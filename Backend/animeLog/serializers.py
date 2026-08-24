from datetime import date
from django.contrib.contenttypes.models import ContentType
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
    Folder,
    Genre,
    Image,
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


class WritableNestedForeignKey(serializers.PrimaryKeyRelatedField):
    """
    Accepts either an ID or a dictionary with an 'id' key (e.g. {id: 1, ...})
    when writing, making it seamless for frontend clients.
    """

    def to_internal_value(self, data):
        if isinstance(data, dict) and "id" in data:
            data = data["id"]
        return super().to_internal_value(data)


class FolderSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    images_count = serializers.IntegerField(source="images.count", read_only=True)

    class Meta:
        model = Folder
        fields = [
            "id",
            "name",
            "parent",
            "parent_name",
            "images_count",
            "created_at",
        ]
        read_only_fields = ["id", "parent_name", "images_count", "created_at"]


class ImageSerializer(serializers.ModelSerializer):
    url = serializers.CharField(read_only=True)
    folder_name = serializers.CharField(source="folder.name", read_only=True)

    class Meta:
        model = Image
        fields = [
            "id",
            "file",
            "url",
            "title",
            "alt_text",
            "folder",
            "folder_name",
            "created_at",
        ]
        read_only_fields = ["id", "url", "folder_name", "created_at"]


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]


class StudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studio
        fields = ["id", "name"]


class RewatchSerializer(serializers.ModelSerializer):
    target_type = serializers.CharField(required=False)
    target_id = serializers.IntegerField(required=False)
    release_title = serializers.CharField(read_only=True)
    series_title = serializers.CharField(read_only=True)

    # Legacy / convenience write fields
    series = serializers.IntegerField(required=False, write_only=True)
    season = serializers.IntegerField(required=False, write_only=True)
    movie = serializers.IntegerField(required=False, write_only=True)
    episode = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = Rewatch
        fields = [
            "id",
            "target_type",
            "target_id",
            "release_title",
            "series_title",
            "episode_number",
            "episode_title",
            "series",
            "season",
            "movie",
            "episode",
            "start_date",
            "finish_date",
            "rating",
            "notes",
        ]
        read_only_fields = ["id", "release_title", "series_title"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        target_t = instance.target_type
        data["target_type"] = target_t
        data["target_id"] = instance.object_id
        data["release_title"] = instance.release_title
        data["series_title"] = instance.series_title
        data["episode_number"] = instance.episode_number
        data["episode_title"] = instance.episode_title

        # Convenience references
        data["season_id"] = instance.object_id if target_t in ("season", "episode") else None
        data["movie_id"] = instance.object_id if target_t == "movie" else None
        
        series_id = None
        if target_t == "series":
            series_id = instance.object_id
        elif instance.content_object:
            if hasattr(instance.content_object, "series_id"):
                series_id = instance.content_object.series_id
        data["series_id"] = series_id
        return data

    def validate(self, attrs):
        target_type = attrs.pop("target_type", None)
        target_id = attrs.pop("target_id", None)
        series_id = attrs.pop("series", None)
        season_id = attrs.pop("season", None)
        movie_id = attrs.pop("movie", None)
        episode_id = attrs.pop("episode", None)

        if not target_type and target_id is None:
            if series_id is not None:
                target_type = "series"
                target_id = series_id
            elif episode_id is not None:
                target_type = "episode"
                target_id = season_id if season_id is not None else episode_id
            elif season_id is not None:
                target_type = "season"
                target_id = season_id
            elif movie_id is not None:
                target_type = "movie"
                target_id = movie_id

        if not target_type and self.instance:
            target_type = self.instance.target_type
            target_id = self.instance.object_id

        if not target_type or target_id is None:
            raise serializers.ValidationError(
                "A rewatch must target a valid series, season, movie, or episode."
            )

        target_map = {
            "series": AnimeSeries,
            "season": AnimeSeason,
            "movie": AnimeMovie,
            "episode": AnimeSeason,
        }

        normalized_type = str(target_type).lower().strip()
        if normalized_type not in target_map:
            raise serializers.ValidationError(
                {"target_type": f"Invalid target type '{target_type}'. Must be one of: series, season, movie, episode."}
            )

        model_cls = target_map[normalized_type]
        try:
            target_obj = model_cls.objects.get(pk=target_id)
        except model_cls.DoesNotExist:
            raise serializers.ValidationError(
                {"target_id": f"{model_cls._meta.verbose_name} with ID {target_id} does not exist."}
            )

        content_type = ContentType.objects.get_for_model(model_cls)
        attrs["content_type"] = content_type
        attrs["object_id"] = target_id
        return attrs


class EpisodeNoteSerializer(serializers.ModelSerializer):
    season_title = serializers.CharField(source="season.title", read_only=True)
    cover_image = WritableNestedForeignKey(
        queryset=Image.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = EpisodeNote
        fields = [
            "id",
            "season",
            "season_title",
            "episode_number",
            "episode_title",
            "cover_image",
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        img_url = instance.cover_image.url if instance.cover_image and instance.cover_image.file else None
        data["cover_image_url"] = img_url
        data["image_url"] = img_url
        data["rewatches"] = RewatchSerializer(instance.rewatches.all(), many=True).data
        return data


class FavoriteCharacterSerializer(serializers.ModelSerializer):
    series_title = serializers.CharField(source="series.title", read_only=True)
    images = WritableNestedManyToManyField(
        queryset=Image.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = FavoriteCharacter
        fields = [
            "id",
            "series",
            "series_title",
            "name",
            "why",
            "images",
        ]
        read_only_fields = ["id", "series_title"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["images"] = ImageSerializer(instance.images.all(), many=True).data
        first_image = instance.images.first()
        data["image_url"] = first_image.url if first_image and first_image.file else None
        return data


class AnimeSeasonSerializer(serializers.ModelSerializer):
    series_title = serializers.CharField(source="series.title", read_only=True)
    cover_image = WritableNestedForeignKey(
        queryset=Image.objects.all(),
        required=False,
        allow_null=True,
    )
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
            "cover_image",
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
        img_url = instance.cover_image.url if instance.cover_image and instance.cover_image.file else None
        data["cover_image_url"] = img_url
        data["image_url"] = img_url
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
    cover_image = WritableNestedForeignKey(
        queryset=Image.objects.all(),
        required=False,
        allow_null=True,
    )
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
            "cover_image",
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
        img_url = instance.cover_image.url if instance.cover_image and instance.cover_image.file else None
        data["cover_image_url"] = img_url
        data["image_url"] = img_url
        data["studios"] = StudioSerializer(instance.studios.all(), many=True).data
        data["rewatches"] = RewatchSerializer(
            instance.rewatches.all(), many=True
        ).data
        return data


class InitialSeasonPayloadSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, default="Season 1")
    season_number = serializers.IntegerField(default=1, min_value=1)
    cover_image = WritableNestedForeignKey(
        queryset=Image.objects.all(),
        required=False,
        allow_null=True,
    )
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
    cover_image = WritableNestedForeignKey(
        queryset=Image.objects.all(),
        required=False,
        allow_null=True,
    )
    genres = WritableNestedManyToManyField(
        queryset=Genre.objects.all(),
        many=True,
        required=False,
    )
    studios = StudioSerializer(many=True, read_only=True)
    seasons = AnimeSeasonSerializer(many=True, read_only=True)
    movies = AnimeMovieSerializer(many=True, read_only=True)
    favorite_characters = FavoriteCharacterSerializer(many=True, read_only=True)
    rewatches = RewatchSerializer(many=True, read_only=True)
    initial_season = InitialSeasonPayloadSerializer(write_only=True, required=False)

    class Meta:
        model = AnimeSeries
        fields = [
            "id",
            "title",
            "japanese_title",
            "romaji_title",
            "cover_image",
            "created_at",
            "genres",
            "studios",
            "seasons",
            "movies",
            "favorite_characters",
            "rewatches",
            "initial_season",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "studios",
            "seasons",
            "movies",
            "favorite_characters",
            "rewatches",
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
        img_url = instance.cover_image.url if instance.cover_image and instance.cover_image.file else None
        data["cover_image_url"] = img_url
        data["image_url"] = img_url
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
        data["rewatches"] = RewatchSerializer(
            instance.rewatches.all(), many=True
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
    cover_image = WritableNestedForeignKey(
        queryset=Image.objects.all(),
        required=False,
        allow_null=True,
    )
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
            "cover_image",
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
        img_url = instance.cover_image.url if instance.cover_image and instance.cover_image.file else None
        data["cover_image_url"] = img_url
        data["image_url"] = img_url
        data["genres"] = GenreSerializer(instance.genres.all(), many=True).data
        return data


class JournalStatsSerializer(serializers.Serializer):
    activeWatching = serializers.IntegerField()
    activeReading = serializers.IntegerField()
    totalCompleted = serializers.IntegerField()
    totalLessons = serializers.IntegerField()
    rewatchesCount = serializers.IntegerField()
    charactersCount = serializers.IntegerField()
