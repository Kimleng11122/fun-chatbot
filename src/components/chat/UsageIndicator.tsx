/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UsageStats } from '@/types/chat';

interface UsageIndicatorProps {
  className?: string;
}

export function UsageIndicator({ className }: UsageIndicatorProps) {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsageStats();
    }
  }, [user]);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usage?userId=${user?.uid}&days=30`);
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
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

  if (!user || loading) {
    return null;
  }

  if (!usageStats) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <span>Usage: Loading...</span>
      </div>
    );
  }

  return (
    <div className={`text-xs text-gray-500 flex items-center space-x-4 ${className}`}>
      <span>Tokens: {formatNumber(usageStats.totalTokens)}</span>
      <span>Cost: {formatCurrency(usageStats.totalCost)}</span>
      <span>Messages: {formatNumber(usageStats.totalMessages)}</span>
    </div>
  );
} 