
from django.urls import path

from .views import (
    MediaListCreateView,
    MediaDetailView,
    ScheduledPostListCreateView,
    ScheduledPostDetailView,
)

urlpatterns = [
    # Media endpoints
    path('', MediaListCreateView.as_view(), name='media-list'),
    path('<int:pk>/', MediaDetailView.as_view(), name='media-detail'),

    # Scheduled post endpoints
    path(
        'scheduled/',
        ScheduledPostListCreateView.as_view(),
        name='scheduled-post-list'
    ),
    path(
        'scheduled/<int:pk>/',
        ScheduledPostDetailView.as_view(),
        name='scheduled-post-detail'
    ),
]
