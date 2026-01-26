'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

interface Theme {
  name: string;
  count: number;
  percentage: number;
  exampleResponses: string[];
}

interface KeyInsight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral' | 'action';
}

interface AIAnalysisResult {
  summary: string;
  sentiment: SentimentBreakdown;
  themes: Theme[];
  keyInsights: KeyInsight[];
  recommendations: string[];
  generatedAt: string;
}

interface AIInsightsProps {
  surveyId: string;
  responseCount: number;
  pricingTier: string;
  getAuthToken: () => Promise<string>;
}

export default function AIInsights({
  surveyId,
  responseCount,
  pricingTier,
  getAuthToken,
}: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const hasAccess = ['pro', 'business', 'enterprise'].includes(pricingTier);

  const handleAnalyze = async () => {
    if (!hasAccess) return;

    setIsLoading(true);
    setError(null);

    try {
      const authToken = await getAuthToken();
      const response = await fetch('/api/analyze-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ surveyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze responses');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return '✅';
      case 'negative':
        return '⚠️';
      case 'action':
        return '💡';
      default:
        return '📊';
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'negative':
        return 'bg-red-50 border-red-200';
      case 'action':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Upgrade prompt for non-Pro users
  if (!hasAccess) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI-Powered Insights
          </h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Get automatic sentiment analysis, theme detection, and actionable recommendations powered by AI.
          </p>
          <p className="text-sm text-purple-600 font-medium">
            Available on Pro, Business, and Enterprise plans
          </p>
        </div>
      </Card>
    );
  }

  // No responses yet
  if (responseCount === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Insights
          </h3>
          <p className="text-gray-500">
            Collect some responses to unlock AI-powered analysis
          </p>
        </div>
      </Card>
    );
  }

  // Not yet analyzed
  if (!analysis && !isLoading) {
    return (
      <Card>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI-Powered Analysis
          </h3>
          <p className="text-gray-600 mb-4">
            Get instant insights from your {responseCount} response{responseCount !== 1 ? 's' : ''}
          </p>
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          <Button onClick={handleAnalyze}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analyze with AI
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-3xl">🤖</span>
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analyzing Your Data...
          </h3>
          <p className="text-gray-500 text-sm">
            AI is reviewing {responseCount} response{responseCount !== 1 ? 's' : ''}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-500 rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Analysis results
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Insights</h3>
            <p className="text-xs text-gray-500">
              Generated {new Date(analysis!.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isLoading}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>📋</span> Executive Summary
        </h4>
        <p className="text-gray-700">{analysis!.summary}</p>
      </Card>

      {/* Sentiment Analysis */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>😊</span> Sentiment Analysis
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm w-20">Positive</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis!.sentiment.positive}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
            <span className="text-sm font-medium w-12 text-right">
              {analysis!.sentiment.positive}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm w-20">Neutral</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis!.sentiment.neutral}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                className="h-full bg-gray-400 rounded-full"
              />
            </div>
            <span className="text-sm font-medium w-12 text-right">
              {analysis!.sentiment.neutral}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm w-20">Negative</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis!.sentiment.negative}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-red-500 rounded-full"
              />
            </div>
            <span className="text-sm font-medium w-12 text-right">
              {analysis!.sentiment.negative}%
            </span>
          </div>
        </div>
      </Card>

      {/* Key Themes */}
      {analysis!.themes.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏷️</span> Key Themes
          </h4>
          <div className="space-y-3">
            {analysis!.themes.map((theme, index) => (
              <motion.div
                key={theme.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedTheme(expandedTheme === theme.name ? null : theme.name)}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">{theme.percentage}%</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{theme.name}</p>
                      <p className="text-sm text-gray-500">{theme.count} mentions</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedTheme === theme.name ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {expandedTheme === theme.name && theme.exampleResponses.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <p className="text-xs text-gray-500 mb-2">Example responses:</p>
                      <ul className="space-y-1">
                        {theme.exampleResponses.slice(0, 3).map((example, i) => (
                          <li key={i} className="text-sm text-gray-600 italic">
                            "{example}"
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Insights */}
      {analysis!.keyInsights.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💡</span> Key Insights
          </h4>
          <div className="space-y-3">
            {analysis!.keyInsights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getInsightBgColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getInsightIcon(insight.type)}</span>
                  <div>
                    <h5 className="font-medium text-gray-900">{insight.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {analysis!.recommendations.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎯</span> Recommendations
          </h4>
          <ul className="space-y-3">
            {analysis!.recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p className="text-gray-700">{rec}</p>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}
    </motion.div>
  );
}
