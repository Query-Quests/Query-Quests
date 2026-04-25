import { Target, XCircle, CheckCircle } from "lucide-react";

export function QueryResults({ queryResult, queryError }) {
  if (!queryResult && !queryError) return null;

  return (
    <div className="bg-[#0a1628] border-t border-gray-800">
      <div className="px-4 py-2 border-b border-gray-800">
        <h3 className="font-medium text-[#19aa59] text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Query Results
        </h3>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto">
        {queryError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <XCircle className="h-4 w-4" />
              <span className="font-semibold text-sm">Query Error</span>
            </div>
            <p className="text-red-300 text-sm">{queryError}</p>
          </div>
        )}

        {queryResult && <ResultBlock result={queryResult} />}
      </div>
    </div>
  );
}

function ResultBlock({ result }) {
  const tone = result.success
    ? "bg-[#19aa59]/10 border-[#19aa59]/30"
    : "bg-amber-500/10 border-amber-500/30";
  const headerColor = result.success ? "text-[#19aa59]" : "text-amber-400";
  const messageColor = result.success ? "text-emerald-300" : "text-amber-300";

  return (
    <div className={`border rounded-xl p-4 ${tone}`}>
      <div className="flex items-center gap-2 mb-2">
        {result.success ? (
          <CheckCircle className="h-5 w-5 text-[#19aa59]" />
        ) : (
          <XCircle className="h-5 w-5 text-amber-400" />
        )}
        <span className={`font-semibold ${headerColor}`}>
          {result.success ? "Success!" : "Try Again"}
        </span>
      </div>

      <p className={`text-sm mb-3 ${messageColor}`}>{result.message}</p>

      {result.data && result.data.length > 0 && <ResultTable rows={result.data} />}
    </div>
  );
}

function ResultTable({ rows }) {
  const columns = Object.keys(rows[0]);
  return (
    <div className="bg-[#030914] border border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-800/50">
            <tr>
              {columns.map((key) => (
                <th
                  key={key}
                  className="px-3 py-2 text-left font-medium text-gray-400 uppercase tracking-wider"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-800/30">
                {Object.values(row).map((value, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-gray-300">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
