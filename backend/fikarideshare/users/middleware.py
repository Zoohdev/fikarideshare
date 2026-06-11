from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User


@database_sync_to_async
def get_user_from_token(token_key):
    """Validate JWT token and return the associated user."""
    try:
        access_token = AccessToken(token_key)
        user_id = access_token.get('user_id')
        return User.objects.get(id=user_id)
    except (TokenError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for Django Channels.
   
    Extracts the JWT token from the WebSocket connection's
    query string and authenticates the user.
   
    Usage in client:
        const ws = new WebSocket('ws://host/ws/rides/?token=<jwt_token>')
    """
   
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = dict(
            param.split('=') for param in query_string.split('&') if '=' in param
        )
        token = query_params.get('token')
       
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
       
        return await super().__call__(scope, receive, send)

