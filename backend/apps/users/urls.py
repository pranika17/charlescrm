from django.urls import path

from apps.users.views import CurrentUserView, LoginView, UserDetailView, UserListCreateView, token_refresh_view


urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", token_refresh_view, name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]
