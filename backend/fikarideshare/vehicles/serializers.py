from rest_framework import serializers
from .models import Vehicle, VehicleInspection


class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for vehicle data."""
   
    is_roadworthy = serializers.ReadOnlyField()
    needs_reverification = serializers.ReadOnlyField()
   
    class Meta:
        model = Vehicle
        fields = [
            'id', 'make', 'model', 'year', 'color', 'license_plate',
            'vehicle_type', 'seats', 'registration_document',
            'insurance_document', 'insurance_expiry',
            'dekra_status', 'dekra_verified_at', 'dekra_expires_at',
            'dekra_rejection_reason', 'photo_front', 'photo_back',
            'photo_side', 'photo_interior', 'is_active', 'is_primary',
            'is_roadworthy', 'needs_reverification', 'created_at',
        ]
        read_only_fields = [
            'id', 'dekra_status', 'dekra_verified_at', 'dekra_expires_at',
            'dekra_rejection_reason', 'created_at',
        ]


class VehicleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new vehicle."""
   
    class Meta:
        model = Vehicle
        fields = [
            'make', 'model', 'year', 'color', 'license_plate',
            'vehicle_type', 'seats', 'registration_document',
            'insurance_document', 'insurance_expiry',
        ]
   
    def validate_license_plate(self, value):
        if Vehicle.objects.filter(license_plate=value.upper()).exists():
            raise serializers.ValidationError(
                'A vehicle with this license plate already exists.'
            )
        return value.upper()


class VehicleInspectionSerializer(serializers.ModelSerializer):
    """Serializer for vehicle inspections."""
   
    class Meta:
        model = VehicleInspection
        fields = [
            'id', 'inspection_type', 'status', 'scheduled_date',
            'inspection_location', 'inspected_at', 'passed',
            'failure_reasons', 'certificate_number',
            'certificate_valid_until', 'created_at',
        ]
        read_only_fields = fields


class InspectionRequestSerializer(serializers.Serializer):
    """Serializer for requesting an inspection."""
   
    inspection_type = serializers.ChoiceField(
        choices=VehicleInspection.InspectionType.choices,
        default='initial'
    )

