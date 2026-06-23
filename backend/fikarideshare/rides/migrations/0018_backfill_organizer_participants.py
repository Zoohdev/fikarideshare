from django.db import migrations


def backfill_organizer_participants(apps, schema_editor):
    """
    From this point on, RideService.create_ride() mirrors the ride's own
    rider as a RideParticipant row (is_organizer=True) at creation time.
    This backfills that row for every ride that already existed before
    that change shipped, so participant-list-based logic (fare split on
    completion, the "is the car empty" check in dropoff_user, the
    websocket fan-out) sees a consistent picture for old and new rides
    alike instead of only working correctly for rides created after
    deploy.
    """
    Ride = apps.get_model('rides', 'Ride')
    RideParticipant = apps.get_model('rides', 'RideParticipant')

    # Reflect each ride's current state onto the backfilled row rather
    # than naively marking everything ACCEPTED - a long-completed ride's
    # organizer row should read as dropped off, not "still in the car".
    status_for_ride_status = {
        'completed': 'dropped_off',
        'cancelled': 'cancelled',
    }

    existing_organizer_ride_ids = set(
        RideParticipant.objects.filter(is_organizer=True).values_list('ride_id', flat=True)
    )

    new_rows = []
    for ride in Ride.objects.exclude(id__in=existing_organizer_ride_ids).iterator():
        if not ride.pickup_location or not ride.dropoff_location:
            # A handful of very old/incomplete test rides may be missing
            # geometry entirely - skip rather than insert a row that would
            # violate the NOT NULL columns.
            continue

        new_rows.append(RideParticipant(
            ride_id=ride.id,
            user_id=ride.rider_id,
            is_organizer=True,
            status=status_for_ride_status.get(ride.status, 'accepted'),
            pickup_location=ride.pickup_location,
            pickup_address=ride.pickup_address or '',
            dropoff_location=ride.dropoff_location,
            dropoff_address=ride.dropoff_address or '',
            estimated_distance_meters=ride.estimated_distance_meters,
            pickup_code=ride.verification_code,
        ))

    if new_rows:
        RideParticipant.objects.bulk_create(new_rows, ignore_conflicts=True)


def noop_reverse(apps, schema_editor):
    # Intentionally not reversible by deleting rows - a reverse migration
    # can't safely tell backfilled organizer rows apart from any that
    # happen to have been created normally by the time this is rolled
    # back. If you need to undo this, do it by hand against is_organizer.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('rides', '0017_alter_rideparticipant_status'),
    ]

    operations = [
        migrations.RunPython(backfill_organizer_participants, noop_reverse),
    ]
