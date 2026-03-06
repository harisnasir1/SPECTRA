import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, Play } from "lucide-react";

interface LogEntry {
  type: "info" | "success" | "error";
  text: string;
}

const mockLogs: LogEntry[] = [
  { type: "info", text: "Initializing CLIP model..." },
  { type: "info", text: "Loading CLIP-ViT-L/14 weights..." },
  { type: "success", text: "Model loaded successfully" },
  { type: "info", text: "Parsing CSV file: products_export.csv" },
  { type: "info", text: "Found 1,247 products with 3,891 images" },
  { type: "info", text: "Generating text embeddings from name + brand + description..." },
  { type: "info", text: "Processing batch 1/13 — encoding images..." },
  { type: "info", text: "Processing batch 2/13 — encoding images..." },
  { type: "info", text: "Processing batch 3/13 — encoding images..." },
  { type: "info", text: "Fusing image + text vectors (weighted average)..." },
  { type: "success", text: "1,247 combined embeddings generated" },
  { type: "info", text: "Storing vectors in pgvector (dimension: 768)..." },
  { type: "success", text: "Vectors stored successfully" },
  { type: "info", text: "Running cosine similarity search (threshold: 0.85)..." },
  { type: "info", text: "Building duplicate clusters..." },
  { type: "success", text: "Found 37 duplicate clusters containing 89 products" },
  { type: "success", text: "Pipeline complete — ready for review in Resolve tab" },
];

export function IngestPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const startProcessing = () => {
    if (!file) return;
    setIsProcessing(true);
    setIsComplete(false);
    setLogs([]);

    mockLogs.forEach((log, index) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, log]);
        if (index === mockLogs.length - 1) {
          setTimeout(() => {
            setIsProcessing(false);
            setIsComplete(true);
          }, 500);
        }
      }, index * 450);
    });
  };

  return (
    <div className="max-w-[850px] mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-[22px] font-semibold text-[#FAFAFA] tracking-tight">
          Data Ingest
        </h1>
        <p className="text-sm text-[#71717A] mt-1">
          Upload a Shopify CSV export to generate CLIP embeddings for images and text
        </p>
      </motion.div>

      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 mb-5 transition-all ${
          file
            ? "border-[#27272A] bg-[#111113] cursor-default"
            : isDragging
            ? "border-[#38BDF8]/50 bg-[#38BDF8]/[0.04] cursor-pointer"
            : "border-[#1F1F23] bg-[#111113] hover:border-[#27272A] cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          {file ? (
            <>
              <div className="p-3 bg-[#38BDF8]/[0.08] rounded-xl">
                <FileText className="w-7 h-7 text-[#38BDF8]" />
              </div>
              <p className="text-sm text-[#FAFAFA] font-medium">{file.name}</p>
              <p className="text-[12px] text-[#52525B]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              {isComplete && (
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-[#34D399]" />
                  <span className="text-[12px] text-[#34D399] font-medium">
                    Complete
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-3 bg-[#18181B] rounded-xl">
                <Upload className="w-7 h-7 text-[#52525B]" />
              </div>
              <p className="text-sm text-[#A1A1AA]">
                Drop your Shopify CSV here
              </p>
              <p className="text-[12px] text-[#3F3F46]">or click to browse</p>
            </>
          )}
        </div>
      </motion.div>

      {/* Start button */}
      {file && !isProcessing && !isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={startProcessing}
            className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Embedding Pipeline
          </motion.button>
        </motion.div>
      )}

      {/* Pipeline steps — shown before processing */}
      {logs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5"
        >
          <h3 className="text-[13px] font-semibold text-[#FAFAFA] mb-4">
            Pipeline Steps
          </h3>
          <div className="space-y-3">
            {[
              {
                n: "1",
                title: "Parse CSV",
                desc: "Extract product names, brands, descriptions, and image URLs from Shopify export",
              },
              {
                n: "2",
                title: "Generate Embeddings",
                desc: "Use CLIP to create vectors from both images and text (name + brand + description)",
              },
              {
                n: "3",
                title: "Fuse Vectors",
                desc: "Combine image and text embeddings into a single representation per product",
              },
              {
                n: "4",
                title: "Store & Index",
                desc: "Store combined vectors in PostgreSQL with pgvector for similarity search",
              },
              {
                n: "5",
                title: "Detect Duplicates",
                desc: "Run cosine similarity to find potential duplicate clusters above threshold",
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-md bg-[#38BDF8]/[0.08] flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[#38BDF8] font-mono">
                    {step.n}
                  </span>
                </div>
                <div>
                  <p className="text-[13px] text-[#D4D4D8] font-medium">
                    {step.title}
                  </p>
                  <p className="text-[11px] text-[#52525B] mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Terminal */}
      <AnimatePresence>
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0C0C0E] border border-[#1F1F23] rounded-xl overflow-hidden"
          >
            {/* Terminal header */}
            <div className="border-b border-[#1F1F23] px-4 py-2.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
              </div>
              <span className="text-[11px] text-[#3F3F46] font-mono">
                embedding-pipeline
              </span>
              {isProcessing && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                  <span className="text-[11px] text-[#38BDF8] font-mono">
                    running
                  </span>
                </div>
              )}
              {isComplete && (
                <div className="ml-auto flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-[#34D399]" />
                  <span className="text-[11px] text-[#34D399] font-mono">
                    done
                  </span>
                </div>
              )}
            </div>

            {/* Log lines */}
            <div className="p-4 font-mono text-[12px] max-h-72 overflow-y-auto leading-relaxed">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2.5 mb-0.5"
                >
                  <span className="shrink-0 text-[#27272A] select-none w-5 text-right">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {log.type === "success" ? (
                    <span className="text-[#34D399]">✓ {log.text}</span>
                  ) : (
                    <span className="text-[#71717A]">› {log.text}</span>
                  )}
                </motion.div>
              ))}
              {isProcessing && (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-[#38BDF8] ml-[30px]"
                >
                  ▊
                </motion.span>
              )}
              <div ref={logEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}