from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import NoteFile


@receiver(post_delete, sender=NoteFile)
def delete_file_from_storage(sender, instance, **kwargs):
    """
    When a NoteFile row is deleted (directly or via cascade
    from Note deletion), also delete the actual file from storage.
    """
    if instance.file:
        instance.file.delete(save=False)



