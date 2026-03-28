import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitMerge,
  ShieldCheck,
  SkipForward,
  CheckCircle,
  Crown,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ── Types matching backend response ── */

interface ProductImage {
  id: number;
  priority: number;
  url: string;
}

interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  sku: string;
  description: string;
  images: ProductImage[];
  category: string;
  condition: string;
  conditionGrade: string;
  gender: string;
  productType: string;
  productUrl: string;
  status: string;
  createdAt: string;
}

interface DuplicateCluster {
  id: number;
  productIds: string[];
  products: Product[];
  createdAt: string;
}

/* ── Mock data ── */

const mockClusters: DuplicateCluster[] = [
  {
    id: 1,
    createdAt: "2026-03-13T15:52:10.201613+00:00",
    productIds: ["p1", "p2", "p3", "p4"],
    products: [
      {
        id: "p1",
        title: "Canada Goose Black Carson Men's Jacket",
        brand: "Canada Goose",
        price: 650,
        sku: "CG-001",
        description: "Black color, Canada Goose badge on sleeve, 3 front pockets, concealed zipper closure",
        images: [{ id: 1, priority: 1, url: "https://cdn.shopify.com/s/files/1/0325/9380/5371/files/PhotoJul312025_115058AM.jpg?v=1753991346" }],
        category: "Clothing",
        condition: "Pre-Owned",
        conditionGrade: "Great Condition",
        gender: "Male",
        productType: "Coats & Jackets",
        productUrl: "https://savonches.com/products/canada-goose-black-carson-mens-jacket-13",
        status: "Categorized",
        createdAt: "2025-08-07T15:39:25.859535+00:00",
      },
      {
        id: "p2",
        title: "Canada Goose Carson Parka Black",
        brand: "Canada Goose",
        price: 645,
        sku: "CG-002",
        description: "Men's Carson parka in black, badge on arm, zip closure",
        images: [{ id: 2, priority: 1, url: "https://cdn.shopify.com/s/files/1/0325/9380/5371/files/PhotoJul312025_112716AM.jpg?v=1753991346" }],
        category: "Clothing",
        condition: "Pre-Owned",
        conditionGrade: "Good Condition",
        gender: "Male",
        productType: "Coats & Jackets",
        productUrl: "https://savonches.com/products/canada-goose-carson-parka-black",
        status: "Categorized",
        createdAt: "2025-08-08T10:00:00.000000+00:00",
      },
      {
        id: "p3",
        title: "Canada Goose Black Jacket (Carson)",
        brand: "Canada Goose",
        price: 640,
        sku: "",
        description: "Authentic Canada Goose jacket, black, men's cut",
        images: [],
        category: "Clothing",
        condition: "Pre-Owned",
        conditionGrade: "Great Condition",
        gender: "Male",
        productType: "Coats & Jackets",
        productUrl: "",
        status: "Uncategorized",
        createdAt: "2025-08-09T11:00:00.000000+00:00",
      },
      {
        id: "p4",
        title: "CG Carson Mens Black Down Jacket",
        brand: "Canada Goose",
        price: 655,
        sku: "CG-004",
        description: "Down filled jacket from Canada Goose, black colorway",
        images: [],
        category: "Clothing",
        condition: "Pre-Owned",
        conditionGrade: "Fair Condition",
        gender: "Male",
        productType: "Coats & Jackets",
        productUrl: "",
        status: "Categorized",
        createdAt: "2025-08-10T09:00:00.000000+00:00",
      },
    ],
  },
  {
    id: 2,
    createdAt: "2026-03-13T16:00:00.000000+00:00",
    productIds: ["p5", "p6"],
    products: [
      {
        id: "p5",
        title: "Wireless Bluetooth Headphones",
        brand: "SoundCore",
        price: 79,
        sku: "SC-BT-HP-001",
        description: "Over-ear wireless headphones with noise cancellation",
        images: [],
        category: "Electronics",
        condition: "New",
        conditionGrade: "New",
        gender: "Unisex",
        productType: "Headphones",
        productUrl: "",
        status: "Categorized",
        createdAt: "2025-09-01T10:00:00.000000+00:00",
      },
      {
        id: "p6",
        title: "BT Wireless Headphones Over-Ear",
        brand: "SoundCore",
        price: 79,
        sku: "SC-BT-HP-003",
        description: "Bluetooth over-ear headphones, ANC enabled",
        images: [],
        category: "Electronics",
        condition: "New",
        conditionGrade: "New",
        gender: "Unisex",
        productType: "Headphones",
        productUrl: "",
        status: "Categorized",
        createdAt: "2025-09-02T10:00:00.000000+00:00",
      },
    ],
  },
];


/* ── Image carousel for a product card ── */

function ProductImageCarousel({ images }: { images: ProductImage[] }) {
  const [idx, setIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-[#18181B] border border-[#1F1F23] rounded-lg flex items-center justify-center">
        <Package className="w-8 h-8 text-[#27272A]" />
      </div>
    );
  }

  const sorted = [...images].sort((a, b) => a.priority - b.priority);

  return (
    <div className="aspect-[4/3] bg-[#18181B] border border-[#1F1F23] rounded-lg overflow-hidden relative group">
      <img
        src={sorted[idx].url}
        alt="product"
        className="w-full h-full object-cover"
      />
      {sorted.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + sorted.length) % sorted.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % sorted.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-3 h-3 text-white" />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {sorted.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Single product card ── */

function ProductCard({
  product,
  isMaster,
  isUnique,
  onSetMaster,
  onToggleUnique,
}: {
  product: Product;
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
      {/* Top-right badge: Master or Unique */}
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

      {/* Status badge */}
      <div className="mb-3">
        <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-[#1F1F23] text-[#52525B]">
          {product.status.toUpperCase()}
        </span>
      </div>

      {/* Image */}
      <ProductImageCarousel images={product.images} />

      {/* Details */}
      <div className="mt-3 space-y-2 flex-1">
        <p className={`text-[13px] font-medium leading-snug line-clamp-2 ${isUnique ? "line-through text-[#52525B]" : "text-[#FAFAFA]"}`}>
          {product.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#71717A]">{product.brand}</span>
          <span className="text-[13px] font-semibold text-[#D4D4D8]">${product.price}</span>
        </div>
        {product.sku && (
          <p className="text-[11px] font-mono text-[#52525B]">SKU: {product.sku}</p>
        )}
        <p className="text-[11px] text-[#52525B] leading-relaxed line-clamp-2">
          {product.description}
        </p>
        <div className="flex gap-2 flex-wrap pt-0.5">
          <Tag value={product.condition} />
          <Tag value={product.conditionGrade} />
          {product.gender !== "Unisex" && <Tag value={product.gender} />}
        </div>
      </div>

      {/* Card action buttons */}
      <div className="mt-4 flex flex-col gap-2">
        {/* Set master — hidden when unique */}
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

        {/* Mark unique / Undo */}
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

function Tag({ value }: { value: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181B] text-[#52525B] border border-[#1F1F23]">
      {value}
    </span>
  );
}

/* ── Main page ── */

export function ResolvePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mergedCount, setMergedCount] = useState(0);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [masterId, setMasterId] = useState<string | null>(null);
  const [markedUniqueIds, setMarkedUniqueIds] = useState<Set<string>>(new Set());

  const cluster = mockClusters[currentIndex];
  const total = mockClusters.length;
  const isDone = currentIndex >= total;

  const remainingProducts = cluster?.products.filter((p) => !markedUniqueIds.has(p.id)) ?? [];

  // Master is the explicit choice if still in remaining, otherwise first remaining product
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
        // If the explicit master is being marked unique, clear it so effectiveMaster auto-picks next
        if (productId === masterId) setMasterId(null);
      }
      return next;
    });
  };

  const handleMerge = () => {
    console.log("Merge cluster", cluster?.id, "with master:", effectiveMaster, "remaining:", remainingProducts.map((p) => p.id));
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
            {/* Cluster header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-mono font-semibold text-[#F87171] bg-[#F87171]/[0.08] px-2.5 py-1 rounded-md">
                  Cluster #{cluster.id}
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

            {/* Hint */}
            {!masterId && remainingProducts.length > 0 && (
              <p className="text-[11px] text-[#52525B] mb-3">
                First product is master by default — click "Set as Master" on any card to change it.
              </p>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              {/* Merge */}
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

              {/* Mark cluster unique */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleMarkClusterUnique}
                className="py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#34D399]/[0.1] text-[#34D399] border border-[#34D399]/20 hover:bg-[#34D399]/[0.15] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                All Unique
              </motion.button>

              {/* Skip */}
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
          /* Done state */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex p-4 bg-[#34D399]/[0.08] rounded-2xl mb-4">
              <CheckCircle className="w-10 h-10 text-[#34D399]" />
            </div>
            <h2 className="text-lg font-semibold text-[#FAFAFA] mb-2">All Clusters Reviewed</h2>
            <p className="text-sm text-[#71717A] max-w-md mx-auto">
              {total} clusters processed — {mergedCount} merged, {uniqueCount} unique,{" "}
              {skippedCount} skipped.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
