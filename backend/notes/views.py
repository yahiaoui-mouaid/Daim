from .serializers import NoteSerializer
from rest_framework import generics, permissions
from .models import Note
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .filters import NoteFilter

# Create view
class NoteCreateView(generics.CreateAPIView):
    """
    Create a new note for the authenticated user.
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]



# List all 'current user' notes view
class NoteListView(generics.ListAPIView):
    """
    List notes belonging to the currently authenticated user only.
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = NoteFilter
    ordering_fields = ['start_time', 'end_time', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).order_by('-start_time')



# update view
class NoteUpdateView(generics.UpdateAPIView):
    """
    Update a note. Scoped to the owner only.
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    

# delete view
class NoteDeleteView(generics.DestroyAPIView):
    """
    Delete a note. Scoped to the owner only.
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)



