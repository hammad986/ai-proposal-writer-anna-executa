import { parseTable } from '@/utils'

export function PricingTable({ content }: { content: string }) {
  const table = parseTable(content)
  if (!table.headers.length) return null

  return (
    <div className="overflow-x-auto rounded-lg border bg-card my-3">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-primary text-white">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {table.rows.map((row, index) => (
            <tr key={`${row.join('-')}-${index}`} className={index % 2 ? 'bg-muted/40' : 'bg-background'}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
