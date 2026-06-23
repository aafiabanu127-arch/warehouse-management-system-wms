from django.db import models
from django.conf import settings


class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    total_capacity = models.FloatField()
    available_capacity = models.FloatField()
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_warehouses'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Zone(models.Model):
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='zones'
    )
    name = models.CharField(max_length=100)
    capacity = models.FloatField()

    def __str__(self):
        return f"{self.warehouse.name} - {self.name}"


class Rack(models.Model):
    zone = models.ForeignKey(
        Zone,
        on_delete=models.CASCADE,
        related_name='racks'
    )
    rack_code = models.CharField(max_length=50, unique=True)
    capacity = models.FloatField()

    def __str__(self):
        return self.rack_code


class Shelf(models.Model):
    rack = models.ForeignKey(
        Rack,
        on_delete=models.CASCADE,
        related_name='shelves'
    )
    shelf_code = models.CharField(max_length=50)
    capacity = models.FloatField()
    occupied_capacity = models.FloatField(default=0)

    def __str__(self):
        return self.shelf_code