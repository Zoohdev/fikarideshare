from rest_framework import serializers
from django.contrib.gis.geos import Point
from decimal import Decimal
from users.serializers import UserProfileSerializer
from vehicles.serializers import VehicleSerializer
from .models import Ride, RideParticipant, RideLocation,EmergencySOS,RideShareLink



class LocationSerializer(serializers.Serializer):
    """Serializer for location coordinates."""
   
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)


class RideEstimateSerializer(serializers.Serializer):
    """Serializer for fare estimation request."""
   
    pickup = LocationSerializer()
    dropoff = LocationSerializer()
    vehicle_type = serializers.ChoiceField(
        choices=['economy', 'comfort', 'premium', 'xl'],
        default='economy'
    )


class RideCreateSerializer(serializers.Serializer):
    """Serializer for creating a ride."""
   
    pickup = LocationSerializer()
    dropoff = LocationSerializer()
    vehicle_type = serializers.ChoiceField(
        choices=['economy', 'comfort', 'premium', 'xl'],
        default='economy'
    )
    ride_type = serializers.ChoiceField(choices=['standard', 'shared', 'scheduled'], default='standard')
    passenger_count = serializers.IntegerField(min_value=1, max_value=8, default=1)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    scheduled_time = serializers.DateTimeField(required=False, allow_null=True)



class RideParticipantSerializer(serializers.ModelSerializer):
    """Serializer for ride participants."""
    user = UserProfileSerializer(read_only=True)
    pickup_location = serializers.SerializerMethodField()
    dropoff_location = serializers.SerializerMethodField()
   
    class Meta:
        model = RideParticipant
        fields = [
            'id', 'user', 'status', 'is_organizer',
            'pickup_location', 'pickup_address',
            'dropoff_location', 'dropoff_address',
            'fare_percentage', 'fare_amount', 'payment_status',
            'invited_at', 'responded_at', 'picked_up_at', 'dropped_off_at',
        ]
        read_only_fields = fields
   
    def get_pickup_location(self, obj):
        if obj.pickup_location:
            return {
                'latitude': obj.pickup_location.y,
                'longitude': obj.pickup_location.x,
            }
        return None
   
    def get_dropoff_location(self, obj):
        if obj.dropoff_location:
            return {
                'latitude': obj.dropoff_location.y,
                'longitude': obj.dropoff_location.x,
            }
        return None


class SharedRideParticipantSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = RideParticipant
        fields = [
            "id",
            
            "user",
            "pickup_address",
            "dropoff_address",
            "status",
            "joined_at",
            "pickup_code"
        ]
        read_only_fields = fields

    
class RideSerializer(serializers.ModelSerializer):
    """Serializer for ride data."""
   
    rider = UserProfileSerializer(read_only=True)
    driver = UserProfileSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    pickup_location = serializers.SerializerMethodField()
    dropoff_location = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
   
    class Meta:
        model = Ride
        fields = [
            'id', 'rider', 'driver', 'vehicle', 'ride_type', 'status',
            'pickup_location', 'pickup_address',
            'dropoff_location', 'dropoff_address',
            'estimated_distance_meters', 'estimated_duration_seconds',
            'actual_distance_meters', 'actual_duration_seconds',
            'vehicle_type_requested', 'estimated_fare', 'final_fare',
            'surge_multiplier', 'passenger_count', 'notes',
            'scheduled_pickup_time', 'requested_at', 'driver_assigned_at',
            'driver_arrived_at', 'started_at', 'completed_at',
            'cancelled_at', 'cancellation_reason','participants','verification_code'
        ]
        read_only_fields = fields
   
    def get_pickup_location(self, obj):
        if obj.pickup_location:
            return {
                'latitude': obj.pickup_location.y,
                'longitude': obj.pickup_location.x,
            }
        return None
   
    def get_dropoff_location(self, obj):
        if obj.dropoff_location:
            return {
                'latitude': obj.dropoff_location.y,
                'longitude': obj.dropoff_location.x,
            }
        return None
    
    def get_participants(self, obj):

        accepted_participants = (
            obj.participants.filter(
                status=RideParticipant.Status.ACCEPTED
            )
        )

        return SharedRideParticipantSerializer(
            accepted_participants,
            many=True
        ).data


class RideStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating ride status."""
   
    status = serializers.ChoiceField(choices=Ride.Status.choices)
    reason = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)


# class RideParticipantSerializer(serializers.ModelSerializer):
#     """Serializer for shared ride participants."""
   
#     user = UserProfileSerializer(read_only=True)
#     pickup_location = serializers.SerializerMethodField()
#     dropoff_location = serializers.SerializerMethodField()
   
#     class Meta:
#         model = RideParticipant
#         fields = [
#             'id', 'user', 'status', 'is_organizer',
#             'pickup_location', 'pickup_address',
#             'dropoff_location', 'dropoff_address',
#             'fare_percentage', 'fare_amount', 'payment_status',
#             'invited_at', 'responded_at', 'picked_up_at', 'dropped_off_at',
#         ]
#         read_only_fields = fields
   
#     def get_pickup_location(self, obj):
#         if obj.pickup_location:
#             return {
#                 'latitude': obj.pickup_location.y,
#                 'longitude': obj.pickup_location.x,
#             }
#         return None
   
#     def get_dropoff_location(self, obj):
#         if obj.dropoff_location:
#             return {
#                 'latitude': obj.dropoff_location.y,
#                 'longitude': obj.dropoff_location.x,
#             }
#         return None


class InviteParticipantSerializer(serializers.Serializer):
    """Serializer for inviting participants to a shared ride."""
   
    user_id = serializers.UUIDField()
    pickup = LocationSerializer()
    dropoff = LocationSerializer()
    fare_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=0,
        max_value=100
    )

class SharedRideJoinSerializer(serializers.Serializer):

    ride_id = serializers.UUIDField()
    pickup = LocationSerializer()
    dropoff = LocationSerializer()



class EmergencySOSSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.get_full_name', read_only=True)
    tracking_url = serializers.SerializerMethodField()

    class Meta:
        model = EmergencySOS
        fields = [
            'id',
            'ride',
            'reporter',
            'reporter_name',
            'reporter_type',
            'is_active',
            'triggered_at',
            'resolved_at',
            'audio_recording_vault',
            'tracking_url'
        ]
        read_only_fields = ['id', 'reporter', 'reporter_type', 'triggered_at', 'is_active', 'resolved_at']

    def get_tracking_url(self, obj):
        return f"https://fika.co.za/safety/track/{obj.id}/"


class RideVerificationSerializer(serializers.Serializer):
    ride_id = serializers.UUIDField()
    code = serializers.CharField(max_length=4)

class PublicTrackingSerializer(serializers.Serializer):

    ride_id = serializers.UUIDField()

    driver_name = serializers.CharField()

    driver_phone = serializers.CharField()

    vehicle_number = serializers.CharField()

    vehicle_model = serializers.CharField()

    pickup = serializers.DictField()

    destination = serializers.DictField()

    driver_location = serializers.DictField()
