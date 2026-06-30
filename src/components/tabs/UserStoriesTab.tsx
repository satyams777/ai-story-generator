'use client';

import { useState } from 'react';
import type { UserStory } from '@/types/analysis';

interface Props {
  stories: UserStory[];
}

export default function UserStoriesTab({ stories }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <div key={story.id} className="rounded-xl bg-white border border-gray-200">
          <button
            onClick={() => toggle(story.id)}
            className="w-full text-left px-6 py-4 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 font-mono text-xs text-gray-400 mt-1">{story.id}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  As a <span className="text-brand-600">{story.actor}</span>, I want to{' '}
                  <span className="font-semibold">{story.goal}</span>
                </p>
                <p className="text-sm text-gray-500 mt-0.5">so that {story.benefit}</p>
              </div>
            </div>
            <span className="shrink-0 text-gray-400 text-lg">{expanded.has(story.id) ? '−' : '+'}</span>
          </button>

          {expanded.has(story.id) && (
            <div className="px-6 pb-5 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Acceptance Criteria
              </p>
              <ul className="space-y-2">
                {story.acceptanceCriteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 text-green-500 mt-0.5">✓</span>
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
