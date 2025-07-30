'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OpenAITestResult {
  success: boolean;
  model?: string;
  response?: string;
  error?: string;
  errorType?: string;
  status?: number;
  recommendations?: string[];
  timestamp?: string;
  openaiStatus?: {
    configured: boolean;
    model?: string;
    error?: string;
    quotaErrors?: number;
    summaryDisabled?: boolean;
    lastQuotaError?: number;
  };
  summaryGenerationEnabled?: boolean;
  diagnostics?: {
    apiKeyConfigured: boolean;
    modelConfigured: boolean;
    llmInitialized: boolean;
    memoryServiceAvailable: boolean;
  };
}

export default function OpenAITestPage() {
  const [testResult, setTestResult] = useState<OpenAITestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/test-openai');
      const data = await response.json();
      
      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatQuotaErrorTime = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">OpenAI Configuration Test</h1>
        <p className="text-gray-600">
          This page helps diagnose OpenAI configuration and quota issues.
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={runTest} disabled={loading}>
          {loading ? 'Testing...' : 'Run Test Again'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Overall Status
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'Working' : 'Error'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Model:</strong> {testResult.model || 'N/A'}</p>
                  <p><strong>Test Time:</strong> {formatTimestamp(testResult.timestamp)}</p>
                </div>
                <div>
                  <p><strong>Summary Generation:</strong> 
                    <Badge variant={testResult.summaryGenerationEnabled ? 'default' : 'secondary'} className="ml-2">
                      {testResult.summaryGenerationEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI Status */}
          {testResult.openaiStatus && (
            <Card>
              <CardHeader>
                <CardTitle>OpenAI Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Configured:</strong> 
                      <Badge variant={testResult.openaiStatus.configured ? 'default' : 'destructive'} className="ml-2">
                        {testResult.openaiStatus.configured ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                    <p><strong>Model:</strong> {testResult.openaiStatus.model || 'N/A'}</p>
                    {testResult.openaiStatus.error && (
                      <p className="text-red-600"><strong>Error:</strong> {testResult.openaiStatus.error}</p>
                    )}
                  </div>
                  <div>
                    <p><strong>Quota Errors:</strong> {testResult.openaiStatus.quotaErrors || 0}</p>
                    <p><strong>Summary Disabled:</strong> 
                      <Badge variant={testResult.openaiStatus.summaryDisabled ? 'destructive' : 'default'} className="ml-2">
                        {testResult.openaiStatus.summaryDisabled ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                    <p><strong>Last Quota Error:</strong> {formatQuotaErrorTime(testResult.openaiStatus.lastQuotaError)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnostics */}
          {testResult.diagnostics && (
            <Card>
              <CardHeader>
                <CardTitle>System Diagnostics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>API Key Configured:</strong> 
                      <Badge variant={testResult.diagnostics.apiKeyConfigured ? 'default' : 'destructive'} className="ml-2">
                        {testResult.diagnostics.apiKeyConfigured ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                    <p><strong>Model Configured:</strong> 
                      <Badge variant={testResult.diagnostics.modelConfigured ? 'default' : 'destructive'} className="ml-2">
                        {testResult.diagnostics.modelConfigured ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p><strong>LLM Initialized:</strong> 
                      <Badge variant={testResult.diagnostics.llmInitialized ? 'default' : 'destructive'} className="ml-2">
                        {testResult.diagnostics.llmInitialized ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                    <p><strong>Memory Service Available:</strong> 
                      <Badge variant={testResult.diagnostics.memoryServiceAvailable ? 'default' : 'destructive'} className="ml-2">
                        {testResult.diagnostics.memoryServiceAvailable ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Response or Error */}
          {testResult.success ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle>Test Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800">{testResult.response}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle>Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Error:</strong> {testResult.error}</p>
                  <p><strong>Type:</strong> {testResult.errorType}</p>
                  {testResult.status && <p><strong>Status:</strong> {testResult.status}</p>}
                  
                  {testResult.recommendations && testResult.recommendations.length > 0 && (
                    <div>
                      <p><strong>Recommendations:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        {testResult.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 