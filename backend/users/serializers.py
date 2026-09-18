from djoser.serializers import UserSerializer as BaseUserSerializer
from djoser.serializers import UserCreatePasswordRetypeSerializer
from rest_framework import serializers

class UserCreateSerializer(UserCreatePasswordRetypeSerializer):   # the data sent when creating a user
    class Meta(UserCreatePasswordRetypeSerializer.Meta):
        fields = ["id", "email", "username", "phone_number", "date_of_birth", "password"]
        read_only_fields = ["id"]

    phone_number = serializers.CharField(required=True)
    date_of_birth = serializers.CharField(required=True)


class UserSerializer(BaseUserSerializer):   # the data sent about the user (what the user can see)
    class Meta(BaseUserSerializer.Meta):
        fields = ["id", "email", "username", "phone_number", "date_of_birth"]
        read_only_fields = ["email"]



