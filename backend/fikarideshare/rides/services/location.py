import requests
from typing import Dict, List, Tuple, Optional
from decimal import Decimal
from django.conf import settings
from django.contrib.gis.geos import Point, LineString
from django.contrib.gis.measure import D
from django.core.cache import cache

from users.models import User


class GoogleMapsService:
    """
    Service for Google Maps Platform APIs.
   
    Provides:
    - Distance Matrix calculations
    - Directions and route polylines
    - Geocoding and reverse geocoding
    - ETA calculations
    """
   
    def __init__(self):
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        # self.base_url = '[maps.googleapis.com](https://maps.googleapis.com/maps/api)'
        self.base_url = 'https://maps.googleapis.com/maps/api'
   
    def geocode(self, address: str) -> Optional[Dict]:
        """
        Convert address to coordinates.
        """
        cache_key = f'geocode:{hash(address)}'
        cached = cache.get(cache_key)
        if cached:
            return cached
       
        response = requests.get(
            f'{self.base_url}/geocode/json',
            params={
                'address': address,
                'key': self.api_key,
            }
        )
       
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK' and data['results']:
                result = {
                    'formatted_address': data['results'][0]['formatted_address'],
                    'location': data['results'][0]['geometry']['location'],
                    'place_id': data['results'][0]['place_id'],
                }
                cache.set(cache_key, result, timeout=86400)  # Cache for 24 hours
                return result
        return None
   
    def reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """
        Convert coordinates to address.
        """
        cache_key = f'reverse_geocode:{lat:.6f}:{lng:.6f}'
        cached = cache.get(cache_key)
        if cached:
            return cached
       
        response = requests.get(
            f'{self.base_url}/geocode/json',
            params={
                'latlng': f'{lat},{lng}',
                'key': self.api_key,
            }
        )
       
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK' and data['results']:
                address = data['results'][0]['formatted_address']
                cache.set(cache_key, address, timeout=86400)
                return address
        return None
   
    def autocomplete(
        self,
        query: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        country: str = 'za',
    ) -> List[Dict]:
        """
        Places Autocomplete predictions for a partial search query.
        """
        params = {
            'input': query,
            'key': self.api_key,
            'components': f'country:{country}',
        }
        if latitude is not None and longitude is not None:
            params['location'] = f'{latitude},{longitude}'
            params['radius'] = 50000

        response = requests.get(
            f'{self.base_url}/place/autocomplete/json',
            params=params,
        )

        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK':
                return [
                    {
                        'place_id': p['place_id'],
                        'description': p['description'],
                        'main_text': p['structured_formatting']['main_text'],
                        'secondary_text': p['structured_formatting'].get('secondary_text', ''),
                    }
                    for p in data['predictions']
                ]
        return []

    def place_details(self, place_id: str) -> Optional[Dict]:
        """
        Resolve a place_id (from autocomplete) to a name, address and coordinates.
        """
        cache_key = f'place_details:{place_id}'
        cached = cache.get(cache_key)
        if cached:
            return cached

        response = requests.get(
            f'{self.base_url}/place/details/json',
            params={
                'place_id': place_id,
                'fields': 'name,formatted_address,geometry',
                'key': self.api_key,
            }
        )

        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK' and data.get('result'):
                result = data['result']
                place = {
                    'name': result.get('name', ''),
                    'address': result['formatted_address'],
                    'latitude': result['geometry']['location']['lat'],
                    'longitude': result['geometry']['location']['lng'],
                    'place_id': place_id,
                }
                cache.set(cache_key, place, timeout=86400)
                return place
        return None

    def get_directions(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        waypoints: List[Tuple[float, float]] = None,
        mode: str = 'driving'
    ) -> Optional[Dict]:
        """
        Get directions between two points.
       
        Returns:
            Dict with distance, duration, polyline, and steps
        """
        params = {
            'origin': f'{origin[0]},{origin[1]}',
            'destination': f'{destination[0]},{destination[1]}',
            'mode': mode,
            'key': self.api_key,
            'departure_time': 'now',
            'traffic_model': 'best_guess',
        }
       
        if waypoints:
            wp_str = '|'.join([f'{wp[0]},{wp[1]}' for wp in waypoints])
            params['waypoints'] = f'optimize:true|{wp_str}'
       
        response = requests.get(
            f'{self.base_url}/directions/json',
            params=params
        )
       
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK' and data['routes']:
                route = data['routes'][0]
                leg = route['legs'][0]
               
                return {
                    'distance_meters': leg['distance']['value'],
                    'duration_seconds': leg['duration']['value'],
                    'duration_in_traffic_seconds': leg.get(
                        'duration_in_traffic', leg['duration']
                    )['value'],
                    # 'polyline': route['overview_polyline']['encoded'],
                    'polyline': route['overview_polyline']['points'],

                    'steps': [
                        {
                            'instruction': step['html_instructions'],
                            'distance': step['distance']['value'],
                            'duration': step['duration']['value'],
                            'start_location': step['start_location'],
                            'end_location': step['end_location'],
                        }
                        for step in leg['steps']
                    ],
                    'start_address': leg['start_address'],
                    'end_address': leg['end_address'],
                }
            else:
                # ADD THESE 3 LINES TO REVEAL THE ERROR
                print("\n=== GOOGLE MAPS API FAILED ===")
                print(f"Status: {data.get('status')}")
                print(f"Error: {data.get('error_message', 'No specific message')}\n")
        else:
            print(f"HTTP ERROR {response.status_code}: {response.text}")
        return None
   
    def get_distance_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]]
    ) -> Optional[List[List[Dict]]]:
        """
        Get distance and duration matrix between multiple origins and destinations.
       
        Useful for finding the nearest driver.
        """
        origins_str = '|'.join([f'{o[0]},{o[1]}' for o in origins])
        destinations_str = '|'.join([f'{d[0]},{d[1]}' for d in destinations])
       
        response = requests.get(
            f'{self.base_url}/distancematrix/json',
            params={
                'origins': origins_str,
                'destinations': destinations_str,
                'mode': 'driving',
                'key': self.api_key,
                'departure_time': 'now',
            }
        )
       
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK':
                results = []
                for row in data['rows']:
                    row_results = []
                    for element in row['elements']:
                        if element['status'] == 'OK':
                            row_results.append({
                                'distance_meters': element['distance']['value'],
                                'duration_seconds': element['duration']['value'],
                            })
                        else:
                            row_results.append(None)
                    results.append(row_results)
                return results
        return None
   
    @staticmethod
    def decode_polyline(polyline_str: str) -> List[Tuple[float, float]]:
        """
        Decode a Google Maps encoded polyline string.
       
        Returns list of (latitude, longitude) tuples.
        """
        index = 0
        coordinates = []
        lat = 0
        lng = 0
       
        while index < len(polyline_str):
            # Decode latitude
            shift = 0
            result = 0
            while True:
                b = ord(polyline_str[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            lat += (~(result >> 1) if result & 1 else result >> 1)
           
            # Decode longitude
            shift = 0
            result = 0
            while True:
                b = ord(polyline_str[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            lng += (~(result >> 1) if result & 1 else result >> 1)
           
            coordinates.append((lat / 1e5, lng / 1e5))
       
        return coordinates


class DriverLocationService:
    """
    Service for managing driver locations and finding nearby drivers.
    """
   
    def __init__(self):
        self.maps = GoogleMapsService()
   
    def update_driver_location(
        self,
        driver: User,
        latitude: float,
        longitude: float,
        heading: float = None,
        speed: float = None
    ) -> None:
        """
        Update a driver's current location.
       
        Also caches location in Redis for fast retrieval.
        """
        # Update database
        driver.update_location(latitude, longitude)
       
        # Cache in Redis for fast queries
        cache_key = f'driver_location:{driver.id}'
        cache.set(cache_key, {
            'lat': latitude,
            'lng': longitude,
            'heading': heading,
            'speed': speed,
            'updated_at': driver.last_location_update.isoformat(),
        }, timeout=300)  # 5 minute TTL
   
    def find_nearby_drivers(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10,
        vehicle_type: str = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        Find available drivers near a location.
       
        Uses PostGIS for efficient geospatial queries.
        """
        point = Point(longitude, latitude, srid=4326)
       
        queryset = User.objects.get_available_drivers(point, radius_km)
       
        if vehicle_type:
            queryset = queryset.filter(
                vehicles__vehicle_type=vehicle_type,
                vehicles__is_primary=True,
                vehicles__is_active=True,
                vehicles__dekra_status='approved',
            )
       
        drivers = queryset[:limit]
       
        # Get ETA for each driver
        if drivers:
            origins = [
                (d.current_location.y, d.current_location.x)
                for d in drivers
            ]
            destination = (latitude, longitude)
           
            # Batch request to Distance Matrix API
            matrix = self.maps.get_distance_matrix(
                origins=origins,
                destinations=[destination]
            )
           
            results = []
            for i, driver in enumerate(drivers):
                eta_info = matrix[i][0] if matrix else None
               
                results.append({
                    'driver_id': str(driver.id),
                    'name': driver.full_name,
                    'rating': float(driver.average_rating),
                    'location': {
                        'lat': driver.current_location.y,
                        'lng': driver.current_location.x,
                    },
                    'distance_meters': eta_info['distance_meters'] if eta_info else None,
                    'eta_seconds': eta_info['duration_seconds'] if eta_info else None,
                    'vehicle': self._get_driver_vehicle(driver),
                })

            # Re-rank by actual road ETA where available - the queryset
            # above is already straight-line-nearest-first, but that can
            # disagree with real driving time (one-way streets, traffic).
            # Callers (e.g. ride matching) take results[0] as "the best
            # driver", so this ordering is the one that actually matters.
            results.sort(key=lambda r: r['eta_seconds'] if r['eta_seconds'] is not None else r['distance_meters'] if r['distance_meters'] is not None else float('inf'))

            return results
       
        return []
   
    def _get_driver_vehicle(self, driver: User) -> Optional[Dict]:
        """Get driver's primary vehicle info."""
        vehicle = driver.vehicles.filter(is_primary=True, is_active=True).first()
        if vehicle:
            return {
                'id': str(vehicle.id),
                'make': vehicle.make,
                'model': vehicle.model,
                'color': vehicle.color,
                'license_plate': vehicle.license_plate,
                'vehicle_type': vehicle.vehicle_type,
            }
        return None
   
    def get_driver_eta(
        self,
        driver: User,
        destination_lat: float,
        destination_lng: float
    ) -> Optional[Dict]:
        """
        Calculate ETA from driver's current location to destination.
        """
        if not driver.current_location:
            return None
       
        directions = self.maps.get_directions(
            origin=(driver.current_location.y, driver.current_location.x),
            destination=(destination_lat, destination_lng)
        )
       
        if directions:
            return {
                'eta_seconds': directions['duration_in_traffic_seconds'],
                'distance_meters': directions['distance_meters'],
                'polyline': directions['polyline'],
            }
        return None

