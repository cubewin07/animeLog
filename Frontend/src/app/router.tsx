import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import {
  AnimePage,
  BookPage,
  BooksPage,
  CharactersPage,
  FranchisePage,
  HomePage,
  MediaPage,
  PageNotFound,
  ReflectionsPage,
  RewatchesPage,
} from './pages';

const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/anime', element: <AnimePage /> },
      { path: '/anime/:seriesId', element: <FranchisePage /> },
      { path: '/books', element: <BooksPage /> },
      { path: '/books/:bookId', element: <BookPage /> },
      { path: '/reflections', element: <ReflectionsPage /> },
      { path: '/characters', element: <CharactersPage /> },
      { path: '/rewatches', element: <RewatchesPage /> },
      { path: '/media', element: <MediaPage /> },
      { path: '*', element: <PageNotFound /> },
    ],
  },
];

// Dev-only preview of the Keyframe design. Excluded from production builds.
if (import.meta.env.DEV) {
  const StyleGuidePage = lazy(() => import('../features/style-guide/StyleGuidePage'));
  routes.unshift({
    path: '/__style',
    element: (
      <Suspense fallback={null}>
        <StyleGuidePage />
      </Suspense>
    ),
  });
}

export const router = createBrowserRouter(routes);
