from django.contrib import admin
from .models import (
    AnimeMovie,
    AnimeSeason,
    AnimeSeries,
    Book,
    EpisodeNote,
    FavoriteCharacter,
    Genre,
    Rewatch,
    Studio,
)


class AnimeSeasonInline(admin.TabularInline):
    model = AnimeSeason
    extra = 1
    show_change_link = True


class AnimeMovieInline(admin.TabularInline):
    model = AnimeMovie
    extra = 1
    show_change_link = True


class FavoriteCharacterInline(admin.TabularInline):
    model = FavoriteCharacter
    extra = 1


class EpisodeNoteInline(admin.TabularInline):
    model = EpisodeNote
    extra = 1


class SeasonRewatchInline(admin.TabularInline):
    model = Rewatch
    fk_name = "season"
    extra = 1


class MovieRewatchInline(admin.TabularInline):
    model = Rewatch
    fk_name = "movie"
    extra = 1


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Studio)
class StudioAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(AnimeSeries)
class AnimeSeriesAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "created_at")
    search_fields = ("title",)
    filter_horizontal = ("genres",)
    inlines = [AnimeSeasonInline, AnimeMovieInline, FavoriteCharacterInline]


@admin.register(AnimeSeason)
class AnimeSeasonAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "series",
        "season_number",
        "title",
        "status",
        "progress",
        "total_episodes",
        "rating",
        "start_date",
        "finish_date",
    )
    list_filter = ("status", "rating", "series", "studios")
    search_fields = ("title", "series__title", "notes")
    filter_horizontal = ("studios",)
    inlines = [EpisodeNoteInline, SeasonRewatchInline]


@admin.register(AnimeMovie)
class AnimeMovieAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "series",
        "title",
        "status",
        "progress_minutes",
        "total_minutes",
        "rating",
        "start_date",
        "finish_date",
    )
    list_filter = ("status", "rating", "series", "studios")
    search_fields = ("title", "series__title", "notes")
    filter_horizontal = ("studios",)
    inlines = [MovieRewatchInline]


@admin.register(EpisodeNote)
class EpisodeNoteAdmin(admin.ModelAdmin):
    list_display = ("id", "season", "episode_number", "episode_title", "rating")
    search_fields = ("season__title", "season__series__title", "episode_title", "note")
    list_filter = ("rating", "season__series")


@admin.register(Rewatch)
class RewatchAdmin(admin.ModelAdmin):
    list_display = ("id", "season", "movie", "rating", "start_date", "finish_date")
    list_filter = ("rating",)
    search_fields = ("season__title", "movie__title", "notes")


@admin.register(FavoriteCharacter)
class FavoriteCharacterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "series")
    search_fields = ("name", "series__title", "why")
    list_filter = ("series",)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "author",
        "status",
        "rating",
        "progress",
        "total_pages",
        "start_date",
        "finish_date",
    )
    list_filter = ("status", "rating", "genres")
    search_fields = ("title", "author", "notes")
    filter_horizontal = ("genres",)
