from django.db import models
from users.models import User


class Note(models.Model):
    """
    Represents an activity log entry with a time interval and a note.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    note = models.TextField(blank=False)  # required, as per frontend validation
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.start_time} to {self.end_time}"


class NoteFile(models.Model):
    """
    Stores individual files attached to a Note.
    """
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='note_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File for Note {self.note.id}"


