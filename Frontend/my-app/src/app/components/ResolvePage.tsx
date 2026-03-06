import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitMerge, ShieldCheck, SkipForward, CheckCircle } from "lucide-react";

interface Product {
  name: string;
  brand: string;
  price: string;
  sku: string;
  description: string;
}

interface DuplicateCluster {
  id: number;
  products: Product[];
  similarity: number;
}

// Mock clusters — replace with API data
const mockClusters: DuplicateCluster[] = [
  {
    id: 1,
    products: [
      {
        name: "Organic Cotton T-Shirt (White)",
        brand: "EcoWear",
        price: "$29.99",
        sku: "ECO-CT-WHT-001",
        description: "100% organic cotton tee, breathable and lightweight",
      },
      {
        name: "Cotton Tee — White — Organic",
        brand: "EcoWear",
        price: "$29.99",
        sku: "ECO-CT-WHT-002",
        description: "Organic cotton t-shirt in white, soft and comfortable",
      },
    ],
    similarity: 96.4,
  },
  {
    id: 2,
    products: [
      {
        name: "Wireless Bluetooth Headphones",
        brand: "SoundCore",
        price: "$79.99",
        sku: "SC-BT-HP-001",
        description: "Over-ear wireless headphones with noise cancellation",
      },
      {
        name: "BT Wireless Headphones Over-Ear",
        brand: "SoundCore",
        price: "$79.99",
        sku: "SC-BT-HP-003",
        description: "Bluetooth over-ear headphones, ANC enabled",
      },
    ],
    similarity: 93.1,
  },
  {
    id: 3,
    products: [
      {
        name: "Running Shoe V2 — Black/Red",
        brand: "StrideMax",
        price: "$124.99",
        sku: "SM-RS-V2-BR",
        description: "Lightweight running shoe with responsive foam cushion",
      },
      {
        name: "V2 Running Shoes Black Red",
        brand: "StrideMax",
        price: "$124.99",
        sku: "SM-RS-V2-BR2",
        description: "Performance running shoes, foam midsole, black/red",
      },
      {
        name: "StrideMax V2 Runner (Black/Red)",
        brand: "StrideMax",
        price: "$124.99",
        sku: "SM-RS-V2-003",
        description: "V2 running shoe — lightweight, cushioned, black & red",
      },
    ],
    similarity: 97.8,
  },
  {
    id: 4,
    products: [
      {
        name: "Stainless Steel Water Bottle 1L",
        brand: "HydroFlask",
        price: "$34.99",
        sku: "HF-WB-SS-1L",
        description: "Double-walled stainless steel, vacuum insulated, 1 litre",
      },
      {
        name: "1L Water Bottle — Steel",
        brand: "HydroFlask",
        price: "$34.99",
        sku: "HF-WB-SS-1L-V2",
        description: "Insulated steel water bottle, keeps cold 24hrs, 1L",
      },
    ],
    similarity: 91.2,
  },
];

function getSimilarityColor(score: number) {
  if (score >= 95) return "#F87171";
  if (score >= 90) return "#FBBF24";
  return "#34D399";
}

export function ResolvePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mergedCount, setMergedCount] = useState(0);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const cluster = mockClusters[currentIndex];
  const total = mockClusters.length;
  const isDone = currentIndex >= total;

  const advance = () => {
    if (currentIndex < total) setCurrentIndex((i) => i + 1);
  };

  const handleMerge = () => {
    setMergedCount((c) => c + 1);
    advance();
  };

  const handleMarkUnique = () => {
    setUniqueCount((c) => c + 1);
    advance();
  };

  const handleSkip = () => {
    setSkippedCount((c) => c + 1);
    advance();
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-[22px] font-semibold text-[#FAFAFA] tracking-tight">
          Resolve Duplicates
        </h1>
        <p className="text-sm text-[#71717A] mt-1">
          Review detected clusters — merge duplicates or mark as unique products
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 bg-[#1F1F23] rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-[#38BDF8] rounded-full"
              animate={{ width: `${(currentIndex / total) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs text-[#52525B] font-mono min-w-[50px] text-right">
            {currentIndex}/{total}
          </span>
        </div>
        <div className="flex gap-5">
          <span className="text-[12px] text-[#52525B]">
            <span className="text-[#38BDF8] font-mono font-semibold">{mergedCount}</span> merged
          </span>
          <span className="text-[12px] text-[#52525B]">
            <span className="text-[#34D399] font-mono font-semibold">{uniqueCount}</span> unique
          </span>
          <span className="text-[12px] text-[#52525B]">
            <span className="text-[#71717A] font-mono font-semibold">{skippedCount}</span> skipped
          </span>
        </div>
      </motion.div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {!isDone && cluster ? (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {/* Cluster header bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-mono font-semibold text-[#F87171] bg-[#F87171]/[0.08] px-2.5 py-1 rounded-md">
                  Cluster #{cluster.id}
                </span>
                <span className="text-[12px] text-[#52525B]">
                  {cluster.products.length} products
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-20 h-1.5 rounded-full bg-[#1F1F23] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cluster.similarity}%`,
                      backgroundColor: getSimilarityColor(cluster.similarity),
                    }}
                  />
                </div>
                <span
                  className="text-[13px] font-mono font-semibold"
                  style={{ color: getSimilarityColor(cluster.similarity) }}
                >
                  {cluster.similarity}%
                </span>
              </div>
            </div>

            {/* Product cards */}
            <div
              className={`grid gap-3 mb-5 ${
                cluster.products.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {cluster.products.map((product, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`bg-[#111113] border rounded-xl p-5 ${
                    idx === 0
                      ? "border-[#38BDF8]/25"
                      : "border-[#1F1F23]"
                  }`}
                >
                  {/* Badge */}
                  <div className="mb-3">
                    <span
                      className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded ${
                        idx === 0
                          ? "bg-[#38BDF8]/[0.1] text-[#38BDF8]"
                          : "bg-[#F87171]/[0.08] text-[#F87171]"
                      }`}
                    >
                      {idx === 0 ? "PRIMARY" : `DUPLICATE ${idx}`}
                    </span>
                  </div>

                  {/* Image placeholder */}
                  <div className="aspect-[4/3] bg-[#18181B] border border-[#1F1F23] rounded-lg mb-4 flex items-center justify-center">
                    <Package className="w-8 h-8 text-[#27272A]" />
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5">
                    <Field label="Name" value={product.name} />
                    <Field label="Brand" value={product.brand} />
                    <Field
                      label="Description"
                      value={product.description}
                      small
                    />
                    <div className="flex gap-3">
                      <Field label="Price" value={product.price} half />
                      <Field label="SKU" value={product.sku} half mono />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleMerge}
                className="py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] transition-colors"
              >
                <GitMerge className="w-4 h-4" />
                Merge Duplicates
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleMarkUnique}
                className="py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#34D399]/[0.1] text-[#34D399] border border-[#34D399]/20 hover:bg-[#34D399]/[0.15] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Mark Unique
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSkip}
                className="py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#18181B] text-[#71717A] border border-[#1F1F23] hover:bg-[#1F1F23] hover:text-[#A1A1AA] transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* All done state */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex p-4 bg-[#34D399]/[0.08] rounded-2xl mb-4">
              <CheckCircle className="w-10 h-10 text-[#34D399]" />
            </div>
            <h2 className="text-lg font-semibold text-[#FAFAFA] mb-2">
              All Clusters Reviewed
            </h2>
            <p className="text-sm text-[#71717A] max-w-md mx-auto">
              {total} clusters processed — {mergedCount} merged, {uniqueCount} unique, {skippedCount} skipped.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helper components ── */

import { Package } from "lucide-react";

function Field({
  label,
  value,
  small,
  half,
  mono,
}: {
  label: string;
  value: string;
  small?: boolean;
  half?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={half ? "flex-1" : ""}>
      <label className="text-[10px] text-[#52525B] uppercase tracking-wider block">
        {label}
      </label>
      <p
        className={`mt-0.5 ${
          small
            ? "text-[12px] text-[#71717A] leading-relaxed"
            : "text-[13px] text-[#D4D4D8]"
        } ${mono ? "font-mono text-[12px]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}