from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from users.authentication import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CookieTokenLogoutView,
)
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),

    path("api/auth/", include("djoser.urls")),

    path("api/token/", CookieTokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", CookieTokenRefreshView.as_view(), name="refresh"),
    path("api/token/logout/", CookieTokenLogoutView.as_view(), name="logout"),

    path("api/", include("notes.urls")),

    path("api/", include("habits.urls")),   

    # drf-spectacular endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

    