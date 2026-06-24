from rest_framework import serializers
from .models import Rating, RatingCategory
from rides.models import RideParticipant

class RatingCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RatingCategory
        fields = ['id', 'name', 'description', 'icon', 'category_type', 'applies_to']


class RatingSerializer(serializers.ModelSerializer):
    # Read representation details for frontend visualization
    categories_detail = RatingCategorySerializer(source='categories', many=True, read_only=True)
    # Write processing mechanism using UUID primaries
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=RatingCategory.objects.filter(is_active=True),
        source='categories',
        many=True,
        required=False,
        write_only=True
    )
    # When the driver is rating a shared ride with multiple passengers,
    # this selects which passenger the rating is about. Ignored for rider
    # raters (they only ever rate the driver).
    target_user_id = serializers.UUIDField(required=False, write_only=True)

    class Meta:
        model = Rating
        fields = [
            'id', 'ride', 'rater', 'rated_user', 'rater_type',
            'score', 'comment', 'categories_detail', 'category_ids',
            'target_user_id', 'created_at',
        ]
        read_only_fields = ['rater', 'rater_type', 'rated_user']

    def validate(self, data):
        request = self.context.get('request')
        ride = data.get('ride')
        user = request.user

        # 1. Prevent duplicate submissions per business constraints
        if Rating.objects.filter(ride=ride, rater=user).exists():
            raise serializers.ValidationError("You have already submitted a rating review for this ride trip.")

        # A pool passenger (joined via RideParticipant, not the ride's
        # primary rider) is also a valid rider-side stakeholder.
        participant = RideParticipant.objects.filter(
            ride=ride,
            user=user,
            is_organizer=False,
            status__in=[
                RideParticipant.Status.ACCEPTED,
                RideParticipant.Status.PICKED_UP,
                RideParticipant.Status.DROPPED_OFF,
            ],
        ).first()

        if user == ride.rider or participant is not None:
            data['rater_type'] = Rating.RaterType.RIDER
            data['rated_user'] = ride.driver
        elif user == ride.driver:
            data['rater_type'] = Rating.RaterType.DRIVER
            target_user_id = data.pop('target_user_id', None)
            if target_user_id:
                is_valid_target = (
                    str(ride.rider_id) == str(target_user_id)
                    or RideParticipant.objects.filter(
                        ride=ride,
                        user_id=target_user_id,
                        is_organizer=False,
                        status__in=[
                            RideParticipant.Status.ACCEPTED,
                            RideParticipant.Status.PICKED_UP,
                            RideParticipant.Status.DROPPED_OFF,
                        ],
                    ).exists()
                )
                if not is_valid_target:
                    raise serializers.ValidationError("target_user_id is not a passenger on this ride.")
                data['rated_user_id'] = target_user_id
            else:
                data['rated_user'] = ride.rider
        else:
            raise serializers.ValidationError("Access Denied: You are not a valid stakeholder participant of this ride.")

        data.pop('target_user_id', None)
        return data

    def create(self, validated_data):
        # Inject the active rater profile from request context
        validated_data['rater'] = self.context['request'].user
        return super().create(validated_data)
