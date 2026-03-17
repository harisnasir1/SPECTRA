import { Outlet, NavLink, useNavigate, Navigate } from "react-router";
import { motion } from "framer-motion";
import {
  Layers,
  Upload,
  CircleDot,
  GitMerge,
  BarChart3,
  LogOut,
  PackageSearch
} from "lucide-react";
import { getToken, clearToken } from "../../api";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: Layers },
  { to: "/ingest", label: "Ingest", icon: Upload },
  { to: "/galaxy", label: "Embeddings", icon: CircleDot },
  { to: "/resolve", label: "Resolve", icon: GitMerge },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/products", label: "Products", icon: PackageSearch },
];

export function RootLayout() {
  const navigate = useNavigate();

  if (!getToken()) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#1F1F23] bg-[#09090B]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center group-hover:border-[#3F3F46] transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#FAFAFA]">
              SPIE<span className="text-[#52525B]"> // </span>CORE
            </span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? "text-[#FAFAFA] bg-[#1F1F23]"
                      : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B]"
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Sign out */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { clearToken(); navigate("/"); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] text-[#3F3F46] hover:text-[#71717A] hover:bg-[#18181B] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </motion.button>
        </div>
      </nav>

      {/* Content */}
      <Outlet />
    </div>
  );
}