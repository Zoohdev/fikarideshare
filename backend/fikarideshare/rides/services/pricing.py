from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from django.utils import timezone
from django.core.cache import cache
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D


class PricingService:
    """
    Service for calculating ride fares.
   
    Pricing components:
    1. Base fare (fixed starting cost)
    2. Per-kilometer rate
    3. Per-minute rate
    4. Minimum fare
    5. Surge pricing multiplier
    6. Vehicle type multiplier
    7. Booking fee
    """
   
    # Base rates (in USD)
    BASE_RATES = {
        'economy': {
            'base_fare': Decimal('2.50'),
            'per_km': Decimal('1.20'),
            'per_minute': Decimal('0.20'),
            'minimum_fare': Decimal('5.00'),
            'booking_fee': Decimal('1.50'),
        },
        'comfort': {
            'base_fare': Decimal('3.50'),
            'per_km': Decimal('1.80'),
            'per_minute': Decimal('0.30'),
            'minimum_fare': Decimal('8.00'),
            'booking_fee': Decimal('2.00'),
        },
        'premium': {
            'base_fare': Decimal('5.00'),
            'per_km': Decimal('2.50'),
            'per_minute': Decimal('0.45'),
            'minimum_fare': Decimal('12.00'),
            'booking_fee': Decimal('2.50'),
        },
        'xl': {
            'base_fare': Decimal('4.00'),
            'per_km': Decimal('2.20'),
            'per_minute': Decimal('0.35'),
            'minimum_fare': Decimal('10.00'),
            'booking_fee': Decimal('2.00'),
        },
    }
   
    # Platform commission percentage
    PLATFORM_COMMISSION = Decimal('0.25')  # 25%
   
    def calculate_fare(
        self,
        distance_meters: int,
        duration_seconds: int,
        vehicle_type: str = 'economy',
        surge_multiplier: float = 1.0,
        promo_code: str = None
    ) -> Dict:
        """
        Calculate fare for a ride.
       
        Args:
            distance_meters: Trip distance in meters
            duration_seconds: Trip duration in seconds
            vehicle_type: Type of vehicle
            surge_multiplier: Dynamic pricing multiplier
            promo_code: Promotional code for discount
       
        Returns:
            Dict with fare breakdown
        """
        rates = self.BASE_RATES.get(vehicle_type, self.BASE_RATES['economy'])
       
        # Convert units
        distance_km = Decimal(distance_meters) / Decimal('1000')
        duration_minutes = Decimal(duration_seconds) / Decimal('60')
        surge = Decimal(str(surge_multiplier))
       
        # Calculate components
        base_fare = rates['base_fare']
        distance_fare = (distance_km * rates['per_km']).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        time_fare = (duration_minutes * rates['per_minute']).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
       
        # Subtotal before surge
        subtotal = base_fare + distance_fare + time_fare
       
        # Apply surge
        if surge > 1:
            surge_amount = (subtotal * (surge - 1)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        else:
            surge_amount = Decimal('0.00')
       
        subtotal_with_surge = subtotal + surge_amount
       
        # Add booking fee
        booking_fee = rates['booking_fee']
       
        # Apply minimum fare
        if subtotal_with_surge < rates['minimum_fare']:
            subtotal_with_surge = rates['minimum_fare']
       
        # Calculate total
        total = subtotal_with_surge + booking_fee
       
        # Apply promo code discount
        discount = Decimal('0.00')
        if promo_code:
            discount = self._apply_promo_code(promo_code, total)
            total = (total - discount).max(Decimal('0.00'))
       
        # Calculate driver earnings and platform fee
        driver_earnings = (total * (1 - self.PLATFORM_COMMISSION)).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        platform_fee = (total - driver_earnings).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
       
        return {
            'base_fare': float(base_fare),
            'distance_fare': float(distance_fare),
            'time_fare': float(time_fare),
            'surge_amount': float(surge_amount),
            'surge_multiplier': float(surge),
            'booking_fee': float(booking_fee),
            'discount': float(discount),
            'subtotal': float(subtotal_with_surge),
            'total': float(total),
            'driver_earnings': float(driver_earnings),
            'platform_fee': float(platform_fee),
            'currency': 'USD',
        }
   
    def calculate_surge_multiplier(
        self,
        latitude: float,
        longitude: float,
        vehicle_type: str = 'economy'
    ) -> float:
        """
        Calculate dynamic surge pricing multiplier.
       
        Factors considered:
        - Demand (number of ride requests in area)
        - Supply (number of available drivers in area)
        - Time of day
        - Weather (could integrate with weather API)
        - Special events
       
        Returns multiplier between 1.0 and 5.0
        """
        from rides.models import Ride
        from users.models import User
       
        point = Point(longitude, latitude, srid=4326)
       
        # Count active ride requests in area (last 15 minutes)
        recent_cutoff = timezone.now() - timezone.timedelta(minutes=15)
        demand = Ride.objects.filter(
            pickup_location__distance_lte=(point, D(km=3)),
            requested_at__gte=recent_cutoff,
            status__in=[
                Ride.Status.REQUESTED,
                Ride.Status.SEARCHING,
            ]
        ).count()
       
        # Count available drivers in area
        supply = User.objects.get_available_drivers(point, radius_km=5).count()
       
        # Calculate base surge from supply/demand
        if supply == 0:
            surge = 3.0
        else:
            ratio = demand / supply
            if ratio <= 0.5:
                surge = 1.0
            elif ratio <= 1.0:
                surge = 1.0 + (ratio - 0.5) * 0.6  # Up to 1.3
            elif ratio <= 2.0:
                surge = 1.3 + (ratio - 1.0) * 0.7  # Up to 2.0
            elif ratio <= 4.0:
                surge = 2.0 + (ratio - 2.0) * 0.5  # Up to 3.0
            else:
                surge = min(3.0 + (ratio - 4.0) * 0.25, 5.0)  # Max 5.0
       
        # Time-of-day adjustment
        hour = timezone.localtime().hour
        if hour in [7, 8, 9, 17, 18, 19]:  # Rush hours
            surge *= 1.2
        elif hour in [0, 1, 2, 3, 4]:  # Late night
            surge *= 1.3
       
        # Round to nearest 0.1
        surge = round(min(surge, 5.0), 1)
       
        return max(surge, 1.0)
   
    def _apply_promo_code(self, code: str, total: Decimal) -> Decimal:
        """Apply promotional code and return discount amount."""
        # In production, look up promo code from database
        promo_codes = {
            'FIRST10': {'type': 'percentage', 'value': Decimal('0.10')},
            'SAVE5': {'type': 'fixed', 'value': Decimal('5.00')},
        }
       
        promo = promo_codes.get(code.upper())
        if not promo:
            return Decimal('0.00')
       
        if promo['type'] == 'percentage':
            return (total * promo['value']).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        else:
            return min(promo['value'], total)


class FareSplitService:
    """
    Service for splitting fares among multiple participants.
    """
   
    def __init__(self):
        self.pricing = PricingService()
   
    def calculate_split(
        self,
        total_fare: Decimal,
        participants: List[Dict],
        split_type: str = 'equal'
    ) -> List[Dict]:
        """
        Calculate fare split among participants.
       
        Args:
            total_fare: Total ride fare
            participants: List of participant dicts with user_id and optional distance
            split_type: 'equal', 'distance', or 'custom'
       
        Returns:
            List of dicts with user_id, percentage, and amount
        """
        if not participants:
            return []
       
        total_fare = Decimal(str(total_fare))
       
        if split_type == 'equal':
            return self._equal_split(total_fare, participants)
        elif split_type == 'distance':
            return self._distance_split(total_fare, participants)
        elif split_type == 'custom':
            return self._custom_split(total_fare, participants)
        else:
            raise ValueError(f'Unknown split type: {split_type}')
   
    def _equal_split(
        self,
        total_fare: Decimal,
        participants: List[Dict]
    ) -> List[Dict]:
        """Split fare equally among participants."""
        count = len(participants)
        share = (total_fare / count).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        percentage = Decimal('100') / count
       
        result = []
        remaining = total_fare
       
        for i, p in enumerate(participants):
            if i == count - 1:
                # Last participant gets remainder to handle rounding
                amount = remaining
            else:
                amount = share
                remaining -= share
           
            result.append({
                'user_id': p['user_id'],
                'percentage': float(percentage.quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )),
                'amount': float(amount),
            })
       
        return result
   
    def _distance_split(
        self,
        total_fare: Decimal,
        participants: List[Dict]
    ) -> List[Dict]:
        """
        Split fare based on distance traveled by each participant.
       
        Each participant dict must include:
        - user_id
        - distance_meters: Their portion of the route
        """
        total_distance = sum(p.get('distance_meters', 0) for p in participants)
       
        if total_distance == 0:
            return self._equal_split(total_fare, participants)
       
        result = []
        remaining = total_fare
       
        for i, p in enumerate(participants):
            distance = p.get('distance_meters', 0)
            percentage = Decimal(str(distance)) / Decimal(str(total_distance)) * 100
           
            if i == len(participants) - 1:
                amount = remaining
            else:
                amount = (total_fare * percentage / 100).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
                remaining -= amount
           
            result.append({
                'user_id': p['user_id'],
                'percentage': float(percentage.quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )),
                'amount': float(amount),
            })
       
        return result
   
    def _custom_split(
        self,
        total_fare: Decimal,
        participants: List[Dict]
    ) -> List[Dict]:
        """
        Use custom percentages defined by participants.
       
        Each participant dict must include:
        - user_id
        - percentage: Their share (must sum to 100)
        """
        total_percentage = sum(
            Decimal(str(p.get('percentage', 0))) for p in participants
        )
       
        if total_percentage != Decimal('100'):
            raise ValueError('Custom percentages must sum to 100')
       
        result = []
        remaining = total_fare
       
        for i, p in enumerate(participants):
            percentage = Decimal(str(p['percentage']))
           
            if i == len(participants) - 1:
                amount = remaining
            else:
                amount = (total_fare * percentage / 100).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
                remaining -= amount
           
            result.append({
                'user_id': p['user_id'],
                'percentage': float(percentage),
                'amount': float(amount),
            })
       
        return result

