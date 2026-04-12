import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitMerge,
  ShieldCheck,
  SkipForward,
  CheckCircle,
  Crown,
  Package,
} from "lucide-react";
import { api, type ApiResolverCluster, type ApiResolverProduct } from "../../api";

/* ── Product card ── */

function ProductCard({
  product,
  isMaster,
  isUnique,
  onSetMaster,
  onToggleUnique,
}: {
  product: ApiResolverProduct;
  isMaster: boolean;
  isUnique: boolean;
  onSetMaster: () => void;
  onToggleUnique: () => void;
}) {
  return (
    <motion.div
      layout
      className={`relative bg-[#111113] border rounded-xl p-4 flex flex-col min-w-[240px] w-[240px] shrink-0 transition-colors duration-200 ${
        isUnique
          ? "border-[#34D399]/20 opacity-50"
          : isMaster
          ? "border-[#FBBF24]/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
          : "border-[#1F1F23]"
      }`}
    >
      {/* Top-right badge */}
      {isUnique ? (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#34D399]/[0.1] text-[#34D399] text-[10px] font-semibold px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-2.5 h-2.5" />
          UNIQUE
        </div>
      ) : isMaster ? (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#FBBF24]/[0.12] text-[#FBBF24] text-[10px] font-semibold px-2 py-0.5 rounded-md">
          <Crown className="w-2.5 h-2.5" />
          MASTER
        </div>
      ) : null}

      {/* Image */}
      <div className="aspect-[4/3] bg-[#18181B] border border-[#1F1F23] rounded-lg overflow-hidden mb-3">
        {product.image ? (
          <img src={product.image} alt="product" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-[#27272A]" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 flex-1">
        <p className={`text-[13px] font-medium leading-snug line-clamp-2 ${isUnique ? "line-through text-[#52525B]" : "text-[#FAFAFA]"}`}>
          {product.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#71717A]">{product.brand}</span>
          <span className="text-[11px] text-[#52525B]">{product.gender}</span>
        </div>
        {product.sku && (
          <p className="text-[11px] font-mono text-[#52525B]">SKU: {product.sku}</p>
        )}
        <p className="text-[11px] text-[#52525B] leading-relaxed line-clamp-2">
          {product.description}
        </p>
        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#18181B] text-[#52525B] border border-[#1F1F23]">
          {product.productType}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2">
        {!isUnique && (
          <button
            onClick={onSetMaster}
            disabled={isMaster}
            className={`w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              isMaster
                ? "bg-[#FBBF24]/[0.1] text-[#FBBF24] border border-[#FBBF24]/20 cursor-default"
                : "bg-[#18181B] text-[#71717A] border border-[#1F1F23] hover:bg-[#1F1F23] hover:text-[#A1A1AA]"
            }`}
          >
            <Crown className="w-3 h-3" />
            {isMaster ? "Master Product" : "Set as Master"}
          </button>
        )}
        <button
          onClick={onToggleUnique}
          className={`w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            isUnique
              ? "bg-[#34D399]/[0.08] text-[#34D399] border border-[#34D399]/20 hover:bg-[#34D399]/[0.15]"
              : "bg-[#18181B] text-[#71717A] border border-[#1F1F23] hover:bg-[#1F1F23] hover:text-[#34D399]"
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          {isUnique ? "Undo Unique" : "Mark Unique"}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main page ── */

export function ResolvePage() {
  const [clusters, setClusters] = useState<ApiResolverCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mergedCount, setMergedCount] = useState(0);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [masterId, setMasterId] = useState<string | null>(null);
  const [markedUniqueIds, setMarkedUniqueIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getDuplicates()
      .then((res) => setClusters(res.clusters))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cluster = clusters[currentIndex];
  const total = clusters.length;
  const isDone = currentIndex >= total;

  const remainingProducts = cluster?.products.filter((p) => !markedUniqueIds.has(p.id)) ?? [];
  const effectiveMaster =
    masterId && !markedUniqueIds.has(masterId)
      ? masterId
      : remainingProducts[0]?.id ?? null;
  const canMerge = remainingProducts.length >= 2;

  const advance = () => {
    setMasterId(null);
    setMarkedUniqueIds(new Set());
    if (currentIndex < total) setCurrentIndex((i) => i + 1);
  };

  const handleToggleUnique = (productId: string) => {
    setMarkedUniqueIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
        if (productId === masterId) setMasterId(null);
      }
      return next;
    });
  };

  const handleMerge = () => {
    console.log("Merge cluster", cluster?.clusterId, "master:", effectiveMaster, "remaining:", remainingProducts.map((p) => p.id));
    setMergedCount((c) => c + 1);
    advance();
  };

  const handleMarkClusterUnique = () => {
    setUniqueCount((c) => c + 1);
    advance();
  };

  const handleSkip = () => {
    setSkippedCount((c) => c + 1);
    advance();
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex items-center justify-center h-64">
        <p className="text-sm text-[#52525B]">Loading clusters…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <p className="text-sm text-[#F87171]">Failed to load: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
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
          Review detected clusters — select a master product, then merge duplicates or mark as unique
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 bg-[#1F1F23] rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-[#38BDF8] rounded-full"
              animate={{ width: total > 0 ? `${(currentIndex / total) * 100}%` : "0%" }}
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
            key={cluster.clusterId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {/* Cluster header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-mono font-semibold text-[#F87171] bg-[#F87171]/[0.08] px-2.5 py-1 rounded-md">
                  Cluster #{cluster.clusterId}
                </span>
                <span className="text-[12px] text-[#52525B]">
                  {cluster.products.length} products
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#52525B]">
                <Crown className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>
                  Master:{" "}
                  <span className="text-[#D4D4D8] font-medium">
                    {cluster.products.find((p) => p.id === effectiveMaster)?.title ?? "—"}
                  </span>
                </span>
              </div>
            </div>

            {/* Scrollable product cards */}
            <div className="overflow-x-auto pb-3 mb-4 -mx-1 px-1">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {cluster.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isMaster={product.id === effectiveMaster}
                    isUnique={markedUniqueIds.has(product.id)}
                    onSetMaster={() => setMasterId(product.id)}
                    onToggleUnique={() => handleToggleUnique(product.id)}
                  />
                ))}
              </div>
            </div>

            {!masterId && remainingProducts.length > 0 && (
              <p className="text-[11px] text-[#52525B] mb-3">
                First product is master by default — click "Set as Master" on any card to change it.
              </p>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileHover={canMerge ? { scale: 1.01 } : {}}
                whileTap={canMerge ? { scale: 0.99 } : {}}
                onClick={canMerge ? handleMerge : undefined}
                title={!canMerge ? "Need at least 2 products to merge" : undefined}
                className={`py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${
                  canMerge
                    ? "bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7]"
                    : "bg-[#18181B] text-[#3F3F46] border border-[#1F1F23] cursor-not-allowed"
                }`}
              >
                <GitMerge className="w-4 h-4" />
                Merge{canMerge ? ` ${remainingProducts.length} Products` : " (need ≥2)"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleMarkClusterUnique}
                className="py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#34D399]/[0.1] text-[#34D399] border border-[#34D399]/20 hover:bg-[#34D399]/[0.15] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                All Unique
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
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex p-4 bg-[#34D399]/[0.08] rounded-2xl mb-4">
              <CheckCircle className="w-10 h-10 text-[#34D399]" />
            </div>
            <h2 className="text-lg font-semibold text-[#FAFAFA] mb-2">
              {total === 0 ? "No Pending Clusters" : "All Clusters Reviewed"}
            </h2>
            <p className="text-sm text-[#71717A] max-w-md mx-auto">
              {total === 0
                ? "There are no pending duplicate clusters to review."
                : `${total} clusters processed — ${mergedCount} merged, ${uniqueCount} unique, ${skippedCount} skipped.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
