import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  ScanEye,
  Loader2,
} from "lucide-react";

/* ── Types ── */

interface Product {
  id: number;
  image: string | null;
  brand: string;
  name: string;
  source: string;
  lastUpdate: string;
  hasEmbedding: boolean;
}

/* ── Mock data ── */

const allProducts: Product[] = [
  { id: 1, image: null, brand: "Chrome Hearts", name: "Chrome Hearts Levi's Blue & Black Cross Patch Jeans", source: "Savonches", lastUpdate: "2026-02-26 15:03", hasEmbedding: true },
  { id: 2, image: null, brand: "Chrome Hearts", name: "Chrome Hearts Nike White & Silver Air Force 1 Sneakers", source: "Savonches", lastUpdate: "2026-02-26 15:03", hasEmbedding: true },
  { id: 3, image: null, brand: "Chrome Hearts", name: "Chrome Hearts Blue Jeans", source: "Savonches", lastUpdate: "2026-02-26 15:03", hasEmbedding: true },
  { id: 4, image: null, brand: "Chrome Hearts", name: "Chrome Hearts Black Multicolor Cross Longsleeve T-Shirt", source: "Savonches", lastUpdate: "2026-02-26 15:03", hasEmbedding: false },
  { id: 5, image: null, brand: "Chrome Hearts", name: "Chrome Hearts Matty Boy Red Form Mesh Jersey T-Shirt", source: "Savonches", lastUpdate: "2026-02-26 15:03", hasEmbedding: true },
  { id: 6, image: null, brand: "Chrome Hearts", name: "Chrome Hearts Black & White T-Bar Logo Thermal Zip Up Hoodie", source: "Savonches", lastUpdate: "2026-02-26 15:03", hasEmbedding: true },
  { id: 7, image: null, brand: "EcoWear", name: "Organic Cotton T-Shirt White", source: "Shopify", lastUpdate: "2026-02-25 10:22", hasEmbedding: true },
  { id: 8, image: null, brand: "EcoWear", name: "Cotton Tee — White — Organic", source: "Shopify", lastUpdate: "2026-02-25 10:22", hasEmbedding: true },
  { id: 9, image: null, brand: "StrideMax", name: "Running Shoe V2 — Black/Red", source: "Shopify", lastUpdate: "2026-02-24 08:45", hasEmbedding: true },
  { id: 10, image: null, brand: "StrideMax", name: "V2 Running Shoes Black Red", source: "Shopify", lastUpdate: "2026-02-24 08:45", hasEmbedding: true },
  { id: 11, image: null, brand: "SoundCore", name: "Wireless Bluetooth Headphones", source: "Shopify", lastUpdate: "2026-02-24 08:45", hasEmbedding: true },
  { id: 12, image: null, brand: "SoundCore", name: "BT Wireless Headphones Over-Ear", source: "Shopify", lastUpdate: "2026-02-24 08:45", hasEmbedding: false },
  { id: 13, image: null, brand: "HydroFlask", name: "Stainless Steel Water Bottle 1L", source: "Shopify", lastUpdate: "2026-02-23 14:11", hasEmbedding: true },
  { id: 14, image: null, brand: "HydroFlask", name: "1L Water Bottle — Steel", source: "Shopify", lastUpdate: "2026-02-23 14:11", hasEmbedding: true },
  { id: 15, image: null, brand: "FemmeStudio", name: "Midi Wrap Dress Floral Print", source: "Shopify", lastUpdate: "2026-02-23 14:11", hasEmbedding: true },
  { id: 16, image: null, brand: "FemmeStudio", name: "Floral Wrap Midi Dress", source: "Shopify", lastUpdate: "2026-02-23 14:11", hasEmbedding: true },
  { id: 17, image: null, brand: "OuterLayer", name: "Puffer Jacket Down Fill — Black", source: "Shopify", lastUpdate: "2026-02-22 09:30", hasEmbedding: true },
  { id: 18, image: null, brand: "OuterLayer", name: "Down Puffer Jacket Black", source: "Shopify", lastUpdate: "2026-02-22 09:30", hasEmbedding: true },
  { id: 19, image: null, brand: "CarryAll", name: "Leather Crossbody Bag — Brown", source: "Shopify", lastUpdate: "2026-02-22 09:30", hasEmbedding: true },
  { id: 20, image: null, brand: "CarryAll", name: "Brown Crossbody Leather Bag", source: "Shopify", lastUpdate: "2026-02-22 09:30", hasEmbedding: false },
];

const ITEMS_PER_PAGE = 8;

/* ── Component ── */

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSource, setFilterSource] = useState<string | null>(null);

  // Image search modal
  const [modalOpen, setModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [imageResults, setImageResults] = useState<Product[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter
  const baseList = imageResults ?? allProducts;
  const filtered = baseList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesSource = filterSource ? p.source === filterSource : true;
    return matchesSearch && matchesSource;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const sources = [...new Set(allProducts.map((p) => p.source))];

  /* ── Image handlers ── */

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setImageResults(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setPreviewUrl(URL.createObjectURL(file));
    setImageResults(null);
  };

  const handleFindSimilar = () => {
    if (!previewUrl) return;
    setIsSearching(true);

    // TODO: POST image to Flask → CLIP encode → cosine similarity → return matches
    setTimeout(() => {
      const mockResults = allProducts
        .filter((p) => p.hasEmbedding)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      setImageResults(mockResults);
      setIsSearching(false);
      setModalOpen(false);
      setCurrentPage(1);
    }, 1500);
  };

  const clearImageSearch = () => {
    setImageResults(null);
    setPreviewUrl(null);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-[22px] font-semibold text-[#FAFAFA] tracking-tight">
          Products
        </h1>
        <p className="text-sm text-[#71717A] mt-1">
          Browse, search, or find similar products by uploading an image
        </p>
      </motion.div>

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#111113] border border-[#1F1F23] rounded-lg px-4 py-2.5">
            <span className="text-[12px] text-[#52525B]">
              {imageResults ? "Results" : "Total Products"}
            </span>
            <span className="ml-2 text-[15px] font-semibold text-[#FAFAFA] font-mono">
              {filtered.length}
            </span>
          </div>

          {!imageResults && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setFilterSource(null); setCurrentPage(1); }}
                className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  !filterSource
                    ? "bg-[#1F1F23] text-[#FAFAFA]"
                    : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B]"
                }`}
              >
                All
              </button>
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setFilterSource(filterSource === s ? null : s);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    filterSource === s
                      ? "bg-[#1F1F23] text-[#FAFAFA]"
                      : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {imageResults && (
            <button
              onClick={clearImageSearch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-[#F87171] bg-[#F87171]/[0.08] hover:bg-[#F87171]/[0.12] transition-colors"
            >
              <X className="w-3 h-3" />
              Clear image search
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3F3F46]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search products..."
              className="pl-9 pr-3 py-2 w-[220px] bg-[#111113] border border-[#1F1F23] rounded-lg text-[13px] text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#27272A] transition-colors"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] transition-colors"
          >
            <ScanEye className="w-3.5 h-3.5" />
            Find by Image
          </motion.button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden"
      >
        <div className="grid grid-cols-[56px_140px_1fr_100px_140px_80px] gap-3 px-4 py-2.5 border-b border-[#1F1F23] text-[11px] font-medium text-[#52525B] uppercase tracking-wider">
          <span>Image</span>
          <span>Brand</span>
          <span>Product Name</span>
          <span>Source</span>
          <span>Last Update</span>
          <span className="text-right">Status</span>
        </div>

        {paginated.length > 0 ? (
          paginated.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.14 + i * 0.03 }}
              className="grid grid-cols-[56px_140px_1fr_100px_140px_80px] gap-3 px-4 py-3 border-b border-[#1F1F23] last:border-b-0 hover:bg-[#18181B] transition-colors items-center"
            >
              <div className="w-10 h-10 rounded-lg bg-[#18181B] border border-[#1F1F23] flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-4 h-4 text-[#27272A]" />
                )}
              </div>
              <span className="text-[13px] text-[#A1A1AA] truncate">{product.brand}</span>
              <span className="text-[13px] text-[#D4D4D8] truncate">{product.name}</span>
              <span className="text-[12px] text-[#52525B]">{product.source}</span>
              <span className="text-[12px] font-mono text-[#3F3F46]">{product.lastUpdate}</span>
              <div className="flex justify-end">
                {product.hasEmbedding ? (
                  <span className="text-[10px] font-medium text-[#34D399] bg-[#34D399]/[0.08] px-2 py-0.5 rounded">Indexed</span>
                ) : (
                  <span className="text-[10px] font-medium text-[#FBBF24] bg-[#FBBF24]/[0.08] px-2 py-0.5 rounded">Pending</span>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="px-4 py-12 text-center">
            <Package className="w-8 h-8 text-[#27272A] mx-auto mb-2" />
            <p className="text-[13px] text-[#52525B]">No products found</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[12px] text-[#3F3F46]">
          Showing {filtered.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}–
          {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-md text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span key={`d-${idx}`} className="px-1.5 text-[12px] text-[#3F3F46]">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item as number)}
                  className={`w-8 h-8 rounded-md text-[12px] font-medium transition-colors ${
                    page === item ? "bg-[#FAFAFA] text-[#09090B]" : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B]"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-md text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          FIND BY IMAGE MODAL
         ══════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-md bg-[#111113] border border-[#1F1F23] rounded-2xl p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#FAFAFA]">
                      Find by Image
                    </h2>
                    <p className="text-[12px] text-[#52525B] mt-0.5">
                      Upload a product photo to find similar items in the catalogue
                    </p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 rounded-md text-[#52525B] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drop / preview zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl cursor-pointer overflow-hidden transition-all ${
                    previewUrl
                      ? "border-[#27272A] bg-[#09090B]"
                      : "border-[#1F1F23] bg-[#09090B] hover:border-[#27272A]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-56 object-contain bg-[#09090B]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <span className="text-[13px] text-white font-medium bg-black/60 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          Tap to change
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 px-4">
                      <div className="p-3 bg-[#18181B] rounded-xl mb-3">
                        <ImagePlus className="w-6 h-6 text-[#52525B]" />
                      </div>
                      <p className="text-[13px] text-[#A1A1AA] text-center">
                        Drop an image here or tap to select
                      </p>
                      <p className="text-[11px] text-[#3F3F46] mt-1">
                        JPG, PNG, WebP supported
                      </p>
                    </div>
                  )}
                </div>

                {/* Explainer */}
                <div className="mt-4 flex items-start gap-2.5 bg-[#18181B]/50 rounded-lg px-3 py-2.5">
                  <ScanEye className="w-3.5 h-3.5 text-[#38BDF8] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-[#52525B] leading-relaxed">
                    Your image is encoded with CLIP and matched against all stored
                    product embeddings using cosine similarity.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5 mt-5">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-[#71717A] bg-[#18181B] border border-[#1F1F23] hover:bg-[#1F1F23] transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleFindSimilar}
                    disabled={!previewUrl || isSearching}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Searching…
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Find Similar
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}