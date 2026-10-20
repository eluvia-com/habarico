import re

from django.contrib.auth.models import User
from django.core import mail
from rest_framework.test import APIClient, APITestCase


class AuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            "ada", "ada@example.com", "Secret-pass-1", is_staff=True
        )
        self.client = APIClient(enforce_csrf_checks=True)

    def login(self, username="ada@example.com", password="Secret-pass-1"):
        return self.client.post(
            "/api/auth/login/",
            {"username": username, "password": password},
            format="json",
        )

    def csrf(self):
        return {"HTTP_X_CSRFTOKEN": self.client.cookies["csrftoken"].value}

    def test_login_with_email_or_username(self):
        for username in ("ada@example.com", "ADA@example.com", "ada"):
            with self.subTest(username=username):
                self.client = APIClient(enforce_csrf_checks=True)
                response = self.login(username)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["username"], "ada@example.com")

    def test_login_with_a_wrong_password_is_a_form_error(self):
        response = self.login(password="wrong")
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["errors"][0]["source"], "non_field_errors")

    def test_admin_api_is_401_without_a_session(self):
        self.assertEqual(self.client.get("/api/admin/schema/").status_code, 401)

    def test_admin_api_is_403_for_a_user_who_is_not_staff(self):
        User.objects.create_user("bob", "bob@example.com", "Secret-pass-1")
        self.login("bob@example.com")
        self.assertEqual(self.client.get("/api/admin/schema/").status_code, 403)

    def test_a_write_needs_the_csrf_token(self):
        self.login()
        self.assertEqual(
            self.client.patch(
                "/api/auth/current-user/", {"first_name": "A"}, format="json"
            ).status_code,
            403,
        )
        response = self.client.patch(
            "/api/auth/current-user/",
            {"first_name": "Ada"},
            format="json",
            **self.csrf(),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["first_name"], "Ada")

    def test_logout_ends_the_session(self):
        self.login()
        self.assertEqual(
            self.client.post("/api/auth/logout/", **self.csrf()).status_code, 204
        )
        self.assertEqual(self.client.get("/api/auth/current-user/").status_code, 401)

    def test_change_password_keeps_the_session(self):
        self.login()
        response = self.client.post(
            "/api/auth/current-user/change-password/",
            {"old_password": "wrong", "new_password": "Another-pass-2"},
            format="json",
            **self.csrf(),
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["errors"][0]["source"], "old_password")

        response = self.client.post(
            "/api/auth/current-user/change-password/",
            {"old_password": "Secret-pass-1", "new_password": "short"},
            format="json",
            **self.csrf(),
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["errors"][0]["source"], "new_password")

        response = self.client.post(
            "/api/auth/current-user/change-password/",
            {"old_password": "Secret-pass-1", "new_password": "Another-pass-2"},
            format="json",
            **self.csrf(),
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.client.get("/api/auth/current-user/").status_code, 200)

    def test_password_reset(self):
        response = self.client.post(
            "/api/auth/forgotten-password/", {"email": "ada@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, 204)
        token = re.search(r"reset-password/(\S+)", mail.outbox[0].body).group(1)

        response = self.client.post(
            "/api/auth/reset-password/",
            {"token": token, "password": "Reset-pass-3"},
            format="json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.login(password="Reset-pass-3").status_code, 200)

        self.client = APIClient(enforce_csrf_checks=True)
        response = self.client.post(
            "/api/auth/reset-password/",
            {"token": token, "password": "Again-pass-4"},
            format="json",
        )
        self.assertEqual(response.status_code, 422)

    def test_forgotten_password_does_not_reveal_unknown_addresses(self):
        response = self.client.post(
            "/api/auth/forgotten-password/",
            {"email": "nobody@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(mail.outbox, [])
