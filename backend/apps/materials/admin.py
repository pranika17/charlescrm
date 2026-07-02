from django.contrib import admin

from apps.materials.models import Material, MaterialPurchase, MaterialUsage


admin.site.register(Material)
admin.site.register(MaterialPurchase)
admin.site.register(MaterialUsage)
