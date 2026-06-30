import type { Risk, Priority } from '@/types/analysis';

const LEVELS: Priority[] = ['Low', 'Medium', 'High'];

const CELL_COLOR: Record<string, string> = {
  'High-High':     'bg-red-100 border-red-300',
  'High-Medium':   'bg-orange-100 border-orange-300',
  'High-Low':      'bg-yellow-100 border-yellow-300',
  'Medium-High':   'bg-orange-100 border-orange-300',
  'Medium-Medium': 'bg-yellow-100 border-yellow-300',
  'Medium-Low':    'bg-green-100 border-green-300',
  'Low-High':      'bg-yellow-100 border-yellow-300',
  'Low-Medium':    'bg-green-100 border-green-300',
  'Low-Low':       'bg-green-50 border-green-200',
};

const DOT_COLOR: Record<Priority, string> = {
  High: 'bg-red-500',
  Medium: 'bg-orange-400',
  Low: 'bg-green-500',
};

interface Props {
  risks: Risk[];
}

export default function RiskMatrix({ risks }: Props) {
  function risksAt(impact: Priority, probability: Priority) {
    return risks.filter(
      (r) => r.impact === impact && (r.probability ?? 'Medium') === probability
    );
  }

  return (
    <div>
      <div className="flex gap-2 items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Risk Matrix</h3>
        <div className="flex gap-3 ml-2 text-xs text-gray-500">
          {(['High', 'Medium', 'Low'] as Priority[]).map((p) => (
            <span key={p} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${DOT_COLOR[p]}`} />
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 pb-2 text-left text-xs font-medium text-gray-500">
                Impact ↓ / Probability →
              </th>
              {LEVELS.map((prob) => (
                <th key={prob} className="pb-2 text-center text-xs font-semibold text-gray-600 w-1/3">
                  {prob} Probability
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...LEVELS].reverse().map((impact) => (
              <tr key={impact}>
                <td className="pr-3 py-2 text-xs font-semibold text-gray-600 align-top">
                  {impact} Impact
                </td>
                {LEVELS.map((prob) => {
                  const cell = risksAt(impact, prob);
                  const colorKey = `${impact}-${prob}`;
                  return (
                    <td key={prob} className="py-1 px-1 align-top">
                      <div className={`min-h-[80px] rounded-lg border p-2 ${CELL_COLOR[colorKey] ?? 'bg-gray-50 border-gray-200'}`}>
                        {cell.length === 0 ? (
                          <p className="text-xs text-gray-300 text-center mt-4">—</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {cell.map((r, i) => (
                              <li key={i} className="group relative">
                                <p className="text-xs text-gray-700 leading-snug line-clamp-2 cursor-default">
                                  {r.description}
                                </p>
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-0 z-10 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg p-3 mb-1 shadow-xl">
                                  <p className="font-medium mb-1">{r.description}</p>
                                  <p className="text-gray-300"><span className="text-gray-400">Mitigation:</span> {r.mitigation}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">Hover over a risk to see its mitigation strategy.</p>
    </div>
  );
}
