from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Category, Product


class AdminTests(APITestCase):
    """A smoke test of the library itself: the example is in this repository so that a change that
    breaks it fails here, in the same pull request."""

    def setUp(self):
        User.objects.create_user(
            "ada", "ada@example.com", "Secret-pass-1", is_staff=True
        )
        self.client.post(
            "/api/auth/login/",
            {"username": "ada@example.com", "password": "Secret-pass-1"},
            format="json",
        )
        category = Category.objects.create(name="Books")
        Product.objects.create(
            name="Dune",
            sku="dune",
            category=category,
            price="12.90",
            stock=40,
            status=Product.Status.PUBLISHED,
        )

    def test_the_schema_lists_the_four_resources(self):
        response = self.client.get("/api/admin/schema/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            sorted(resource["name"] for resource in response.json()),
            ["category", "customer", "order", "product"],
        )

    def test_a_list_response_carries_the_record_and_its_money_field(self):
        response = self.client.get("/api/admin/product/")
        self.assertEqual(response.status_code, 200)

        product = response.json()["objects"][0]
        self.assertEqual(product["name"], "Dune")
        self.assertEqual(product["price"], "12.90")

    def test_the_money_field_is_published_in_the_currency_the_model_sets(self):
        response = self.client.get("/api/admin/product/schema/")
        self.assertEqual(response.status_code, 200)

        fields = response.json()["endpoints"]["get"]["fields"]
        price = next(field for field in fields if field["name"] == "price")
        self.assertEqual(price["options"]["number"]["currency"], "USD")
