import { Anime, Book, FavoriteCharacter, Genre, Rewatch, Studio } from '../types';

export const INITIAL_GENRES: Genre[] = [
  { id: 1, name: 'Fantasy' },
  { id: 2, name: 'Adventure' },
  { id: 3, name: 'Sci-Fi' },
  { id: 4, name: 'Psychological' },
  { id: 5, name: 'Drama' },
  { id: 6, name: 'Slice of Life' },
  { id: 7, name: 'Philosophy' },
  { id: 8, name: 'History' },
];

export const INITIAL_STUDIOS: Studio[] = [
  { id: 1, name: 'Madhouse' },
  { id: 2, name: 'Wit Studio' },
  { id: 3, name: 'MAPPA' },
  { id: 4, name: 'White Fox' },
  { id: 5, name: 'Kyoto Animation' },
  { id: 6, name: 'Bones' },
];

export const INITIAL_ANIME: Anime[] = [
  {
    id: 1,
    title: "Frieren: Beyond Journey's End",
    status: 'COMPLETED',
    rating: 10,
    progress: 28,
    total_episodes: 28,
    start_date: '2025-10-15',
    finish_date: '2025-11-20',
    notes:
      "A profound lesson on the relativity of time. When lifespan spans a millennium, moments feel transient until someone is gone. Himmel taught Frieren that even brief shared journeys shape our human warmth. It reminded me never to postpone expressing care to those around me.",
    created_at: '2025-10-15T12:00:00Z',
    genres: [
      { id: 1, name: 'Fantasy' },
      { id: 2, name: 'Adventure' },
      { id: 5, name: 'Drama' },
    ],
    studios: [{ id: 1, name: 'Madhouse' }],
  },
  {
    id: 2,
    title: 'Vinland Saga Season 2',
    status: 'COMPLETED',
    rating: 10,
    progress: 24,
    total_episodes: 24,
    start_date: '2025-12-01',
    finish_date: '2026-01-10',
    notes:
      '"You have no enemies." The farmland arc demonstrates that true strength is not the capacity for violence, but the resilience to atone, build soil, and protect life without taking another. True freedom begins when hatred is abandoned.',
    created_at: '2025-12-01T08:00:00Z',
    genres: [
      { id: 5, name: 'Drama' },
      { id: 8, name: 'History' },
      { id: 7, name: 'Philosophy' },
    ],
    studios: [{ id: 3, name: 'MAPPA' }],
  },
  {
    id: 3,
    title: 'Steins;Gate',
    status: 'COMPLETED',
    rating: 9,
    progress: 24,
    total_episodes: 24,
    start_date: '2024-05-01',
    finish_date: '2024-05-18',
    notes:
      'Consequences of obsession and the weight of bearing sole memory of multiple timelines. The importance of sacrifice and unwavering loyalty to friends.',
    created_at: '2024-05-01T14:30:00Z',
    genres: [
      { id: 3, name: 'Sci-Fi' },
      { id: 4, name: 'Psychological' },
      { id: 5, name: 'Drama' },
    ],
    studios: [{ id: 4, name: 'White Fox' }],
  },
  {
    id: 4,
    title: 'Mob Psycho 100 III',
    status: 'WATCHING',
    rating: 9,
    progress: 9,
    total_episodes: 12,
    start_date: '2026-08-01',
    finish_date: null,
    notes:
      'Kindness is not weakness. Special talents do not make anyone inherently better than others; emotional maturity and empathy are the real virtues worth cultivating.',
    created_at: '2026-08-01T10:00:00Z',
    genres: [
      { id: 4, name: 'Psychological' },
      { id: 5, name: 'Drama' },
      { id: 6, name: 'Slice of Life' },
    ],
    studios: [{ id: 6, name: 'Bones' }],
  },
  {
    id: 5,
    title: 'March Comes In Like a Lion Season 2',
    status: 'PLAN_TO_WATCH',
    rating: null,
    progress: 0,
    total_episodes: 22,
    start_date: null,
    finish_date: null,
    notes: 'Heard this covers the bullying resolution arc and deep reflections on warmth amidst isolation.',
    created_at: '2026-08-10T11:00:00Z',
    genres: [
      { id: 5, name: 'Drama' },
      { id: 6, name: 'Slice of Life' },
    ],
    studios: [{ id: 5, name: 'Kyoto Animation' }],
  },
];

export const INITIAL_REWATCHES: Rewatch[] = [
  {
    id: 1,
    anime: 3,
    anime_title: 'Steins;Gate',
    start_date: '2026-02-10',
    finish_date: '2026-02-18',
    rating: 10,
    notes:
      "Second pass hit far harder knowing Okabe's eventual despair from the opening episode. The subtle foreshadowing in Kurisu's early dialogues made the whole sacrifice arc unforgettable.",
  },
  {
    id: 2,
    anime: 1,
    anime_title: "Frieren: Beyond Journey's End",
    start_date: '2026-04-01',
    finish_date: '2026-04-12',
    rating: 10,
    notes:
      "Rewatching with a slower mindset. Paying close attention to how Himmel's words guide Frieren's quiet patience with Fern and Stark.",
  },
];

export const INITIAL_CHARACTERS: FavoriteCharacter[] = [
  {
    id: 1,
    anime: 1,
    anime_title: "Frieren: Beyond Journey's End",
    name: 'Himmel the Hero',
    why:
      'He never took for granted that life is short. He deliberately erected statues not out of narcissism, but so Frieren would never feel lonely when everyone else was gone.',
  },
  {
    id: 2,
    anime: 2,
    anime_title: 'Vinland Saga Season 2',
    name: 'Thorfinn',
    why:
      'His transformation from a creature consumed by revenge to a peaceful farmer seeking to create a land without swords is one of the most honest depictions of atonement.',
  },
  {
    id: 3,
    anime: 4,
    anime_title: 'Mob Psycho 100 III',
    name: 'Arataka Reigen',
    why:
      'Despite being a con artist on the surface, his core mentorship toward Mob is deeply empathetic and grounded in protecting a child from being exploited.',
  },
];

export const INITIAL_BOOKS: Book[] = [
  {
    id: 1,
    title: 'Dune',
    author: 'Frank Herbert',
    status: 'COMPLETED',
    rating: 9,
    progress: 688,
    total_pages: 688,
    start_date: '2025-06-01',
    finish_date: '2025-07-15',
    notes:
      'A masterclass warning against messianic leaders. Charisma combined with ecological and religious dogmatism creates uncontrollable momentum that sweeps even well-intentioned heroes into tragedy.',
    created_at: '2025-06-01T12:00:00Z',
    genres: [
      { id: 3, name: 'Sci-Fi' },
      { id: 7, name: 'Philosophy' },
    ],
  },
  {
    id: 2,
    title: 'Atomic Habits',
    author: 'James Clear',
    status: 'COMPLETED',
    rating: 8,
    progress: 320,
    total_pages: 320,
    start_date: '2025-08-01',
    finish_date: '2025-08-14',
    notes:
      'You do not rise to the level of your goals; you fall to the level of your systems. Small 1% compounding daily adjustments beat sporadic bursts of willpower every single time.',
    created_at: '2025-08-01T09:00:00Z',
    genres: [
      { id: 4, name: 'Psychological' },
      { id: 7, name: 'Philosophy' },
    ],
  },
  {
    id: 3,
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    status: 'READING',
    rating: 9,
    progress: 185,
    total_pages: 303,
    start_date: '2026-08-10',
    finish_date: null,
    notes:
      'Exploration of loneliness, sacrifice, and the unique human essence from an artificial friend\'s observant and gentle viewpoint. Is the human heart something that can truly be replicated?',
    created_at: '2026-08-10T14:00:00Z',
    genres: [
      { id: 3, name: 'Sci-Fi' },
      { id: 5, name: 'Drama' },
      { id: 7, name: 'Philosophy' },
    ],
  },
  {
    id: 4,
    title: 'Meditations',
    author: 'Marcus Aurelius',
    status: 'PLAN_TO_READ',
    rating: null,
    progress: 0,
    total_pages: 254,
    start_date: null,
    finish_date: null,
    notes: 'Personal journal of Roman Emperor on stoicism, duty, and maintaining mental equilibrium in turmoil.',
    created_at: '2026-08-15T10:00:00Z',
    genres: [{ id: 7, name: 'Philosophy' }],
  },
];
