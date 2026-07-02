from rest_framework.routers import DefaultRouter
from .views import BOQViewSet

router = DefaultRouter()

router.register(
    r"boq",
    BOQViewSet,
    basename="boq"
)

urlpatterns = router.urls