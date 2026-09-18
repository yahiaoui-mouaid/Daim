from .models import Note, NoteFile
from rest_framework import serializers
from django.core.exceptions import ValidationError


class NoteFileSerializer(serializers.ModelSerializer):
    """
    Serializer for individual note images.
    """
    class Meta:
        model = NoteFile
        fields = ['id', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class NoteSerializer(serializers.ModelSerializer):

    user = serializers.PrimaryKeyRelatedField(read_only=True)
    files = NoteFileSerializer(many=True, read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        help_text="List of images or/and files to attach to this note."
    )

    class Meta:
        model = Note
        fields = [
            'id', 'user', 'start_time', 'end_time', 'note',
            'created_at', 'updated_at', 'files', 'uploaded_files'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


    def validate(self, data):
        """
        Ensure start_time is before end_time — works for both
        full creates and partial (PATCH) updates.
        """
        start = data.get('start_time', getattr(self.instance, 'start_time', None))
        end = data.get('end_time', getattr(self.instance, 'end_time', None))
        if start and end and start >= end:
            raise serializers.ValidationError("Start time must be before end time.")
            # only enforce on create (self.instance is None means this is a create)
            
        if self.instance is None and not data.get('uploaded_files'):
            raise serializers.ValidationError({
                "uploaded_files": "At least one file must be attached to a new note."
            })

        return data


    def validate_file_extension(value):
        allowed = ['.jpg', '.jpeg', '.png', '.webp', 'html', 'txt', 'pdf']
        if not any(value.name.lower().endswith(ext) for ext in allowed):
            raise ValidationError("Unsupported file type.")
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise ValidationError("File too large.")


    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        request = self.context.get('request')
        note = Note.objects.create(user=request.user, **validated_data)

        for file in uploaded_files:
            NoteFile.objects.create(note=note, file=file)

        return note


    def update(self, instance, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for file in uploaded_files:
            NoteFile.objects.create(note=instance, file=file)
        return instance




