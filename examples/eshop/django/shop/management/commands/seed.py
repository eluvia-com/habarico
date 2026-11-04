from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from shop.models import Category, Customer, Order, Product


class Command(BaseCommand):
    help = "Creates the admin user admin@habarico.com / admin1234 and a few records to look at."

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                "admin",
                "admin@habarico.com",
                "admin1234",
                first_name="Ada",
                last_name="Admin",
            )

        books, _ = Category.objects.get_or_create(name="Books")
        games, _ = Category.objects.get_or_create(name="Board games")
        for sku, name, category, price, stock in [
            ("dune", "Dune", books, "12.90", 40),
            ("hobbit", "The Hobbit", books, "9.50", 25),
            ("catan", "Catan", games, "44.00", 8),
            ("carcassonne", "Carcassonne", games, "35.00", 0),
        ]:
            Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "category": category,
                    "price": Decimal(price),
                    "stock": stock,
                    "status": Product.Status.PUBLISHED,
                },
            )

        zoe, _ = Customer.objects.get_or_create(
            email="zoe@example.com",
            defaults={"first_name": "Zoë", "last_name": "Müller"},
        )
        Order.objects.get_or_create(
            number="2026-0001", defaults={"customer": zoe, "total": Decimal("56.90")}
        )

        self.stdout.write(
            self.style.SUCCESS("Sign in as admin@habarico.com / admin1234")
        )
