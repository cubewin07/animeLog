from datetime import date
from django.db import transaction
from rest_framework import serializers

from .models import (
    AnimeMovie,
    AnimeSeason,
    AnimeSeries,
    AnimeStatus,
    Book,
    BookStatus,
    EpisodeNote,
    FavoriteCharacter,
    Genre,
    Rewatch,
    Studio,
)


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


class EpisodeNoteSerializer(serializers.ModelSerializer):
    season_title = serializers.CharField(source="season.title", read_only=True)

    class Meta:
        model = EpisodeNote
        fields = [
            "id",
            "season",
            "season_title",
            "episode_number",
            "episode_title",
            "note",
            "rating",
            "created_at",
        ]
        read_only_fields = ["id", "season_title", "created_at"]

    def validate(self, attrs):
        season = attrs.get("season") or getattr(self.instance, "season", None)
        ep_num = attrs.get("episode_number") or getattr(
            self.instance, "episode_number", None
        )

        if ep_num is not None and ep_num < 1:
            raise serializers.ValidationError(
                {"episode_number": "Episode number must be at least 1."}
            )

        if (
            season
            and season.total_episodes is not None
            and ep_num is not None
            and ep_num > season.total_episodes
        ):
            raise serializers.ValidationError(
                {
                    "episode_number": (
                        f"Episode number ({ep_num}) cannot exceed season total episodes ({season.total_episodes})."
                    )
                }
            )

        # Uniqueness check on create
        if not self.instance and season and ep_num:
            if EpisodeNote.objects.filter(
                season=season, episode_number=ep_num
            ).exists():
                raise serializers.ValidationError(
                    {
                        "episode_number": f"An episode note already exists for season {season.id} episode {ep_num}."
                    }
                )

        return attrs


class RewatchSerializer(serializers.ModelSerializer):
    release_title = serializers.CharField(read_only=True)

    class Meta:
        model = Rewatch
        fields = [
            "id",
            "season",
            "movie",
            "release_title",
            "start_date",
            "finish_date",
            "rating",
            "notes",
        ]
        read_only_fields = ["id", "release_title"]

    def validate(self, attrs):
        season = attrs.get("season") if "season" in attrs else getattr(self.instance, "season", None)
        movie = attrs.get("movie") if "movie" in attrs else getattr(self.instance, "movie", None)

        if (season is None and movie is None) or (season is not None and movie is not None):
            raise serializers.ValidationError(
                "A rewatch must target exactly one season or movie."
            )
        return attrs


class FavoriteCharacterSerializer(serializers.ModelSerializer):
    series_title = serializers.CharField(source="series.title", read_only=True)

    class Meta:
        model = FavoriteCharacter
        fields = [
            "id",
            "series",
            "series_title",
            "name",
            "why",
        ]
        read_only_fields = ["id", "series_title"]


class AnimeSeasonSerializer(serializers.ModelSerializer):
    series_title = serializers.CharField(source="series.title", read_only=True)
    studios = WritableNestedManyToManyField(
        queryset=Studio.objects.all(),
        many=True,
        required=False,
    )
    episode_notes = EpisodeNoteSerializer(many=True, read_only=True)
    rewatches = RewatchSerializer(many=True, read_only=True)

    class Meta:
        model = AnimeSeason
        fields = [
            "id",
            "series",
            "series_title",
            "title",
            "season_number",
            "status",
            "progress",
            "total_episodes",
            "rating",
            "start_date",
            "finish_date",
            "notes",
            "created_at",
            "studios",
            "episode_notes",
            "rewatches",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "series_title",
            "episode_notes",
            "rewatches",
        ]

    def validate(self, attrs):
        season_num = attrs.get("season_number") or getattr(
            self.instance, "season_number", None
        )
        if season_num is not None and season_num < 1:
            raise serializers.ValidationError(
                {"season_number": "Season number must be at least 1."}
            )

        progress = attrs.get("progress") if "progress" in attrs else getattr(self.instance, "progress", 0)
        total = attrs.get("total_episodes") if "total_episodes" in attrs else getattr(self.instance, "total_episodes", None)

        if total is not None and total < 1:
            raise serializers.ValidationError(
                {"total_episodes": "Total episodes must be at least 1."}
            )
        if total is not None and progress is not None and progress > total:
            raise serializers.ValidationError(
                {
                    "progress": f"Progress ({progress}) cannot exceed total episodes ({total})."
                }
            )
        return attrs

    def update(self, instance, validated_data):
        status_explicit = "status" in validated_data
        new_progress = validated_data.get("progress", instance.progress)
        total = validated_data.get("total_episodes", instance.total_episodes)
        current_status = validated_data.get("status", instance.status)

        if not status_explicit:
            if current_status == AnimeStatus.PLAN_TO_WATCH and new_progress > 0:
                validated_data["status"] = AnimeStatus.WATCHING
                current_status = AnimeStatus.WATCHING

            if total is not None and new_progress >= total and current_status == AnimeStatus.WATCHING:
                validated_data["status"] = AnimeStatus.COMPLETED
                if not instance.finish_date and "finish_date" not in validated_data:
                    validated_data["finish_date"] = date.today()

        return super().update(instance, validated_data)

    def create(self, validated_data):
        status_explicit = "status" in validated_data
        progress = validated_data.get("progress", 0)
        total = validated_data.get("total_episodes", None)
        current_status = validated_data.get("status", AnimeStatus.PLAN_TO_WATCH)

        if not status_explicit:
            if current_status == AnimeStatus.PLAN_TO_WATCH and progress > 0:
                validated_data["status"] = AnimeStatus.WATCHING
                current_status = AnimeStatus.WATCHING

            if total is not None and progress >= total and current_status == AnimeStatus.WATCHING:
                validated_data["status"] = AnimeStatus.COMPLETED
                if "finish_date" not in validated_data or not validated_data["finish_date"]:
                    validated_data["finish_date"] = date.today()

        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["studios"] = StudioSerializer(instance.studios.all(), many=True).data
        data["episode_notes"] = EpisodeNoteSerializer(
            instance.episode_notes.all(), many=True
        ).data
        data["rewatches"] = RewatchSerializer(
            instance.rewatches.all(), many=True
        ).data
        return data


class AnimeMovieSerializer(serializers.ModelSerializer):
    series_title = serializers.CharField(source="series.title", read_only=True)
    studios = WritableNestedManyToManyField(
        queryset=Studio.objects.all(),
        many=True,
        required=False,
    )
    rewatches = RewatchSerializer(many=True, read_only=True)

    class Meta:
        model = AnimeMovie
        fields = [
            "id",
            "series",
            "series_title",
            "title",
            "status",
            "progress_minutes",
            "total_minutes",
            "rating",
            "start_date",
            "finish_date",
            "notes",
            "created_at",
            "studios",
            "rewatches",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "series_title",
            "rewatches",
        ]

    def validate(self, attrs):
        progress = attrs.get("progress_minutes") if "progress_minutes" in attrs else getattr(self.instance, "progress_minutes", 0)
        total = attrs.get("total_minutes") if "total_minutes" in attrs else getattr(self.instance, "total_minutes", None)

        if total is not None and total < 1:
            raise serializers.ValidationError(
                {"total_minutes": "Total minutes must be at least 1."}
            )
        if total is not None and progress is not None and progress > total:
            raise serializers.ValidationError(
                {
                    "progress_minutes": f"Progress minutes ({progress}) cannot exceed total minutes ({total})."
                }
            )
        return attrs

    def update(self, instance, validated_data):
        status_explicit = "status" in validated_data
        new_progress = validated_data.get("progress_minutes", instance.progress_minutes)
        total = validated_data.get("total_minutes", instance.total_minutes)
        current_status = validated_data.get("status", instance.status)

        if not status_explicit:
            if current_status == AnimeStatus.PLAN_TO_WATCH and new_progress > 0:
                validated_data["status"] = AnimeStatus.WATCHING
                current_status = AnimeStatus.WATCHING

            if total is not None and new_progress >= total and current_status == AnimeStatus.WATCHING:
                validated_data["status"] = AnimeStatus.COMPLETED
                if not instance.finish_date and "finish_date" not in validated_data:
                    validated_data["finish_date"] = date.today()

        return super().update(instance, validated_data)

    def create(self, validated_data):
        status_explicit = "status" in validated_data
        progress = validated_data.get("progress_minutes", 0)
        total = validated_data.get("total_minutes", None)
        current_status = validated_data.get("status", AnimeStatus.PLAN_TO_WATCH)

        if not status_explicit:
            if current_status == AnimeStatus.PLAN_TO_WATCH and progress > 0:
                validated_data["status"] = AnimeStatus.WATCHING
                current_status = AnimeStatus.WATCHING

            if total is not None and progress >= total and current_status == AnimeStatus.WATCHING:
                validated_data["status"] = AnimeStatus.COMPLETED
                if "finish_date" not in validated_data or not validated_data["finish_date"]:
                    validated_data["finish_date"] = date.today()

        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["studios"] = StudioSerializer(instance.studios.all(), many=True).data
        data["rewatches"] = RewatchSerializer(
            instance.rewatches.all(), many=True
        ).data
        return data


class InitialSeasonPayloadSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, default="Season 1")
    season_number = serializers.IntegerField(default=1, min_value=1)
    status = serializers.ChoiceField(
        choices=AnimeStatus.choices, default=AnimeStatus.PLAN_TO_WATCH
    )
    progress = serializers.IntegerField(default=0, min_value=0)
    total_episodes = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    rating = serializers.IntegerField(
        required=False, allow_null=True, min_value=1, max_value=10
    )
    start_date = serializers.DateField(required=False, allow_null=True)
    finish_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    studios = WritableNestedManyToManyField(
        queryset=Studio.objects.all(), many=True, required=False
    )

    def validate(self, attrs):
        total = attrs.get("total_episodes")
        prog = attrs.get("progress", 0)
        if total is not None and prog > total:
            raise serializers.ValidationError(
                {"progress": f"Progress ({prog}) cannot exceed total episodes ({total})."}
            )
        return attrs


class AnimeSeriesSerializer(serializers.ModelSerializer):
    genres = WritableNestedManyToManyField(
        queryset=Genre.objects.all(),
        many=True,
        required=False,
    )
    studios = StudioSerializer(many=True, read_only=True)
    seasons = AnimeSeasonSerializer(many=True, read_only=True)
    movies = AnimeMovieSerializer(many=True, read_only=True)
    favorite_characters = FavoriteCharacterSerializer(many=True, read_only=True)
    initial_season = InitialSeasonPayloadSerializer(write_only=True, required=False)

    class Meta:
        model = AnimeSeries
        fields = [
            "id",
            "title",
            "created_at",
            "genres",
            "studios",
            "seasons",
            "movies",
            "favorite_characters",
            "initial_season",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "studios",
            "seasons",
            "movies",
            "favorite_characters",
        ]

    def create(self, validated_data):
        initial_season_data = validated_data.pop("initial_season", None)
        genres_data = validated_data.pop("genres", [])

        with transaction.atomic():
            series = AnimeSeries.objects.create(**validated_data)
            if genres_data:
                series.genres.set(genres_data)

            if initial_season_data:
                season_studios = initial_season_data.pop("studios", [])
                season = AnimeSeason.objects.create(series=series, **initial_season_data)
                if season_studios:
                    season.studios.set(season_studios)

        return series

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["genres"] = GenreSerializer(instance.genres.all(), many=True).data
        data["seasons"] = AnimeSeasonSerializer(
            instance.seasons.all(), many=True
        ).data
        data["movies"] = AnimeMovieSerializer(
            instance.movies.all(), many=True
        ).data
        data["favorite_characters"] = FavoriteCharacterSerializer(
            instance.favorite_characters.all(), many=True
        ).data

        # Derived de-duplicated studios
        seen_studios = {}
        for season in instance.seasons.all():
            for st in season.studios.all():
                seen_studios[st.id] = st
        for movie in instance.movies.all():
            for st in movie.studios.all():
                seen_studios[st.id] = st
        data["studios"] = StudioSerializer(
            sorted(seen_studios.values(), key=lambda s: s.name), many=True
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
