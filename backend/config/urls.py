from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.users.urls")),
    path("api/projects/", include("apps.projects.urls")),
    path("api/labor/", include("apps.labor.urls")),
    path("api/materials/", include("apps.materials.urls")),
    path("api/expenses/", include("apps.expenses.urls")),
    path("api/finance/", include("apps.finance.urls")),
    path("api/quotations/", include("apps.quotations.urls")),
    path("api/approvals/", include("apps.approvals.urls")),
    path("api/uploads/", include("apps.uploads.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/boq/", include("apps.boq.urls")),
    path("api/vendors/", include("apps.vendors.urls")),
    path("api/purchase_orders/", include("apps.purchase_orders.urls")),
    path("api/equipment/", include("apps.equipment.urls")),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
