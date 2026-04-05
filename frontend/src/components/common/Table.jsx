export default function Table({ columns, data, loading, emptyMessage = 'No records found.' }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-center text-gray-400">
          <div className="inline-block w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-10 text-gray-400">{emptyMessage}</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={row._id || i} className="hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {data.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">{emptyMessage}</p>
        ) : (
          data.map((row, i) => (
            <div key={row._id || i} className="p-4 space-y-2">
              {columns.map(col => (
                col.mobileHide ? null :
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">{col.label}</span>
                  <span className="text-sm text-gray-700 text-right">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
