
from django.contrib.auth.models import User
from django.db import IntegrityError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token

from .serializers import RegisterSerializer, LoginSerializer


GOOGLE_CLIENT_ID = "523529256791-0ivc9lul1khjir70tn1amv6ah33u6ge0.apps.googleusercontent.com"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        user_id = response.data['id']

        token, created = Token.objects.get_or_create(
            user_id=user_id
        )

        response.data['token'] = token.key

        return response


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']

            token, created = Token.objects.get_or_create(
                user=user
            )

            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'token': token.key
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get('credential')

        if not credential:
            return Response(
                {'error': 'Google credential is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            google_user = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )

            if not google_user.get('email_verified'):
                return Response(
                    {'error': 'Google email is not verified.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            email = google_user.get('email', '').lower()
            name = google_user.get('name') or email.split('@')[0]

            if not email:
                return Response(
                    {'error': 'Google account has no email address.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.filter(
                email__iexact=email
            ).first()

            if not user:
                username = email.split('@')[0][:100]

                if User.objects.filter(username=username).exists():
                    username = f"{username}_{google_user['sub'][-6:]}"

                user = User.objects.create_user(
                    username=username,
                    email=email
                )

            token, created = Token.objects.get_or_create(
                user=user
            )

            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'token': token.key
            })

        except ValueError:
            return Response(
                {'error': 'Invalid Google credential.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutView(APIView):
    def post(self, request):
        request.user.auth_token.delete()

        return Response({
            'message': 'Successfully logged out.'
        })


class ProfileView(APIView):

    def get(self, request):
        user = request.user

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'date_joined': user.date_joined
        })
