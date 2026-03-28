import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import MainDashboard from "./pages/MainDashboard";
import MainDashboardEnhanced from "./pages/MainDashboardEnhanced";
import MainDashboard2 from "./pages/MainDashboard2";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainDashboard2,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/admin",
    Component: AdminPanel,
  },
  {
    path: "/settings",
    Component: Settings,
  },
]);