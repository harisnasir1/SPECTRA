import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Play,
  X,
  GitMerge,
} from "lucide-react";
import { api } from "../../api";

/* ── CSV spec ── */

const REQUIRED_COLUMNS = [
  "title",
  "brand",
  "description",
  "price",
  "category",
  "gender",
  "product_url",
  "product_type",
  "condition",
  "image",
] as const;

const OPTIONAL_COLUMNS = ["sku", "condition_grade", "extra_images", "variants"] as const;

// variants column format: size:sku:price:in_stock  pipe-separated for multiple
// e.g.  S:CG-S:650:true|M:CG-M:650:true|L:CG-L:660:false
const TEMPLATE_CSV = [
  [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(","),
  [
    "Canada Goose Black Carson Men's Jacket",
    "Canada Goose",
    "Black down jacket with badge on sleeve",
    "650",
    "Clothing",
    "Male",
    "https://example.com/product/1",
    "Coats & Jackets",
    "Pre-Owned",
    "CG-001",
    "Great Condition",
    "https://cdn.example.com/image1.jpg",
    "https://cdn.example.com/image2.jpg|https://cdn.example.com/image3.jpg",
    "S:CG-S:650:true|M:CG-M:650:true|L:CG-L:660:false",
  ].join(","),
].join("\n");

/* ── Types ── */

type ParsedProduct = Record<string, string>;

interface ParseResult {
  valid: ParsedProduct[];
  invalid: { row: number; missing: string[] }[];
}

interface IngestResult {
  inserted: number;
  skipped: number;
  new_clusters: number;
}

/* ── CSV parser (handles quoted fields) ── */

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(field);
        field = "";
      } else {
        field += ch;
      }
    }
    fields.push(field);
    rows.push(fields);
  }
  return rows;
}

function validateCSV(text: string): ParseResult {
  const rows = parseCSV(text);
  if (rows.length < 2) return { valid: [], invalid: [] };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const valid: ParsedProduct[] = [];
  const invalid: { row: number; missing: string[] }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const product: ParsedProduct = {};
    headers.forEach((h, idx) => {
      product[h] = (cells[idx] ?? "").trim();
    });

    const missing = REQUIRED_COLUMNS.filter((col) => !product[col]);
    if (missing.length > 0) {
      invalid.push({ row: i + 1, missing });
    } else {
      valid.push(product);
    }
  }

  return { valid, invalid };
}

function toApiPayload(product: ParsedProduct) {
  const extraImages = product.extra_images
    ? product.extra_images.split("|").map((u) => u.trim()).filter(Boolean)
    : [];

  const variants = product.variants
    ? product.variants
        .split("|")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => {
          const [size, sku, price, in_stock] = v.split(":");
          return { size, sku, price: Number(price), in_stock: in_stock?.toLowerCase() === "true" };
        })
        .filter((v) => v.size && v.sku && !isNaN(v.price))
    : [];

  return {
    title: product.title,
    brand: product.brand,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    gender: product.gender,
    product_url: product.product_url,
    product_type: product.product_type,
    condition: product.condition,
    sku: product.sku || undefined,
    condition_grade: product.condition_grade || undefined,
    image: product.image,
    extra_images: extraImages,
    variants,
  };
}

/* ── Component ── */

export function IngestPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [stage, setStage] = useState<"idle" | "preview" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readAndParse = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = validateCSV(text);
      setFile(f);
      setParsed(result);
      setStage("preview");
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) readAndParse(dropped);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) readAndParse(selected);
  };

  const handleReset = () => {
    setFile(null);
    setParsed(null);
    setStage("idle");
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!parsed || parsed.valid.length === 0) return;
    setStage("uploading");
    setErrorMsg(null);
    try {
      const payload = parsed.valid.map(toApiPayload);
        const res = await api.ingestProducts(payload);
        setResult({ inserted: res.inserted, skipped: res.skipped, new_clusters: res.new_clusters });
        setStage("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStage("error");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[860px] mx-auto px-6 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-[22px] font-semibold text-[#FAFAFA] tracking-tight">Data Ingest</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Upload a CSV of products — we validate, embed, and check for duplicates automatically
        </p>
      </motion.div>

      {/* CSV format spec + template download */}
      {stage === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-[#FAFAFA]">Expected CSV Format</h3>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-[11px] text-[#38BDF8] hover:text-[#7DD3FC] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {REQUIRED_COLUMNS.map((col) => (
              <span
                key={col}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F87171]/[0.08] text-[#F87171] border border-[#F87171]/15"
              >
                {col}
                <span className="ml-1 text-[#F87171]/50">*</span>
              </span>
            ))}
            {OPTIONAL_COLUMNS.map((col) => (
              <span
                key={col}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-[#52525B] border border-[#1F1F23]"
              >
                {col}
              </span>
            ))}
          </div>

          <div className="space-y-1.5 text-[11px] text-[#52525B]">
            <p>
              <span className="text-[#F87171]">*</span> Required fields — rows missing any of these will be rejected
            </p>
            <p>
              <span className="font-mono text-[#71717A]">extra_images</span> — pipe-separated URLs:{" "}
              <span className="font-mono text-[#3F3F46]">https://url1.jpg|https://url2.jpg</span>
            </p>
            <p>
              <span className="font-mono text-[#71717A]">variants</span> — pipe-separated, each as{" "}
              <span className="font-mono text-[#3F3F46]">size:sku:price:in_stock</span>
              {" "}e.g.{" "}
              <span className="font-mono text-[#3F3F46]">S:SKU-S:29.99:true|M:SKU-M:30.99:false</span>
            </p>
            <p>
              <span className="font-mono text-[#71717A]">price</span> — numeric only (e.g.{" "}
              <span className="font-mono text-[#3F3F46]">650</span>)
            </p>
          </div>
        </motion.div>
      )}

      {/* Drop zone */}
      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all ${
              isDragging
                ? "border-[#38BDF8]/50 bg-[#38BDF8]/[0.04]"
                : "border-[#1F1F23] bg-[#111113] hover:border-[#27272A]"
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-[#18181B] rounded-xl">
                <Upload className="w-7 h-7 text-[#52525B]" />
              </div>
              <p className="text-sm text-[#A1A1AA]">Drop your CSV here</p>
              <p className="text-[12px] text-[#3F3F46]">or click to browse</p>
            </div>
          </motion.div>
        )}

        {/* Preview stage */}
        {stage === "preview" && parsed && file && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* File info bar */}
            <div className="flex items-center gap-3 bg-[#111113] border border-[#1F1F23] rounded-xl px-4 py-3">
              <div className="p-1.5 bg-[#38BDF8]/[0.08] rounded-lg">
                <FileText className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#D4D4D8] font-medium truncate">{file.name}</p>
                <p className="text-[11px] text-[#52525B]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={handleReset} className="p-1 hover:bg-[#1F1F23] rounded-lg transition-colors">
                <X className="w-4 h-4 text-[#52525B]" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111113] border border-[#34D399]/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0" />
                <div>
                  <p className="text-[20px] font-semibold text-[#34D399] font-mono leading-none">
                    {parsed.valid.length}
                  </p>
                  <p className="text-[11px] text-[#52525B] mt-0.5">valid rows</p>
                </div>
              </div>
              <div className={`bg-[#111113] border rounded-xl px-4 py-3 flex items-center gap-3 ${
                parsed.invalid.length > 0 ? "border-[#F87171]/20" : "border-[#1F1F23]"
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${parsed.invalid.length > 0 ? "text-[#F87171]" : "text-[#3F3F46]"}`} />
                <div>
                  <p className={`text-[20px] font-semibold font-mono leading-none ${
                    parsed.invalid.length > 0 ? "text-[#F87171]" : "text-[#3F3F46]"
                  }`}>
                    {parsed.invalid.length}
                  </p>
                  <p className="text-[11px] text-[#52525B] mt-0.5">invalid rows (will be skipped)</p>
                </div>
              </div>
            </div>

            {/* Invalid row details */}
            {parsed.invalid.length > 0 && (
              <div className="bg-[#0C0C0E] border border-[#F87171]/10 rounded-xl p-4 max-h-40 overflow-y-auto">
                <p className="text-[11px] text-[#52525B] mb-2 font-semibold uppercase tracking-wider">
                  Skipped rows
                </p>
                <div className="space-y-1">
                  {parsed.invalid.map(({ row, missing }) => (
                    <div key={row} className="flex gap-2 text-[11px] font-mono">
                      <span className="text-[#3F3F46] min-w-[50px]">Row {row}</span>
                      <span className="text-[#F87171]">missing: {missing.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            {parsed.valid.length > 0 ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleUpload}
                className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] transition-colors"
              >
                <Play className="w-4 h-4" />
                Upload {parsed.valid.length} Products
              </motion.button>
            ) : (
              <div className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#18181B] text-[#3F3F46] border border-[#1F1F23]">
                No valid products to upload
              </div>
            )}
          </motion.div>
        )}

        {/* Uploading */}
        {stage === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#111113] border border-[#1F1F23] rounded-xl p-10 flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-[#38BDF8]/30 border-t-[#38BDF8] rounded-full"
            />
            <div className="text-center">
              <p className="text-[13px] text-[#D4D4D8] font-medium">Processing products</p>
              <p className="text-[11px] text-[#52525B] mt-1">
                Generating CLIP embeddings and detecting duplicates…
              </p>
            </div>
          </motion.div>
        )}

        {/* Done */}
        {stage === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-[#111113] border border-[#34D399]/20 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
              <div className="inline-flex p-4 bg-[#34D399]/[0.08] rounded-2xl">
                <CheckCircle className="w-9 h-9 text-[#34D399]" />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-[#FAFAFA]">Upload Complete</h2>
                <p className="text-[12px] text-[#71717A] mt-1">
                  Products ingested and duplicate detection run
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-[24px] font-semibold text-[#FAFAFA] font-mono">{result.inserted}</p>
                  <p className="text-[11px] text-[#52525B]">inserted</p>
                </div>
                <div className="w-px bg-[#1F1F23]" />
                <div className="text-center">
                  <p className="text-[24px] font-semibold text-[#71717A] font-mono">{result.skipped}</p>
                  <p className="text-[11px] text-[#52525B]">skipped</p>
                </div>
                <div className="w-px bg-[#1F1F23]" />
                <div className="text-center">
                  <p className="text-[24px] font-semibold text-[#FBBF24] font-mono">{result.new_clusters}</p>
                  <p className="text-[11px] text-[#52525B]">new clusters</p>
                </div>
              </div>
            </div>

            {result.new_clusters > 0 && (
              <div className="bg-[#111113] border border-[#FBBF24]/15 rounded-xl px-4 py-3 flex items-center gap-3">
                <GitMerge className="w-4 h-4 text-[#FBBF24] shrink-0" />
                <p className="text-[12px] text-[#A1A1AA]">
                  {result.new_clusters} new duplicate cluster{result.new_clusters > 1 ? "s" : ""} found — review them in the{" "}
                  <span className="text-[#FAFAFA] font-medium">Resolve</span> tab
                </p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-[#71717A] border border-[#1F1F23] hover:bg-[#18181B] hover:text-[#A1A1AA] transition-colors"
            >
              Upload Another File
            </button>
          </motion.div>
        )}

        {/* Error */}
        {stage === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#111113] border border-[#F87171]/20 rounded-xl p-8 flex flex-col items-center gap-4 text-center"
          >
            <div className="inline-flex p-4 bg-[#F87171]/[0.08] rounded-2xl">
              <AlertCircle className="w-9 h-9 text-[#F87171]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#FAFAFA]">Upload Failed</h2>
              <p className="text-[12px] text-[#71717A] mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-[#71717A] border border-[#1F1F23] hover:bg-[#18181B] hover:text-[#A1A1AA] transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
