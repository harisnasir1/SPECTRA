import { RouterProvider } from "react-router";
import { router } from "./app/routes";
import "./styles/tailwind.css";
export default function App() {
  return <RouterProvider router={router} />;
}
