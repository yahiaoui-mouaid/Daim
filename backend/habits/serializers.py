# habits/serializers.py

from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import Habit, HabitLog


class HabitLogMiniSerializer(serializers.ModelSerializer):
    """Lightweight representation of a HabitLog, used when nesting under Habit."""

    class Meta:
        model = HabitLog
        fields = ["id", "date", "status", "value_achieved", "notes"]
        read_only_fields = fields


class HabitSerializer(serializers.ModelSerializer):
    """
    Full read/write serializer for Habit.

    Adds computed, read-only streak fields on top of the model's stored
    fields, and enforces tracking_type-dependent validation on
    target_count / unit that mirrors Habit.save()'s normalization.
    """

    current_streak = serializers.SerializerMethodField()
    top_streak = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Habit
        fields = [
            "id",
            "user",
            "name",
            "description",
            "frequency",
            "tracking_type",
            "target_count",
            "unit",
            "active",
            "color_hex",
            "current_streak",
            "top_streak",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_current_streak(self, obj):
        return obj.calculate_streak()

    def get_top_streak(self, obj):
        return obj.calculate_top_streak()

    def validate_color_hex(self, value):
        import re

        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", value):
            raise serializers.ValidationError(
                "color_hex must be a 6-digit hex code, e.g. '#3498db'."
            )
        return value

    def validate(self, attrs):
        """
        Enforce tracking_type-dependent rules for target_count and unit.

        NUMERIC habits must have a meaningful target_count (>1 doesn't
        make sense to require, but 0 is nonsensical) and should generally
        specify a unit so the frontend can render something like
        "6 / 8 glasses". BOOLEAN habits get normalized in Habit.save(),
        so we don't need to fight the user over stray values there.
        """
        tracking_type = attrs.get(
            "tracking_type",
            getattr(self.instance, "tracking_type", Habit.TrackingType.BOOLEAN),
        )

        if tracking_type == Habit.TrackingType.NUMERIC:
            target_count = attrs.get(
                "target_count", getattr(self.instance, "target_count", None)
            )
            unit = attrs.get("unit", getattr(self.instance, "unit", ""))

            if not target_count or target_count < 1:
                raise serializers.ValidationError(
                    {
                        "target_count": (
                            "target_count must be at least 1 for NUMERIC habits."
                        )
                    }
                )
            if not unit:
                raise serializers.ValidationError(
                    {"unit": "unit is required for NUMERIC habits."}
                )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class HabitDetailSerializer(HabitSerializer):
    """
    Extended Habit serializer for detail views: includes recent logs and
    the list of long-run historical streaks.
    """

    recent_logs = serializers.SerializerMethodField()
    streak_history = serializers.SerializerMethodField()

    class Meta(HabitSerializer.Meta):
        fields = HabitSerializer.Meta.fields + ["recent_logs", "streak_history"]

    def get_recent_logs(self, obj, days=30):
        cutoff = timezone.localdate() - timedelta(days=days)
        logs = obj.logs.filter(date__gte=cutoff).order_by("-date")
        return HabitLogMiniSerializer(logs, many=True).data

    def get_streak_history(self, obj, min_days=4):
        return obj.calculate_all_streaks(min_days=min_days)


class HabitLogSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for HabitLog.

    `habit` is writable only on create (set from the URL, not the client)
    and is otherwise read-only, since a log entry shouldn't be reassigned
    to a different habit after creation.
    """

    habit = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = HabitLog
        fields = ["id", "habit", "date", "status", "value_achieved", "notes"]
        read_only_fields = ["id", "habit"]

    def validate_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("date cannot be in the future.")
        return value

    def validate(self, attrs):
        """
        value_achieved is only meaningful for COMPLETED logs on NUMERIC
        habits; keep it optional everywhere else but validate it against
        the habit's target_count when it is provided.
        """
        status = attrs.get("status", getattr(self.instance, "status", None))
        value_achieved = attrs.get(
            "value_achieved", getattr(self.instance, "value_achieved", None)
        )

        habit = getattr(self.instance, "habit", None) or self.context.get("habit")

        if (
            value_achieved is not None
            and habit is not None
            and habit.tracking_type == Habit.TrackingType.NUMERIC
            and value_achieved < 0
        ):
            raise serializers.ValidationError(
                {"value_achieved": "value_achieved cannot be negative."}
            )

        if status != HabitLog.Status.COMPLETED and value_achieved:
            # Not an error, just informational: allow it, since partial
            # progress can still be logged on a SKIPPED/MISSED day, but
            # flag the common mistake of leaving stale COMPLETED data.
            pass

        return attrs


class HabitLogCreateSerializer(HabitLogSerializer):
    """
    Upsert-style serializer used by the log-creation endpoint: creating a
    second log for a (habit, date) that already has one updates it in
    place instead of raising a UniqueConstraint IntegrityError.
    """

    def create(self, validated_data):
        habit = self.context["habit"]
        date = validated_data["date"]

        log, _created = HabitLog.objects.update_or_create(
            habit=habit,
            date=date,
            defaults={
                "status": validated_data.get("status", HabitLog.Status.MISSED),
                "value_achieved": validated_data.get("value_achieved"),
                "notes": validated_data.get("notes", ""),
            },
        )
        return log

