/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UsageResponse } from '@/types/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';


export default function UsagePage() {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user, timeRange]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usage?userId=${user?.uid}&days=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      const data = await response.json();
      setUsageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usage Dashboard</h1>
          <p>Please log in to view your usage statistics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usage Dashboard</h1>
          <p>Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usage Dashboard</h1>
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={fetchUsageData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usage Dashboard</h1>
          <p>No usage data available.</p>
        </div>
      </div>
    );
  }

  const { stats, recentUsage, pricing } = usageData;

  // Prepare chart data
  const dailyUsageData = Object.entries(stats.usageByDate).map(([date, data]) => ({
    date,
    tokens: data.tokens,
    cost: data.cost,
    messages: data.messages,
  }));

  const modelUsageData = Object.entries(stats.usageByModel).map(([model, data]) => ({
    model,
    tokens: data.tokens,
    cost: data.cost,
    messages: data.messages,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usage Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 7 ? 'default' : 'outline'}
            onClick={() => setTimeRange(7)}
          >
            7 days
          </Button>
          <Button
            variant={timeRange === 30 ? 'default' : 'outline'}
            onClick={() => setTimeRange(30)}
          >
            30 days
          </Button>
          <Button
            variant={timeRange === 90 ? 'default' : 'outline'}
            onClick={() => setTimeRange(90)}
          >
            90 days
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalTokens)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.averageTokensPerMessage)} avg per message
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <span className="text-muted-foreground">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalCost / stats.totalMessages)} avg per message
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <span className="text-muted-foreground">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalMessages)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.totalMessages / timeRange)} per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Models Used</CardTitle>
            <span className="text-muted-foreground">🤖</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.usageByModel).length}</div>
            <p className="text-xs text-muted-foreground">
              Different AI models
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Usage</TabsTrigger>
          <TabsTrigger value="models">Model Usage</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Token Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="tokens" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ model, percent }) => `${model} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="tokens"
                    >
                      {modelUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="tokens" fill="#8884d8" name="Tokens" />
                  <Bar yAxisId="right" dataKey="cost" fill="#82ca9d" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelUsageData.map((modelData) => (
                  <div key={modelData.model} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{modelData.model}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(modelData.messages)} messages
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatNumber(modelData.tokens)} tokens</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(modelData.cost)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsage.slice(0, 20).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{record.model}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(record.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        {record.promptTokens} + {record.completionTokens} = {record.totalTokens} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(record.cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricing.map((model) => (
                  <div key={model.model} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{model.model}</h3>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Input: {formatCurrency(model.inputPricePer1kTokens)}/1K tokens
                      </p>
                      <p className="text-sm">
                        Output: {formatCurrency(model.outputPricePer1kTokens)}/1K tokens
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 