import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import MainDashboard from "./pages/MainDashboard";
import LumenStation from "./pages/LumenStation";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainDashboard,
  },
  {
    path: "/lumen-station",
    Component: LumenStation,
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