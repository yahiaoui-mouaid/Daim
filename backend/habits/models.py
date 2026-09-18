"""
models.py

Domain models for the Habit Tracker application.

Contains:
    - Habit: represents a habit a user wants to track (e.g. "Drink water").
    - HabitLog: represents a single day's record of progress against a Habit.

Design notes:
    - We use get_user_model() rather than importing auth.User directly so
      this app remains compatible with any custom user model a project
      might swap in later (Django best practice for reusable apps).
    - Streak calculation is done in Python over a small, indexed queryset
      (dates only, DESC order) rather than in raw SQL, to keep the logic
      portable across database backends while still being O(n) in the
      number of logs and terminating as soon as the streak breaks.
"""

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Habit(models.Model):
    """
    Represents a single habit that a user wants to build or maintain.

    A habit belongs to exactly one user. Users may not create two habits
    with the same name (enforced via a unique_together constraint), which
    keeps habit names usable as a friendly identifier in UIs and reduces
    accidental duplicate entries.

    The `frequency` field currently distinguishes daily vs. weekly habits.
    `tracking_type` determines how progress is logged: BOOLEAN habits are
    simply done/not-done for a given day, while NUMERIC habits are logged
    against `target_count` and `unit` (e.g. target_count=8, unit="glasses").
    """

    class Frequency(models.TextChoices):
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"

    class TrackingType(models.TextChoices):
        BOOLEAN = "BOOLEAN", "Boolean (done / not done)"
        NUMERIC = "NUMERIC", "Numeric (integer count)"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habits",
        help_text="The owner of this habit.",
    )
    name = models.CharField(
        max_length=100,
        help_text="Short display name for the habit, e.g. 'Drink water'.",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Optional longer explanation / motivation for the habit.",
    )
    frequency = models.CharField(
        max_length=10,
        choices=Frequency.choices,
        default=Frequency.DAILY,
        help_text="How often this habit is expected to be performed.",
    )
    tracking_type = models.CharField(
        max_length=10,
        choices=TrackingType.choices,
        default=TrackingType.BOOLEAN,
        help_text=(
            "How progress is logged for this habit: BOOLEAN for simple "
            "done/not-done habits (e.g. 'Meditated'), or NUMERIC for "
            "habits tracked by an integer count against target_count "
            "(e.g. 'Drink 8 glasses of water')."
        ),
    )
    target_count = models.PositiveIntegerField(
        default=1,
        help_text=(
            "Target number of units to complete per occurrence. Only "
            "meaningful when tracking_type=NUMERIC, e.g. 8 (glasses of "
            "water) or 30 (minutes of reading); ignored (treated as 1) "
            "for BOOLEAN habits."
        ),
    )
    unit = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text=(
            "Unit of measurement for target_count, e.g. 'glasses', "
            "'pages'. Only relevant when tracking_type=NUMERIC."
        ),
    )
    active = models.BooleanField(
        default=True,
        help_text="Whether this habit is currently being tracked.",
    )
    color_hex = models.CharField(
        max_length=7,
        default="#3498db",
        help_text="Hex color code (e.g. '#3498db') used for UI theming.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="unique_habit_name_per_user"
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.user})"

    def save(self, *args, **kwargs):
        """
        Normalize numeric-only fields for BOOLEAN-tracked habits before
        saving, so a habit that's switched to boolean tracking doesn't
        keep a stale, meaningless target_count/unit combination around.
        """
        if self.tracking_type == self.TrackingType.BOOLEAN:
            self.target_count = 1
            self.unit = ""
        super().save(*args, **kwargs)

    def calculate_streak(self):
        """
        Calculate the current consecutive-day completion streak for this habit.

        Business logic:
            - Only HabitLog rows with status=COMPLETED count toward a streak.
            - The streak is counted backwards from "today" (or from the most
              recent completed day, if today has no log yet / isn't
              completed yet) and stops at the first gap.
            - A "gap" means a calendar day between two completions (or
              between today and the most recent completion) with no
              COMPLETED log. SKIPPED and MISSED days both break the streak,
              as does an entirely missing log for a day.

        Algorithm (efficient, O(n) over the habit's completed logs):
            1. Fetch only the `date` column of COMPLETED logs, sorted
               descending. This avoids loading full log objects and avoids
               a naive day-by-day DB query loop.
            2. Walk the sorted dates starting from "today" (or "yesterday"
               if today isn't completed) and count consecutive calendar
               days until a break is found.

        Returns:
            int: The current streak length in days (0 if no active streak).
        """
        completed_dates = list(
            self.logs.filter(status=HabitLog.Status.COMPLETED)
            .order_by("-date")
            .values_list("date", flat=True)
        )

        if not completed_dates:
            return 0

        completed_dates_set = set(completed_dates)
        today = timezone.localdate()

        # Anchor the streak at today if it's completed, otherwise at
        # yesterday — this allows a streak to still "count" earlier in the
        # day before today's entry has been logged, without falsely
        # extending a streak that was actually broken yesterday.
        if today in completed_dates_set:
            cursor = today
        elif (today - timedelta(days=1)) in completed_dates_set:
            cursor = today - timedelta(days=1)
        else:
            return 0

        streak = 0
        while cursor in completed_dates_set:
            streak += 1
            cursor -= timedelta(days=1)

        return streak

    def _get_completed_dates(self):
        """
        Return all dates on which this habit was completed.

        Returns:
            set[date]: A set of completed calendar dates.
        """
        return set(
            self.logs.filter(status=HabitLog.Status.COMPLETED)
            .values_list("date", flat=True)
        )

    def calculate_streak(self):
        """
        Calculate the current consecutive-day completion streak.

        The streak starts from:
            - today, if today is completed
            - otherwise yesterday, if yesterday is completed

        It stops at the first missing/non-completed day.

        Returns:
            int: Current streak length in days.
        """
        completed_dates_set = self._get_completed_dates()

        if not completed_dates_set:
            return 0

        today = timezone.localdate()

        if today in completed_dates_set:
            cursor = today
        elif (today - timedelta(days=1)) in completed_dates_set:
            cursor = today - timedelta(days=1)
        else:
            return 0

        streak = 0

        while cursor in completed_dates_set:
            streak += 1
            cursor -= timedelta(days=1)

        return streak

    def calculate_top_streak(self):
        """
        Calculate the longest consecutive-day completion streak ever achieved
        for this habit.

        Returns:
            int: Longest streak length in days.
        """
        completed_dates = sorted(self._get_completed_dates())

        if not completed_dates:
            return 0

        top_streak = 1
        current_streak = 1

        for previous_date, current_date in zip(
            completed_dates,
            completed_dates[1:]
        ):
            if current_date == previous_date + timedelta(days=1):
                current_streak += 1
            else:
                current_streak = 1

            top_streak = max(top_streak, current_streak)

        return top_streak

    def calculate_all_streaks(self, min_days=4):
        """
        Calculate all historical consecutive-day streaks whose length is
        greater than or equal to `min_days`.

        Example:
            Completed:
                Jan 1
                Jan 2
                Jan 3
                Jan 4
                Jan 10
                Jan 11
                Jan 12
                Jan 13
                Jan 14

            calculate_all_streaks(min_days=4) returns:

            [
                {
                    "start_date": Jan 1,
                    "end_date": Jan 4,
                    "days": 4,
                },
                {
                    "start_date": Jan 10,
                    "end_date": Jan 14,
                    "days": 5,
                },
            ]

        Returns:
            list[dict]: All qualifying streaks.
        """
        completed_dates = sorted(self._get_completed_dates())

        if not completed_dates:
            return []

        streaks = []

        streak_start = completed_dates[0]
        streak_end = completed_dates[0]

        for current_date in completed_dates[1:]:

            if current_date == streak_end + timedelta(days=1):
                # Still part of the same streak.
                streak_end = current_date

            else:
                # The previous streak has ended.
                streak_length = (streak_end - streak_start).days + 1

                if streak_length >= min_days:
                    streaks.append(
                        {
                            "start_date": streak_start,
                            "end_date": streak_end,
                            "days": streak_length,
                        }
                    )

                # Start a new streak.
                streak_start = current_date
                streak_end = current_date

        # Handle the final streak.
        streak_length = (streak_end - streak_start).days + 1

        if streak_length >= min_days:
            streaks.append(
                {
                    "start_date": streak_start,
                    "end_date": streak_end,
                    "days": streak_length,
                }
            )

        return streaks



class HabitLog(models.Model):
    """
    Represents the record of a single day's progress toward a Habit.

    Exactly one log may exist per (habit, date) pair; creating a second
    log for the same day should instead update the existing one (see
    HabitLogCreateSerializer's upsert logic in serializers.py).
    """

    class Status(models.TextChoices):
        COMPLETED = "COMPLETED", "Completed"
        SKIPPED = "SKIPPED", "Skipped"
        MISSED = "MISSED", "Missed"

    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name="logs",
        help_text="The habit this log entry belongs to.",
    )
    date = models.DateField(
        help_text="The calendar date this log entry applies to."
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.MISSED,
        help_text="Whether the habit was completed, skipped, or missed on this date.",
    )
    value_achieved = models.FloatField(
        null=True,
        blank=True,
        help_text=(
            "Optional actual amount achieved, e.g. 7 out of a target_count "
            "of 8 glasses."
        ),
    )
    notes = models.TextField(
        blank=True,
        default="",
        help_text="Optional free-text notes for this day's entry.",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["habit", "date"], name="unique_log_per_habit_per_day"
            )
        ]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.habit.name} - {self.date} ({self.status})"





