from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BookViewSet,
    EpisodeNoteViewSet,
    FavoriteCharacterViewSet,
    FolderViewSet,
    GenreViewSet,
    ImageViewSet,
    JournalExportView,
    JournalImportView,
    MALImportView,
    MetadataLookupView,
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
    path("lookup/", MetadataLookupView.as_view(), name="metadata-lookup"),
    path("export/", JournalExportView.as_view(), name="journal-export"),
    path("import/mal/", MALImportView.as_view(), name="mal-import"),
    path("import/json/", JournalImportView.as_view(), name="journal-import"),
    path("", include(router.urls)),
]
