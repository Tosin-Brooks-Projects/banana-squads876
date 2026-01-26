'use client';

import { useState } from 'react';

interface TextResponsesListProps {
  responses: string[];
  maxVisible?: number;
}

export default function TextResponsesList({
  responses,
  maxVisible = 5,
}: TextResponsesListProps) {
  const [showAll, setShowAll] = useState(false);

  if (responses.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        No text responses yet
      </div>
    );
  }

  const visibleResponses = showAll ? responses : responses.slice(0, maxVisible);
  const hasMore = responses.length > maxVisible;

  return (
    <div className="w-full">
      <div className="space-y-2">
        {visibleResponses.map((response, index) => (
          <div
            key={index}
            className="bg-white border border-gray-100 rounded-lg p-3 text-sm text-gray-700"
          >
            <p className="whitespace-pre-wrap break-words">{response}</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showAll
            ? 'Show less'
            : `Show ${responses.length - maxVisible} more response${responses.length - maxVisible !== 1 ? 's' : ''}`}
        </button>
      )}

      <p className="text-xs text-gray-400 mt-3">
        {responses.length} response{responses.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
