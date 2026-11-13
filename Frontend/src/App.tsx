import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { JournalProvider } from './state/JournalContext';
import { router } from './app/router';

export const App: React.FC = () => (
  <JournalProvider>
    <RouterProvider router={router} />
  </JournalProvider>
);
