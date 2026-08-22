from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BookViewSet,
    EpisodeNoteViewSet,
    FavoriteCharacterViewSet,
    FolderViewSet,
    GenreViewSet,
    ImageViewSet,
    MovieViewSet,
    RewatchViewSet,
    SeasonViewSet,
    SeriesViewSet,
    StatsView,
    StudioViewSet,
)

router = DefaultRouter()
router.register(r"folders", FolderViewSet, basename="folder")
router.register(r"images", ImageViewSet, basename="image")
router.register(r"genres", GenreViewSet, basename="genre")
router.register(r"studios", StudioViewSet, basename="studio")
router.register(r"series", SeriesViewSet, basename="series")
router.register(r"seasons", SeasonViewSet, basename="season")
router.register(r"movies", MovieViewSet, basename="movie")
router.register(r"episode-notes", EpisodeNoteViewSet, basename="episode-note")
router.register(r"rewatches", RewatchViewSet, basename="rewatch")
router.register(r"characters", FavoriteCharacterViewSet, basename="character")
router.register(r"books", BookViewSet, basename="book")

urlpatterns = [
    path("stats/", StatsView.as_view(), name="journal-stats"),
    path("", include(router.urls)),
]
