"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Globe,
  MessageSquare,
  MousePointerClick,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const iconMap = {
  positive: TrendingUp,
  neutral: Smartphone,
  suggestion: Sparkles,
};

const deviceColors: { [key: string]: string } = {
  Desktop: "#6366f1",
  Mobile: "#f97316",
  Tablet: "#10b981",
  Other: "#64748b",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "90d" | "1y" | "all"
  >("7d");
  const user = useQuery(api.auth.loggedInUser);
  const analytics = useQuery(api.analytics.getAnalytics, {
    timeRange,
    workspaceId: user?.activeWorkspaceId as Id<"workspaces">,
  });

  const formatMinutes = (ms: number) => {
    const minutes = ms / 1000 / 60;
    return `${minutes.toFixed(1)}m`;
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { keyMetrics, responseTrend, deviceBreakdown } = analytics || {};

  const geographicData = analytics?.geographicData || [];
  const aiInsights = analytics?.aiInsights || [];

  const totalGeoResponses = geographicData.reduce(
    (acc, curr) => acc + curr.responses,
    0,
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Key Metrics Row */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border-0 shadow-sm bg-linear-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Responses
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {keyMetrics.totalResponses}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total submissions received
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full border-0 shadow-sm bg-linear-to-br from-green-50 to-white dark:from-green-950/20 dark:to-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <MousePointerClick className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {keyMetrics.avgCompletionRate.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average form completion
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full border-0 shadow-sm bg-linear-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Time
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {formatMinutes(keyMetrics.avgCompletionTime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Time to complete
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full border-0 shadow-sm bg-linear-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Forms
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MessageSquare className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {keyMetrics.activeForms}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {keyMetrics.draftForms} drafts pending
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Chart Area - Spans 2 cols on LG, 3 on XL */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-2 lg:col-span-3 row-span-2"
        >
          <Card className="h-full border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Response Trends</CardTitle>
              <CardDescription>
                Daily submission volume over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <ChartContainer
                config={{
                  responses: {
                    label: "Responses",
                    color: "#6366f1",
                  },
                }}
                className="h-[350px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={responseTrend}>
                    <defs>
                      <linearGradient
                        id="colorResponses"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="responses"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorResponses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Device Breakdown - Spans 1 col */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-1 lg:col-span-1 row-span-2"
        >
          <Card className="h-full border-0 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Devices</CardTitle>
              <CardDescription>User platforms</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <ChartContainer
                config={{
                  desktop: { label: "Desktop", color: "#6366f1" },
                  mobile: { label: "Mobile", color: "#f97316" },
                  tablet: { label: "Tablet", color: "#10b981" },
                }}
                className="h-[200px] w-full mx-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {deviceBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={deviceColors[entry.name] || deviceColors.Other}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-6 space-y-3">
                {deviceBreakdown.map((device) => (
                  <div
                    key={device.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            deviceColors[device.name] || deviceColors.Other,
                        }}
                      />
                      <span>{device.name}</span>
                    </div>
                    <span className="font-medium">
                      {device.value.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights - Spans 2 cols */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="h-full border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F56A4D]" />
                <CardTitle>AI Insights</CardTitle>
              </div>
              <CardDescription>
                Smart recommendations for your forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {aiInsights.map((insight, index) => {
                  const Icon =
                    iconMap[insight.type as keyof typeof iconMap] || Sparkles;
                  return (
                    <div
                      key={index}
                      className="flex gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          insight.type === "positive"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : insight.type === "neutral"
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : "bg-purple-100 dark:bg-purple-900/30"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            insight.type === "positive"
                              ? "text-green-600 dark:text-green-400"
                              : insight.type === "neutral"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-purple-600 dark:text-purple-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-0.5">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Geography - Spans 2 cols */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="h-full border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
              <CardDescription>
                Where your users are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geographicData.slice(0, 5).map((country, index) => (
                  <div key={country.country} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-4">
                          {index + 1}
                        </span>
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {country.responses}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-7">
                      <div
                        className="h-full bg-linear-to-r from-[#F56A4D] to-[#f97316] rounded-full"
                        style={{
                          width: `${(country.responses / totalGeoResponses) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
