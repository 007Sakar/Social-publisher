from django.db import models
import os


class Media(models.Model):

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
