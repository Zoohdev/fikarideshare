from rest_framework import serializers
from .models import KYCVerification, KYCDocument, DriverLicense


class KYCInitiateSerializer(serializers.Serializer):
    """Serializer for initiating KYC verification."""
   
    document_type = serializers.ChoiceField(
        choices=KYCVerification.DocumentType.choices
    )
    document_country = serializers.CharField(max_length=2)


class KYCVerificationSerializer(serializers.ModelSerializer):
    """Serializer for KYC verification status."""
   
    class Meta:
        model = KYCVerification
        fields = [
            'id', 'status', 'document_type', 'document_country',
            'document_check_passed', 'facial_similarity_passed',
            'liveness_check_passed', 'rejection_reasons',
            'created_at', 'completed_at',
        ]
        read_only_fields = fields


class KYCWebhookSerializer(serializers.Serializer):
    """Serializer for Onfido webhook payload."""
   
    payload = serializers.DictField()


class DriverLicenseSerializer(serializers.ModelSerializer):
    """Serializer for driver's license submission."""
   
    class Meta:
        model = DriverLicense
        fields = [
            'id', 'license_number', 'issuing_country', 'issuing_state',
            'license_classes', 'issue_date', 'expiry_date',
            'front_image', 'back_image', 'status', 'verified_at',
        ]
        read_only_fields = ['id', 'status', 'verified_at']

