import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import MainDashboard from "./pages/MainDashboard";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
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