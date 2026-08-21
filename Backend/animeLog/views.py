from django.db.models import Q
from django.db.models.functions import Length, Trim
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Anime, AnimeStatus, Book, BookStatus, FavoriteCharacter, Genre, Rewatch, Studio
from .serializers import (
    AnimeSerializer,
    BookSerializer,
    FavoriteCharacterSerializer,
    GenreSerializer,
    JournalStatsSerializer,
    RewatchSerializer,
    StudioSerializer,
)


class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer


class StudioViewSet(viewsets.ModelViewSet):
    queryset = Studio.objects.all()
    serializer_class = StudioSerializer


class AnimeViewSet(viewsets.ModelViewSet):
    serializer_class = AnimeSerializer

    def get_queryset(self):
        queryset = (
            Anime.objects.prefetch_related(
                "genres",
                "studios",
                "rewatches",
                "favorite_characters",
            )
            .all()
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param) | Q(notes__icontains=search_param)
            )

        genre_param = self.request.query_params.get("genre")
        if genre_param:
            if genre_param.isdigit():
                queryset = queryset.filter(genres__id=int(genre_param))
            else:
                queryset = queryset.filter(genres__name__iexact=genre_param)

        return queryset.distinct()


class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer

    def get_queryset(self):
        queryset = (
            Book.objects.prefetch_related("genres")
            .all()
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param)
                | Q(author__icontains=search_param)
                | Q(notes__icontains=search_param)
            )

        genre_param = self.request.query_params.get("genre")
        if genre_param:
            if genre_param.isdigit():
                queryset = queryset.filter(genres__id=int(genre_param))
            else:
                queryset = queryset.filter(genres__name__iexact=genre_param)

        return queryset.distinct()


class RewatchViewSet(viewsets.ModelViewSet):
    serializer_class = RewatchSerializer

    def get_queryset(self):
        queryset = Rewatch.objects.select_related("anime").all().order_by("-start_date", "-id")
        anime_id = self.request.query_params.get("anime")
        if anime_id and anime_id.isdigit():
            queryset = queryset.filter(anime_id=int(anime_id))
        return queryset


class FavoriteCharacterViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteCharacterSerializer

    def get_queryset(self):
        queryset = FavoriteCharacter.objects.select_related("anime").all().order_by("name")
        anime_id = self.request.query_params.get("anime")
        if anime_id and anime_id.isdigit():
            queryset = queryset.filter(anime_id=int(anime_id))
        return queryset


def _count_written_lessons(queryset):
    return queryset.annotate(_notes_len=Length(Trim("notes"))).filter(_notes_len__gt=0).count()


class StatsView(APIView):
    """
    Returns aggregated journal counts for the dashboard overview.
    """

    def get(self, request):
        active_watching = Anime.objects.filter(status=AnimeStatus.WATCHING).count()
        active_reading = Book.objects.filter(status=BookStatus.READING).count()
        completed_anime = Anime.objects.filter(status=AnimeStatus.COMPLETED).count()
        completed_books = Book.objects.filter(status=BookStatus.COMPLETED).count()

        anime_lessons = _count_written_lessons(Anime.objects.all())
        book_lessons = _count_written_lessons(Book.objects.all())
        rewatch_lessons = _count_written_lessons(Rewatch.objects.all())

        rewatches_count = Rewatch.objects.count()
        characters_count = FavoriteCharacter.objects.count()

        data = {
            "activeWatching": active_watching,
            "activeReading": active_reading,
            "totalCompleted": completed_anime + completed_books,
            "totalLessons": anime_lessons + book_lessons + rewatch_lessons,
            "rewatchesCount": rewatches_count,
            "charactersCount": characters_count,
        }

        serializer = JournalStatsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
