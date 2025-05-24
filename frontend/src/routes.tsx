import { createRootRoute, createRoute } from '@tanstack/react-router';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';

const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

export const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
]); 