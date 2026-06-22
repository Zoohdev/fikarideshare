from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import KYCVerification, DriverLicense
from .serializers import KYCVerificationSerializer, DriverLicenseSerializer

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
        serializer = KYCVerificationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            verification = serializer.save(user=request.user)
           
            # --- CELERY ASYNC WORKER TRIGGER POINT ---
            # process_kyc_verification_task.delay(verification.id)
           
            return Response(
                {
                    "message": "Identity documentation submitted successfully.",
                    "verification_id": verification.id,
                    "status": verification.status
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
