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


class AnimeStatus(models.TextChoices):
    WATCHING = "WATCHING", "Watching"
    COMPLETED = "COMPLETED", "Completed"
    ON_HOLD = "ON_HOLD", "On Hold"
    DROPPED = "DROPPED", "Dropped"
    PLAN_TO_WATCH = "PLAN_TO_WATCH", "Plan to Watch"


class Anime(models.Model):
    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=AnimeStatus.choices,
        default=AnimeStatus.PLAN_TO_WATCH,
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Rating score (1-10)",
    )
    progress = models.PositiveIntegerField(default=0, help_text="Current episode progress")
    start_date = models.DateField(null=True, blank=True)
    finish_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    total_episodes = models.PositiveIntegerField(null=True, blank=True)

    genres = models.ManyToManyField(Genre, blank=True, related_name="anime")
    studios = models.ManyToManyField(Studio, blank=True, related_name="anime")

    class Meta:
        verbose_name = "Anime"
        verbose_name_plural = "Anime"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Rewatch(models.Model):
    anime = models.ForeignKey(
        Anime,
        on_delete=models.CASCADE,
        related_name="rewatches",
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

    def __str__(self):
        return f"Rewatch: {self.anime.title}"


class FavoriteCharacter(models.Model):
    anime = models.ForeignKey(
        Anime,
        on_delete=models.CASCADE,
        related_name="favorite_characters",
    )
    name = models.CharField(max_length=100)
    why = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Favorite Character"
        verbose_name_plural = "Favorite Characters"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.anime.title})"


class BookStatus(models.TextChoices):
    READING = "READING", "Reading"
    COMPLETED = "COMPLETED", "Completed"
    ON_HOLD = "ON_HOLD", "On Hold"
    DROPPED = "DROPPED", "Dropped"
    PLAN_TO_READ = "PLAN_TO_READ", "Plan to Read"


class Book(models.Model):
    title = models.CharField(max_length=255)
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
