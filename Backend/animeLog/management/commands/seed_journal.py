from datetime import date
from django.core.management.base import BaseCommand

from animeLog.models import (
    Anime,
    AnimeStatus,
    Book,
    BookStatus,
    FavoriteCharacter,
    Genre,
    Rewatch,
    Studio,
)


class Command(BaseCommand):
    help = "Seeds initial genres, studios, anime, books, rewatches, and characters into the database."

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
        ]
        studios = {}
        for name in studios_data:
            studio, _ = Studio.objects.get_or_create(name=name)
            studios[name] = studio

        # 3. Anime
        if not Anime.objects.exists():
            frieren = Anime.objects.create(
                title="Frieren: Beyond Journey's End",
                status=AnimeStatus.COMPLETED,
                rating=10,
                progress=28,
                total_episodes=28,
                start_date=date(2025, 10, 15),
                finish_date=date(2025, 11, 20),
                notes=(
                    "A profound lesson on the relativity of time. When lifespan spans a millennium, "
                    "moments feel transient until someone is gone. Himmel taught Frieren that even brief "
                    "shared journeys shape our human warmth. It reminded me never to postpone expressing "
                    "care to those around me."
                ),
            )
            frieren.genres.add(genres["Fantasy"], genres["Adventure"], genres["Drama"])
            frieren.studios.add(studios["Madhouse"])

            vinland = Anime.objects.create(
                title="Vinland Saga Season 2",
                status=AnimeStatus.COMPLETED,
                rating=10,
                progress=24,
                total_episodes=24,
                start_date=date(2025, 12, 1),
                finish_date=date(2026, 1, 10),
                notes=(
                    '"You have no enemies." The farmland arc demonstrates that true strength is not the '
                    "capacity for violence, but the resilience to atone, build soil, and protect life without "
                    "taking another. True freedom begins when hatred is abandoned."
                ),
            )
            vinland.genres.add(genres["Drama"], genres["History"], genres["Philosophy"])
            vinland.studios.add(studios["MAPPA"])

            steins = Anime.objects.create(
                title="Steins;Gate",
                status=AnimeStatus.COMPLETED,
                rating=9,
                progress=24,
                total_episodes=24,
                start_date=date(2024, 5, 1),
                finish_date=date(2024, 5, 18),
                notes=(
                    "Consequences of obsession and the weight of bearing sole memory of multiple timelines. "
                    "The importance of sacrifice and unwavering loyalty to friends."
                ),
            )
            steins.genres.add(genres["Sci-Fi"], genres["Psychological"], genres["Drama"])
            steins.studios.add(studios["White Fox"])

            mob = Anime.objects.create(
                title="Mob Psycho 100 III",
                status=AnimeStatus.WATCHING,
                rating=9,
                progress=9,
                total_episodes=12,
                start_date=date(2026, 8, 1),
                finish_date=None,
                notes=(
                    "Kindness is not weakness. Special talents do not make anyone inherently better than "
                    "others; emotional maturity and empathy are the real virtues worth cultivating."
                ),
            )
            mob.genres.add(genres["Psychological"], genres["Drama"], genres["Slice of Life"])
            mob.studios.add(studios["Bones"])

            lion = Anime.objects.create(
                title="March Comes In Like a Lion Season 2",
                status=AnimeStatus.PLAN_TO_WATCH,
                rating=None,
                progress=0,
                total_episodes=22,
                start_date=None,
                finish_date=None,
                notes="Heard this covers the bullying resolution arc and deep reflections on warmth amidst isolation.",
            )
            lion.genres.add(genres["Drama"], genres["Slice of Life"])
            lion.studios.add(studios["Kyoto Animation"])

            # Rewatches
            Rewatch.objects.create(
                anime=steins,
                start_date=date(2026, 2, 10),
                finish_date=date(2026, 2, 18),
                rating=10,
                notes=(
                    "Second pass hit far harder knowing Okabe's eventual despair from the opening episode. "
                    "The subtle foreshadowing in Kurisu's early dialogues made the whole sacrifice arc unforgettable."
                ),
            )
            Rewatch.objects.create(
                anime=frieren,
                start_date=date(2026, 4, 1),
                finish_date=date(2026, 4, 12),
                rating=10,
                notes=(
                    "Rewatching with a slower mindset. Paying close attention to how Himmel's words guide "
                    "Frieren's quiet patience with Fern and Stark."
                ),
            )

            # Characters
            FavoriteCharacter.objects.create(
                anime=frieren,
                name="Himmel the Hero",
                why=(
                    "He never took for granted that life is short. He deliberately erected statues not out of "
                    "narcissism, but so Frieren would never feel lonely when everyone else was gone."
                ),
            )
            FavoriteCharacter.objects.create(
                anime=vinland,
                name="Thorfinn",
                why=(
                    "His transformation from a creature consumed by revenge to a peaceful farmer seeking to "
                    "create a land without swords is one of the most honest depictions of atonement."
                ),
            )
            FavoriteCharacter.objects.create(
                anime=mob,
                name="Arataka Reigen",
                why=(
                    "Despite being a con artist on the surface, his core mentorship toward Mob is deeply "
                    "empathetic and grounded in protecting a child from being exploited."
                ),
            )

        # 4. Books
        if not Book.objects.exists():
            dune = Book.objects.create(
                title="Dune",
                author="Frank Herbert",
                status=BookStatus.COMPLETED,
                rating=9,
                progress=688,
                total_pages=688,
                start_date=date(2025, 6, 1),
                finish_date=date(2025, 7, 15),
                notes=(
                    "A masterclass warning against messianic leaders. Charisma combined with ecological "
                    "and religious dogmatism creates uncontrollable momentum that sweeps even well-intentioned "
                    "heroes into tragedy."
                ),
            )
            dune.genres.add(genres["Sci-Fi"], genres["Philosophy"])

            habits = Book.objects.create(
                title="Atomic Habits",
                author="James Clear",
                status=BookStatus.COMPLETED,
                rating=8,
                progress=320,
                total_pages=320,
                start_date=date(2025, 8, 1),
                finish_date=date(2025, 8, 14),
                notes=(
                    "You do not rise to the level of your goals; you fall to the level of your systems. "
                    "Small 1% compounding daily adjustments beat sporadic bursts of willpower every single time."
                ),
            )
            habits.genres.add(genres["Psychological"], genres["Philosophy"])

            klara = Book.objects.create(
                title="Klara and the Sun",
                author="Kazuo Ishiguro",
                status=BookStatus.READING,
                rating=9,
                progress=185,
                total_pages=303,
                start_date=date(2026, 8, 10),
                finish_date=None,
                notes=(
                    "Exploration of loneliness, sacrifice, and the unique human essence from an artificial "
                    "friend's observant and gentle viewpoint. Is the human heart something that can truly be replicated?"
                ),
            )
            klara.genres.add(genres["Sci-Fi"], genres["Drama"], genres["Philosophy"])

            meditations = Book.objects.create(
                title="Meditations",
                author="Marcus Aurelius",
                status=BookStatus.PLAN_TO_READ,
                rating=None,
                progress=0,
                total_pages=254,
                start_date=None,
                finish_date=None,
                notes="Personal journal of Roman Emperor on stoicism, duty, and maintaining mental equilibrium in turmoil.",
            )
            meditations.genres.add(genres["Philosophy"])

        self.stdout.write(self.style.SUCCESS("Successfully seeded AnimeLog journal data!"))
