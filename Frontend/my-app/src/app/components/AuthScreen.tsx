import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: wire to Flask JWT endpoint
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
      {/* Subtle ambient — not neon, just depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#38BDF8]/[0.03] blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Card */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] mb-4">
              <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            </div>
            <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight mb-1">
              SPIE // CORE
            </h1>
            <p className="text-sm text-[#71717A]">
              {isLogin ? "Sign in to continue" : "Create your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-[#A1A1AA] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-[#FAFAFA] text-sm placeholder-[#3F3F46] focus:outline-none focus:border-[#38BDF8]/50 focus:ring-1 focus:ring-[#38BDF8]/20 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-[#A1A1AA] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-[#FAFAFA] text-sm placeholder-[#3F3F46] focus:outline-none focus:border-[#38BDF8]/50 focus:ring-1 focus:ring-[#38BDF8]/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-[#1F1F23]" />

          {/* Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[13px] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#3F3F46] mt-4">
          Product Deduplication System
        </p>
      </motion.div>
    </div>
  );
}