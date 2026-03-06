import { motion } from "framer-motion";
import { Package, AlertTriangle, CheckCircle, Layers, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

// Mock stats — replace with API data
const stats = [
  {
    label: "Total Products",
    value: "14,231",
    sub: "Ingested from Shopify",
    icon: Package,
    accent: "#38BDF8",
  },
  {
    label: "Duplicate Clusters",
    value: "342",
    sub: "Pending review",
    icon: AlertTriangle,
    accent: "#F87171",
  },
  {
    label: "Resolved",
    value: "1,105",
    sub: "Merged or marked unique",
    icon: CheckCircle,
    accent: "#34D399",
  },
  {
    label: "Embeddings",
    value: "14,231",
    sub: "CLIP vectors stored",
    icon: Layers,
    accent: "#A78BFA",
  },
];

// Recent clusters — replace with API data
const recentClusters = [
  {
    id: 1,
    productA: "Organic Cotton T-Shirt (White)",
    productB: "Cotton Tee — White — Organic",
    similarity: 96.4,
  },
  {
    id: 2,
    productA: "Wireless Bluetooth Headphones",
    productB: "BT Wireless Headphones Over-Ear",
    similarity: 93.1,
  },
  {
    id: 3,
    productA: "Running Shoe V2 — Black/Red",
    productB: "V2 Running Shoes Black Red",
    similarity: 97.8,
  },
  {
    id: 4,
    productA: "Stainless Steel Water Bottle 1L",
    productB: "1L Water Bottle — Steel",
    similarity: 91.2,
  },
  {
    id: 5,
    productA: "Leather Crossbody Bag — Brown",
    productB: "Brown Crossbody Leather Bag",
    similarity: 98.1,
  },
];

function getSimilarityColor(score: number) {
  if (score >= 95) return "#F87171";
  if (score >= 90) return "#FBBF24";
  return "#34D399";
}

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-[22px] font-semibold text-[#FAFAFA] tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-[#71717A] mt-1">
          Product deduplication overview
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 hover:border-[#27272A] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: `${stat.accent}12` }}
            >
              <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
            </div>
            <div className="text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              {stat.value}
            </div>
            <div className="text-[13px] text-[#71717A] mt-0.5">{stat.label}</div>
            <div className="text-[11px] text-[#3F3F46] mt-1">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Duplicate Clusters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#FAFAFA]">
              Recent Duplicate Clusters
            </h2>
            <p className="text-[12px] text-[#52525B] mt-0.5">
              Detected via CLIP image + text embedding similarity
            </p>
          </div>
          <button
            onClick={() => navigate("/resolve")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#38BDF8] bg-[#38BDF8]/[0.08] hover:bg-[#38BDF8]/[0.12] transition-colors"
          >
            Resolve All
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[48px_1fr_1fr_80px_40px] gap-4 px-4 py-2.5 border-b border-[#1F1F23] text-[11px] font-medium text-[#52525B] uppercase tracking-wider">
            <span>#</span>
            <span>Product A</span>
            <span>Product B</span>
            <span className="text-right">Score</span>
            <span />
          </div>

          {/* Rows */}
          {recentClusters.map((cluster, i) => (
            <motion.div
              key={cluster.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.04 }}
              onClick={() => navigate("/resolve")}
              className="grid grid-cols-[48px_1fr_1fr_80px_40px] gap-4 px-4 py-3 border-b border-[#1F1F23] last:border-b-0 hover:bg-[#18181B] cursor-pointer transition-colors items-center"
            >
              <span className="text-[12px] font-mono text-[#52525B]">
                {String(cluster.id).padStart(2, "0")}
              </span>
              <span className="text-[13px] text-[#D4D4D8] truncate">
                {cluster.productA}
              </span>
              <span className="text-[13px] text-[#D4D4D8] truncate">
                {cluster.productB}
              </span>
              <div className="text-right">
                <span
                  className="text-[13px] font-mono font-semibold"
                  style={{ color: getSimilarityColor(cluster.similarity) }}
                >
                  {cluster.similarity}%
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#3F3F46]" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}