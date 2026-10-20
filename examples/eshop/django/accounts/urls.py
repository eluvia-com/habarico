from django.urls import path

from . import views

urlpatterns = [
    path("login/", views.LoginView.as_view()),
    path("logout/", views.LogoutView.as_view()),
    path("current-user/", views.CurrentUserView.as_view()),
    path("current-user/change-password/", views.ChangePasswordView.as_view()),
    path("forgotten-password/", views.ForgottenPasswordView.as_view()),
    path("reset-password/", views.ResetPasswordView.as_view()),
]
