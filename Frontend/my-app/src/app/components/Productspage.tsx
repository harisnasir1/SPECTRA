import { useState, useRef, useEffect } from "react";
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
import { api, type ApiProduct } from "../../api";

/* ── Types ── */

interface Product {
  id: string;
  image: string | null;
  brand: string;
  name: string;
  source: string;
  lastUpdate: string;
  hasEmbedding: boolean;
}

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    image: p.images[0]?.url ?? null,
    brand: p.brand,
    name: p.title,
    source: p.productType,
    lastUpdate: new Date(p.createdAt).toLocaleString(),
    hasEmbedding: p.hasEmbedding,
  };
}

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

/* ── Component ── */

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<string[]>([]);

  // Image search modal
  const [modalOpen, setModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [imageResults, setImageResults] = useState<Product[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch filter options once
  useEffect(() => {
    api.getProductFilters()
      .then((res) => setProductTypes(res.productTypes))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getProducts(currentPage, perPage, undefined, filterSource ?? undefined, search || undefined)
      .then((res) => {
        setProducts(res.products.map(toProduct));
        setTotalItems(res.total);
        setTotalPages(res.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentPage, perPage, filterSource, search]);

  // Reset to page 1 when perPage changes
  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearch(pendingSearch);
      setCurrentPage(1);
    }
  };

  const filtered = imageResults ?? products;
  const sources = productTypes;

  const pageStart = (currentPage - 1) * perPage + 1;
  const pageEnd = Math.min(currentPage * perPage, totalItems);

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
    setTimeout(() => {
      setIsSearching(false);
      setModalOpen(false);
    }, 500);
  };

  const clearImageSearch = () => {
    setImageResults(null);
    setPreviewUrl(null);
    setCurrentPage(1);
    setPendingSearch("");
    setSearch("");
  };

  /* ── Pagination helpers ── */

  const goTo = (p: number) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));

  const pageNumbers = (): (number | "...")[] => {
    const result: (number | "...")[] = [];
    const delta = 1;
    let prev = 0;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= delta) {
        if (prev && p - prev > 1) result.push("...");
        result.push(p);
        prev = p;
      }
    }
    return result;
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
              {imageResults ? filtered.length : totalItems}
            </span>
          </div>

          {!imageResults && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-[420px] scrollbar-none">
              <button
                onClick={() => { setFilterSource(null); setCurrentPage(1); }}
                className={`shrink-0 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
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
                  className={`shrink-0 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
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
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search products…"
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
        {/* Column headers */}
        <div className="grid grid-cols-[64px_1fr_160px_120px_160px_90px] gap-3 px-4 py-2.5 border-b border-[#1F1F23] text-[11px] font-medium text-[#52525B] uppercase tracking-wider">
          <span>Image</span>
          <span>Product Name</span>
          <span>Brand</span>
          <span>Source</span>
          <span>Last Update</span>
          <span className="text-right">Status</span>
        </div>

        {loading ? (
          <div className="px-4 py-12 text-center">
            <Loader2 className="w-6 h-6 text-[#52525B] animate-spin mx-auto mb-2" />
            <p className="text-[13px] text-[#52525B]">Loading products…</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.14 + i * 0.02 }}
              className="grid grid-cols-[64px_1fr_160px_120px_160px_90px] gap-3 px-4 py-3 border-b border-[#1F1F23] last:border-b-0 hover:bg-[#18181B] transition-colors items-center"
            >
              {/* Image — leftmost */}
              <div className="w-12 h-12 rounded-lg bg-[#18181B] border border-[#1F1F23] flex items-center justify-center overflow-hidden shrink-0">
                {product.image ? (
                  <img src={product.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-4 h-4 text-[#27272A]" />
                )}
              </div>

              <span className="text-[13px] text-[#D4D4D8] truncate">{product.name}</span>
              <span className="text-[13px] text-[#A1A1AA] truncate">{product.brand}</span>
              <span className="text-[12px] text-[#52525B]">{product.source}</span>
              <span className="text-[12px] font-mono text-[#3F3F46]">{product.lastUpdate}</span>

              <div className="flex justify-end">
                {product.hasEmbedding ? (
                  <span className="text-[10px] font-medium text-[#34D399] bg-[#34D399]/[0.08] px-2 py-0.5 rounded">
                    Indexed
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[#FBBF24] bg-[#FBBF24]/[0.08] px-2 py-0.5 rounded">
                    Pending
                  </span>
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

      {/* Pagination bar */}
      <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
        {/* Left: count + per-page */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#3F3F46]">
            {totalItems > 0 ? `${pageStart}–${pageEnd} of ${totalItems}` : "0 products"}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-[#52525B]">Show</span>
            <div className="flex items-center gap-0.5">
              {PER_PAGE_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => handlePerPageChange(n)}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    perPage === n
                      ? "bg-[#1F1F23] text-[#FAFAFA]"
                      : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: page buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers().map((item, idx) =>
            item === "..." ? (
              <span key={`d-${idx}`} className="px-1.5 text-[12px] text-[#3F3F46]">
                …
              </span>
            ) : (
              <button
                key={item}
                onClick={() => goTo(item as number)}
                className={`w-8 h-8 rounded-md text-[12px] font-medium transition-colors ${
                  currentPage === item
                    ? "bg-[#FAFAFA] text-[#09090B]"
                    : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B]"
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= totalPages}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

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

                <div className="mt-4 flex items-start gap-2.5 bg-[#18181B]/50 rounded-lg px-3 py-2.5">
                  <ScanEye className="w-3.5 h-3.5 text-[#38BDF8] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-[#52525B] leading-relaxed">
                    Your image is encoded with CLIP and matched against all stored
                    product embeddings using cosine similarity.
                  </p>
                </div>

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
