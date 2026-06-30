'use client';

import { useState } from 'react';
import type { Ticket, TicketType, UserStory } from '@/types/analysis';
import TicketModal from '@/components/TicketModal';

const TYPE_STYLES: Record<TicketType, string> = {
  Frontend: 'bg-blue-100 text-blue-700',
  Backend:  'bg-green-100 text-green-700',
  QA:       'bg-purple-100 text-purple-700',
  DevOps:   'bg-orange-100 text-orange-700',
};

interface Props {
  tickets: Ticket[];
  userStories: UserStory[];
}

type Filter = TicketType | 'All';

export default function TasksTab({ tickets, userStories }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const types: Filter[] = ['All', 'Frontend', 'Backend', 'QA', 'DevOps'];
  const visible = filter === 'All' ? tickets : tickets.filter((t) => t.type === filter);

  const linkedStory = selected
    ? userStories.find((s) => s.id === selected.storyId)
    : undefined;

  return (
    <>
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex gap-2 flex-wrap">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {type}
              <span className="ml-1.5 text-xs opacity-70">
                {type === 'All' ? tickets.length : tickets.filter((t) => t.type === type).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-24">Story</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">Pts</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => setSelected(ticket)}
                  className="hover:bg-brand-50 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 group-hover:text-brand-600">{ticket.id}</td>
                  <td className="px-4 py-3 text-gray-800 group-hover:text-brand-700 font-medium">{ticket.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[ticket.type]}`}>
                      {ticket.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{ticket.storyId}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{ticket.effortPoints}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{ticket.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 text-center">Click any row to see ticket details</p>
      </div>

      {selected && (
        <TicketModal
          ticket={selected}
          story={linkedStory}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
