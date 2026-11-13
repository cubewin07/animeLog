import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import {
  AnimePage,
  BookPage,
  BooksPage,
  CharacterPage,
  CharactersPage,
  FindArtPage,
  FranchisePage,
  HomePage,
  JournalPage,
  MePage,
  PageNotFound,
  RecapPage,
  SettingsPage,
} from './pages';

const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/library', element: <Navigate to="/anime" replace /> },
      { path: '/anime', element: <AnimePage /> },
      { path: '/anime/:seriesId', element: <FranchisePage /> },
      { path: '/books', element: <BooksPage /> },
      { path: '/books/:bookId', element: <BookPage /> },
      { path: '/characters', element: <CharactersPage /> },
      { path: '/characters/:characterId', element: <CharacterPage /> },
      { path: '/journal', element: <JournalPage /> },
      { path: '/me', element: <MePage /> },
      { path: '/me/recap/:year', element: <RecapPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/settings/find-art', element: <FindArtPage /> },
      { path: '/reflections', element: <Navigate to="/journal" replace /> },
      { path: '/rewatches', element: <Navigate to="/journal?kind=rewatch" replace /> },
      { path: '/media', element: <Navigate to="/settings" replace /> },
      { path: '*', element: <PageNotFound /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
