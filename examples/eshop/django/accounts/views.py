from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ChangePasswordSerializer,
    ForgottenPasswordSerializer,
    LoginSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)

User = get_user_model()


class LoginView(APIView):
    """Signs in with the e-mail (or the username) and the password and starts a session."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["username"]
        account = User.objects.filter(email__iexact=identifier).first()
        user = authenticate(
            request,
            username=account.get_username() if account else identifier,
            password=serializer.validated_data["password"],
        )
        if user is None:
            raise serializers.ValidationError({"non_field_errors": ["Invalid e-mail or password."]})
        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        # Keeps this session signed in; every other session of the user ends.
        update_session_auth_hash(request, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ForgottenPasswordView(APIView):
    """E-mails a reset link. Answers the same whether the address exists or not."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgottenPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
        if user is not None:
            token = "{}.{}".format(
                urlsafe_base64_encode(force_bytes(user.pk)), default_token_generator.make_token(user)
            )
            send_mail(
                "Reset your password",
                "Set a new password here: {}".format(settings.PASSWORD_RESET_URL.format(token=token)),
                None,
                [user.email],
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.get_user(serializer.validated_data["token"])
        if user is None:
            raise serializers.ValidationError({"non_field_errors": ["The link is invalid or has expired."]})
        password = serializer.validated_data["password"]
        try:
            password_validation.validate_password(password, user)
        except ValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)})
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def get_user(token):
        uidb64, _, user_token = token.partition(".")
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uidb64)))
        except (ValueError, OverflowError, User.DoesNotExist):
            return None
        return user if default_token_generator.check_token(user, user_token) else None
