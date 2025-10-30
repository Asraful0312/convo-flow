"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Users, MessageSquare, Clock, Sparkles, Smartphone, Globe } from "lucide-react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")

  // Mock data for charts
  const responsesTrend = [
    { date: "Mon", responses: 12 },
    { date: "Tue", responses: 19 },
    { date: "Wed", responses: 15 },
    { date: "Thu", responses: 25 },
    { date: "Fri", responses: 22 },
    { date: "Sat", responses: 18 },
    { date: "Sun", responses: 20 },
  ]

  const completionRates = [
    { form: "Customer Feedback", rate: 68 },
    { form: "Event Registration", rate: 82 },
    { form: "Lead Qualification", rate: 45 },
  ]

  const deviceBreakdown = [
    { name: "Desktop", value: 45, color: "#6366f1" },
    { name: "Mobile", value: 40, color: "#f97316" },
    { name: "Tablet", value: 15, color: "#10b981" },
  ]

  const geographicData = [
    { country: "United States", responses: 45 },
    { country: "United Kingdom", responses: 28 },
    { country: "Canada", responses: 18 },
    { country: "Australia", responses: 12 },
    { country: "Germany", responses: 10 },
  ]

  const aiInsights = [
    {
      type: "positive",
      title: "Completion Rate Improving",
      description: "Your average completion rate increased by 12% this week compared to last week.",
      icon: TrendingUp,
    },
    {
      type: "neutral",
      title: "Mobile Traffic Growing",
      description: "40% of responses now come from mobile devices. Consider optimizing for mobile.",
      icon: Smartphone,
    },
    {
      type: "suggestion",
      title: "Question Optimization",
      description: "Question 3 in 'Customer Feedback' has a 25% drop-off rate. Consider simplifying it.",
      icon: Sparkles,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track performance and gain insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">127</div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>+23% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion Rate</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">68%</div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>+12% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.2m</div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mt-1">
              <TrendingDown className="w-4 h-4" />
              <span>-15% faster</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Forms</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <div className="text-sm text-muted-foreground mt-1">2 published, 1 draft</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6366f1]" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <CardDescription>Personalized recommendations to improve your forms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-lg border border-border bg-muted/30">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    insight.type === "positive"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : insight.type === "neutral"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-purple-100 dark:bg-purple-900/30"
                  }`}
                >
                  <insight.icon
                    className={`w-5 h-5 ${
                      insight.type === "positive"
                        ? "text-green-600 dark:text-green-400"
                        : insight.type === "neutral"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-purple-600 dark:text-purple-400"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="completion">Completion Rates</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Trend</CardTitle>
              <CardDescription>Daily responses over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  responses: {
                    label: "Responses",
                    color: "#6366f1",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responsesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="responses" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Rates by Form</CardTitle>
              <CardDescription>Compare completion rates across your forms</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  rate: {
                    label: "Completion Rate",
                    color: "#6366f1",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="form" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="rate" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Responses by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <ChartContainer
                  config={{
                    desktop: { label: "Desktop", color: "#6366f1" },
                    mobile: { label: "Mobile", color: "#f97316" },
                    tablet: { label: "Tablet", color: "#10b981" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deviceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <div className="space-y-4">
                  {deviceBreakdown.map((device) => (
                    <div key={device.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: device.color }} />
                          <span className="font-medium">{device.name}</span>
                        </div>
                        <span className="text-muted-foreground">{device.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${device.value}%`, backgroundColor: device.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Top countries by response count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geographicData.map((country, index) => (
                  <div key={country.country} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <span className="text-muted-foreground">{country.responses} responses</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden ml-9">
                      <div
                        className="h-full bg-gradient-to-r from-[#6366f1] to-[#f97316] transition-all"
                        style={{ width: `${(country.responses / 45) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
