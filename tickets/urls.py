from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TicketViewSet, LogAttachmentViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'logs', LogAttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
