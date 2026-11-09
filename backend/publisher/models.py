from django.db import models
import os


class Media(models.Model):
    owner = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='media_files',
        null=True,
        blank=True
    )

    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    title = models.CharField(max_length=255)

    file = models.FileField(upload_to='uploads/')

    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPES
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    file_size = models.PositiveBigIntegerField(default=0)

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    
class ScheduledPost(models.Model):
    owner = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='scheduled_posts',
        null=True,
        blank=True
    )
        
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('published', 'Published'),
        ('failed', 'Failed'),
    ]

    caption = models.TextField(blank=True)

    media = models.ForeignKey(
        Media,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scheduled_posts'
    )

    platforms = models.JSONField(default=list)

    scheduled_at = models.DateTimeField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Post {self.id} - {self.status}"
class UserSettings(models.Model):
    owner = models.OneToOneField(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='socialflow_settings'
    )

    display_name = models.CharField(
        max_length=150,
        default='SocialFlow User'
    )

    bio = models.TextField(blank=True)

    notifications = models.JSONField(
        default=dict
    )

    appearance = models.CharField(
        max_length=20,
        default='dark'
    )

    def __str__(self):
        return f"Settings for {self.owner.username}"