
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Media, ScheduledPost, UserSettings
from .serializers import (
    MediaSerializer,
    ScheduledPostSerializer,
    UserSettingsSerializer
)


# ==========================================
# MEDIA API
# ==========================================

class MediaListCreateView(generics.ListCreateAPIView):
    serializer_class = MediaSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Media.objects.filter(
            owner=self.request.user
        ).order_by('-uploaded_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class MediaDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = MediaSerializer

    def get_queryset(self):
        return Media.objects.filter(
            owner=self.request.user
        )

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        instance.delete()


# ==========================================
# SCHEDULED POSTS API
# ==========================================

class ScheduledPostListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduledPostSerializer

    def get_queryset(self):
        return ScheduledPost.objects.filter(
            owner=self.request.user
        ).select_related(
            'media'
        ).order_by('scheduled_at', '-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ScheduledPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ScheduledPostSerializer

    def get_queryset(self):
        return ScheduledPost.objects.filter(
            owner=self.request.user
        ).select_related('media')
# ==========================================
# USER SETTINGS API
# ==========================================

class UserSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSettingsSerializer

    def get_object(self):
        settings, created = UserSettings.objects.get_or_create(
            owner=self.request.user
        )

        return settings