from django.contrib import admin
from django.utils.html import format_html

from .models import (
    AnimeMovie,
    AnimeSeason,
    AnimeSeries,
    Book,
    EpisodeNote,
    FavoriteCharacter,
    Folder,
    Genre,
    Image,
    Rewatch,
    Studio,
)


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "parent", "created_at")
    search_fields = ("name",)
    list_filter = ("parent",)


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ("id", "thumbnail", "title", "folder", "created_at")
    list_filter = ("folder",)
    search_fields = ("title", "alt_text")
    readonly_fields = ("thumbnail_preview",)

    def thumbnail(self, obj):
        if obj.file:
            return format_html(
                '<img src="{}" style="height: 40px; width: 40px; border-radius: 4px; object-fit: cover;" />',
                obj.file.url,
            )
        return "-"

    thumbnail.short_description = "Preview"

    def thumbnail_preview(self, obj):
        if obj.file:
            return format_html(
                '<img src="{}" style="max-height: 250px; border-radius: 6px;" />',
                obj.file.url,
            )
        return "-"

    thumbnail_preview.short_description = "Image Preview"


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
    filter_horizontal = ("images",)


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
    list_display = ("id", "title", "cover_image", "created_at")
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
        "cover_image",
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
        "cover_image",
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
    list_display = ("id", "season", "episode_number", "episode_title", "cover_image", "rating")
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
    filter_horizontal = ("images",)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "author",
        "cover_image",
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
