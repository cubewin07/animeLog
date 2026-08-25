from django.test import TestCase
from animeLog.models import (
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
from animeLog.mcp import tools, resources, prompts
from animeLog.mcp.server import mcp_server


class MCPToolsTestCase(TestCase):
    async def test_log_anime_series_and_initial_season(self):
        result = await tools.log_anime_series(
            title="Sousou no Frieren",
            japanese_title="葬送のフリーレン",
            romaji_title="Frieren: Beyond Journey's End",
            genres=["Fantasy", "Adventure", "Drama"],
            initial_season_title="Season 1",
            initial_season_episodes=28,
            initial_season_status="WATCHING",
            initial_season_rating=10,
            initial_season_notes="A masterpiece on time, memory, and appreciating human connections.",
            studios=["Madhouse"],
        )

        self.assertTrue(result["success"])
        series = await AnimeSeries.objects.aget(pk=result["series_id"])
        self.assertEqual(series.title, "Sousou no Frieren")
        
        season = await AnimeSeason.objects.aget(pk=result["season_id"])
        self.assertEqual(season.title, "Season 1")
        self.assertEqual(season.status, AnimeStatus.WATCHING)
        self.assertEqual(season.total_episodes, 28)
        self.assertEqual(season.rating, 10)

        # Check genres & studios created and linked
        genre_count = await series.genres.acount()
        self.assertEqual(genre_count, 3)
        studio_count = await season.studios.acount()
        self.assertEqual(studio_count, 1)

    async def test_add_anime_season_and_movie(self):
        series_res = await tools.log_anime_series(title="Demon Slayer")
        series_id = series_res["series_id"]

        # Add Season 2
        s2_res = await tools.add_anime_season(
            series_id=series_id,
            title="Entertainment District Arc",
            season_number=2,
            total_episodes=11,
            notes="Flashy animations and emotional brother-sister bonds.",
        )
        self.assertTrue(s2_res["success"])
        s2 = await AnimeSeason.objects.aget(pk=s2_res["season_id"])
        self.assertEqual(s2.season_number, 2)

        # Add Movie
        movie_res = await tools.add_anime_movie(
            series_id=series_id,
            title="Mugen Train",
            total_minutes=117,
            progress_minutes=117,
            status="COMPLETED",
            rating=9,
            notes="Set your heart ablaze. Rengoku's determination.",
        )
        self.assertTrue(movie_res["success"])
        movie = await AnimeMovie.objects.aget(pk=movie_res["movie_id"])
        self.assertEqual(movie.title, "Mugen Train")
        self.assertEqual(movie.status, AnimeStatus.COMPLETED)

    async def test_update_anime_progress_auto_completion(self):
        series_res = await tools.log_anime_series(
            title="Bocchi the Rock!",
            initial_season_episodes=12,
            initial_season_status="PLAN_TO_WATCH",
        )
        season_id = series_res["season_id"]

        # Progress from 0 to 6 -> should automatically become WATCHING
        up1 = await tools.update_anime_progress("season", season_id, progress=6)
        self.assertTrue(up1["success"])
        self.assertEqual(up1["status"], AnimeStatus.WATCHING)

        # Progress from 6 to 12 -> should automatically become COMPLETED
        up2 = await tools.update_anime_progress("season", season_id, progress=12, rating=10, notes="Relatable introversion and passion for music.")
        self.assertTrue(up2["success"])
        self.assertEqual(up2["status"], AnimeStatus.COMPLETED)
        
        season = await AnimeSeason.objects.aget(pk=season_id)
        self.assertEqual(season.status, AnimeStatus.COMPLETED)
        self.assertIsNotNone(season.finish_date)
        self.assertEqual(season.rating, 10)

    async def test_add_episode_note(self):
        series_res = await tools.log_anime_series(title="Violet Evergarden", initial_season_episodes=13)
        season_id = series_res["season_id"]

        ep_res = await tools.add_episode_note(
            season_id=season_id,
            episode_number=10,
            episode_title="Loved Ones Will Always Watch Over You",
            note="Anne's mother's letters written for the next 50 years. Pure catharsis.",
            rating=10,
        )
        self.assertTrue(ep_res["success"])

        note = await EpisodeNote.objects.aget(pk=ep_res["episode_note_id"])
        self.assertEqual(note.episode_number, 10)
        self.assertEqual(note.rating, 10)

    async def test_favorite_character_and_rewatch(self):
        series_res = await tools.log_anime_series(title="Gurren Lagann")
        series_id = series_res["series_id"]

        # Favorite Character
        char_res = await tools.add_favorite_character(
            series_id=series_id,
            name="Kamina",
            why="Believe in the you that believes in yourself. Unwavering faith in brothers.",
        )
        self.assertTrue(char_res["success"])
        char = await FavoriteCharacter.objects.aget(pk=char_res["character_id"])
        self.assertEqual(char.name, "Kamina")

        # Rewatch
        rewatch_res = await tools.log_rewatch(
            target_type="series",
            target_id=series_id,
            rating=10,
            notes="Rewatching the finale reminds me to keep moving forward no matter the odds.",
        )
        self.assertTrue(rewatch_res["success"])
        rewatch = await Rewatch.objects.aget(pk=rewatch_res["rewatch_id"])
        self.assertEqual(rewatch.rating, 10)

    async def test_book_logging_and_progress(self):
        book_res = await tools.log_book(
            title="Atomic Habits",
            author="James Clear",
            total_pages=320,
            notes="You do not rise to the level of your goals, you fall to the level of your systems.",
            genres=["Self-Help", "Productivity"],
        )
        self.assertTrue(book_res["success"])
        book_id = book_res["book_id"]

        # Update progress to completed
        up_res = await tools.update_book_progress(book_id, progress=320, rating=9)
        self.assertTrue(up_res["success"])
        self.assertEqual(up_res["status"], BookStatus.COMPLETED)

    async def test_search_journal_and_overview(self):
        await tools.log_anime_series(
            title="Steins;Gate",
            initial_season_notes="El Psy Kongroo. The weight of time travel and sacrifice.",
            genres=["Sci-Fi", "Thriller"],
        )
        await tools.log_book(
            title="Klara and the Sun",
            author="Kazuo Ishiguro",
            notes="What does it mean to have a human heart?",
            genres=["Sci-Fi"],
        )

        # Search across all
        results = await tools.search_journal("sacrifice")
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Steins;Gate")

        # Search book
        book_results = await tools.search_journal("Ishiguro", media_type="books")
        self.assertEqual(len(book_results), 1)
        self.assertEqual(book_results[0]["title"], "Klara and the Sun")

        # Overview stats
        overview = await tools.get_journal_overview()
        self.assertIn("stats", overview)
        self.assertGreaterEqual(overview["stats"]["total_lessons_count"], 2)

    async def test_mcp_resources_and_prompts(self):
        stats_str = await resources.get_stats_resource()
        self.assertIn("total_series", stats_str)

        lessons_str = await resources.get_lessons_resource()
        self.assertIn("anime_seasons", lessons_str)

        reflect_prompt = prompts.get_reflect_prompt(theme="courage")
        self.assertIn("courage", reflect_prompt)

    async def test_add_genre_and_studio(self):
        genre_res = await tools.add_genre("Cyberpunk")
        self.assertTrue(genre_res["success"])
        self.assertEqual(genre_res["name"], "Cyberpunk")
        self.assertTrue(genre_res["created"])

        # Re-adding should find existing
        genre_dup = await tools.add_genre("Cyberpunk")
        self.assertTrue(genre_dup["success"])
        self.assertFalse(genre_dup["created"])

        studio_res = await tools.add_studio("CloverWorks")
        self.assertTrue(studio_res["success"])
        self.assertEqual(studio_res["name"], "CloverWorks")
        self.assertTrue(studio_res["created"])

        # Re-adding studio
        studio_dup = await tools.add_studio("CloverWorks")
        self.assertTrue(studio_dup["success"])
        self.assertFalse(studio_dup["created"])

    def test_asgi_streamable_http_handshake(self):
        from config.asgi import application
        from starlette.testclient import TestClient

        with TestClient(application, base_url="http://127.0.0.1:8000") as client:
            response = client.post(
                "/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {"name": "test-agent", "version": "1.0"},
                    },
                },
                headers={"Host": "127.0.0.1:8000"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertIn("mcp-session-id", response.headers)
            self.assertIn("text/event-stream", response.headers.get("content-type", ""))



