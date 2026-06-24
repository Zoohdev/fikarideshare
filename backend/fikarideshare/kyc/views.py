from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from .models import KYCVerification, DriverLicense
from .serializers import (
    KYCVerificationSerializer,
    KYCInitiateSerializer,
    DriverLicenseSerializer,
)
from .services import KYCManager

class KYCSubmitAndStatusView(APIView):
    """
    Handles submitting new identity checks (POST) and checking verification statuses (GET).
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        # Fetch the user's latest identity clearance attempt
        verification = KYCVerification.objects.filter(user=request.user).first()
        if not verification:
            return Response(
                {"status": "pending", "message": "No KYC verification profile found."},
                status=status.HTTP_200_OK
            )
        serializer = KYCVerificationSerializer(verification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = KYCInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        document_type = serializer.validated_data['document_type']
        document_country = serializer.validated_data['document_country']

        manager = KYCManager()
        success, result = manager.initiate_verification(request.user, document_type)
        if not success:
            return Response(
                {"error": "Unable to start identity verification.", "detail": result},
                status=status.HTTP_502_BAD_GATEWAY
            )

        verification = KYCVerification.objects.get(id=result['verification_id'])
        if verification.document_country != document_country:
            verification.document_country = document_country
            verification.save(update_fields=['document_country'])

        return Response(
            {
                "message": "Identity verification started.",
                "verification_id": verification.id,
                "sdk_token": result['sdk_token'],
                "status": verification.status
            },
            status=status.HTTP_201_CREATED
        )


class KYCWebhookView(APIView):
    """
    Webhook endpoint for Onfido verification results.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        # Verify webhook signature in production
        manager = KYCManager()
        manager.process_webhook(request.data)

        return Response(status=status.HTTP_200_OK)


class DriverLicenseSubmitView(APIView):
    """
    Handles driver specific professional operating documentation submissions.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            license_record = DriverLicense.objects.get(user=request.user)
            serializer = DriverLicenseSerializer(license_record)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DriverLicense.DoesNotExist:
            return Response(
                {"status": "pending", "message": "No driver license record has been filed."},
                status=status.HTTP_200_OK
            )

    def post(self, request):
        # Prevent duplicates since DriverLicense shares a OneToOne relationship with User
        if DriverLicense.objects.filter(user=request.user).exists():
            return Response(
                {"error": "A driver license file already exists for this profile."},
                status=status.HTTP_400_BAD_REQUEST
            )
           
        serializer = DriverLicenseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            license_record = serializer.save(user=request.user)
            return Response(
                {
                    "message": "Driver license submitted successfully for verification validation.",
                    "license_id": license_record.id,
                    "status": license_record.status
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
