"""
Custom SimpleJWT views.

Default TokenObtainPairView / TokenRefreshView return both access and
refresh tokens in the JSON response body. That means any JS on the page
(including injected XSS) can read the refresh token if it's later stored
in localStorage.

These views instead:
  - Return the ACCESS token in the JSON body (short-lived, meant to be
    held in memory by the frontend).
  - Set the REFRESH token as an httpOnly, Secure cookie (long-lived,
    never exposed to JS at all).

Requires django-cors-headers with CORS_ALLOW_CREDENTIALS = True if your
frontend is on a different origin, and the frontend must send requests
with credentials included (axios: withCredentials: true).
"""

from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework.response import Response

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/token/refresh/"



def _refresh_cookie_kwargs():
    """
    Centralized cookie settings so login/refresh/logout all agree.

    secure=True requires HTTPS. In local dev over plain http://localhost
    this will silently not work in the browser -- see note below.
    """
    return dict(
        httponly=True,
        secure=not settings.DEBUG,   # True in production; relax for local http dev
        samesite="Strict",
        path=REFRESH_COOKIE_PATH,
    )



class CookieTokenObtainPairView(TokenObtainPairView):
    def finalize_response(self, request, response, *args, **kwargs):
        if response.status_code == 200 and "refresh" in response.data:
            refresh_token = response.data.pop("refresh")
            response.set_cookie(
                REFRESH_COOKIE_NAME,
                refresh_token,
                **_refresh_cookie_kwargs(),
            )
        return super().finalize_response(request, response, *args, **kwargs)



class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh_token:
            raise InvalidToken("No refresh token cookie found.")

        # Inject the cookie value into the data SimpleJWT's serializer expects
        request.data["refresh"] = refresh_token
        response = super().post(request, *args, **kwargs)

        # If ROTATE_REFRESH_TOKENS is on, SimpleJWT returns a new refresh
        # token in the body -- move it back into the cookie and strip it
        # from the body, same as login.
        if response.status_code == 200 and "refresh" in response.data:
            new_refresh = response.data.pop("refresh")
            response.set_cookie(
                REFRESH_COOKIE_NAME,
                new_refresh,
                **_refresh_cookie_kwargs(),
            )
        return response



class CookieTokenLogoutView(TokenObtainPairView):
    """
    Optional: clears the refresh cookie. Pair with token blacklisting
    (rest_framework_simplejwt.token_blacklist) if you want logout to
    actually invalidate the refresh token server-side, not just remove
    the cookie client-side.
    """
    def post(self, request, *args, **kwargs):
        response = Response({"detail": "Logged out."}, status=200)
        response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
        return response






