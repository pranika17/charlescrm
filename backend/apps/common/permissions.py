from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.users.models import User


def user_has_any_role(user, roles):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    return getattr(user, "role", None) in roles


class RolePermission(BasePermission):
    read_roles = ()
    write_roles = ()
    message = "You do not have permission to access this resource."

    def has_permission(self, request, view):
        allowed_roles = self.read_roles if request.method in SAFE_METHODS else self.write_roles
        return user_has_any_role(request.user, allowed_roles)


class DashboardPermission(RolePermission):
    read_roles = (
        User.Role.OWNER,
        User.Role.MANAGER,
        User.Role.SITE_ENGINEER,
        User.Role.ACCOUNTANT,
        User.Role.VIEWER,
    )
    write_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.ACCOUNTANT)


class ProjectPermission(RolePermission):
    read_roles = (
        User.Role.OWNER,
        User.Role.MANAGER,
        User.Role.SITE_ENGINEER,
        User.Role.ACCOUNTANT,
        User.Role.VIEWER,
    )
    write_roles = (User.Role.OWNER, User.Role.MANAGER)


class DailyLogPermission(RolePermission):
    read_roles = (
        User.Role.OWNER,
        User.Role.MANAGER,
        User.Role.SITE_ENGINEER,
        User.Role.ACCOUNTANT,
        User.Role.VIEWER,
    )
    write_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.SITE_ENGINEER)


class LaborPermission(RolePermission):
    read_roles = (
        User.Role.OWNER,
        User.Role.MANAGER,
        User.Role.SITE_ENGINEER,
        User.Role.ACCOUNTANT,
    )
    write_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.SITE_ENGINEER)


class MaterialPermission(RolePermission):
    read_roles = (
        User.Role.OWNER,
        User.Role.MANAGER,
        User.Role.SITE_ENGINEER,
        User.Role.ACCOUNTANT,
    )
    write_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.SITE_ENGINEER)


class FinancePermission(RolePermission):
    read_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.ACCOUNTANT)
    write_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.ACCOUNTANT)


class QuotationPermission(RolePermission):
    read_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.ACCOUNTANT)
    write_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.ACCOUNTANT)


class ApprovalListPermission(RolePermission):
    read_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.ACCOUNTANT)
    write_roles = (User.Role.OWNER, User.Role.MANAGER, User.Role.ACCOUNTANT)


class ApprovalActionPermission(RolePermission):
    write_roles = (User.Role.OWNER, User.Role.MANAGER)


class UserManagementPermission(RolePermission):
    read_roles = (User.Role.OWNER,)
    write_roles = (User.Role.OWNER,)
