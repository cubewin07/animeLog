from datetime import date
from django.core.management.base import BaseCommand

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


class Command(BaseCommand):
    help = "Seeds initial genres, studios, anime series/seasons/movies, books, rewatches, and characters idempotently."

    def handle(self, *args, **options):
        self.stdout.write("Seeding AnimeLog journal data...")

        # 1. Genres
        genres_data = [
            "Fantasy",
            "Adventure",
            "Sci-Fi",
            "Psychological",
            "Drama",
            "Slice of Life",
            "Philosophy",
            "History",
            "Action",
            "Mystery",
        ]
        genres = {}
        for name in genres_data:
            genre, _ = Genre.objects.get_or_create(name=name)
            genres[name] = genre

        # 2. Studios
        studios_data = [
            "Madhouse",
            "Wit Studio",
            "MAPPA",
            "White Fox",
            "Kyoto Animation",
            "Bones",
            "ufotable",
        ]
        studios = {}
        for name in studios_data:
            studio, _ = Studio.objects.get_or_create(name=name)
            studios[name] = studio

        # 3. Anime Series, Seasons, Movies, Episode Notes, Rewatches, Characters

        # --- Frieren ---
        frieren_series, _ = AnimeSeries.objects.get_or_create(
            title="Frieren: Beyond Journey's End"
        )
        frieren_series.genres.set(
            [genres["Fantasy"], genres["Adventure"], genres["Drama"]]
        )

        frieren_s1, _ = AnimeSeason.objects.get_or_create(
            series=frieren_series,
            season_number=1,
            defaults={
                "title": "Season 1",
                "status": AnimeStatus.COMPLETED,
                "rating": 10,
                "progress": 28,
                "total_episodes": 28,
                "start_date": date(2025, 10, 15),
                "finish_date": date(2025, 11, 20),
                "notes": (
                    "A profound lesson on the relativity of time. When lifespan spans a millennium, "
                    "moments feel transient until someone is gone. Himmel taught Frieren that even brief "
                    "shared journeys shape our human warmth. It reminded me never to postpone expressing "
                    "care to those around me."
                ),
            },
        )
        frieren_s1.studios.set([studios["Madhouse"]])

        EpisodeNote.objects.get_or_create(
            season=frieren_s1,
            episode_number=1,
            defaults={
                "episode_title": "The Journey's End",
                "note": "Realizing that 10 years of adventuring was barely a drop in an elf's lifespan, yet it became the emotional anchor for the rest of her existence.",
                "rating": 10,
            },
        )
        EpisodeNote.objects.get_or_create(
            season=frieren_s1,
            episode_number=8,
            defaults={
                "episode_title": "Frieren the Slayer",
                "note": "A chilling yet composed demonstration of absolute dedication to aura concealment and patience over centuries.",
                "rating": 9,
            },
        )
        EpisodeNote.objects.get_or_create(
            season=frieren_s1,
            episode_number=28,
            defaults={
                "episode_title": "It Would Be Embarrassing When We Meet Again",
                "note": "A bittersweet farewell. An adventure doesn't truly end as long as the memories keep guiding you forward.",
                "rating": 10,
            },
        )

        frieren_s1.rewatches.get_or_create(
            defaults={
                "start_date": date(2026, 4, 1),
                "finish_date": date(2026, 4, 12),
                "rating": 10,
                "notes": (
                    "Rewatching with a slower mindset. Paying close attention to how Himmel's words guide "
                    "Frieren's quiet patience with Fern and Stark."
                ),
            },
        )

        FavoriteCharacter.objects.get_or_create(
            series=frieren_series,
            name="Himmel the Hero",
            defaults={
                "why": (
                    "He never took for granted that life is short. He deliberately erected statues not out of "
                    "narcissism, but so Frieren would never feel lonely when everyone else was gone."
                )
            },
        )

        # --- Attack on Titan ---
        aot_series, _ = AnimeSeries.objects.get_or_create(title="Attack on Titan")
        aot_series.genres.set(
            [genres["Action"], genres["Drama"], genres["Fantasy"], genres["Mystery"]]
        )

        aot_s1, _ = AnimeSeason.objects.get_or_create(
            series=aot_series,
            season_number=1,
            defaults={
                "title": "Season 1",
                "status": AnimeStatus.COMPLETED,
                "rating": 9,
                "progress": 25,
                "total_episodes": 25,
                "start_date": date(2023, 1, 10),
                "finish_date": date(2023, 2, 1),
                "notes": "The visceral terror of powerlessness within the walls and humanity's fierce instinct to fight.",
            },
        )
        aot_s1.studios.set([studios["Wit Studio"]])

        aot_s2, _ = AnimeSeason.objects.get_or_create(
            series=aot_series,
            season_number=2,
            defaults={
                "title": "Season 2",
                "status": AnimeStatus.COMPLETED,
                "rating": 9,
                "progress": 12,
                "total_episodes": 12,
                "start_date": date(2023, 2, 5),
                "finish_date": date(2023, 2, 20),
                "notes": "Betrayal, loyalty, and the revelation that enemies are people we once broke bread with.",
            },
        )
        aot_s2.studios.set([studios["Wit Studio"]])

        aot_s3, _ = AnimeSeason.objects.get_or_create(
            series=aot_series,
            season_number=3,
            defaults={
                "title": "Season 3",
                "status": AnimeStatus.COMPLETED,
                "rating": 10,
                "progress": 22,
                "total_episodes": 22,
                "start_date": date(2023, 3, 1),
                "finish_date": date(2023, 3, 28),
                "notes": "Erwin's charge: giving meaning to the lives of fallen comrades. Beyond the sea lies not freedom, but complex truth.",
            },
        )
        aot_s3.studios.set([studios["Wit Studio"]])

        aot_s4, _ = AnimeSeason.objects.get_or_create(
            series=aot_series,
            season_number=4,
            defaults={
                "title": "The Final Season",
                "status": AnimeStatus.COMPLETED,
                "rating": 10,
                "progress": 28,
                "total_episodes": 28,
                "start_date": date(2024, 1, 15),
                "finish_date": date(2024, 3, 10),
                "notes": "The devastating cycle of hatred and generational trauma. There are no villains on either side of the sea—only humans trapped by history.",
            },
        )
        aot_s4.studios.set([studios["MAPPA"]])

        FavoriteCharacter.objects.get_or_create(
            series=aot_series,
            name="Erwin Smith",
            defaults={
                "why": "The ultimate leader who bore the weight of deception to charge into the unknown, giving purpose to every soldier's sacrifice."
            },
        )

        # --- Demon Slayer ---
        ds_series, _ = AnimeSeries.objects.get_or_create(
            title="Demon Slayer: Kimetsu no Yaiba"
        )
        ds_series.genres.set(
            [genres["Action"], genres["Fantasy"], genres["Adventure"]]
        )

        ds_s1, _ = AnimeSeason.objects.get_or_create(
            series=ds_series,
            season_number=1,
            defaults={
                "title": "Unwavering Resolve Arc",
                "status": AnimeStatus.COMPLETED,
                "rating": 9,
                "progress": 26,
                "total_episodes": 26,
                "start_date": date(2024, 6, 1),
                "finish_date": date(2024, 6, 20),
                "notes": "Tanjiro's unwavering compassion even towards demons who caused him immense suffering.",
            },
        )
        ds_s1.studios.set([studios["ufotable"]])

        ds_movie, _ = AnimeMovie.objects.get_or_create(
            series=ds_series,
            title="Mugen Train",
            defaults={
                "status": AnimeStatus.COMPLETED,
                "rating": 10,
                "progress_minutes": 117,
                "total_minutes": 117,
                "start_date": date(2024, 7, 1),
                "finish_date": date(2024, 7, 1),
                "notes": "'Set your heart ablaze.' Rengoku demonstrated what it means to fulfill one's duty and protect the weak with warmth and courage until the very end.",
            },
        )
        ds_movie.studios.set([studios["ufotable"]])

        ds_movie.rewatches.get_or_create(
            defaults={
                "start_date": date(2025, 1, 15),
                "finish_date": date(2025, 1, 15),
                "rating": 10,
                "notes": "Revisited Rengoku's battle with Akaza. His resolve and optimism shine even brighter on rewatch.",
            },
        )

        ds_s2, _ = AnimeSeason.objects.get_or_create(
            series=ds_series,
            season_number=2,
            defaults={
                "title": "Entertainment District Arc",
                "status": AnimeStatus.COMPLETED,
                "rating": 9,
                "progress": 11,
                "total_episodes": 11,
                "start_date": date(2024, 8, 1),
                "finish_date": date(2024, 8, 15),
                "notes": "Spectacular visual storytelling emphasizing perseverance when pushing past physical limits.",
            },
        )
        ds_s2.studios.set([studios["ufotable"]])

        # --- Steins;Gate ---
        sg_series, _ = AnimeSeries.objects.get_or_create(title="Steins;Gate")
        sg_series.genres.set(
            [genres["Sci-Fi"], genres["Psychological"], genres["Drama"]]
        )

        sg_s1, _ = AnimeSeason.objects.get_or_create(
            series=sg_series,
            season_number=1,
            defaults={
                "title": "Season 1",
                "status": AnimeStatus.COMPLETED,
                "rating": 10,
                "progress": 24,
                "total_episodes": 24,
                "start_date": date(2024, 5, 1),
                "finish_date": date(2024, 5, 18),
                "notes": (
                    "Consequences of obsession and the weight of bearing sole memory of multiple timelines. "
                    "The importance of sacrifice and unwavering loyalty to friends."
                ),
            },
        )
        sg_s1.studios.set([studios["White Fox"]])

        sg_s1.rewatches.get_or_create(
            defaults={
                "start_date": date(2026, 2, 10),
                "finish_date": date(2026, 2, 18),
                "rating": 10,
                "notes": (
                    "Second pass hit far harder knowing Okabe's eventual despair from the opening episode. "
                    "The subtle foreshadowing in Kurisu's early dialogues made the whole sacrifice arc unforgettable."
                ),
            },
        )

        sg_movie, _ = AnimeMovie.objects.get_or_create(
            series=sg_series,
            title="Load Region of Déjà Vu",
            defaults={
                "status": AnimeStatus.COMPLETED,
                "rating": 8,
                "progress_minutes": 90,
                "total_minutes": 90,
                "start_date": date(2024, 6, 1),
                "finish_date": date(2024, 6, 1),
                "notes": "Kurisu's perspective bearing the weight of rescuing Okabe from the R worldline.",
            },
        )
        sg_movie.studios.set([studios["White Fox"]])

        FavoriteCharacter.objects.get_or_create(
            series=sg_series,
            name="Rintaro Okabe",
            defaults={
                "why": "Willing to endure countless cycles of psychological trauma to protect the worldline where everyone he loves survives."
            },
        )
        FavoriteCharacter.objects.get_or_create(
            series=sg_series,
            name="Kurisu Makise",
            defaults={
                "why": "Brilliant intellect combined with genuine emotional vulnerability and selflessness."
            },
        )

        # 4. Books
        dune, _ = Book.objects.get_or_create(
            title="Dune",
            defaults={
                "author": "Frank Herbert",
                "status": BookStatus.COMPLETED,
                "rating": 9,
                "progress": 688,
                "total_pages": 688,
                "start_date": date(2025, 6, 1),
                "finish_date": date(2025, 7, 15),
                "notes": (
                    "A masterclass warning against messianic leaders. Charisma combined with ecological "
                    "and religious dogmatism creates uncontrollable momentum that sweeps even well-intentioned "
                    "heroes into tragedy."
                ),
            },
        )
        dune.genres.set([genres["Sci-Fi"], genres["Philosophy"]])

        habits, _ = Book.objects.get_or_create(
            title="Atomic Habits",
            defaults={
                "author": "James Clear",
                "status": BookStatus.COMPLETED,
                "rating": 8,
                "progress": 320,
                "total_pages": 320,
                "start_date": date(2025, 8, 1),
                "finish_date": date(2025, 8, 14),
                "notes": (
                    "You do not rise to the level of your goals; you fall to the level of your systems. "
                    "Small 1% compounding daily adjustments beat sporadic bursts of willpower every single time."
                ),
            },
        )
        habits.genres.set([genres["Psychological"], genres["Philosophy"]])

        klara, _ = Book.objects.get_or_create(
            title="Klara and the Sun",
            defaults={
                "author": "Kazuo Ishiguro",
                "status": BookStatus.READING,
                "rating": 9,
                "progress": 185,
                "total_pages": 303,
                "start_date": date(2026, 8, 10),
                "finish_date": None,
                "notes": (
                    "Exploration of loneliness, sacrifice, and the unique human essence from an artificial "
                    "friend's observant and gentle viewpoint. Is the human heart something that can truly be replicated?"
                ),
            },
        )
        klara.genres.set([genres["Sci-Fi"], genres["Drama"], genres["Philosophy"]])

        meditations, _ = Book.objects.get_or_create(
            title="Meditations",
            defaults={
                "author": "Marcus Aurelius",
                "status": BookStatus.PLAN_TO_READ,
                "rating": None,
                "progress": 0,
                "total_pages": 254,
                "start_date": None,
                "finish_date": None,
                "notes": "Personal journal of Roman Emperor on stoicism, duty, and maintaining mental equilibrium in turmoil.",
            },
        )
        meditations.genres.set([genres["Philosophy"]])

        self.stdout.write(
            self.style.SUCCESS("Successfully seeded AnimeLog journal data!")
        )
