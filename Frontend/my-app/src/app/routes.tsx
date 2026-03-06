import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { IngestPage } from "./components/IngestPage";
import { GalaxyPage } from "./components/GalaxyPage";
import { ResolvePage } from "./components/ResolvePage";
import { ReportsPage } from "./components/ReportsPage";
import { ProductsPage } from "./components/Productspage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthScreen />,
  },
  {
    element: <RootLayout />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/ingest",
        element: <IngestPage />,
      },
      {
        path: "/galaxy",
        element: <GalaxyPage />,
      },
      {
        path: "/resolve",
        element: <ResolvePage />,
      },
      {
        path: "/reports",
        element: <ReportsPage />,
      },
      { path: "/products",
         element: <ProductsPage /> },
    ],
  },
]);
