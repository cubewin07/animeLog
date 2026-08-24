from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        verbose_name = "Genre"
        verbose_name_plural = "Genres"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Studio(models.Model):
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = "Studio"
        verbose_name_plural = "Studios"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Folder(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subfolders",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Folder"
        verbose_name_plural = "Folders"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["parent", "name"],
                name="unique_subfolder_per_parent",
            ),
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(parent__isnull=True),
                name="unique_root_folder_name",
            ),
        ]

    def __str__(self):
        return f"{self.parent.name}/{self.name}" if self.parent else self.name


class Image(models.Model):
    file = models.ImageField(upload_to="anime_log/images/")
    title = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    folder = models.ForeignKey(
        Folder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="images",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Image"
        verbose_name_plural = "Images"
        ordering = ["-created_at"]

    @property
    def url(self):
        return self.file.url if self.file else ""

    def __str__(self):
        return self.title or (self.file.name if self.file else f"Image #{self.id}")

    def delete(self, *args, **kwargs):
        if self.file:
            self.file.delete(save=False)
        super().delete(*args, **kwargs)


class AnimeStatus(models.TextChoices):
    WATCHING = "WATCHING", "Watching"
    COMPLETED = "COMPLETED", "Completed"
    ON_HOLD = "ON_HOLD", "On Hold"
    DROPPED = "DROPPED", "Dropped"
    PLAN_TO_WATCH = "PLAN_TO_WATCH", "Plan to Watch"


class AnimeSeries(models.Model):
    title = models.CharField(max_length=255)
    japanese_title = models.CharField(max_length=255, blank=True, null=True)
    romaji_title = models.CharField(max_length=255, blank=True, null=True)
    cover_image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="anime_series",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    genres = models.ManyToManyField(Genre, blank=True, related_name="anime_series")
    rewatches = GenericRelation("Rewatch", related_query_name="anime_series")

    class Meta:
        verbose_name = "Anime Series"
        verbose_name_plural = "Anime Series"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class AnimeSeason(models.Model):
    series = models.ForeignKey(
        AnimeSeries,
        related_name="seasons",
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    season_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    cover_image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="anime_seasons",
    )
    status = models.CharField(
        max_length=20,
        choices=AnimeStatus.choices,
        default=AnimeStatus.PLAN_TO_WATCH,
    )
    progress = models.PositiveIntegerField(default=0, help_text="Current episode progress")
    total_episodes = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Rating score (1-10)",
    )
    start_date = models.DateField(null=True, blank=True)
    finish_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    studios = models.ManyToManyField(Studio, blank=True, related_name="anime_seasons")
    rewatches = GenericRelation("Rewatch", related_query_name="anime_season")

    class Meta:
        verbose_name = "Anime Season"
        verbose_name_plural = "Anime Seasons"
        ordering = ["season_number", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["series", "season_number"],
                name="unique_series_season_number",
            ),
            models.CheckConstraint(
                condition=models.Q(season_number__gte=1),
                name="anime_season_number_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(progress__gte=0),
                name="anime_season_progress_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(total_episodes__isnull=True)
                    | models.Q(total_episodes__gte=1, progress__lte=models.F("total_episodes"))
                ),
                name="anime_season_progress_within_total",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.season_number is not None and self.season_number < 1:
            errors["season_number"] = "Season number must be at least 1."
        if self.total_episodes is not None and self.total_episodes < 1:
            errors["total_episodes"] = "Total episodes must be at least 1."
        if (
            self.total_episodes is not None
            and self.progress is not None
            and self.progress > self.total_episodes
        ):
            errors["progress"] = (
                f"Progress ({self.progress}) cannot exceed total episodes ({self.total_episodes})."
            )
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.series.title} - {self.title}"


class AnimeMovie(models.Model):
    series = models.ForeignKey(
        AnimeSeries,
        related_name="movies",
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    cover_image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="anime_movies",
    )
    status = models.CharField(
        max_length=20,
        choices=AnimeStatus.choices,
        default=AnimeStatus.PLAN_TO_WATCH,
    )
    progress_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Current progress in minutes",
    )
    total_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Rating score (1-10)",
    )
    start_date = models.DateField(null=True, blank=True)
    finish_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    studios = models.ManyToManyField(Studio, blank=True, related_name="anime_movies")
    rewatches = GenericRelation("Rewatch", related_query_name="anime_movie")

    class Meta:
        verbose_name = "Anime Movie"
        verbose_name_plural = "Anime Movies"
        ordering = ["created_at", "id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(progress_minutes__gte=0),
                name="anime_movie_progress_minutes_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(total_minutes__isnull=True)
                    | models.Q(
                        total_minutes__gte=1,
                        progress_minutes__lte=models.F("total_minutes"),
                    )
                ),
                name="anime_movie_progress_within_total",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.total_minutes is not None and self.total_minutes < 1:
            errors["total_minutes"] = "Total minutes must be at least 1."
        if (
            self.total_minutes is not None
            and self.progress_minutes is not None
            and self.progress_minutes > self.total_minutes
        ):
            errors["progress_minutes"] = (
                f"Progress minutes ({self.progress_minutes}) cannot exceed total minutes ({self.total_minutes})."
            )
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.series.title} - {self.title} (Movie)"


class EpisodeNote(models.Model):
    season = models.ForeignKey(
        AnimeSeason,
        related_name="episode_notes",
        on_delete=models.CASCADE,
    )
    episode_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    episode_title = models.CharField(max_length=255, null=True, blank=True)
    cover_image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="episode_notes",
    )
    note = models.TextField()
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Episode rating score (1-10)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    rewatches = GenericRelation("Rewatch", related_query_name="episode_note")

    class Meta:
        verbose_name = "Episode Note"
        verbose_name_plural = "Episode Notes"
        ordering = ["episode_number", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["season", "episode_number"],
                name="unique_season_episode_note",
            ),
            models.CheckConstraint(
                condition=models.Q(episode_number__gte=1),
                name="episode_note_number_positive",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.episode_number is not None and self.episode_number < 1:
            errors["episode_number"] = "Episode number must be at least 1."
        if (
            self.season_id
            and self.season.total_episodes is not None
            and self.episode_number is not None
            and self.episode_number > self.season.total_episodes
        ):
            errors["episode_number"] = (
                f"Episode number ({self.episode_number}) cannot exceed season total episodes ({self.season.total_episodes})."
            )
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.season.title} - Ep {self.episode_number}"


class Rewatch(models.Model):
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to=models.Q(
            app_label="animeLog",
            model__in=["animeseries", "animeseason", "animemovie"],
        ),
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    episode_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Optional episode number when rewatching a specific episode of a season",
    )
    episode_title = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Optional episode title or note for this episode rewatch pass",
    )

    start_date = models.DateField(null=True, blank=True)
    finish_date = models.DateField(null=True, blank=True)
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Rewatch rating score (1-10)",
    )
    notes = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Rewatch"
        verbose_name_plural = "Rewatches"
        ordering = ["-start_date", "-id"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    @property
    def target_type(self) -> str:
        if self.episode_number is not None:
            return "episode"
        if self.content_type:
            model_name = self.content_type.model.lower()
            if model_name == "animeseries":
                return "series"
            if model_name == "animeseason":
                return "season"
            if model_name == "animemovie":
                return "movie"
        return ""

    @property
    def release_title(self) -> str:
        obj = self.content_object
        if not obj:
            return ""
        if self.episode_number is not None and isinstance(obj, AnimeSeason):
            ep_str = f"Ep {self.episode_number}"
            if self.episode_title:
                ep_str += f": {self.episode_title}"
            return f"{obj.title} — {ep_str}"
        if isinstance(obj, AnimeSeries):
            return obj.title
        if isinstance(obj, AnimeSeason):
            return obj.title
        if isinstance(obj, AnimeMovie):
            return obj.title
        return str(obj)

    @property
    def series_title(self) -> str:
        obj = self.content_object
        if not obj:
            return ""
        if isinstance(obj, AnimeSeries):
            return obj.title
        if isinstance(obj, (AnimeSeason, AnimeMovie)):
            return obj.series.title if obj.series else ""
        return ""

    def __str__(self):
        return f"Rewatch: {self.release_title}"


class FavoriteCharacter(models.Model):
    series = models.ForeignKey(
        AnimeSeries,
        on_delete=models.CASCADE,
        related_name="favorite_characters",
    )
    name = models.CharField(max_length=100)
    why = models.TextField(null=True, blank=True)
    images = models.ManyToManyField(
        Image,
        blank=True,
        related_name="favorite_characters",
    )

    class Meta:
        verbose_name = "Favorite Character"
        verbose_name_plural = "Favorite Characters"
        ordering = ["name"]

    @property
    def series_title(self):
        return self.series.title if self.series else ""

    def __str__(self):
        return f"{self.name} ({self.series.title})"


class BookStatus(models.TextChoices):
    READING = "READING", "Reading"
    COMPLETED = "COMPLETED", "Completed"
    ON_HOLD = "ON_HOLD", "On Hold"
    DROPPED = "DROPPED", "Dropped"
    PLAN_TO_READ = "PLAN_TO_READ", "Plan to Read"


class Book(models.Model):
    title = models.CharField(max_length=255)
    cover_image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="books",
    )
    status = models.CharField(
        max_length=20,
        choices=BookStatus.choices,
        default=BookStatus.PLAN_TO_READ,
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Rating score (1-10)",
    )
    progress = models.PositiveIntegerField(default=0, help_text="Current page/chapter progress")
    start_date = models.DateField(null=True, blank=True)
    finish_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    total_pages = models.PositiveIntegerField(null=True, blank=True)
    author = models.CharField(max_length=100, null=True, blank=True)

    genres = models.ManyToManyField(Genre, blank=True, related_name="books")

    class Meta:
        verbose_name = "Book"
        verbose_name_plural = "Books"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
