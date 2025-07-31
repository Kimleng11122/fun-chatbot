'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EnvCheck {
  hasOpenAIKey: boolean;
  openaiKeyLength: number;
  openaiKeyPrefix: string;
  openaiModel: string;
  hasFirebaseConfig: {
    projectId: boolean;
    clientEmail: boolean;
    privateKey: boolean;
  };
  nodeEnv: string;
  timestamp: string;
}

export default function DebugEnvPage() {
  const [envCheck, setEnvCheck] = useState<EnvCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEnv = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug-env');
      const data = await response.json();
      
      setEnvCheck(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEnv();
  }, []);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Environment Debug</h1>
        <p className="text-gray-600">
          This page helps verify your environment variable configuration.
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={checkEnv} disabled={loading}>
          {loading ? 'Checking...' : 'Check Environment Again'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {envCheck && (
        <div className="space-y-6">
          {/* OpenAI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>OpenAI Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>API Key Present:</strong> 
                    <Badge variant={envCheck.hasOpenAIKey ? 'default' : 'destructive'} className="ml-2">
                      {envCheck.hasOpenAIKey ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                  <p><strong>API Key Length:</strong> {envCheck.openaiKeyLength}</p>
                  <p><strong>API Key Prefix:</strong> {envCheck.openaiKeyPrefix}</p>
                </div>
                <div>
                  <p><strong>Model:</strong> {envCheck.openaiModel}</p>
                  <p><strong>Node Environment:</strong> {envCheck.nodeEnv}</p>
                  <p><strong>Check Time:</strong> {formatTimestamp(envCheck.timestamp)}</p>
                </div>
              </div>
              
              {!envCheck.hasOpenAIKey && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ OpenAI API Key Missing</h4>
                  <p className="text-yellow-700 text-sm">
                    Your OpenAI API key is not configured. Please check:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                                         <li>Create a <code>.env.local</code> file in your project root</li>
                     <li>Add <code>OPENAI_API_KEY=sk-your-key-here</code></li>
                     <li>Restart your development server</li>
                     <li>If deployed, check your deployment platform&apos;s environment variables</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Firebase Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Firebase Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p><strong>Project ID:</strong> 
                    <Badge variant={envCheck.hasFirebaseConfig.projectId ? 'default' : 'destructive'} className="ml-2">
                      {envCheck.hasFirebaseConfig.projectId ? 'Set' : 'Missing'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p><strong>Client Email:</strong> 
                    <Badge variant={envCheck.hasFirebaseConfig.clientEmail ? 'default' : 'destructive'} className="ml-2">
                      {envCheck.hasFirebaseConfig.clientEmail ? 'Set' : 'Missing'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p><strong>Private Key:</strong> 
                    <Badge variant={envCheck.hasFirebaseConfig.privateKey ? 'default' : 'destructive'} className="ml-2">
                      {envCheck.hasFirebaseConfig.privateKey ? 'Set' : 'Missing'}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">If you&apos;re still getting quota errors with a new API key:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li><strong>Restart the development server:</strong> <code>npm run dev</code></li>
                    <li><strong>Clear Next.js cache:</strong> <code>rm -rf .next</code> then restart</li>
                    <li><strong>Check for multiple .env files:</strong> Look for <code>.env</code>, <code>.env.local</code>, <code>.env.development</code></li>
                    <li><strong>Verify API key format:</strong> Should start with <code>sk-</code></li>
                    <li><strong>Check deployment environment:</strong> If testing on Vercel/Netlify, update env vars there</li>
                                         <li><strong>Test API key directly:</strong> Try using it in OpenAI&apos;s playground</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Common Issues:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Environment variables are cached by Next.js</li>
                    <li>Multiple .env files with conflicting values</li>
                    <li>Deployment platform using old environment variables</li>
                    <li>API key has insufficient permissions or credits</li>
                    <li>Rate limiting from previous API key usage</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 