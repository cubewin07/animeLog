from datetime import date, datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch, MagicMock
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    ActivityEvent,
    ActivityKind,
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


class ModelConstraintTests(TestCase):
    def setUp(self):
        self.genre = Genre.objects.create(name="Fantasy")
        self.studio = Studio.objects.create(name="Madhouse")
        self.series = AnimeSeries.objects.create(title="Frieren")

    def test_season_rating_bounds(self):
        too_high = AnimeSeason(series=self.series, season_number=1, title="S1", rating=11)
        with self.assertRaises(ValidationError) as ctx:
            too_high.full_clean()
        self.assertIn("rating", ctx.exception.message_dict)

        too_low = AnimeSeason(series=self.series, season_number=1, title="S1", rating=0)
        with self.assertRaises(ValidationError) as ctx:
            too_low.full_clean()
        self.assertIn("rating", ctx.exception.message_dict)

    def test_movie_rating_bounds(self):
        too_high = AnimeMovie(series=self.series, title="Movie", rating=11)
        with self.assertRaises(ValidationError) as ctx:
            too_high.full_clean()
        self.assertIn("rating", ctx.exception.message_dict)

        too_low = AnimeMovie(series=self.series, title="Movie", rating=0)
        with self.assertRaises(ValidationError) as ctx:
            too_low.full_clean()
        self.assertIn("rating", ctx.exception.message_dict)

    def test_null_rating_is_allowed(self):
        season = AnimeSeason(series=self.series, season_number=1, title="S1", rating=None)
        season.full_clean()
        movie = AnimeMovie(series=self.series, title="M1", rating=None)
        movie.full_clean()

    def test_season_number_must_be_positive(self):
        invalid_season = AnimeSeason(series=self.series, season_number=0, title="S0")
        with self.assertRaises(ValidationError) as ctx:
            invalid_season.full_clean()
        self.assertIn("season_number", ctx.exception.message_dict)

    def test_season_progress_cannot_exceed_total_episodes(self):
        over_progress = AnimeSeason(
            series=self.series, season_number=1, title="S1", progress=29, total_episodes=28
        )
        with self.assertRaises(ValidationError) as ctx:
            over_progress.full_clean()
        self.assertIn("progress", ctx.exception.message_dict)

    def test_movie_progress_cannot_exceed_total_minutes(self):
        over_progress = AnimeMovie(
            series=self.series, title="Movie", progress_minutes=120, total_minutes=90
        )
        with self.assertRaises(ValidationError) as ctx:
            over_progress.full_clean()
        self.assertIn("progress_minutes", ctx.exception.message_dict)

    def test_unique_season_number_within_series(self):
        AnimeSeason.objects.create(series=self.series, season_number=1, title="Season 1")
        with self.assertRaises(IntegrityError):
            AnimeSeason.objects.create(series=self.series, season_number=1, title="Duplicate S1")

    def test_episode_note_unique_per_season_and_episode_number(self):
        season = AnimeSeason.objects.create(
            series=self.series, season_number=1, title="S1", total_episodes=28
        )
        EpisodeNote.objects.create(season=season, episode_number=1, note="Note 1")
        with self.assertRaises(IntegrityError):
            EpisodeNote.objects.create(season=season, episode_number=1, note="Duplicate Note 1")

    def test_episode_note_cannot_exceed_season_total_episodes(self):
        season = AnimeSeason.objects.create(
            series=self.series, season_number=1, title="S1", total_episodes=12
        )
        note = EpisodeNote(season=season, episode_number=13, note="Beyond total")
        with self.assertRaises(ValidationError) as ctx:
            note.full_clean()
        self.assertIn("episode_number", ctx.exception.message_dict)

    def test_rewatch_polymorphic_targets(self):
        season = AnimeSeason.objects.create(series=self.series, season_number=1, title="S1")
        movie = AnimeMovie.objects.create(series=self.series, title="Film")

        # Season rewatch
        season_rewatch = Rewatch(content_object=season, notes="Season valid")
        season_rewatch.full_clean()
        season_rewatch.save()
        self.assertEqual(season_rewatch.release_title, "S1")
        self.assertEqual(season_rewatch.target_type, "season")

        # Movie rewatch
        movie_rewatch = Rewatch(content_object=movie, notes="Movie valid")
        movie_rewatch.full_clean()
        movie_rewatch.save()
        self.assertEqual(movie_rewatch.release_title, "Film")
        self.assertEqual(movie_rewatch.target_type, "movie")

        # Series rewatch
        series_rewatch = Rewatch(content_object=self.series, notes="Series valid")
        series_rewatch.full_clean()
        series_rewatch.save()
        self.assertEqual(series_rewatch.release_title, self.series.title)
        self.assertEqual(series_rewatch.target_type, "series")

        # Episode rewatch
        ep_rewatch = Rewatch(content_object=season, episode_number=5, episode_title="The Battle", notes="Episode valid")
        ep_rewatch.full_clean()
        ep_rewatch.save()
        self.assertEqual(ep_rewatch.release_title, "S1 — Ep 5: The Battle")
        self.assertEqual(ep_rewatch.target_type, "episode")

    def test_genre_name_is_unique(self):
        with self.assertRaises(IntegrityError):
            Genre.objects.create(name="Fantasy")


class MediaModelTests(TestCase):
    def test_folder_hierarchy_and_uniqueness(self):
        root = Folder.objects.create(name="Covers")
        sub1 = Folder.objects.create(name="Anime", parent=root)
        self.assertEqual(str(root), "Covers")
        self.assertEqual(str(sub1), "Covers/Anime")

        # Duplicate root folder name
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Folder.objects.create(name="Covers")

        # Duplicate subfolder under same parent
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Folder.objects.create(name="Anime", parent=root)

        # Same subfolder name under different parent is allowed
        root2 = Folder.objects.create(name="Wallpapers")
        sub2 = Folder.objects.create(name="Anime", parent=root2)
        self.assertEqual(str(sub2), "Wallpapers/Anime")

    def test_image_creation_and_safe_folder_deletion(self):
        folder = Folder.objects.create(name="Characters")
        img = Image.objects.create(
            file="anime_log/images/himmel.jpg",
            title="Himmel Portrait",
            alt_text="Himmel looking up",
            folder=folder,
        )
        self.assertEqual(img.title, "Himmel Portrait")
        self.assertEqual(img.folder, folder)

        # Deleting folder sets image.folder to None (SET_NULL)
        folder.delete()
        img.refresh_from_db()
        self.assertIsNone(img.folder)

    def test_entity_cover_images_and_safe_image_deletion(self):
        img = Image.objects.create(
            file="anime_log/images/frieren_cover.jpg",
            title="Frieren Cover",
        )
        series = AnimeSeries.objects.create(title="Frieren", cover_image=img)
        season = AnimeSeason.objects.create(
            series=series,
            season_number=1,
            title="S1",
            cover_image=img,
            notes="Frieren season 1 notes",
        )
        movie = AnimeMovie.objects.create(
            series=series,
            title="Film",
            cover_image=img,
            notes="Film notes",
        )
        ep = EpisodeNote.objects.create(
            season=season,
            episode_number=1,
            note="Ep 1 note",
            cover_image=img,
        )
        book = Book.objects.create(
            title="Meditations",
            cover_image=img,
            notes="Book notes",
        )

        char = FavoriteCharacter.objects.create(
            series=series,
            name="Himmel",
            why="Kindness",
            cover_image=img,
        )
        char.images.add(img)

        # Verify initial linking
        self.assertEqual(series.cover_image, img)
        self.assertEqual(season.cover_image, img)
        self.assertEqual(movie.cover_image, img)
        self.assertEqual(ep.cover_image, img)
        self.assertEqual(book.cover_image, img)
        self.assertEqual(char.cover_image, img)
        self.assertEqual(list(char.images.all()), [img])

        # Delete image: entities and their journal notes must be preserved!
        img.delete()

        series.refresh_from_db()
        season.refresh_from_db()
        movie.refresh_from_db()
        ep.refresh_from_db()
        book.refresh_from_db()
        char.refresh_from_db()

        self.assertIsNone(series.cover_image)
        self.assertIsNone(season.cover_image)
        self.assertEqual(season.notes, "Frieren season 1 notes")
        self.assertIsNone(movie.cover_image)
        self.assertEqual(movie.notes, "Film notes")
        self.assertIsNone(ep.cover_image)
        self.assertEqual(ep.note, "Ep 1 note")
        self.assertIsNone(book.cover_image)
        self.assertEqual(book.notes, "Book notes")
        self.assertIsNone(char.cover_image)
        self.assertEqual(char.images.count(), 0)
        self.assertEqual(char.why, "Kindness")

    def test_delete_image_triggers_storage_file_deletion(self):
        img = Image.objects.create(file="anime_log/images/test_signal.jpg", title="Test Signal")
        with patch.object(img.file.storage, "delete", return_value=True) as mock_delete:
            img.delete()
            mock_delete.assert_called_once_with("anime_log/images/test_signal.jpg")

    def test_update_image_file_triggers_old_file_deletion(self):
        img = Image.objects.create(file="anime_log/images/initial.jpg", title="Initial")
        with patch.object(img.file.storage, "delete", return_value=True) as mock_delete:
            img.file = "anime_log/images/replaced.jpg"
            img.save()
            mock_delete.assert_called_once_with("anime_log/images/initial.jpg")


class JournalAPIFixtureMixin:
    def setUp(self):
        self.genre_fantasy = Genre.objects.create(name="Fantasy")
        self.genre_sci_fi = Genre.objects.create(name="Sci-Fi")
        self.studio_madhouse = Studio.objects.create(name="Madhouse")
        self.studio_whitefox = Studio.objects.create(name="White Fox")

        self.folder_covers = Folder.objects.create(name="Covers")
        self.image_frieren = Image.objects.create(
            file="anime_log/images/frieren.jpg",
            title="Frieren Poster",
            folder=self.folder_covers,
        )

        self.series = AnimeSeries.objects.create(
            title="Frieren: Beyond Journey's End",
            cover_image=self.image_frieren,
        )
        self.series.genres.add(self.genre_fantasy)

        self.season = AnimeSeason.objects.create(
            series=self.series,
            season_number=1,
            title="Season 1",
            cover_image=self.image_frieren,
            status=AnimeStatus.COMPLETED,
            rating=10,
            progress=28,
            total_episodes=28,
            notes="A poignant reflection on the passage of time and cherishing fleeting moments.",
        )
        self.season.studios.add(self.studio_madhouse)

        self.episode_note = EpisodeNote.objects.create(
            season=self.season,
            episode_number=1,
            episode_title="The Journey's End",
            note="Ten years of adventure became the anchor for the rest of her existence.",
            rating=10,
            cover_image=self.image_frieren,
        )

        self.rewatch = Rewatch.objects.create(
            content_object=self.season,
            rating=10,
            notes="Second viewing deepened the emotional resonance.",
        )

        self.character = FavoriteCharacter.objects.create(
            series=self.series,
            name="Himmel",
            why="Demonstrated how small acts of kindness leave an eternal footprint.",
            cover_image=self.image_frieren,
        )
        self.character.images.add(self.image_frieren)

        self.book = Book.objects.create(
            title="Meditations",
            author="Marcus Aurelius",
            cover_image=self.image_frieren,
            status=BookStatus.READING,
            rating=9,
            progress=120,
            total_pages=254,
            notes="Focus on what is within your control.",
        )
        self.book.genres.add(self.genre_fantasy)


class AnimeLogAPITests(JournalAPIFixtureMixin, APITestCase):
    def test_list_folders_and_filtering(self):
        subfolder = Folder.objects.create(name="Seasons", parent=self.folder_covers)
        res = self.client.get("/api/folders/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

        # Filter root
        res_root = self.client.get("/api/folders/?parent=root")
        self.assertEqual(res_root.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_root.data), 1)
        self.assertEqual(res_root.data[0]["name"], "Covers")

        # Filter by parent id
        res_sub = self.client.get(f"/api/folders/?parent={self.folder_covers.id}")
        self.assertEqual(res_sub.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_sub.data), 1)
        self.assertEqual(res_sub.data[0]["name"], "Seasons")

    def test_list_images_and_filtering(self):
        img_unorganized = Image.objects.create(
            file="anime_log/images/random.jpg", title="Unorganized"
        )
        res = self.client.get("/api/images/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

        # Filter by folder
        res_folder = self.client.get(f"/api/images/?folder={self.folder_covers.id}")
        self.assertEqual(res_folder.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_folder.data), 1)
        self.assertEqual(res_folder.data[0]["title"], "Frieren Poster")

        # Filter root/unorganized
        res_root = self.client.get("/api/images/?folder=root")
        self.assertEqual(res_root.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_root.data), 1)
        self.assertEqual(res_root.data[0]["title"], "Unorganized")

    def test_delete_image_via_api_triggers_file_deletion(self):
        img = Image.objects.create(file="anime_log/images/api_del.jpg", title="API Del")
        with patch.object(img.file.storage, "delete", return_value=True) as mock_delete:
            res = self.client.delete(f"/api/images/{img.id}/")
            self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
            self.assertFalse(Image.objects.filter(id=img.id).exists())
            mock_delete.assert_called_once_with("anime_log/images/api_del.jpg")

    def test_list_genres(self):
        response = self.client.get("/api/genres/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_series_nested_output(self):
        response = self.client.get("/api/series/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        series_data = response.data[0]
        self.assertEqual(series_data["title"], "Frieren: Beyond Journey's End")
        self.assertEqual(series_data["cover_image"], self.image_frieren.id)
        self.assertTrue(series_data["image_url"])
        self.assertEqual(len(series_data["genres"]), 1)
        self.assertEqual(series_data["genres"][0]["name"], "Fantasy")
        self.assertEqual(len(series_data["studios"]), 1)
        self.assertEqual(series_data["studios"][0]["name"], "Madhouse")

        self.assertEqual(len(series_data["seasons"]), 1)
        season_data = series_data["seasons"][0]
        self.assertEqual(season_data["title"], "Season 1")
        self.assertEqual(season_data["notes"], self.season.notes)
        self.assertEqual(season_data["cover_image"], self.image_frieren.id)
        self.assertTrue(season_data["image_url"])
        self.assertEqual(len(season_data["episode_notes"]), 1)
        self.assertEqual(season_data["episode_notes"][0]["episode_number"], 1)
        self.assertEqual(len(season_data["rewatches"]), 1)

        self.assertEqual(len(series_data["favorite_characters"]), 1)
        char_data = series_data["favorite_characters"][0]
        self.assertEqual(char_data["name"], "Himmel")
        self.assertEqual(len(char_data["images"]), 1)
        self.assertTrue(char_data["image_url"])

    def test_create_series_with_atomic_initial_season(self):
        payload = {
            "title": "Steins;Gate",
            "cover_image": self.image_frieren.id,
            "genres": [self.genre_sci_fi.id],
            "initial_season": {
                "title": "Season 1",
                "season_number": 1,
                "cover_image": self.image_frieren.id,
                "status": "WATCHING",
                "rating": 10,
                "progress": 12,
                "total_episodes": 24,
                "notes": "Time travel thriller with profound emotional stakes.",
                "studios": [self.studio_whitefox.id],
            },
        }
        response = self.client.post("/api/series/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Steins;Gate")
        self.assertEqual(response.data["cover_image"], self.image_frieren.id)
        self.assertEqual(len(response.data["seasons"]), 1)
        created_season = response.data["seasons"][0]
        self.assertEqual(created_season["title"], "Season 1")
        self.assertEqual(created_season["progress"], 12)
        self.assertEqual(created_season["cover_image"], self.image_frieren.id)
        self.assertEqual(len(created_season["studios"]), 1)
        self.assertEqual(created_season["studios"][0]["name"], "White Fox")

    def test_create_season_for_existing_series(self):
        payload = {
            "series": self.series.id,
            "title": "Season 2",
            "season_number": 2,
            "cover_image": self.image_frieren.id,
            "status": "PLAN_TO_WATCH",
            "progress": 0,
            "total_episodes": 24,
            "studios": [self.studio_madhouse.id],
        }
        response = self.client.post("/api/seasons/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["series_title"], self.series.title)
        self.assertEqual(response.data["season_number"], 2)
        self.assertEqual(response.data["cover_image"], self.image_frieren.id)

    def test_create_movie_for_existing_series(self):
        payload = {
            "series": self.series.id,
            "title": "Special Film",
            "cover_image": self.image_frieren.id,
            "status": "PLAN_TO_WATCH",
            "progress_minutes": 0,
            "total_minutes": 110,
            "rating": 9,
            "notes": "Standalone film.",
            "studios": [self.studio_madhouse.id],
        }
        response = self.client.post("/api/movies/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Special Film")
        self.assertEqual(response.data["total_minutes"], 110)
        self.assertEqual(response.data["cover_image"], self.image_frieren.id)

    def test_create_favorite_character_with_multiple_images(self):
        img2 = Image.objects.create(file="anime_log/images/himmel2.jpg", title="Himmel 2")
        payload = {
            "series": self.series.id,
            "name": "Himmel Young",
            "why": "A hero with a pure heart.",
            "images": [self.image_frieren.id, img2.id],
        }
        response = self.client.post("/api/characters/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["images"]), 2)

    def test_season_progress_endpoint_and_status_transition(self):
        season = AnimeSeason.objects.create(
            series=self.series,
            season_number=2,
            title="Season 2",
            status=AnimeStatus.PLAN_TO_WATCH,
            progress=0,
            total_episodes=12,
        )

        # 1. Delta +1 changes PLAN_TO_WATCH to WATCHING
        res1 = self.client.patch(
            f"/api/seasons/{season.id}/progress/", {"delta": 1}, format="json"
        )
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["progress"], 1)
        self.assertEqual(res1.data["status"], AnimeStatus.WATCHING)

        # 2. Delta +11 reaches total_episodes -> changes to COMPLETED and sets finish_date
        res2 = self.client.patch(
            f"/api/seasons/{season.id}/progress/", {"delta": 11}, format="json"
        )
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["progress"], 12)
        self.assertEqual(res2.data["status"], AnimeStatus.COMPLETED)
        self.assertEqual(res2.data["finish_date"], str(date.today()))

        # 3. Delta +1 exceeds total_episodes -> rejected with 400
        res3 = self.client.patch(
            f"/api/seasons/{season.id}/progress/", {"delta": 1}, format="json"
        )
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Delta -1 undoes finishing: back to WATCHING, and today's finish date is cleared
        res4 = self.client.patch(
            f"/api/seasons/{season.id}/progress/", {"delta": -1}, format="json"
        )
        self.assertEqual(res4.status_code, status.HTTP_200_OK)
        self.assertEqual(res4.data["progress"], 11)
        self.assertEqual(res4.data["status"], AnimeStatus.WATCHING)
        self.assertIsNone(res4.data["finish_date"])

    def test_stepping_back_keeps_an_older_finish_date(self):
        season = AnimeSeason.objects.create(
            series=self.series,
            season_number=3,
            title="Season 3",
            status=AnimeStatus.COMPLETED,
            progress=12,
            total_episodes=12,
            finish_date=date(2023, 2, 20),
        )
        res = self.client.patch(
            f"/api/seasons/{season.id}/progress/", {"delta": -1}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], AnimeStatus.WATCHING)
        self.assertEqual(res.data["finish_date"], "2023-02-20")

    def test_movie_progress_endpoint_and_bounds(self):
        movie = AnimeMovie.objects.create(
            series=self.series,
            title="Film",
            status=AnimeStatus.PLAN_TO_WATCH,
            progress_minutes=0,
            total_minutes=100,
        )

        res = self.client.patch(
            f"/api/movies/{movie.id}/progress/", {"delta": 100}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["progress_minutes"], 100)
        self.assertEqual(res.data["status"], AnimeStatus.COMPLETED)
        self.assertEqual(res.data["finish_date"], str(date.today()))

        # Negative overrun rejected
        res_neg = self.client.patch(
            f"/api/movies/{movie.id}/progress/", {"delta": -150}, format="json"
        )
        self.assertEqual(res_neg.status_code, status.HTTP_400_BAD_REQUEST)

    def test_direct_release_progress_patch_applies_status_transitions(self):
        season = AnimeSeason.objects.create(
            series=self.series,
            season_number=2,
            title="Season 2",
            status=AnimeStatus.PLAN_TO_WATCH,
            progress=0,
            total_episodes=12,
        )
        movie = AnimeMovie.objects.create(
            series=self.series,
            title="Film",
            status=AnimeStatus.PLAN_TO_WATCH,
            progress_minutes=0,
            total_minutes=100,
        )

        # Partial progress moves PLAN_TO_WATCH to WATCHING
        s_part = self.client.patch(
            f"/api/seasons/{season.id}/", {"progress": 4}, format="json"
        )
        self.assertEqual(s_part.status_code, status.HTTP_200_OK)
        self.assertEqual(s_part.data["status"], AnimeStatus.WATCHING)

        m_part = self.client.patch(
            f"/api/movies/{movie.id}/", {"progress_minutes": 30}, format="json"
        )
        self.assertEqual(m_part.status_code, status.HTTP_200_OK)
        self.assertEqual(m_part.data["status"], AnimeStatus.WATCHING)

        # Reaching total completes and sets finish_date
        season_response = self.client.patch(
            f"/api/seasons/{season.id}/", {"progress": 12}, format="json"
        )
        movie_response = self.client.patch(
            f"/api/movies/{movie.id}/", {"progress_minutes": 100}, format="json"
        )

        self.assertEqual(season_response.status_code, status.HTTP_200_OK)
        self.assertEqual(season_response.data["status"], AnimeStatus.COMPLETED)
        self.assertEqual(season_response.data["finish_date"], str(date.today()))
        self.assertEqual(movie_response.status_code, status.HTTP_200_OK)
        self.assertEqual(movie_response.data["status"], AnimeStatus.COMPLETED)
        self.assertEqual(movie_response.data["finish_date"], str(date.today()))

    def test_direct_release_patch_respects_explicit_status(self):
        season = AnimeSeason.objects.create(
            series=self.series,
            season_number=2,
            title="Season 2",
            status=AnimeStatus.PLAN_TO_WATCH,
            progress=0,
            total_episodes=12,
        )
        res = self.client.patch(
            f"/api/seasons/{season.id}/",
            {"progress": 12, "status": AnimeStatus.DROPPED},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], AnimeStatus.DROPPED)

    def test_create_episode_note_and_reject_duplicate(self):
        payload = {
            "season": self.season.id,
            "episode_number": 2,
            "episode_title": "It Didn't Have to Be Magic",
            "note": "Fern and Frieren's quiet routine.",
            "rating": 9,
        }
        res = self.client.post("/api/episode-notes/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["episode_number"], 2)

        # Duplicate episode note for same season
        dup_res = self.client.post("/api/episode-notes/", payload, format="json")
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rewatch_for_season_and_movie(self):
        # Season rewatch
        season_payload = {
            "target_type": "season",
            "target_id": self.season.id,
            "rating": 10,
            "notes": "Third time viewing.",
        }
        s_res = self.client.post("/api/rewatches/", season_payload, format="json")
        self.assertEqual(s_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(s_res.data["release_title"], "Season 1")
        self.assertEqual(s_res.data["target_type"], "season")

        # Movie rewatch
        movie = AnimeMovie.objects.create(series=self.series, title="Mugen Train")
        movie_payload = {
            "target_type": "movie",
            "target_id": movie.id,
            "rating": 10,
            "notes": "Movie rewatch pass.",
        }
        m_res = self.client.post("/api/rewatches/", movie_payload, format="json")
        self.assertEqual(m_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(m_res.data["release_title"], "Mugen Train")
        self.assertEqual(m_res.data["target_type"], "movie")

        # Series rewatch
        series_payload = {
            "target_type": "series",
            "target_id": self.series.id,
            "rating": 10,
            "notes": "Series rewatch pass.",
        }
        series_res = self.client.post("/api/rewatches/", series_payload, format="json")
        self.assertEqual(series_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(series_res.data["target_type"], "series")

        # Episode rewatch
        ep_payload = {
            "target_type": "episode",
            "target_id": self.season.id,
            "episode_number": 8,
            "episode_title": "Draht",
            "rating": 10,
            "notes": "Episode rewatch pass.",
        }
        ep_res = self.client.post("/api/rewatches/", ep_payload, format="json")
        self.assertEqual(ep_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ep_res.data["target_type"], "episode")
        self.assertEqual(ep_res.data["episode_number"], 8)
        self.assertIn("Ep 8", ep_res.data["release_title"])

        # Legacy payload with "season": id
        legacy_res = self.client.post(
            "/api/rewatches/",
            {"season": self.season.id, "rating": 9, "notes": "Legacy pass"},
            format="json",
        )
        self.assertEqual(legacy_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(legacy_res.data["target_type"], "season")

        # Invalid target type
        invalid_payload = {
            "target_type": "invalid",
            "target_id": self.season.id,
            "notes": "Invalid type",
        }
        inv_res = self.client.post("/api/rewatches/", invalid_payload, format="json")
        self.assertEqual(inv_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_favorite_character_cover_image_crud_and_serialization(self):
        image_fern = Image.objects.create(
            file="anime_log/images/fern.jpg",
            title="Fern Portrait",
            folder=self.folder_covers,
        )
        # Create character with cover_image and gallery images
        create_payload = {
            "series": self.series.id,
            "name": "Fern",
            "why": "Unwavering loyalty and maturity beyond her years.",
            "cover_image": self.image_frieren.id,
            "images": [self.image_frieren.id, image_fern.id],
        }
        res = self.client.post("/api/characters/", create_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["cover_image"], self.image_frieren.id)
        self.assertEqual(res.data["cover_image_url"], self.image_frieren.url)
        self.assertEqual(res.data["image_url"], self.image_frieren.url)
        self.assertEqual(len(res.data["images"]), 2)
        char_id = res.data["id"]

        # Update cover_image to Fern's image
        patch_res = self.client.patch(
            f"/api/characters/{char_id}/",
            {"cover_image": image_fern.id},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["cover_image"], image_fern.id)
        self.assertEqual(patch_res.data["cover_image_url"], image_fern.url)
        self.assertEqual(patch_res.data["image_url"], image_fern.url)

        # Clear cover_image to null -> image_url falls back to first image in gallery
        patch_null = self.client.patch(
            f"/api/characters/{char_id}/",
            {"cover_image": None},
            format="json",
        )
        self.assertEqual(patch_null.status_code, status.HTTP_200_OK)
        self.assertIsNone(patch_null.data["cover_image"])
        self.assertIsNone(patch_null.data["cover_image_url"])
        self.assertIsNotNone(patch_null.data["image_url"])

    def test_delete_series_cascades_properly(self):
        series_id = self.series.id
        season_id = self.season.id
        episode_note_id = self.episode_note.id
        rewatch_id = self.rewatch.id
        char_id = self.character.id
        genre_id = self.genre_fantasy.id
        studio_id = self.studio_madhouse.id
        image_id = self.image_frieren.id

        res = self.client.delete(f"/api/series/{series_id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(AnimeSeries.objects.filter(id=series_id).exists())
        self.assertFalse(AnimeSeason.objects.filter(id=season_id).exists())
        self.assertFalse(EpisodeNote.objects.filter(id=episode_note_id).exists())
        self.assertFalse(Rewatch.objects.filter(id=rewatch_id).exists())
        self.assertFalse(FavoriteCharacter.objects.filter(id=char_id).exists())

        # Genres, Studios, and Images preserved
        self.assertTrue(Genre.objects.filter(id=genre_id).exists())
        self.assertTrue(Studio.objects.filter(id=studio_id).exists())
        self.assertTrue(Image.objects.filter(id=image_id).exists())

    def test_journal_stats(self):
        response = self.client.get("/api/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["activeWatching"], 0)
        self.assertEqual(response.data["activeReading"], 1)
        self.assertEqual(response.data["totalCompleted"], 1)  # 1 season + 0 movies + 0 books
        self.assertEqual(
            response.data["totalLessons"], 4
        )  # 1 season note + 1 episode note + 1 rewatch note + 1 book note
        self.assertEqual(response.data["rewatchesCount"], 1)
        self.assertEqual(response.data["charactersCount"], 1)

    def test_seed_journal_idempotency(self):
        call_command("seed_journal")
        call_command("seed_journal")

        # Verify series counts
        self.assertEqual(AnimeSeries.objects.filter(title="Attack on Titan").count(), 1)
        self.assertEqual(AnimeSeries.objects.filter(title="Steins;Gate").count(), 1)
        self.assertEqual(
            AnimeSeries.objects.filter(title="Demon Slayer: Kimetsu no Yaiba").count(), 1
        )

        aot = AnimeSeries.objects.get(title="Attack on Titan")
        self.assertEqual(aot.seasons.count(), 4)

        ds = AnimeSeries.objects.get(title="Demon Slayer: Kimetsu no Yaiba")
        self.assertEqual(ds.seasons.count(), 2)
        self.assertEqual(ds.movies.count(), 1)


class QueryOptimizationTests(JournalAPIFixtureMixin, APITestCase):
    def test_list_series_uses_constant_queries_with_prefetch(self):
        for index in range(4):
            series = AnimeSeries.objects.create(title=f"Franchise {index}", cover_image=self.image_frieren)
            series.genres.add(self.genre_fantasy)
            season = AnimeSeason.objects.create(
                series=series,
                season_number=1,
                title=f"S1 {index}",
                notes=f"Season Note {index}",
                cover_image=self.image_frieren,
            )
            season.studios.add(self.studio_madhouse)
            movie = AnimeMovie.objects.create(
                series=series,
                title=f"Movie {index}",
                notes=f"Movie Note {index}",
                cover_image=self.image_frieren,
            )
            movie.studios.add(self.studio_whitefox)
            EpisodeNote.objects.create(
                season=season, episode_number=1, note=f"Ep note {index}", cover_image=self.image_frieren
            )
            Rewatch.objects.create(content_object=season, notes=f"Rewatch S {index}")
            Rewatch.objects.create(content_object=movie, notes=f"Rewatch M {index}")
            char = FavoriteCharacter.objects.create(
                series=series, name=f"Hero {index}", why=f"Why {index}"
            )
            char.images.add(self.image_frieren)

        # Constant queries test with prefetch / select_related
        # Query count should remain constant regardless of franchise count
        response = self.client.get("/api/series/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)


class MetadataLookupAndExportAPITests(JournalAPIFixtureMixin, APITestCase):
    from unittest.mock import patch

    @patch("animeLog.services.metadata_lookup.requests.get")
    def test_lookup_anime_metadata(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "data": [
                {
                    "mal_id": 52991,
                    "title": "Sousou no Frieren",
                    "title_japanese": "葬送のフリーレン",
                    "type": "TV",
                    "episodes": 28,
                    "duration": "24 min per ep",
                    "score": 9.35,
                    "status": "Finished Airing",
                    "synopsis": "During their decade-long quest...",
                    "studios": [{"name": "Madhouse"}],
                    "genres": [{"name": "Adventure"}, {"name": "Fantasy"}],
                    "images": {"jpg": {"large_image_url": "https://example.com/frieren.jpg"}},
                }
            ]
        }

        res = self.client.get("/api/lookup/?type=anime&q=Frieren")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)
        self.assertEqual(len(res.data["results"]), 1)
        item = res.data["results"][0]
        self.assertEqual(item["title"], "Sousou no Frieren")
        self.assertEqual(item["total_episodes"], 28)
        self.assertEqual(item["studios"], ["Madhouse"])
        self.assertEqual(item["genres"], ["Adventure", "Fantasy"])
        self.assertEqual(item["cover_url"], "https://example.com/frieren.jpg")

    @patch("animeLog.services.metadata_lookup.requests.get")
    def test_lookup_book_metadata(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "docs": [
                {
                    "key": "/works/OL123W",
                    "title": "Man's Search for Meaning",
                    "author_name": ["Viktor E. Frankl"],
                    "number_of_pages_median": 165,
                    "subject": ["Psychology", "Philosophy"],
                    "first_publish_year": 1946,
                    "cover_i": 98765,
                }
            ]
        }

        res = self.client.get("/api/lookup/?type=book&q=Frankl")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)
        item = res.data["results"][0]
        self.assertEqual(item["title"], "Man's Search for Meaning")
        self.assertEqual(item["author"], "Viktor E. Frankl")
        self.assertEqual(item["total_pages"], 165)
        self.assertIn("covers.openlibrary.org", item["cover_url"])

    @patch("animeLog.services.metadata_lookup.requests.get")
    def test_import_image_from_url(self, mock_get):
        mock_get.return_value.status_code = 200
        gif_bytes = (
            b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
        )
        mock_get.return_value.content = gif_bytes
        mock_get.return_value.iter_content.return_value = [gif_bytes]
        mock_get.return_value.headers = {"Content-Type": "image/gif", "Content-Length": str(len(gif_bytes))}

        res = self.client.post(
            "/api/images/import-url/",
            {"url": "https://cdn.myanimelist.net/images/anime/1015/138006l.gif", "title": "Imported Poster"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", res.data)
        self.assertEqual(res.data["title"], "Imported Poster")
        self.assertEqual(res.data["folder_name"], "Imported Media")

        # Test deduplication: importing again returns the existing image without error
        res_dup = self.client.post(
            "/api/images/import-url/",
            {"url": "https://cdn.myanimelist.net/images/anime/1015/138006l.gif", "title": "Imported Poster"},
            format="json",
        )
        self.assertEqual(res_dup.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_dup.data["id"], res.data["id"])

    def test_import_image_ssrf_rejection(self):
        res = self.client.post(
            "/api/images/import-url/",
            {"url": "http://169.254.169.254/latest/meta-data/", "title": "Evil URL"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not in the trusted image sources allowlist", res.data.get("error", ""))

    def test_export_journal_json_and_markdown(self):
        res_json = self.client.get("/api/export/?export_format=json")
        self.assertEqual(res_json.status_code, status.HTTP_200_OK)
        self.assertIn("series", res_json.data)
        self.assertIn("books", res_json.data)
        self.assertIn("rewatches", res_json.data)
        self.assertIn("characters", res_json.data)

        res_md = self.client.get("/api/export/?export_format=markdown")
        self.assertEqual(res_md.status_code, status.HTTP_200_OK)
        self.assertIn("content", res_md.data)
        content = res_md.data["content"]
        self.assertIn("[[Frieren: Beyond Journey's End]]", content)
        self.assertIn("[[Meditations]]", content)
        self.assertIn("Himmel", content)
        self.assertIn("obsidian_compat: true", content)

    @patch("animeLog.services.importer.requests.get")
    def test_mal_user_import(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "data": [
                {
                    "entry": {"mal_id": 52991, "title": "Sousou no Frieren (Imported)"},
                    "score": 10,
                    "status": "completed",
                    "episodes_seen": 28,
                    "episodes_total": 28,
                }
            ]
        }
        res = self.client.post("/api/import/mal/", {"username": "otaku_user"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["imported_count"], 1)

        # Verify created in DB
        imported_series = AnimeSeries.objects.filter(title="Sousou no Frieren (Imported)").first()
        self.assertIsNotNone(imported_series)
        season = imported_series.seasons.first()
        self.assertEqual(season.status, AnimeStatus.COMPLETED)
        self.assertEqual(season.rating, 10)

    def test_journal_json_import(self):
        payload = {
            "version": "1.0",
            "series": [
                {
                    "title": "Neon Genesis Evangelion",
                    "seasons": [{"season_number": 1, "title": "TV Series", "status": "COMPLETED", "rating": 10, "notes": "Hedgehog dilemma."}],
                }
            ],
            "books": [
                {
                    "title": "Thus Spoke Zarathustra",
                    "author": "Friedrich Nietzsche",
                    "status": "COMPLETED",
                    "rating": 9,
                    "notes": "Become who you are.",
                }
            ],
            "characters": [],
            "rewatches": [],
        }
        res = self.client.post("/api/import/json/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data["imported"]["series"], 1)
        self.assertEqual(res.data["imported"]["books"], 1)

        self.assertTrue(AnimeSeries.objects.filter(title="Neon Genesis Evangelion").exists())
        self.assertTrue(Book.objects.filter(title="Thus Spoke Zarathustra").exists())


class ActivityEventAPITests(JournalAPIFixtureMixin, APITestCase):
    def test_season_and_movie_progress_endpoints_record_activity(self):
        season = AnimeSeason.objects.create(
            series=self.series,
            season_number=2,
            title="Season 2",
            status=AnimeStatus.PLAN_TO_WATCH,
            progress=0,
            total_episodes=12,
        )
        movie = AnimeMovie.objects.create(
            series=self.series,
            title="Film",
            status=AnimeStatus.PLAN_TO_WATCH,
            progress_minutes=0,
            total_minutes=100,
        )

        # Season +1 -> EPISODE_PROGRESS
        res1 = self.client.patch(f"/api/seasons/{season.id}/progress/", {"delta": 1}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        ev1 = ActivityEvent.objects.filter(target_type="season", target_id=season.id).first()
        self.assertIsNotNone(ev1)
        self.assertEqual(ev1.kind, ActivityKind.EPISODE_PROGRESS)
        self.assertEqual(ev1.delta, 1)
        self.assertIn("Season 2", ev1.title)

        # Season +11 -> EPISODE_PROGRESS + COMPLETED
        res2 = self.client.patch(f"/api/seasons/{season.id}/progress/", {"delta": 11}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        season_events = list(
            ActivityEvent.objects.filter(target_type="season", target_id=season.id).values_list("kind", "delta")
        )
        self.assertIn((ActivityKind.EPISODE_PROGRESS, 11), season_events)
        self.assertIn((ActivityKind.COMPLETED, 1), season_events)

        # Season -1 undo -> EPISODE_PROGRESS with delta=-1
        res3 = self.client.patch(f"/api/seasons/{season.id}/progress/", {"delta": -1}, format="json")
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        latest_season_ev = ActivityEvent.objects.filter(target_type="season", target_id=season.id).first()
        self.assertEqual(latest_season_ev.kind, ActivityKind.EPISODE_PROGRESS)
        self.assertEqual(latest_season_ev.delta, -1)

        # Movie +100 -> MOVIE_PROGRESS + COMPLETED
        m_res = self.client.patch(f"/api/movies/{movie.id}/progress/", {"delta": 100}, format="json")
        self.assertEqual(m_res.status_code, status.HTTP_200_OK)
        movie_kinds = list(
            ActivityEvent.objects.filter(target_type="movie", target_id=movie.id).values_list("kind", "delta")
        )
        self.assertIn((ActivityKind.MOVIE_PROGRESS, 100), movie_kinds)
        self.assertIn((ActivityKind.COMPLETED, 1), movie_kinds)

    def test_notes_and_book_updates_record_activity(self):
        # Season note written on PATCH
        s_res = self.client.patch(
            f"/api/seasons/{self.season.id}/",
            {"notes": "Updated reflection on time."},
            format="json",
        )
        self.assertEqual(s_res.status_code, status.HTTP_200_OK)
        self.assertTrue(
            ActivityEvent.objects.filter(
                kind=ActivityKind.NOTE_WRITTEN, target_type="season", target_id=self.season.id
            ).exists()
        )

        # Book create with initial progress and note
        b_create = self.client.post(
            "/api/books/",
            {
                "title": "The Enchiridion",
                "author": "Epictetus",
                "status": BookStatus.READING,
                "progress": 15,
                "total_pages": 60,
                "notes": "Some things are up to us.",
            },
            format="json",
        )
        self.assertEqual(b_create.status_code, status.HTTP_201_CREATED)
        book_id = b_create.data["id"]
        created_kinds = set(
            ActivityEvent.objects.filter(target_type="book", target_id=book_id).values_list("kind", flat=True)
        )
        self.assertEqual(created_kinds, {ActivityKind.BOOK_PROGRESS, ActivityKind.NOTE_WRITTEN})

        # Book update progress + complete
        b_patch = self.client.patch(
            f"/api/books/{book_id}/",
            {"progress": 60, "status": BookStatus.COMPLETED},
            format="json",
        )
        self.assertEqual(b_patch.status_code, status.HTTP_200_OK)
        book_events = list(
            ActivityEvent.objects.filter(target_type="book", target_id=book_id).values_list("kind", "delta")
        )
        self.assertIn((ActivityKind.BOOK_PROGRESS, 45), book_events)
        self.assertIn((ActivityKind.COMPLETED, 1), book_events)

        # Decreasing book progress does not emit BOOK_PROGRESS
        before_count = ActivityEvent.objects.filter(target_type="book", target_id=book_id).count()
        self.client.patch(f"/api/books/{book_id}/", {"progress": 50}, format="json")
        self.assertEqual(
            ActivityEvent.objects.filter(target_type="book", target_id=book_id).count(),
            before_count,
        )

    def test_episode_note_rewatch_and_character_record_activity(self):
        # Episode note create & update
        ep_res = self.client.post(
            "/api/episode-notes/",
            {
                "season": self.season.id,
                "episode_number": 3,
                "note": "Magic as quiet care.",
            },
            format="json",
        )
        self.assertEqual(ep_res.status_code, status.HTTP_201_CREATED)
        ep_id = ep_res.data["id"]
        ep_event = ActivityEvent.objects.filter(
            kind=ActivityKind.NOTE_WRITTEN, target_type="episode", target_id=self.season.id
        ).first()
        self.assertIsNotNone(ep_event)
        self.assertEqual(ep_event.title, f"{self.series.title} · Ep 3")

        self.client.patch(
            f"/api/episode-notes/{ep_id}/",
            {"note": "Magic as quiet care, revised."},
            format="json",
        )
        self.assertEqual(
            ActivityEvent.objects.filter(
                kind=ActivityKind.NOTE_WRITTEN, target_type="episode", target_id=self.season.id
            ).count(),
            2,
        )

        # Rewatch create
        rw_res = self.client.post(
            "/api/rewatches/",
            {"target_type": "season", "target_id": self.season.id, "notes": "Pass 2"},
            format="json",
        )
        self.assertEqual(rw_res.status_code, status.HTTP_201_CREATED)
        rw_event = ActivityEvent.objects.filter(
            kind=ActivityKind.REWATCH_LOGGED, target_type="season", target_id=self.season.id
        ).first()
        self.assertIsNotNone(rw_event)
        self.assertEqual(rw_event.title, self.series.title)

        # Character create + update
        ch_res = self.client.post(
            "/api/characters/",
            {"series": self.series.id, "name": "Eisen", "why": ""},
            format="json",
        )
        self.assertEqual(ch_res.status_code, status.HTTP_201_CREATED)
        char_id = ch_res.data["id"]
        self.assertEqual(
            ActivityEvent.objects.filter(
                kind=ActivityKind.CHARACTER_ADDED, target_type="character", target_id=char_id
            ).count(),
            1,
        )

        # Updating non-why fields does not emit another CHARACTER_ADDED
        self.client.patch(
            f"/api/characters/{char_id}/",
            {"cover_image": self.image_frieren.id},
            format="json",
        )
        self.assertEqual(
            ActivityEvent.objects.filter(
                kind=ActivityKind.CHARACTER_ADDED, target_type="character", target_id=char_id
            ).count(),
            1,
        )

        # Writing why emits CHARACTER_ADDED
        self.client.patch(
            f"/api/characters/{char_id}/",
            {"why": "Strength tempered by humility."},
            format="json",
        )
        self.assertEqual(
            ActivityEvent.objects.filter(
                kind=ActivityKind.CHARACTER_ADDED, target_type="character", target_id=char_id
            ).count(),
            2,
        )

    def test_activity_list_endpoint_and_since_filtering(self):
        now = timezone.now()
        old_dt = now - timedelta(days=10)
        recent_dt = now - timedelta(days=1)

        old_ev = ActivityEvent.objects.create(
            kind=ActivityKind.BOOK_PROGRESS,
            target_type="book",
            target_id=self.book.id,
            title="Old Event",
            delta=5,
            created_at=old_dt,
        )
        recent_ev = ActivityEvent.objects.create(
            kind=ActivityKind.EPISODE_PROGRESS,
            target_type="season",
            target_id=self.season.id,
            title="Recent Event",
            delta=1,
            created_at=recent_dt,
        )

        res_all = self.client.get("/api/activity/")
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res_all.data, list)
        ids = [item["id"] for item in res_all.data]
        self.assertEqual(ids, [recent_ev.id, old_ev.id])

        since_date = (now - timedelta(days=3)).date().isoformat()
        res_since = self.client.get(f"/api/activity/?since={since_date}")
        self.assertEqual(res_since.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in res_since.data], [recent_ev.id])

        res_limit = self.client.get("/api/activity/?limit=1")
        self.assertEqual(res_limit.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_limit.data), 1)
        self.assertEqual(res_limit.data[0]["id"], recent_ev.id)

        res_bad = self.client.get("/api/activity/?since=not-a-date")
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("animeLog.services.importer.requests.get")
    def test_bulk_imports_do_not_create_activity_events(self, mock_get):
        ActivityEvent.objects.all().delete()

        # JSON import
        payload = {
            "version": "1.0",
            "series": [
                {
                    "title": "Vinland Saga",
                    "seasons": [
                        {
                            "season_number": 1,
                            "title": "Season 1",
                            "status": "COMPLETED",
                            "progress": 24,
                            "total_episodes": 24,
                            "notes": "No enemies.",
                        }
                    ],
                }
            ],
            "books": [
                {
                    "title": "Letters from a Stoic",
                    "status": "COMPLETED",
                    "progress": 200,
                    "notes": "Time is the only possession.",
                }
            ],
            "characters": [{"series_title": "Vinland Saga", "name": "Thorfinn", "why": "Redemption."}],
            "rewatches": [],
        }
        res_json = self.client.post("/api/import/json/", payload, format="json")
        self.assertEqual(res_json.status_code, status.HTTP_200_OK)
        self.assertEqual(ActivityEvent.objects.count(), 0)

        # MAL import
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "data": [
                {
                    "entry": {"mal_id": 1, "title": "Cowboy Bebop"},
                    "score": 10,
                    "status": "completed",
                    "episodes_seen": 26,
                    "episodes_total": 26,
                }
            ]
        }
        res_mal = self.client.post("/api/import/mal/", {"username": "spike"}, format="json")
        self.assertEqual(res_mal.status_code, status.HTTP_200_OK)
        self.assertEqual(ActivityEvent.objects.count(), 0)

    async def test_mcp_write_tools_record_activity(self):
        from animeLog.mcp import tools

        await ActivityEvent.objects.all().adelete()
        s_res = await tools.log_anime_series(
            title="Mushishi",
            initial_season_episodes=26,
            initial_season_status="PLAN_TO_WATCH",
        )
        season_id = s_res["season_id"]
        series_id = s_res["series_id"]

        await tools.update_anime_progress("season", season_id, progress=26, notes="Quiet folklore.")
        await tools.add_episode_note(season_id=season_id, episode_number=1, note="The green seat.")
        await tools.log_rewatch(target_type="season", target_id=season_id, notes="Still serene.")
        c_res = await tools.add_favorite_character(series_id=series_id, name="Ginko", why="Curiosity without malice.")
        await tools.update_favorite_character(character_id=c_res["character_id"], why="Quiet empathy.")

        b_res = await tools.log_book(title="Walden", total_pages=300, progress=10)
        await tools.update_book_progress(b_res["book_id"], progress=300, notes="Simplicity.")

        kinds = [
            k
            async for k in ActivityEvent.objects.values_list("kind", flat=True)
        ]
        self.assertIn(ActivityKind.EPISODE_PROGRESS, kinds)
        self.assertIn(ActivityKind.COMPLETED, kinds)
        self.assertIn(ActivityKind.NOTE_WRITTEN, kinds)
        self.assertIn(ActivityKind.REWATCH_LOGGED, kinds)
        self.assertIn(ActivityKind.CHARACTER_ADDED, kinds)
        self.assertIn(ActivityKind.BOOK_PROGRESS, kinds)

