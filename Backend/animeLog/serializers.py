from rest_framework import serializers

from .models import Anime, AnimeStatus, Book, BookStatus, FavoriteCharacter, Genre, Rewatch, Studio


class WritableNestedManyToManyField(serializers.PrimaryKeyRelatedField):
    """
    Accepts either an ID or a dictionary with an 'id' key (e.g. {id: 1, name: '...'})
    when writing, making it seamless for frontend clients.
    """

    def to_internal_value(self, data):
        if isinstance(data, dict) and "id" in data:
            data = data["id"]
        return super().to_internal_value(data)


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]


class StudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studio
        fields = ["id", "name"]


class RewatchSerializer(serializers.ModelSerializer):
    anime_title = serializers.CharField(source="anime.title", read_only=True)

    class Meta:
        model = Rewatch
        fields = [
            "id",
            "anime",
            "anime_title",
            "start_date",
            "finish_date",
            "rating",
            "notes",
        ]
        read_only_fields = ["id", "anime_title"]


class FavoriteCharacterSerializer(serializers.ModelSerializer):
    anime_title = serializers.CharField(source="anime.title", read_only=True)

    class Meta:
        model = FavoriteCharacter
        fields = [
            "id",
            "anime",
            "anime_title",
            "name",
            "why",
        ]
        read_only_fields = ["id", "anime_title"]


class AnimeSerializer(serializers.ModelSerializer):
    genres = WritableNestedManyToManyField(
        queryset=Genre.objects.all(),
        many=True,
        required=False,
    )
    studios = WritableNestedManyToManyField(
        queryset=Studio.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Anime
        fields = [
            "id",
            "title",
            "status",
            "rating",
            "progress",
            "total_episodes",
            "start_date",
            "finish_date",
            "notes",
            "created_at",
            "genres",
            "studios",
            "rewatches",
            "favorite_characters",
        ]
        read_only_fields = ["id", "created_at", "rewatches", "favorite_characters"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["genres"] = GenreSerializer(instance.genres.all(), many=True).data
        data["studios"] = StudioSerializer(instance.studios.all(), many=True).data
        data["rewatches"] = RewatchSerializer(instance.rewatches.all(), many=True).data
        data["favorite_characters"] = FavoriteCharacterSerializer(
            instance.favorite_characters.all(), many=True
        ).data
        return data


class BookSerializer(serializers.ModelSerializer):
    genres = WritableNestedManyToManyField(
        queryset=Genre.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "status",
            "rating",
            "progress",
            "total_pages",
            "start_date",
            "finish_date",
            "notes",
            "created_at",
            "genres",
        ]
        read_only_fields = ["id", "created_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["genres"] = GenreSerializer(instance.genres.all(), many=True).data
        return data


class JournalStatsSerializer(serializers.Serializer):
    activeWatching = serializers.IntegerField()
    activeReading = serializers.IntegerField()
    totalCompleted = serializers.IntegerField()
    totalLessons = serializers.IntegerField()
    rewatchesCount = serializers.IntegerField()
    charactersCount = serializers.IntegerField()
