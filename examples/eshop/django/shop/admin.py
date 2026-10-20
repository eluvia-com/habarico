from habarico import ModelAdmin

from .models import Category, Customer, Order, Product


class CategoryAdmin(ModelAdmin):
    model = Category
    label = "Categories"
    icon = "Category"
    fields = ["name", "description"]
    search_fields = ["name"]
    ordering_fields = ["name"]
    can_create = can_update = can_delete = True


class ProductAdmin(ModelAdmin):
    model = Product
    label = "Products"
    icon = "Inventory"
    fields = ["name", "sku", "description", "status", "category", "price", "stock", "created_at"]
    read_only_fields = ["created_at"]
    search_fields = ["name", "sku"]
    filter_fields = ["status", "category", "price"]
    ordering_fields = ["name", "price", "stock", "created_at"]
    can_create = can_update = can_delete = True


class CustomerAdmin(ModelAdmin):
    model = Customer
    label = "Customers"
    icon = "People"
    fields = ["first_name", "last_name", "email", "created_at"]
    read_only_fields = ["created_at"]
    search_fields = ["first_name", "last_name", "email"]
    ordering_fields = ["last_name", "created_at"]
    can_create = can_update = can_delete = True


class OrderAdmin(ModelAdmin):
    model = Order
    label = "Orders"
    icon = "ShoppingCart"
    fields = ["number", "customer", "status", "total", "note", "created_at"]
    read_only_fields = ["created_at"]
    search_fields = ["number"]
    filter_fields = ["status", "customer", "created_at"]
    ordering_fields = ["number", "total", "created_at"]
    can_create = can_update = True
