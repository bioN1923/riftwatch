import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { ProfilePage } from './pages/Profile';
import { NotFoundPage } from './pages/NotFound';
import { ChampionsPage } from './pages/Champions';
import { ChampionPage } from './pages/Champion';
import { ApiClientError } from './lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000,
      // Don't retry answers that won't change (not found, bad key, bad input).
      retry: (count, err) => !(err instanceof ApiClientError && [400, 404, 502].includes(err.status) && err.code !== 'UPSTREAM') && count < 1,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/lol/:region/:slug', element: <ProfilePage tab="overview" /> },
      { path: '/lol/:region/:slug/live', element: <ProfilePage tab="live" /> },
      { path: '/champions', element: <ChampionsPage /> },
      { path: '/champions/:slug', element: <ChampionPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
