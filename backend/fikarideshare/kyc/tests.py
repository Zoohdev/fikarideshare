from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from .models import KYCVerification, DriverLicense
from .serializers import (
    KYCInitiateSerializer,
    KYCVerificationSerializer,
    KYCWebhookSerializer,
    DriverLicenseSerializer,
)
from .services import KYCManager


class KYCInitiateView(APIView):
    """
    Initiate KYC verification process.
   
    Returns SDK token for mobile app to capture documents.
    """
   
    permission_classes = [IsAuthenticated]
   
    def post(self, request):
        serializer = KYCInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       
        manager = KYCManager()
        success, result = manager.initiate_verification(
            user=request.user,
            document_type=serializer.validated_data['document_type']
        )
       
        if success:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


class KYCSubmitView(APIView):
    """
    Submit documents for verification check.
   
    Called after mobile SDK finishes document capture.
    """
   
    permission_classes = [IsAuthenticated]
   
    def post(self, request, verification_id):
        manager = KYCManager()
        success, result = manager.submit_for_review(verification_id)
       
        if success:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


class KYCStatusView(generics.RetrieveAPIView):
    """
    Get current KYC verification status.
    """
   
    permission_classes = [IsAuthenticated]
    serializer_class = KYCVerificationSerializer
   
    def get_object(self):
        return KYCVerification.objects.filter(
            user=self.request.user
        ).order_by('-created_at').first()


class KYCWebhookView(APIView):
    """
    Webhook endpoint for Onfido verification results.
    """
   
    permission_classes = [AllowAny]  # Webhook authentication handled separately
   
    def post(self, request):
        # Verify webhook signature (in production)
        # signature = request.headers.get('X-SHA2-Signature')
        # if not self._verify_signature(request.body, signature):
        #     return Response(status=status.HTTP_401_UNAUTHORIZED)
       
        serializer = KYCWebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       
        manager = KYCManager()
        manager.process_webhook(serializer.validated_data)
       
        return Response(status=status.HTTP_200_OK)


class DriverLicenseView(generics.CreateAPIView, generics.RetrieveAPIView):
    """
    Submit or retrieve driver's license.
    """
   
    permission_classes = [IsAuthenticated]
    serializer_class = DriverLicenseSerializer
    parser_classes = [MultiPartParser, FormParser]
   
    def get_object(self):
        return DriverLicense.objects.filter(user=self.request.user).first()
   
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


