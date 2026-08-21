from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Anime, AnimeStatus, Book, BookStatus, FavoriteCharacter, Genre, Rewatch, Studio


class ModelConstraintTests(TestCase):
    def test_anime_rating_must_be_between_1_and_10(self):
        too_high = Anime(title="Overrated", rating=11)
        with self.assertRaises(ValidationError) as ctx:
            too_high.full_clean()
        self.assertIn("rating", ctx.exception.message_dict)

        too_low = Anime(title="Underrated", rating=0)
        with self.assertRaises(ValidationError) as ctx:
            too_low.full_clean()
        self.assertIn("rating", ctx.exception.message_dict)

    def test_null_rating_is_allowed(self):
        anime = Anime(title="Unrated", rating=None, status=AnimeStatus.PLAN_TO_WATCH)
        anime.full_clean()

    def test_invalid_status_is_rejected(self):
        anime = Anime(title="Binge", status="BINGING")
        with self.assertRaises(ValidationError) as ctx:
            anime.full_clean()
        self.assertIn("status", ctx.exception.message_dict)

        book = Book(title="Skim", status="SKIMMING")
        with self.assertRaises(ValidationError) as ctx:
            book.full_clean()
        self.assertIn("status", ctx.exception.message_dict)

    def test_rewatch_and_book_rating_bounds(self):
        anime = Anime.objects.create(title="Host")
        rewatch = Rewatch(anime=anime, rating=11)
        with self.assertRaises(ValidationError):
            rewatch.full_clean()

        book = Book(title="Overrated book", rating=0)
        with self.assertRaises(ValidationError):
            book.full_clean()

    def test_genre_name_is_unique(self):
        Genre.objects.create(name="Fantasy")
        with self.assertRaises(IntegrityError):
            Genre.objects.create(name="Fantasy")


class JournalAPIFixtureMixin:
    def setUp(self):
        self.genre_fantasy = Genre.objects.create(name="Fantasy")
        self.genre_sci_fi = Genre.objects.create(name="Sci-Fi")
        self.studio_madhouse = Studio.objects.create(name="Madhouse")

        self.anime = Anime.objects.create(
            title="Frieren: Beyond Journey's End",
            status=AnimeStatus.COMPLETED,
            rating=10,
            progress=28,
            total_episodes=28,
            notes="A poignant reflection on the passage of time and cherishing fleeting moments.",
        )
        self.anime.genres.add(self.genre_fantasy)
        self.anime.studios.add(self.studio_madhouse)

        self.rewatch = Rewatch.objects.create(
            anime=self.anime,
            rating=10,
            notes="Second viewing deepened the emotional resonance.",
        )

        self.character = FavoriteCharacter.objects.create(
            anime=self.anime,
            name="Himmel",
            why="Demonstrated how small acts of kindness leave an eternal footprint.",
        )

        self.book = Book.objects.create(
            title="Meditations",
            author="Marcus Aurelius",
            status=BookStatus.READING,
            rating=9,
            progress=120,
            total_pages=254,
            notes="Focus on what is within your control.",
        )
        self.book.genres.add(self.genre_fantasy)


class AnimeLogAPITests(JournalAPIFixtureMixin, APITestCase):
    def test_list_genres(self):
        response = self.client.get("/api/genres/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        names = [g["name"] for g in response.data]
        self.assertIn("Fantasy", names)

    def test_create_genre(self):
        response = self.client.post("/api/genres/", {"name": "Philosophy"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Philosophy")

    def test_duplicate_genre_name_is_rejected(self):
        response = self.client.post("/api/genres/", {"name": "Fantasy"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_list_studios(self):
        response = self.client.get("/api/studios/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Madhouse")

    def test_create_studio(self):
        response = self.client.post("/api/studios/", {"name": "Kyoto Animation"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Kyoto Animation")

    def test_list_anime(self):
        response = self.client.get("/api/anime/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        anime_data = response.data[0]
        self.assertEqual(anime_data["title"], "Frieren: Beyond Journey's End")
        self.assertEqual(anime_data["notes"], self.anime.notes)
        self.assertEqual(len(anime_data["genres"]), 1)
        self.assertEqual(anime_data["genres"][0]["name"], "Fantasy")
        self.assertEqual(len(anime_data["studios"]), 1)
        self.assertEqual(anime_data["studios"][0]["name"], "Madhouse")
        self.assertEqual(len(anime_data["rewatches"]), 1)
        self.assertEqual(len(anime_data["favorite_characters"]), 1)
        self.assertEqual(anime_data["favorite_characters"][0]["name"], "Himmel")
        self.assertEqual(
            anime_data["favorite_characters"][0]["why"],
            self.character.why,
        )

    def test_get_anime_detail(self):
        response = self.client.get(f"/api/anime/{self.anime.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.anime.title)
        self.assertEqual(response.data["notes"], self.anime.notes)

    def test_get_missing_anime_returns_404(self):
        response = self.client.get("/api/anime/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_anime_with_genre_and_studio_ids(self):
        payload = {
            "title": "Steins;Gate",
            "status": "WATCHING",
            "rating": 10,
            "progress": 12,
            "total_episodes": 24,
            "notes": "Time travel thriller with profound emotional stakes.",
            "genres": [self.genre_sci_fi.id],
            "studios": [self.studio_madhouse.id],
        }
        response = self.client.post("/api/anime/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Steins;Gate")
        self.assertEqual(len(response.data["genres"]), 1)
        self.assertEqual(response.data["genres"][0]["name"], "Sci-Fi")
        self.assertEqual(response.data["rewatches"], [])
        self.assertEqual(response.data["favorite_characters"], [])

    def test_create_anime_accepts_frontend_genre_and_studio_objects(self):
        payload = {
            "title": "Mob Psycho 100",
            "status": "WATCHING",
            "rating": 9,
            "progress": 3,
            "total_episodes": 12,
            "start_date": "2026-08-01",
            "finish_date": None,
            "notes": "Kindness is not weakness.",
            "genres": [{"id": self.genre_sci_fi.id, "name": self.genre_sci_fi.name}],
            "studios": [{"id": self.studio_madhouse.id, "name": self.studio_madhouse.name}],
        }
        response = self.client.post("/api/anime/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["genres"][0]["name"], "Sci-Fi")
        self.assertEqual(response.data["studios"][0]["name"], "Madhouse")
        created = Anime.objects.get(id=response.data["id"])
        self.assertEqual(list(created.genres.values_list("name", flat=True)), ["Sci-Fi"])

    def test_create_anime_rejects_out_of_range_rating(self):
        too_high = self.client.post(
            "/api/anime/",
            {"title": "Too high", "rating": 11},
            format="json",
        )
        self.assertEqual(too_high.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rating", too_high.data)

        too_low = self.client.post(
            "/api/anime/",
            {"title": "Too low", "rating": 0},
            format="json",
        )
        self.assertEqual(too_low.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rating", too_low.data)

    def test_create_anime_rejects_invalid_status(self):
        response = self.client.post(
            "/api/anime/",
            {"title": "Nope", "status": "BINGING"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_create_anime_requires_title(self):
        response = self.client.post("/api/anime/", {"status": "WATCHING"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_update_anime_progress_and_status(self):
        response = self.client.patch(
            f"/api/anime/{self.anime.id}/",
            {"progress": 28, "status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.anime.refresh_from_db()
        self.assertEqual(self.anime.status, AnimeStatus.COMPLETED)

    def test_patch_anime_accepts_genre_objects(self):
        response = self.client.patch(
            f"/api/anime/{self.anime.id}/",
            {"genres": [{"id": self.genre_sci_fi.id, "name": "Sci-Fi"}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["genres"][0]["name"], "Sci-Fi")
        self.anime.refresh_from_db()
        self.assertEqual(list(self.anime.genres.values_list("name", flat=True)), ["Sci-Fi"])

    def test_filter_anime_by_status_and_search(self):
        response = self.client.get("/api/anime/?status=COMPLETED")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        response = self.client.get("/api/anime/?status=PLAN_TO_WATCH")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        response = self.client.get("/api/anime/?search=frieren")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_search_anime_matches_notes(self):
        response = self.client.get("/api/anime/?search=fleeting")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.anime.id)

    def test_filter_anime_by_genre_id_and_name(self):
        by_id = self.client.get(f"/api/anime/?genre={self.genre_fantasy.id}")
        self.assertEqual(by_id.status_code, status.HTTP_200_OK)
        self.assertEqual(len(by_id.data), 1)

        by_name = self.client.get("/api/anime/?genre=fantasy")
        self.assertEqual(by_name.status_code, status.HTTP_200_OK)
        self.assertEqual(len(by_name.data), 1)

        missing = self.client.get("/api/anime/?genre=Romance")
        self.assertEqual(missing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(missing.data), 0)

    def test_delete_anime_returns_204_and_cascades(self):
        anime_id = self.anime.id
        response = self.client.delete(f"/api/anime/{anime_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Anime.objects.filter(id=anime_id).exists())
        self.assertFalse(Rewatch.objects.filter(anime_id=anime_id).exists())
        self.assertFalse(FavoriteCharacter.objects.filter(anime_id=anime_id).exists())

    def test_list_books(self):
        response = self.client.get("/api/books/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Meditations")
        self.assertEqual(response.data[0]["author"], "Marcus Aurelius")
        self.assertEqual(response.data[0]["notes"], self.book.notes)

    def test_create_book(self):
        payload = {
            "title": "Dune",
            "author": "Frank Herbert",
            "status": "PLAN_TO_READ",
            "rating": None,
            "progress": 0,
            "total_pages": 412,
            "notes": "Epic space saga exploring power, religion, and ecology.",
            "genres": [self.genre_sci_fi.id],
        }
        response = self.client.post("/api/books/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Dune")
        self.assertEqual(response.data["genres"][0]["name"], "Sci-Fi")

    def test_create_book_accepts_frontend_genre_objects(self):
        payload = {
            "title": "Klara and the Sun",
            "author": "Kazuo Ishiguro",
            "status": "READING",
            "rating": 9,
            "progress": 40,
            "total_pages": 303,
            "notes": "Is the human heart something that can be replicated?",
            "genres": [{"id": self.genre_sci_fi.id, "name": "Sci-Fi"}],
        }
        response = self.client.post("/api/books/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["genres"][0]["id"], self.genre_sci_fi.id)

    def test_update_and_delete_book(self):
        patched = self.client.patch(
            f"/api/books/{self.book.id}/",
            {"progress": 200, "status": "READING"},
            format="json",
        )
        self.assertEqual(patched.status_code, status.HTTP_200_OK)
        self.book.refresh_from_db()
        self.assertEqual(self.book.progress, 200)

        deleted = self.client.delete(f"/api/books/{self.book.id}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=self.book.id).exists())

    def test_filter_and_search_books(self):
        by_status = self.client.get("/api/books/?status=READING")
        self.assertEqual(by_status.status_code, status.HTTP_200_OK)
        self.assertEqual(len(by_status.data), 1)

        by_author = self.client.get("/api/books/?search=marcus")
        self.assertEqual(by_author.status_code, status.HTTP_200_OK)
        self.assertEqual(len(by_author.data), 1)

        by_notes = self.client.get("/api/books/?search=control")
        self.assertEqual(by_notes.status_code, status.HTTP_200_OK)
        self.assertEqual(len(by_notes.data), 1)

        by_genre = self.client.get(f"/api/books/?genre={self.genre_fantasy.id}")
        self.assertEqual(by_genre.status_code, status.HTTP_200_OK)
        self.assertEqual(len(by_genre.data), 1)

    def test_create_book_rejects_invalid_status(self):
        response = self.client.post(
            "/api/books/",
            {"title": "Nope", "status": "SKIMMING"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_list_and_create_rewatches(self):
        response = self.client.get("/api/rewatches/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["anime_title"], "Frieren: Beyond Journey's End")
        self.assertEqual(response.data[0]["notes"], self.rewatch.notes)

        payload = {
            "anime": self.anime.id,
            "rating": 10,
            "notes": "Third time rewatching.",
        }
        create_res = self.client.post("/api/rewatches/", payload, format="json")
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["anime_title"], "Frieren: Beyond Journey's End")

    def test_filter_and_delete_rewatch(self):
        other = Anime.objects.create(title="Other series")
        Rewatch.objects.create(anime=other, notes="A different pass.")

        filtered = self.client.get(f"/api/rewatches/?anime={self.anime.id}")
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered.data), 1)
        self.assertEqual(filtered.data[0]["id"], self.rewatch.id)

        deleted = self.client.delete(f"/api/rewatches/{self.rewatch.id}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Rewatch.objects.filter(id=self.rewatch.id).exists())
        self.assertTrue(Anime.objects.filter(id=self.anime.id).exists())

    def test_rewatch_rejects_out_of_range_rating(self):
        response = self.client.post(
            "/api/rewatches/",
            {"anime": self.anime.id, "rating": 11, "notes": "Impossible score."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rating", response.data)

    def test_list_and_create_characters(self):
        response = self.client.get("/api/characters/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Himmel")
        self.assertEqual(response.data[0]["anime_title"], "Frieren: Beyond Journey's End")
        self.assertEqual(response.data[0]["why"], self.character.why)

        payload = {
            "anime": self.anime.id,
            "name": "Fern",
            "why": "Demonstrates quiet perseverance and deep respect for elders.",
        }
        create_res = self.client.post("/api/characters/", payload, format="json")
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["name"], "Fern")

    def test_filter_and_delete_character(self):
        other = Anime.objects.create(title="Other series")
        FavoriteCharacter.objects.create(anime=other, name="Someone else", why="Different story.")

        filtered = self.client.get(f"/api/characters/?anime={self.anime.id}")
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered.data), 1)
        self.assertEqual(filtered.data[0]["name"], "Himmel")

        deleted = self.client.delete(f"/api/characters/{self.character.id}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FavoriteCharacter.objects.filter(id=self.character.id).exists())

    def test_character_requires_name(self):
        response = self.client.post(
            "/api/characters/",
            {"anime": self.anime.id, "why": "Nameless."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_journal_stats(self):
        response = self.client.get("/api/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["activeWatching"], 0)
        self.assertEqual(response.data["activeReading"], 1)
        self.assertEqual(response.data["totalCompleted"], 1)
        self.assertEqual(response.data["totalLessons"], 3)
        self.assertEqual(response.data["rewatchesCount"], 1)
        self.assertEqual(response.data["charactersCount"], 1)

    def test_blank_notes_are_not_counted_as_lessons(self):
        Anime.objects.create(title="No notes yet", notes="")
        Anime.objects.create(title="Null notes", notes=None)
        Book.objects.create(title="Empty book notes", notes="   ")

        response = self.client.get("/api/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["totalLessons"], 3)

    def test_cors_allows_vite_origin(self):
        response = self.client.get("/api/stats/", HTTP_ORIGIN="http://localhost:5173")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Access-Control-Allow-Origin"], "http://localhost:5173")


class QueryOptimizationTests(JournalAPIFixtureMixin, APITestCase):
    def test_list_anime_uses_constant_queries_with_prefetch(self):
        for index in range(4):
            extra = Anime.objects.create(
                title=f"Extra series {index}",
                status=AnimeStatus.WATCHING,
                notes=f"Lesson {index}",
            )
            extra.genres.add(self.genre_fantasy)
            extra.studios.add(self.studio_madhouse)
            Rewatch.objects.create(anime=extra, notes=f"Rewatch {index}")
            FavoriteCharacter.objects.create(
                anime=extra,
                name=f"Character {index}",
                why=f"Why {index}",
            )

        # 1 anime table + 4 prefetched relations. Must not grow with row count.
        with self.assertNumQueries(5):
            response = self.client.get("/api/anime/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
