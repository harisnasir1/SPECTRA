import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Package, AlertTriangle, CheckCircle, GitMerge } from "lucide-react";

// --- Mock data (replace with API) ---

const resolutionData = [
  { month: "Jan", merged: 145, unique: 32 },
  { month: "Feb", merged: 189, unique: 41 },
  { month: "Mar", merged: 210, unique: 55 },
  { month: "Apr", merged: 178, unique: 48 },
  { month: "May", merged: 195, unique: 38 },
  { month: "Jun", merged: 188, unique: 44 },
];

const categoryData = [
  { name: "Footwear", value: 4200 },
  { name: "Electronics", value: 3100 },
  { name: "Apparel", value: 3800 },
  { name: "Accessories", value: 1800 },
  { name: "Home", value: 1331 },
];

const similarityDistribution = [
  { range: "85–88%", count: 45 },
  { range: "88–91%", count: 82 },
  { range: "91–94%", count: 156 },
  { range: "94–97%", count: 203 },
  { range: "97–100%", count: 89 },
];

const COLORS = ["#38BDF8", "#A78BFA", "#FBBF24", "#F87171", "#34D399"];

const tooltipStyle = {
  backgroundColor: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#D4D4D8",
};

// --- Stats config ---

const statsConfig = [
  {
    icon: Package,
    label: "Total Products",
    value: "14,231",
    sub: "Across all imports",
    accent: "#38BDF8",
  },
  {
    icon: AlertTriangle,
    label: "Clusters Found",
    value: "575",
    sub: "Above 85% threshold",
    accent: "#F87171",
  },
  {
    icon: CheckCircle,
    label: "Resolved",
    value: "1,105",
    sub: "87% resolution rate",
    accent: "#34D399",
  },
  {
    icon: GitMerge,
    label: "Products Merged",
    value: "2,347",
    sub: "Removed from catalogue",
    accent: "#A78BFA",
  },
];

export function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-[22px] font-semibold text-[#FAFAFA] tracking-tight">
          Reports
        </h1>
        <p className="text-sm text-[#71717A] mt-1">
          Deduplication metrics and data insights
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statsConfig.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 hover:border-[#27272A] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Resolution Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5"
        >
          <h3 className="text-[14px] font-semibold text-[#FAFAFA] mb-0.5">
            Resolution Activity
          </h3>
          <p className="text-[11px] text-[#52525B] mb-5">
            Monthly merged vs unique decisions
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={resolutionData} barGap={2}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272A"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#3F3F46"
                tick={{ fontSize: 11, fill: "#52525B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#3F3F46"
                tick={{ fontSize: 11, fill: "#52525B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar
                dataKey="merged"
                fill="#38BDF8"
                radius={[4, 4, 0, 0]}
                name="Merged"
              />
              <Bar
                dataKey="unique"
                fill="#34D399"
                radius={[4, 4, 0, 0]}
                name="Unique"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5"
        >
          <h3 className="text-[14px] font-semibold text-[#FAFAFA] mb-0.5">
            Products by Category
          </h3>
          <p className="text-[11px] text-[#52525B] mb-5">
            Distribution across product types
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                stroke="transparent"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {categoryData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Similarity Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5"
      >
        <h3 className="text-[14px] font-semibold text-[#FAFAFA] mb-0.5">
          Similarity Score Distribution
        </h3>
        <p className="text-[11px] text-[#52525B] mb-5">
          How detected duplicates spread across cosine similarity ranges
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={similarityDistribution}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272A"
              vertical={false}
            />
            <XAxis
              dataKey="range"
              stroke="#3F3F46"
              tick={{ fontSize: 11, fill: "#52525B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#3F3F46"
              tick={{ fontSize: 11, fill: "#52525B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#38BDF8", strokeWidth: 1 }} />
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="count"
              stroke="#38BDF8"
              fill="url(#areaFill)"
              strokeWidth={2}
              name="Clusters"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}