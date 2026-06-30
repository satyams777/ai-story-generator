import type { TechStack, TechItem } from '@/types/analysis';

const CATEGORY_META: Record<keyof TechStack, { label: string; color: string; icon: string }> = {
  frontend:   { label: 'Frontend',    color: 'border-blue-200 bg-blue-50',   icon: '🖥️' },
  backend:    { label: 'Backend',     color: 'border-green-200 bg-green-50', icon: '⚙️' },
  database:   { label: 'Database',    color: 'border-purple-200 bg-purple-50', icon: '🗄️' },
  devops:     { label: 'DevOps',      color: 'border-orange-200 bg-orange-50', icon: '🚀' },
  thirdParty: { label: 'Third Party', color: 'border-pink-200 bg-pink-50',   icon: '🔌' },
};

interface Props {
  techStack: TechStack;
}

export default function TechStackCards({ techStack }: Props) {
  const categories = Object.entries(CATEGORY_META) as [keyof TechStack, typeof CATEGORY_META[keyof TechStack]][];
  const hasAny = categories.some(([key]) => techStack[key]?.length > 0);

  if (!hasAny) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(([key, meta]) => {
        const items: TechItem[] = techStack[key] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={key} className={`rounded-xl border p-4 ${meta.color}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{meta.icon}</span>
              <h3 className="text-sm font-semibold text-gray-700">{meta.label}</h3>
            </div>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.name} className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{item.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
