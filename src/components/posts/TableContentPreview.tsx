import clsx from 'clsx'
import type { TableContent } from '@/types/postCommon'

interface TableContentPreviewProps {
  table: TableContent | null
  emptyLabel?: string
}

export function TableContentPreview({ table, emptyLabel = 'Add table data to preview it here.' }: TableContentPreviewProps) {
  if (!table || table.rows.length === 0) {
    return <p className="text-center text-xs text-body-subtle">{emptyLabel}</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => {
                if (cell.kind === 'covered') return null
                const isGroupRow = cell.colSpan > 1 && r > 0
                return (
                  <td
                    key={c}
                    rowSpan={cell.rowSpan}
                    colSpan={cell.colSpan}
                    className={clsx(
                      'border border-border px-2.5 py-1.5 text-center text-xs',
                      r === 0 || isGroupRow ? 'bg-page font-bold text-heading' : 'font-semibold text-heading',
                    )}
                  >
                    {cell.text}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
