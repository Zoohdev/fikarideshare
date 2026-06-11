from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'users'

urlpatterns = [
    # Standard auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
   
    # Biometric auth
    path('biometric/register/', views.BiometricRegisterView.as_view(), name='biometric_register'),
    path('biometric/challenge/', views.BiometricChallengeView.as_view(), name='biometric_challenge'),
    path('biometric/login/', views.BiometricLoginView.as_view(), name='biometric_login'),
   
    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
]

