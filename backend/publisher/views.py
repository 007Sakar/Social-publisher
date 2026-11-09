
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Media, ScheduledPost
from .serializers import MediaSerializer, ScheduledPostSerializer


# ==========================================
# MEDIA API
# ==========================================

class MediaListCreateView(generics.ListCreateAPIView):
    queryset = Media.objects.all().order_by('-uploaded_at')
    serializer_class = MediaSerializer
    parser_classes = [MultiPartParser, FormParser]


class MediaDetailView(generics.RetrieveDestroyAPIView):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer

    def perform_destroy(self, instance):
        # Delete the physical file from storage
        instance.file.delete(save=False)

        # Delete the database record
        instance.delete()


# ==========================================
# SCHEDULED POSTS API
# ==========================================

class ScheduledPostListCreateView(generics.ListCreateAPIView):
    queryset = ScheduledPost.objects.select_related(
        'media'
    ).order_by('scheduled_at', '-created_at')

    serializer_class = ScheduledPostSerializer


class ScheduledPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ScheduledPost.objects.select_related('media')
    serializer_class = ScheduledPostSerializer
