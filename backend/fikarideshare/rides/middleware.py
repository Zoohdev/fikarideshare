
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from users.models import User
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Custom middleware to authenticate WebSocket connections 
    via an explicit token passed in the query string.
    Example: ws://192.168.X.X:8000/ws/location/?token=xyz
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):

        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        user_id = query_params.get("user_id", [None])[0]

        if user_id:
            scope["user"] = await get_user(user_id)

            print("DEBUG USER ID:", user_id)
            print("DEBUG USER:", scope["user"])
        else:
            scope["user"] = AnonymousUser()

        print("MIDDLEWARE PASSING TO CONSUMER")

        return await self.inner(scope, receive, send)
