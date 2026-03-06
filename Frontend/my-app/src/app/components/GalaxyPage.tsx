import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, X, Package, Info } from "lucide-react";

/* ── Types ── */

interface DataPoint {
  id: number;
  x: number;
  y: number;
  category: string;
  color: string;
  name: string;
  brand: string;
  isDuplicate: boolean;
}

/* ── Realistic UMAP-style cluster generation ── */

function gaussianRandom(mean: number, stdDev: number): number {
  // Box-Muller transform for gaussian distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function generateClusteredData(): DataPoint[] {
  const clusters = [
    {
      cx: 140,
      cy: 130,
      spread: 38,
      category: "T-Shirts & Tops",
      color: "#38BDF8",
      products: [
        "Organic Cotton Tee",
        "V-Neck Basic Tee",
        "Oversized Graphic Tee",
        "Crew Neck Slim Fit",
        "Striped Long Sleeve",
        "Pocket Tee Relaxed",
        "Henley Button Tee",
        "Linen Blend Top",
        "Crop Top Ribbed",
        "Muscle Fit Tee",
        "Boxy Fit Tee",
        "Mock Neck Top",
        "Raglan Sleeve Tee",
        "Washed Cotton Tee",
        "Jersey Knit Top",
      ],
      brands: ["EcoWear", "BasicCo", "ThreadLine", "UrbanKnit"],
    },
    {
      cx: 620,
      cy: 120,
      spread: 35,
      category: "Footwear",
      color: "#A78BFA",
      products: [
        "Running Shoe V2",
        "Canvas Sneaker Low",
        "Leather Chelsea Boot",
        "Mesh Trainer Pro",
        "Suede Desert Boot",
        "Slip-On Espadrille",
        "Hiking Boot Mid",
        "Platform Sneaker",
        "Loafer Classic",
        "Trail Runner GTX",
        "White Leather Sneaker",
        "Ankle Boot Zip",
        "Knit Sock Runner",
        "Oxford Brogue",
      ],
      brands: ["StrideMax", "SoleCraft", "WalkWell", "BootHaus"],
    },
    {
      cx: 380,
      cy: 420,
      spread: 42,
      category: "Dresses & Skirts",
      color: "#FBBF24",
      products: [
        "Midi Wrap Dress",
        "A-Line Mini Skirt",
        "Maxi Floral Dress",
        "Pleated Midi Skirt",
        "Slip Dress Satin",
        "Shirt Dress Cotton",
        "Bodycon Ribbed Dress",
        "Tennis Skirt White",
        "Tiered Maxi Dress",
        "Denim Mini Skirt",
        "Knit Sweater Dress",
        "Pencil Skirt Wool",
        "Smocked Sundress",
      ],
      brands: ["FemmeStudio", "DressCode", "SilkRoute", "Modeste"],
    },
    {
      cx: 130,
      cy: 460,
      spread: 32,
      category: "Bags & Accessories",
      color: "#F87171",
      products: [
        "Leather Crossbody",
        "Canvas Tote Bag",
        "Mini Backpack",
        "Clutch Evening Bag",
        "Belt Bag Leather",
        "Weekender Duffle",
        "Laptop Sleeve 15in",
        "Straw Beach Bag",
        "Bucket Bag Suede",
        "Card Wallet Slim",
        "Messenger Bag Waxed",
        "Drawstring Pouch",
      ],
      brands: ["CarryAll", "BagSmith", "Herschel", "PackCo"],
    },
    {
      cx: 660,
      cy: 440,
      spread: 34,
      category: "Outerwear",
      color: "#34D399",
      products: [
        "Puffer Jacket Down",
        "Denim Jacket Classic",
        "Trench Coat Belted",
        "Bomber Jacket Nylon",
        "Fleece Zip-Up",
        "Rain Jacket Hooded",
        "Wool Overcoat",
        "Quilted Vest",
        "Windbreaker Light",
        "Shacket Plaid",
        "Parka Winter Long",
        "Blazer Structured",
      ],
      brands: ["OuterLayer", "CoatHaus", "ShellCo", "WarmFront"],
    },
  ];

  const points: DataPoint[] = [];
  let id = 0;

  clusters.forEach((cluster) => {
    const count = cluster.products.length * 3; // ~3 variants per product name
    for (let i = 0; i < count; i++) {
      const productName =
        cluster.products[i % cluster.products.length];
      const brand =
        cluster.brands[Math.floor(Math.random() * cluster.brands.length)];
      const variant = i >= cluster.products.length
        ? ` — ${["Black", "White", "Navy", "Grey", "Red", "Green"][Math.floor(Math.random() * 6)]}`
        : "";

      points.push({
        id: id++,
        x: gaussianRandom(cluster.cx, cluster.spread),
        y: gaussianRandom(cluster.cy, cluster.spread),
        category: cluster.category,
        color: cluster.color,
        name: `${productName}${variant}`,
        brand,
        isDuplicate: Math.random() > 0.75, // ~25% flagged as part of a dup cluster
      });
    }
  });

  // Scatter some outliers between clusters (products that don't fit neatly)
  const outlierNames = [
    "Printed Silk Scarf",
    "Sports Water Bottle",
    "Yoga Mat Premium",
    "Phone Case Leather",
    "Sunglasses Aviator",
    "Watch Strap Nylon",
    "Hat Bucket Terry",
    "Socks Merino 3-Pack",
  ];
  for (let i = 0; i < outlierNames.length; i++) {
    points.push({
      id: id++,
      x: 100 + Math.random() * 600,
      y: 150 + Math.random() * 350,
      category: "Uncategorised",
      color: "#52525B",
      name: outlierNames[i],
      brand: "Various",
      isDuplicate: false,
    });
  }

  return points;
}

/* ── Category config ── */

const categories = [
  { name: "T-Shirts & Tops", color: "#38BDF8" },
  { name: "Footwear", color: "#A78BFA" },
  { name: "Dresses & Skirts", color: "#FBBF24" },
  { name: "Bags & Accessories", color: "#F87171" },
  { name: "Outerwear", color: "#34D399" },
  { name: "Uncategorised", color: "#52525B" },
];

/* ── Component ── */

export function GalaxyPage() {
  const dataPoints = useMemo(() => generateClusteredData(), []);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.3, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-point]")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning)
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="relative h-[calc(100vh-64px)] bg-[#09090B] overflow-hidden">
      {/* ── Canvas ── */}
      <div
        className="absolute inset-0"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.3s ease-out",
          }}
          className="relative w-full h-full"
        >
          {/* Subtle dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]">
            <defs>
              <pattern
                id="dotgrid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="0.8" fill="#A1A1AA" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>

          {/* Data points */}
          {dataPoints.map((point) => {
            const dimmed =
              activeCategory && point.category !== activeCategory;
            return (
              <motion.div
                key={point.id}
                data-point
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: dimmed ? 0.1 : 0.85,
                  scale: 1,
                }}
                transition={{ delay: point.id * 0.0008, duration: 0.25 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoint(point);
                }}
                className="absolute rounded-full cursor-pointer hover:scale-[2.5] transition-transform duration-150"
                style={{
                  width: point.isDuplicate ? 5 : 3,
                  height: point.isDuplicate ? 5 : 3,
                  left: `${(point.x / 800) * 100}%`,
                  top: `${(point.y / 600) * 100}%`,
                  backgroundColor: point.color,
                }}
              />
            );
          })}

          {/* Cluster labels — positioned at cluster centres */}
          {!activeCategory && (
            <>
              <ClusterLabel x={17} y={17} label="T-SHIRTS & TOPS" color="#38BDF8" />
              <ClusterLabel x={76} y={15} label="FOOTWEAR" color="#A78BFA" />
              <ClusterLabel x={46} y={63} label="DRESSES & SKIRTS" color="#FBBF24" />
              <ClusterLabel x={14} y={71} label="BAGS & ACC." color="#F87171" />
              <ClusterLabel x={80} y={68} label="OUTERWEAR" color="#34D399" />
            </>
          )}
        </div>
      </div>

      {/* ── Header overlay ── */}
      <div className="absolute top-5 left-5">
        <h1 className="text-[15px] font-semibold text-[#FAFAFA]">
          Embedding Space
        </h1>
        <p className="text-[11px] text-[#52525B] mt-0.5">
          2D UMAP projection of {dataPoints.length} product vectors — clusters show semantically similar items
        </p>
      </div>

      {/* ── Legend ── */}
      <div className="absolute top-5 right-5 bg-[#111113]/90 backdrop-blur-sm border border-[#1F1F23] rounded-xl p-4 w-52">
        <div className="flex items-center gap-1.5 mb-3">
          <Info className="w-3 h-3 text-[#52525B]" />
          <span className="text-[10px] font-semibold text-[#52525B] uppercase tracking-wider">
            Categories
          </span>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => {
            const count = dataPoints.filter(
              (p) => p.category === cat.name
            ).length;
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() =>
                  setActiveCategory(isActive ? null : cat.name)
                }
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left transition-colors ${
                  isActive ? "bg-[#1F1F23]" : "hover:bg-[#18181B]"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-[12px] text-[#A1A1AA] flex-1">
                  {cat.name}
                </span>
                <span className="text-[10px] font-mono text-[#3F3F46]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Duplicate legend */}
        <div className="mt-3 pt-3 border-t border-[#1F1F23]">
          <div className="flex items-center gap-2 px-2">
            <div className="w-[5px] h-[5px] rounded-full bg-[#71717A]" />
            <span className="text-[11px] text-[#52525B]">
              Larger dot = flagged duplicate
            </span>
          </div>
        </div>
      </div>

      {/* ── Zoom controls ── */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-1.5">
        {[
          { icon: ZoomIn, action: handleZoomIn, label: "Zoom in" },
          { icon: ZoomOut, action: handleZoomOut, label: "Zoom out" },
          { icon: RotateCcw, action: handleReset, label: "Reset" },
        ].map(({ icon: Icon, action, label }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action}
            title={label}
            className="p-2.5 bg-[#111113]/90 backdrop-blur-sm border border-[#1F1F23] rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:border-[#27272A] transition-colors"
          >
            <Icon className="w-4 h-4" />
          </motion.button>
        ))}
      </div>

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-72 h-full bg-[#111113]/95 backdrop-blur-xl border-l border-[#1F1F23] p-5 overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-[13px] font-semibold text-[#FAFAFA]">
                Product Details
              </h3>
              <button
                onClick={() => setSelectedPoint(null)}
                className="p-1 text-[#52525B] hover:text-[#FAFAFA] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image placeholder */}
            <div className="aspect-square bg-[#18181B] border border-[#1F1F23] rounded-xl mb-5 flex items-center justify-center">
              <Package className="w-8 h-8 text-[#27272A]" />
            </div>

            <div className="space-y-4">
              <DetailField label="Name" value={selectedPoint.name} />
              <DetailField label="Brand" value={selectedPoint.brand} />

              <div>
                <label className="text-[10px] text-[#52525B] uppercase tracking-wider block">
                  Category
                </label>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium"
                  style={{
                    backgroundColor: `${selectedPoint.color}15`,
                    color: selectedPoint.color,
                  }}
                >
                  {selectedPoint.category}
                </span>
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase tracking-wider block">
                  UMAP Coordinates
                </label>
                <div className="bg-[#18181B] rounded-lg p-2.5 font-mono text-[11px] text-[#71717A] mt-1">
                  <div>x: {selectedPoint.x.toFixed(4)}</div>
                  <div>y: {selectedPoint.y.toFixed(4)}</div>
                </div>
              </div>

              {selectedPoint.isDuplicate && (
                <div className="bg-[#F87171]/[0.06] border border-[#F87171]/15 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-[#F87171]">
                    Flagged as potential duplicate
                  </span>
                  <p className="text-[10px] text-[#52525B] mt-1">
                    This product is part of a duplicate cluster detected by
                    cosine similarity search.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helper components ── */

function ClusterLabel({
  x,
  y,
  label,
  color,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className="text-[9px] font-mono tracking-[0.15em] opacity-30"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[10px] text-[#52525B] uppercase tracking-wider block">
        {label}
      </label>
      <p className="text-[13px] text-[#D4D4D8] mt-0.5">{value}</p>
    </div>
  );
}