
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from users.models import User
from urllib.parse import parse_qs

@database_sync_to_async
def get_user_from_token(token):
    try:
        validated = AccessToken(token)
        return User.objects.get(id=validated['user_id'])
    except (TokenError, KeyError, User.DoesNotExist):
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Authenticates WebSocket connections via a SimpleJWT access token passed
    in the query string: ws://host/ws/tracking/?token=<access token> - the
    same token issued by /api/users/login/ and already sent as the Bearer
    header on REST calls (see services/api.js).

    Previously this trusted a bare ?user_id=<uuid> with no signature check
    at all - literally User.objects.get(id=user_id) on whatever id the
    client claimed. Anyone who knew (or enumerated) another user's id could
    open a socket as them and land in their user_<id> broadcast group,
    silently receiving ride requests, location and chat meant for that
    person (and, combined with the driver_accept_ride handler, accepting
    rides as them). A verified JWT is the only thing that actually proves
    who's connecting.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)
