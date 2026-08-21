from django.contrib import admin
from .models import (
    Anime,
    Book,
    FavoriteCharacter,
    Genre,
    Rewatch,
    Studio,
)


class RewatchInline(admin.TabularInline):
    model = Rewatch
    extra = 1


class FavoriteCharacterInline(admin.TabularInline):
    model = FavoriteCharacter
    extra = 1


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Studio)
class StudioAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Anime)
class AnimeAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "rating", "progress", "total_episodes", "start_date", "finish_date")
    list_filter = ("status", "rating", "genres", "studios")
    search_fields = ("title", "notes")
    filter_horizontal = ("genres", "studios")
    inlines = [RewatchInline, FavoriteCharacterInline]


@admin.register(Rewatch)
class RewatchAdmin(admin.ModelAdmin):
    list_display = ("id", "anime", "rating", "start_date", "finish_date")
    list_filter = ("rating",)
    search_fields = ("anime__title", "notes")


@admin.register(FavoriteCharacter)
class FavoriteCharacterAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "anime")
    search_fields = ("name", "anime__title", "why")
    list_filter = ("anime",)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "status", "rating", "progress", "total_pages", "start_date", "finish_date")
    list_filter = ("status", "rating", "genres")
    search_fields = ("title", "author", "notes")
    filter_horizontal = ("genres",)
