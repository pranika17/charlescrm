from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.common.permissions import UserManagementPermission
from apps.users.models import User
from apps.users.serializers import CRMTokenSerializer, UserCreateSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CRMTokenSerializer


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by("-created_at")
    permission_classes = [UserManagementPermission]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [UserManagementPermission]


token_refresh_view = TokenRefreshView.as_view()
