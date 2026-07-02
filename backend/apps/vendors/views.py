from rest_framework import viewsets

from .models import Vendor
from .serializers import VendorSerializer


class VendorViewSet(viewsets.ModelViewSet):

    queryset = Vendor.objects.all().order_by("name")

    serializer_class = VendorSerializer