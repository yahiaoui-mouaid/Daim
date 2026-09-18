from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Habit, HabitLog
from .serializers import (
    HabitSerializer,
    HabitDetailSerializer,
    HabitLogSerializer,
    HabitLogCreateSerializer,
)


class HabitListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/habits/
        Return all habits belonging to the authenticated user.

    POST /api/habits/
        Create a new habit for the authenticated user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Habit.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        return HabitSerializer


class HabitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/habits/<habit_id>/
    PATCH  /api/habits/<habit_id>/
    PUT    /api/habits/<habit_id>/
    DELETE /api/habits/<habit_id>/

    Only the owner can access the habit.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return HabitDetailSerializer


class HabitLogListCreateView(generics.ListCreateAPIView):
    """
    GET /api/habits/<habit_id>/logs/
        Return logs for one of the authenticated user's habits.

    POST /api/habits/<habit_id>/logs/
        Create/update the log for a specific date.

        The HabitLogCreateSerializer performs the upsert:
        if the date already exists, the existing log is updated.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_habit(self):
        return get_object_or_404(
            Habit,
            id=self.kwargs["habit_id"],
            user=self.request.user,
        )

    def get_queryset(self):
        habit = self.get_habit()

        return (
            HabitLog.objects
            .filter(habit=habit)
            .order_by("-date")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return HabitLogCreateSerializer

        return HabitLogSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["habit"] = self.get_habit()
        return context


class HabitLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/habits/<habit_id>/logs/<log_id>/
    PATCH  /api/habits/<habit_id>/logs/<log_id>/
    PUT    /api/habits/<habit_id>/logs/<log_id>/
    DELETE /api/habits/<habit_id>/logs/<log_id>/

    Only the owner of the parent habit can access the log.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HabitLog.objects.filter(
            habit__user=self.request.user
        ).select_related("habit")

    def get_object(self):
        """
        Restrict the log to BOTH:

        1. the requested habit
        2. the authenticated user

        This prevents someone from manually changing the URL and
        accessing another user's log.
        """

        return get_object_or_404(
            self.get_queryset(),
            id=self.kwargs["log_id"],
            habit_id=self.kwargs["habit_id"],
        )

    def get_serializer_class(self):
        return HabitLogSerializer





