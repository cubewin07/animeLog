from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AnimeViewSet,
    BookViewSet,
    FavoriteCharacterViewSet,
    GenreViewSet,
    RewatchViewSet,
    StatsView,
    StudioViewSet,
)

router = DefaultRouter()
router.register(r"genres", GenreViewSet, basename="genre")
router.register(r"studios", StudioViewSet, basename="studio")
router.register(r"anime", AnimeViewSet, basename="anime")
router.register(r"books", BookViewSet, basename="book")
router.register(r"rewatches", RewatchViewSet, basename="rewatch")
router.register(r"characters", FavoriteCharacterViewSet, basename="character")

urlpatterns = [
    path("stats/", StatsView.as_view(), name="journal-stats"),
    path("", include(router.urls)),
]
