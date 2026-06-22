from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    CurrentUserView,
    RegisterView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserViewSet,
)
router = SimpleRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('register/', RegisterView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('', include(router.urls)),
]
