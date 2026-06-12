from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Rating, RatingCategory
from .serializers import RatingSerializer, RatingCategorySerializer

class RatingCategoryListView(APIView):
    """
    Returns active feedback option tags (e.g., Clean Car, Safe Driving).
    Filters contextually by whether the caller is a rider or a driver.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_type = getattr(request.user, 'user_type', 'both')
       
        # Determine target list tags to return to the smartphone camera UI
        # If a rider calls, show tags that apply to drivers (and vice versa)
        target_applies = 'driver' if user_type == 'rider' else 'rider'

        categories = RatingCategory.objects.filter(
            Q(applies_to=target_applies) | Q(applies_to=RatingCategory.AppliesTo.BOTH),
            is_active=True
        )
        serializer = RatingCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RatingSubmitView(APIView):
    """
    Processes submission forms containing star metrics and custom commentary notes.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RatingSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            rating = serializer.save()
           
            # If a negative review triggers manual support intervention
            # flags can automatically be processed based on category conditions
            if rating.categories.filter(triggers_review=True).exists() or rating.score <= 2:
                rating.is_flagged = True
                rating.flagged_reason = "Automated Flag: Low review score or critical tag selected."
                rating.save()

            return Response(
                {
                    "message": "Review metrics successfully saved.",
                    "rating_id": rating.id,
                    "score_logged": rating.score
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRatingsHistoryView(APIView):
    """
    Returns review history records received by the authenticated user profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch verified clear text reviews received by the client user
        reviews = Rating.objects.filter(rated_user=request.user, is_hidden=False)
        serializer = RatingSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

