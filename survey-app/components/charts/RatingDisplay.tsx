'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';

interface RatingData {
  name: string;
  value: number;
}

interface RatingDisplayProps {
  average: number;
  data: RatingData[];
  totalResponses: number;
  maxRating?: number;
}

function getRatingColor(average: number, maxRating: number): string {
  const normalized = (average / maxRating) * 5;
  if (normalized >= 4) return '#22c55e'; // green
  if (normalized >= 3) return '#eab308'; // yellow
  return '#ef4444'; // red
}

function getRatingLabel(average: number, maxRating: number): string {
  const normalized = (average / maxRating) * 5;
  if (normalized >= 4.5) return 'Excellent';
  if (normalized >= 4) return 'Great';
  if (normalized >= 3.5) return 'Good';
  if (normalized >= 3) return 'Average';
  if (normalized >= 2) return 'Below Average';
  return 'Poor';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: RatingData & { percentage: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="font-medium text-gray-900 text-sm">Rating: {data.name}</p>
      <p className="text-gray-600 text-sm">
        {data.value} response{data.value !== 1 ? 's' : ''} ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

export default function RatingDisplay({
  average,
  data,
  totalResponses,
  maxRating = 5,
}: RatingDisplayProps) {
  const color = getRatingColor(average, maxRating);
  const label = getRatingLabel(average, maxRating);

  // Calculate percentages
  const dataWithPercentages = data.map((item) => ({
    ...item,
    percentage: totalResponses > 0 ? (item.value / totalResponses) * 100 : 0,
  }));

  // Determine bar colors based on rating value
  const getBarColor = (rating: string) => {
    const ratingNum = Number(rating);
    const normalized = (ratingNum / maxRating) * 5;
    if (normalized >= 4) return '#22c55e'; // green
    if (normalized >= 3) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="w-full">
      {/* Large Average Display */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <div
            className="text-5xl font-bold mb-1"
            style={{ color }}
          >
            {average.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">
            out of {maxRating}
          </div>
          <div
            className="text-sm font-medium mt-1 px-3 py-1 rounded-full inline-block"
            style={{
              backgroundColor: `${color}20`,
              color,
            }}
          >
            {label}
          </div>
        </div>
      </div>

      {/* Star visualization */}
      <div className="flex justify-center gap-1 mb-4">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const fillPercentage = Math.min(1, Math.max(0, average - i));

          return (
            <div key={i} className="relative w-6 h-6">
              {/* Empty star */}
              <svg
                className="absolute inset-0 w-6 h-6 text-gray-200"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {/* Filled star (clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution Bar Chart */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2 text-center">Rating Distribution</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            data={dataWithPercentages}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {dataWithPercentages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Response count */}
      <p className="text-xs text-gray-400 text-center mt-2">
        Based on {totalResponses} response{totalResponses !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
