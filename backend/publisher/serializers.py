
from rest_framework import serializers
from .models import Media, ScheduledPost, UserSettings
import os


# ==========================================
# MEDIA SERIALIZER
# ==========================================

class MediaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Media
        fields = [
            'id',
            'title',
            'file',
            'media_type',
            'uploaded_at',
            'file_size'
        ]

        read_only_fields = [
            'id',
            'media_type',
            'uploaded_at',
            'file_size'
        ]

    def validate_file(self, value):

        allowed_images = [
            '.jpg', '.jpeg', '.png', '.webp', '.gif'
        ]

        allowed_videos = [
            '.mp4', '.mov', '.webm', '.mkv'
        ]

        extension = os.path.splitext(value.name)[1].lower()

        allowed_extensions = allowed_images + allowed_videos

        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Unsupported file type. Upload an image or video file."
            )

        max_size = 500 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "File size cannot exceed 500 MB."
            )

        return value

    def create(self, validated_data):

        uploaded_file = validated_data['file']

        extension = os.path.splitext(uploaded_file.name)[1].lower()

        image_extensions = [
            '.jpg', '.jpeg', '.png', '.webp', '.gif'
        ]

        if extension in image_extensions:
            validated_data['media_type'] = 'image'
        else:
            validated_data['media_type'] = 'video'

        if not validated_data.get('title'):
            validated_data['title'] = os.path.basename(
                uploaded_file.name
            )

        return Media.objects.create(**validated_data)


# ==========================================
# SCHEDULED POST SERIALIZER
# ==========================================

class ScheduledPostSerializer(serializers.ModelSerializer):

    media = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.none(),
        required=False,
        allow_null=True
    )

    media_details = MediaSerializer(
        source='media',
        read_only=True
    )

    platforms = serializers.ListField(
        child=serializers.ChoiceField(
            choices=[
                'youtube',
                'instagram',
                'facebook',
                'tiktok'
            ]
        ),
        required=False,
        default=list
    )

    status = serializers.ChoiceField(
        choices=ScheduledPost.STATUS_CHOICES,
        required=False
    )

    class Meta:
        model = ScheduledPost

        fields = [
            'id',
            'caption',
            'media',
            'media_details',
            'platforms',
            'scheduled_at',
            'status',
            'created_at',
            'updated_at'
        ]

        read_only_fields = [
            'id',
            'media_details',
            'created_at',
            'updated_at'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')

        if request and request.user.is_authenticated:
            self.fields['media'].queryset = Media.objects.filter(
                owner=request.user
            )

    def validate_platforms(self, value):

        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                "You cannot select the same platform more than once."
            )

        return value

    def validate(self, attrs):

        post_status = attrs.get(
            'status',
            getattr(self.instance, 'status', 'draft')
        )

        scheduled_at = attrs.get(
            'scheduled_at',
            getattr(self.instance, 'scheduled_at', None)
        )

        platforms = attrs.get(
            'platforms',
            getattr(self.instance, 'platforms', [])
        )

        if post_status == 'scheduled':

            if not scheduled_at:
                raise serializers.ValidationError({
                    'scheduled_at': 'A date and time are required for scheduled posts.'
                })

            if not platforms:
                raise serializers.ValidationError({
                    'platforms': 'Select at least one platform.'
                })

        return attrs
# ==========================================
# USER SETTINGS SERIALIZER
# ==========================================

class UserSettingsSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source='owner.username',
        read_only=True
    )

    email = serializers.EmailField(
        source='owner.email',
        read_only=True
    )

    class Meta:
        model = UserSettings

        fields = [
            'display_name',
            'bio',
            'notifications',
            'appearance',
            'username',
            'email'
        ]

        read_only_fields = [
            'username',
            'email'
        ]