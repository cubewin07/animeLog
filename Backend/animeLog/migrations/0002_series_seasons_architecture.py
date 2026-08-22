import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("animeLog", "0001_initial"),
    ]

    operations = [
        # Step 1: Drop old dependent models in dependency order
        migrations.DeleteModel(
            name="Rewatch",
        ),
        migrations.DeleteModel(
            name="FavoriteCharacter",
        ),
        migrations.DeleteModel(
            name="Anime",
        ),
        # Step 2: Create new hierarchy models
        migrations.CreateModel(
            name="AnimeSeries",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "genres",
                    models.ManyToManyField(
                        blank=True,
                        related_name="anime_series",
                        to="animeLog.genre",
                    ),
                ),
            ],
            options={
                "verbose_name": "Anime Series",
                "verbose_name_plural": "Anime Series",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="AnimeSeason",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                (
                    "season_number",
                    models.PositiveIntegerField(
                        validators=[django.core.validators.MinValueValidator(1)]
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("WATCHING", "Watching"),
                            ("COMPLETED", "Completed"),
                            ("ON_HOLD", "On Hold"),
                            ("DROPPED", "Dropped"),
                            ("PLAN_TO_WATCH", "Plan to Watch"),
                        ],
                        default="PLAN_TO_WATCH",
                        max_length=20,
                    ),
                ),
                (
                    "progress",
                    models.PositiveIntegerField(
                        default=0, help_text="Current episode progress"
                    ),
                ),
                (
                    "total_episodes",
                    models.PositiveIntegerField(
                        blank=True,
                        null=True,
                        validators=[django.core.validators.MinValueValidator(1)],
                    ),
                ),
                (
                    "rating",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        help_text="Rating score (1-10)",
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10),
                        ],
                    ),
                ),
                ("start_date", models.DateField(blank=True, null=True)),
                ("finish_date", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "series",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="seasons",
                        to="animeLog.animeseries",
                    ),
                ),
                (
                    "studios",
                    models.ManyToManyField(
                        blank=True,
                        related_name="anime_seasons",
                        to="animeLog.studio",
                    ),
                ),
            ],
            options={
                "verbose_name": "Anime Season",
                "verbose_name_plural": "Anime Seasons",
                "ordering": ["season_number", "id"],
                "constraints": [
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
                        condition=models.Q(total_episodes__isnull=True)
                        | models.Q(
                            total_episodes__gte=1,
                            progress__lte=models.F("total_episodes"),
                        ),
                        name="anime_season_progress_within_total",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="AnimeMovie",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("WATCHING", "Watching"),
                            ("COMPLETED", "Completed"),
                            ("ON_HOLD", "On Hold"),
                            ("DROPPED", "Dropped"),
                            ("PLAN_TO_WATCH", "Plan to Watch"),
                        ],
                        default="PLAN_TO_WATCH",
                        max_length=20,
                    ),
                ),
                (
                    "progress_minutes",
                    models.PositiveIntegerField(
                        default=0, help_text="Current progress in minutes"
                    ),
                ),
                (
                    "total_minutes",
                    models.PositiveIntegerField(
                        blank=True,
                        null=True,
                        validators=[django.core.validators.MinValueValidator(1)],
                    ),
                ),
                (
                    "rating",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        help_text="Rating score (1-10)",
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10),
                        ],
                    ),
                ),
                ("start_date", models.DateField(blank=True, null=True)),
                ("finish_date", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "series",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="movies",
                        to="animeLog.animeseries",
                    ),
                ),
                (
                    "studios",
                    models.ManyToManyField(
                        blank=True,
                        related_name="anime_movies",
                        to="animeLog.studio",
                    ),
                ),
            ],
            options={
                "verbose_name": "Anime Movie",
                "verbose_name_plural": "Anime Movies",
                "ordering": ["created_at", "id"],
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(progress_minutes__gte=0),
                        name="anime_movie_progress_minutes_non_negative",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(total_minutes__isnull=True)
                        | models.Q(
                            total_minutes__gte=1,
                            progress_minutes__lte=models.F("total_minutes"),
                        ),
                        name="anime_movie_progress_within_total",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="EpisodeNote",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "episode_number",
                    models.PositiveIntegerField(
                        validators=[django.core.validators.MinValueValidator(1)]
                    ),
                ),
                (
                    "episode_title",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                ("note", models.TextField()),
                (
                    "rating",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        help_text="Episode rating score (1-10)",
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10),
                        ],
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "season",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="episode_notes",
                        to="animeLog.animeseason",
                    ),
                ),
            ],
            options={
                "verbose_name": "Episode Note",
                "verbose_name_plural": "Episode Notes",
                "ordering": ["episode_number", "id"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=["season", "episode_number"],
                        name="unique_season_episode_note",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(episode_number__gte=1),
                        name="episode_note_number_positive",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="Rewatch",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("start_date", models.DateField(blank=True, null=True)),
                ("finish_date", models.DateField(blank=True, null=True)),
                (
                    "rating",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        help_text="Rewatch rating score (1-10)",
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10),
                        ],
                    ),
                ),
                ("notes", models.TextField(blank=True, null=True)),
                (
                    "season",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rewatches",
                        to="animeLog.animeseason",
                    ),
                ),
                (
                    "movie",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rewatches",
                        to="animeLog.animemovie",
                    ),
                ),
            ],
            options={
                "verbose_name": "Rewatch",
                "verbose_name_plural": "Rewatches",
                "ordering": ["-start_date", "-id"],
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(season__isnull=False, movie__isnull=True)
                        | models.Q(season__isnull=True, movie__isnull=False),
                        name="rewatch_exactly_one_target",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="FavoriteCharacter",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("why", models.TextField(blank=True, null=True)),
                (
                    "series",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorite_characters",
                        to="animeLog.animeseries",
                    ),
                ),
            ],
            options={
                "verbose_name": "Favorite Character",
                "verbose_name_plural": "Favorite Characters",
                "ordering": ["name"],
            },
        ),
    ]
