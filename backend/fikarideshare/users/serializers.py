from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
   
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
   
    class Meta:
        model = User
        fields = [
            'email', 'phone_number', 'first_name', 'last_name',
            'password', 'password_confirm', 'user_type'
        ]
        extra_kwargs = {
            'user_type': {'required': False}
        }
   
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()
   
    def validate_phone_number(self, value):
        # Remove common formatting characters
        cleaned = ''.join(c for c in value if c.isdigit() or c == '+')
        if User.objects.filter(phone_number=cleaned).exists():
            raise serializers.ValidationError('A user with this phone number already exists.')
        return cleaned
   
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        return attrs
   
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
       
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for email/password login."""
   
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
   
    def validate(self, attrs):
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
       
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password
        )
       
        if not user:
            raise serializers.ValidationError(
                'Unable to log in with provided credentials.'
            )
       
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
       
        attrs['user'] = user
        return attrs


class BiometricRegistrationSerializer(serializers.Serializer):
    """
    Serializer for registering a biometric credential.
    Uses WebAuthn/FIDO2 standard format.
    """
   
    credential_id = serializers.CharField()
    public_key = serializers.CharField()
    device_name = serializers.CharField(max_length=100, required=False)
    device_type = serializers.CharField(max_length=50, required=False)
   
    def validate_credential_id(self, value):
        if BiometricCredential.objects.filter(credential_id=value).exists():
            raise serializers.ValidationError('This credential is already registered.')
        return value
   
    def create(self, validated_data):
        user = self.context['request'].user
       
        credential = BiometricCredential.objects.create(
            user=user,
            **validated_data
        )
       
        # Enable biometric auth on user account
        user.biometric_enabled = True
        user.save(update_fields=['biometric_enabled'])
       
        return credential


class BiometricLoginSerializer(serializers.Serializer):
    """
    Serializer for biometric authentication.
    Validates the signed challenge from the device.
    """
   
    credential_id = serializers.CharField()
    signature = serializers.CharField()
    authenticator_data = serializers.CharField()
    client_data_json = serializers.CharField()
   
    def validate(self, attrs):
        credential_id = attrs['credential_id']
       
        try:
            credential = BiometricCredential.objects.select_related('user').get(
                credential_id=credential_id
            )
        except BiometricCredential.DoesNotExist:
            raise serializers.ValidationError('Credential not found.')
       
        if not credential.user.is_active:
            raise serializers.ValidationError('User account is disabled.')
       
        # In production, verify the signature using the stored public key
        # This involves:
        # 1. Decoding the client_data_json and authenticator_data
        # 2. Verifying the signature against the challenge
        # 3. Checking the sign count to prevent replay attacks
       
        # For this example, we'll trust the credential (in production, use a library like webauthn)
        is_valid = self._verify_signature(
            credential=credential,
            signature=attrs['signature'],
            authenticator_data=attrs['authenticator_data'],
            client_data_json=attrs['client_data_json']
        )
       
        if not is_valid:
            raise serializers.ValidationError('Invalid biometric signature.')
       
        attrs['credential'] = credential
        attrs['user'] = credential.user
        return attrs
   
    def _verify_signature(self, credential, signature, authenticator_data, client_data_json):
        """
        Verify the WebAuthn assertion.
       
        In production, use a proper WebAuthn library like py_webauthn:
       
        from webauthn import verify_authentication_response
        from webauthn.helpers.structs import AuthenticationCredential
       
        verification = verify_authentication_response(
            credential=AuthenticationCredential(...),
            expected_challenge=cached_challenge,
            expected_origin=settings.WEBAUTHN_ORIGIN,
            expected_rp_id=settings.WEBAUTHN_RP_ID,
            credential_public_key=credential.public_key,
            credential_current_sign_count=credential.sign_count,
        )
        """
        # Placeholder - implement proper WebAuthn verification
        return True


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
   
    full_name = serializers.ReadOnlyField()
    is_driver = serializers.ReadOnlyField()
    is_verified = serializers.ReadOnlyField()
   
    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone_number', 'first_name', 'last_name',
            'full_name', 'date_of_birth', 'profile_photo', 'user_type',
            'kyc_status', 'biometric_enabled', 'average_rating',
            'total_ratings', 'is_driver', 'is_verified', 'created_at'
        ]
        read_only_fields = [
            'id', 'email', 'phone_number','kyc_status', 'average_rating',
            'total_ratings', 'created_at'
        ]


class TokenResponseSerializer(serializers.Serializer):
    """Response serializer for authentication endpoints."""
   
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = UserProfileSerializer()

