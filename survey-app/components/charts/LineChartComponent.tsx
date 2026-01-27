'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import { CHART_COLORS, BRAND_COLORS } from './chartColors';
import ChartSkeleton from './ChartSkeleton';

interface LineChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  color: string;
  name?: string;
}

interface LineChartComponentProps {
  data: LineChartData[];
  title?: string;
  subtitle?: string;
  lines?: LineConfig[];
  showGrid?: boolean;
  height?: number;
  showLegend?: boolean;
  showArea?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[120px]"
      role="tooltip"
    >
      <p className="font-medium text-gray-900 text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-gray-600 text-sm">
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </span>
        </div>
      ))}
    </motion.div>
  );
}

export default function LineChartComponent({
  data,
  title,
  subtitle,
  lines,
  showGrid = true,
  height = 300,
  showLegend = false,
  showArea = true,
  isLoading = false,
  ariaLabel,
}: LineChartComponentProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !isReady) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
        )}
        <ChartSkeleton type="line" height={height} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
        )}
        <div
          className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
          style={{ height }}
        >
          <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-gray-400 text-sm">No timeline data yet</p>
        </div>
      </div>
    );
  }

  const lineConfigs: LineConfig[] = lines || [
    { dataKey: 'value', color: BRAND_COLORS.primary, name: 'Responses' },
  ];

  const chartAriaLabel = ariaLabel || `Line chart showing ${title || 'data over time'}`;

  // Calculate total for summary
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <span className="text-xs text-gray-500">
            Total: <span className="font-semibold text-gray-700">{total}</span>
          </span>
        </div>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
      )}
      <div role="img" aria-label={chartAriaLabel}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              {lineConfigs.map((config) => (
                <linearGradient
                  key={`gradient-${config.dataKey}`}
                  id={`gradient-${config.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                vertical={false}
              />
            )}
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
              dy={5}
            />
            <YAxis
              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
            )}
            {lineConfigs.map((lineConfig) => (
              <React.Fragment key={lineConfig.dataKey}>
                {showArea && (
                  <Area
                    type="monotone"
                    dataKey={lineConfig.dataKey}
                    stroke="none"
                    fill={`url(#gradient-${lineConfig.dataKey})`}
                    animationDuration={800}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={lineConfig.dataKey}
                  stroke={lineConfig.color}
                  strokeWidth={2.5}
                  dot={{
                    fill: 'white',
                    stroke: lineConfig.color,
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    fill: lineConfig.color,
                    stroke: 'white',
                    strokeWidth: 2,
                  }}
                  name={lineConfig.name || lineConfig.dataKey}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </React.Fragment>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Screen reader summary */}
      <div className="sr-only">
        Timeline data: {data.map((item) => `${item.name}: ${item.value} responses`).join(', ')}.
        Total: {total} responses.
      </div>
    </motion.div>
  );
}
