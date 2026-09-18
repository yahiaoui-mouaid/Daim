from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)


    # Account metadata
    # is_verified = models.BooleanField(default=False)  # Note: i do not need this in this project


    # Configure authentication
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]  # Email and password are required by default




