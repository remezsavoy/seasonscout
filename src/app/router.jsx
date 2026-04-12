import { createBrowserRouter } from 'react-router-dom';
import { AdminRoute } from '../components/auth/AdminRoute';
import { AppShell } from '../layouts/AppShell';
import { AdminPage } from '../pages/AdminPage';
import { AuthPage } from '../pages/AuthPage';
import { CountryPage } from '../pages/CountryPage';
import { DestinationPage } from '../pages/DestinationPage';
import { ExplorePage } from '../pages/ExplorePage';
import { ExploreCalendar } from '../pages/ExploreCalendar';
import { FavoritesPage } from '../pages/FavoritesPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ReviewsAdminPage } from '../pages/ReviewsAdminPage';
import { UpdatePasswordPage } from '../pages/UpdatePasswordPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'destinations/:slug',
        element: <DestinationPage />,
      },
      {
        path: 'destination/:slug',
        element: <DestinationPage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'explore-calendar',
        element: <ExploreCalendar />,
      },
      {
        path: 'countries/:slug',
        element: <CountryPage />,
      },
      {
        path: 'country/:slug',
        element: <CountryPage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'update-password',
        element: <UpdatePasswordPage />,
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminPage />,
          },
          {
            path: 'admin/reviews',
            element: <ReviewsAdminPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
