import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { NotFoundPage } from './pages/NotFound';
import { RouteError } from './pages/RouteError';
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

const profileRoute = (tab: 'overview' | 'stats' | 'live') => async () => {
  const { ProfilePage } = await import('./pages/Profile');
  return { element: <ProfilePage tab={tab} /> };
};

// Pages other than Home load on demand, keeping the first download small.
const router = createBrowserRouter([
  {
    element: <Layout />,
    hydrateFallbackElement: <div className="min-h-dvh bg-bg" />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/lol/:region/:slug', lazy: profileRoute('overview') },
          { path: '/lol/:region/:slug/live', lazy: profileRoute('live') },
          { path: '/lol/:region/:slug/stats', lazy: profileRoute('stats') },
          { path: '/champions', lazy: async () => ({ Component: (await import('./pages/Champions')).ChampionsPage }) },
          { path: '/champions/:slug', lazy: async () => ({ Component: (await import('./pages/Champion')).ChampionPage }) },
          { path: '/multisearch', lazy: async () => ({ Component: (await import('./pages/MultiSearch')).MultiSearchPage }) },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
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
