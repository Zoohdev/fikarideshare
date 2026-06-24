from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone

from .models import User, BiometricData
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    BiometricRegistrationSerializer,
    BiometricLoginSerializer,
    UserProfileSerializer,
    TokenResponseSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
   
    Creates a new user account and returns authentication tokens.
    """
   
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
   
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
       
        # Generate tokens
        refresh = RefreshToken.for_user(user)
       
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Email/password login endpoint.
   
    Returns access and refresh tokens on successful authentication.
    """
   
    permission_classes = [AllowAny]
   
    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
       
        user = serializer.validated_data['user']
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
       
        refresh = RefreshToken.for_user(user)
       
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserProfileSerializer(user).data
        })


class BiometricRegisterView(APIView):
    """
    Register a biometric credential for the authenticated user.
   
    The mobile app generates a public/private key pair and sends
    the public key and credential ID for storage.
    """
   
    permission_classes = [IsAuthenticated]
   
    def post(self, request):
        serializer = BiometricRegistrationSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        credential = serializer.save()
       
        return Response({
            'message': 'Biometric credential registered successfully.',
            'credential_id': credential.id,
            'device_name': credential.device_name,
        }, status=status.HTTP_201_CREATED)


class BiometricLoginView(APIView):
    """
    Biometric authentication endpoint.
   
    Validates the signed assertion from the device's biometric system
    and returns authentication tokens.
    """
   
    permission_classes = [AllowAny]
   
    def post(self, request):
        serializer = BiometricLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       
        user = serializer.validated_data['user']
        credential = serializer.validated_data['credential']
       
        # Update last used timestamp
        credential.last_used_at = timezone.now()
        credential.save(update_fields=['last_used_at'])
       
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
       
        refresh = RefreshToken.for_user(user)
       
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserProfileSerializer(user).data
        })


class BiometricChallengeView(APIView):
    """
    Generate a challenge for biometric authentication.
   
    The challenge must be signed by the device's private key
    and verified against the stored public key.
    """
   
    permission_classes = [AllowAny]
   
    def post(self, request):
        credential_id = request.data.get('credential_id')
       
        if not credential_id:
            return Response(
                {'error': 'credential_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
       
        try:
            credential = BiometricData.objects.get(
                credential_id=credential_id
            )
        except BiometricData.DoesNotExist:
            return Response(
                {'error': 'Credential not found'},
                status=status.HTTP_404_NOT_FOUND
            )
       
        # Generate a cryptographically secure challenge
        import secrets
        import base64
       
        challenge = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
       
        # Store challenge in cache with short TTL (e.g., 5 minutes)
        from django.core.cache import cache
        cache_key = f'biometric_challenge:{credential_id}'
        cache.set(cache_key, challenge, timeout=300)
       
        return Response({
            'challenge': challenge,
            'timeout': 300,
        })


class LogoutView(APIView):
    """
    Logout endpoint.
   
    Blacklists the refresh token to invalidate the session.
    """
   
    permission_classes = [IsAuthenticated]
   
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass  # Token already invalid/blacklisted

        return Response({'message': 'Successfully logged out.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update user profile.
    """
   
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
   
    def get_object(self):
        return self.request.user


