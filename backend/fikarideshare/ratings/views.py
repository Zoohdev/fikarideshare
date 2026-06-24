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
        user_type = getattr(request.user, 'user_type', None)
        ride_id = request.query_params.get('ride_id')

        # Determine target list tags to return to the smartphone camera UI.
        # If the caller is rating as a rider, show tags that apply to drivers
        # (and vice versa). When ride_id is given, derive the role from the
        # actual ride instead of guessing from the account's user_type - this
        # matters for 'both' accounts, who can be either party depending on
        # the ride.
        target_applies = None
        if ride_id:
            from rides.models import Ride
            ride = Ride.objects.filter(id=ride_id).first()
            if ride:
                if request.user.id == ride.rider_id:
                    target_applies = 'driver'
                elif request.user.id == ride.driver_id:
                    target_applies = 'rider'

        if target_applies is None:
            if user_type == 'rider':
                target_applies = 'driver'
            elif user_type == 'driver':
                target_applies = 'rider'
            # 'both' (or unknown) without ride context: role can't be
            # determined safely, so don't guess - return all active
            # categories below instead of one wrong-sided list.

        if target_applies:
            categories = RatingCategory.objects.filter(
                Q(applies_to=target_applies) | Q(applies_to=RatingCategory.AppliesTo.BOTH),
                is_active=True
            )
        else:
            categories = RatingCategory.objects.filter(is_active=True)

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

