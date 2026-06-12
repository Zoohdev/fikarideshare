from rest_framework import serializers
from .models import Rating, RatingCategory

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

    class Meta:
        model = Rating
        fields = [
            'id', 'ride', 'rater', 'rated_user', 'rater_type',
            'score', 'comment', 'categories_detail', 'category_ids', 'created_at'
        ]
        read_only_fields = ['rater', 'rater_type', 'rated_user']

    def validate(self, data):
        request = self.context.get('request')
        ride = data.get('ride')
        user = request.user

        # 1. Prevent duplicate submissions per business constraints
        if Rating.objects.filter(ride=ride, rater=user).exists():
            raise serializers.ValidationError("You have already submitted a rating review for this ride trip.")

        # 2. Extract context details to find who the target recipient user is
        # Assumes your 'Ride' model has attributes 'rider' and 'driver'
        if user == ride.rider:
            data['rater_type'] = Rating.RaterType.RIDER
            data['rated_user'] = ride.driver
        elif user == ride.driver:
            data['rater_type'] = Rating.RaterType.DRIVER
            data['rated_user'] = ride.rider
        else:
            raise serializers.ValidationError("Access Denied: You are not a valid stakeholder participant of this ride.")

        return data

    def create(self, validated_data):
        # Inject the active rater profile from request context
        validated_data['rater'] = self.context['request'].user
        return super().create(validated_data)
