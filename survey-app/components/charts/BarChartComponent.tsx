'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { ACCESSIBLE_COLORS, CHART_COLORS } from './chartColors';
import ChartSkeleton from './ChartSkeleton';

interface BarChartData {
  name: string;
  value: number;
  percentage?: number;
}

interface BarChartComponentProps {
  data: BarChartData[];
  title?: string;
  subtitle?: string;
  color?: string;
  showGrid?: boolean;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  showPercentages?: boolean;
  showCounts?: boolean;
  singleColor?: boolean;
  showLegend?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
}

function isEmojiOnly(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  // No ASCII letters or digits — treat as emoji-only
  return !/[a-zA-Z0-9]/.test(trimmed);
}

interface CustomYAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function CustomYAxisTick({ x = 0, y = 0, payload }: CustomYAxisTickProps) {
  if (!payload) return null;
  const value = payload.value;
  if (isEmojiOnly(value)) {
    return (
      <text x={x} y={y} textAnchor="end" dominantBaseline="middle" fontSize={20} dy={0}>
        {value}
      </text>
    );
  }
  const display = value.length > 20 ? `${value.slice(0, 20)}…` : value;
  return (
    <text x={x} y={y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={CHART_COLORS.text}>
      {display}
    </text>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BarChartData; color: string }>;
  showPercentages?: boolean;
}

function CustomTooltip({ active, payload, showPercentages }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const color = payload[0].color;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[140px]"
      role="tooltip"
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]">
          {data.name}
        </p>
      </div>
      <p className="text-gray-600 text-sm">
        <span className="font-semibold">{data.value}</span> response{data.value !== 1 ? 's' : ''}
        {showPercentages && data.percentage !== undefined && (
          <span className="ml-1 text-gray-500">({data.percentage.toFixed(1)}%)</span>
        )}
      </p>
    </motion.div>
  );
}

export default function BarChartComponent({
  data,
  title,
  subtitle,
  color,
  showGrid = false,
  height = 300,
  layout = 'vertical',
  showPercentages = true,
  showCounts = true,
  singleColor = false,
  showLegend = false,
  isLoading = false,
  ariaLabel,
}: BarChartComponentProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay for smooth transition
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
        <ChartSkeleton type="bar" height={height} />
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-400 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Calculate percentages if not provided
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentages = data.map((item) => ({
    ...item,
    percentage: item.percentage ?? (total > 0 ? (item.value / total) * 100 : 0),
  }));

  const chartAriaLabel = ariaLabel || `Bar chart showing ${title || 'data distribution'}`;

  // For horizontal layout (bars go left to right, categories on Y axis)
  if (layout === 'horizontal') {
    const barHeight = Math.max(36, Math.min(50, 280 / data.length));
    const dynamicHeight = Math.max(height, data.length * barHeight + 40);

    const allEmoji = dataWithPercentages.every((d) => isEmojiOnly(d.name));

    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {title && (
          <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
        )}
        <div role="img" aria-label={chartAriaLabel}>
          <ResponsiveContainer width="100%" height={dynamicHeight}>
            <BarChart
              data={dataWithPercentages}
              layout="vertical"
              margin={{ top: 5, right: 85, left: allEmoji ? 15 : 5, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                  horizontal={false}
                />
              )}
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax']}
                hide
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={allEmoji ? <CustomYAxisTick /> : { fontSize: 12, fill: CHART_COLORS.text }}
                tickLine={false}
                axisLine={false}
                width={allEmoji ? 40 : 130}
              />
              <Tooltip
                content={<CustomTooltip showPercentages={showPercentages} />}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              />
              {showLegend && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                />
              )}
              <Bar
                dataKey="value"
                name="Responses"
                radius={[0, 6, 6, 0]}
                barSize={barHeight - 12}
                background={{ fill: CHART_COLORS.background, radius: 6 }}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {dataWithPercentages.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={singleColor
                      ? (color || ACCESSIBLE_COLORS[0])
                      : (color || ACCESSIBLE_COLORS[index % ACCESSIBLE_COLORS.length])
                    }
                  />
                ))}
                {(showCounts || showPercentages) && (
                  <LabelList
                    dataKey={(entry: Record<string, unknown>) => {
                      const barEntry = entry as unknown as BarChartData;
                      const parts: (string | number)[] = [];
                      if (showCounts) parts.push(barEntry.value);
                      if (showPercentages && barEntry.percentage !== undefined) {
                        parts.push(`(${barEntry.percentage.toFixed(0)}%)`);
                      }
                      return parts.join(' ');
                    }}
                    position="right"
                    fill={CHART_COLORS.textMuted}
                    fontSize={12}
                    fontWeight={500}
                    offset={8}
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Screen reader summary */}
        <div className="sr-only">
          {dataWithPercentages.map((item) => (
            <span key={item.name}>
              {item.name}: {item.value} responses ({item.percentage?.toFixed(1)}%).
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  // Vertical layout (default - bars go up, categories on X axis)
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
      )}
      <div role="img" aria-label={chartAriaLabel}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={dataWithPercentages}
            margin={{ top: 25, right: 10, left: -10, bottom: data.length > 5 ? 60 : 20 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
              />
            )}
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
              interval={0}
              angle={data.length > 5 ? -45 : 0}
              textAnchor={data.length > 5 ? 'end' : 'middle'}
              height={data.length > 5 ? 80 : 30}
              tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
            />
            <YAxis
              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
              allowDecimals={false}
              label={{
                value: 'Responses',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: CHART_COLORS.axis }
              }}
            />
            <Tooltip
              content={<CustomTooltip showPercentages={showPercentages} />}
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
            />
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
              />
            )}
            <Bar
              dataKey="value"
              name="Responses"
              radius={[6, 6, 0, 0]}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {dataWithPercentages.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={singleColor
                    ? (color || ACCESSIBLE_COLORS[0])
                    : (color || ACCESSIBLE_COLORS[index % ACCESSIBLE_COLORS.length])
                  }
                />
              ))}
              {showPercentages && (
                <LabelList
                  dataKey="percentage"
                  position="top"
                  fill={CHART_COLORS.textMuted}
                  fontSize={11}
                  fontWeight={500}
                  formatter={(value) => typeof value === 'number' ? `${value.toFixed(0)}%` : ''}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Screen reader summary */}
      <div className="sr-only">
        {dataWithPercentages.map((item) => (
          <span key={item.name}>
            {item.name}: {item.value} responses ({item.percentage?.toFixed(1)}%).
          </span>
        ))}
      </div>
    </motion.div>
  );
}
