import { useState } from 'react'
import { faObjectGroup, faObjectUngroup, faPlus } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import clsx from 'clsx'
import { Icon } from '@/components/ui/Icon'
import {
  addTableColumn,
  addTableRow,
  mergeTableCells,
  removeTableColumn,
  removeTableRow,
  resolveTableAnchor,
  tableColumnCount,
  unmergeTableCell,
  updateTableCellText,
  type TableAnchorCell,
  type TableContent,
} from '@/types/postCommon'

interface TableEditorProps {
  value: TableContent
  onChange: (value: TableContent) => void
}

interface CellPos {
  row: number
  col: number
}

export function TableEditor({ value, onChange }: TableEditorProps) {
  const [anchorCell, setAnchorCell] = useState<CellPos | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<CellPos | null>(null)

  const cols = tableColumnCount(value)

  const selectCell = (row: number, col: number, extend: boolean) => {
    const pos = resolveTableAnchor(value, row, col)
    if (extend && anchorCell) {
      setSelectionEnd(pos)
    } else {
      setAnchorCell(pos)
      setSelectionEnd(pos)
    }
  }

  const selection =
    anchorCell && selectionEnd
      ? {
          r1: Math.min(anchorCell.row, selectionEnd.row),
          c1: Math.min(anchorCell.col, selectionEnd.col),
          r2: Math.max(anchorCell.row, selectionEnd.row),
          c2: Math.max(anchorCell.col, selectionEnd.col),
        }
      : null

  const isSingleCellSelected = selection && selection.r1 === selection.r2 && selection.c1 === selection.c2
  const singleCell = isSingleCellSelected ? (value.rows[selection.r1][selection.c1] as TableAnchorCell) : null
  const canMerge = selection && !isSingleCellSelected
  const canUnmerge = singleCell && (singleCell.rowSpan > 1 || singleCell.colSpan > 1)

  const handleMerge = () => {
    if (!selection) return
    onChange(mergeTableCells(value, selection.r1, selection.c1, selection.r2, selection.c2))
  }
  const handleUnmerge = () => {
    if (!selection) return
    onChange(unmergeTableCell(value, selection.r1, selection.c1))
  }
  const handleAddRow = () => onChange(addTableRow(value))
  const handleAddColumn = () => onChange(addTableColumn(value))
  const handleRemoveRow = (r: number) => {
    setAnchorCell(null)
    setSelectionEnd(null)
    onChange(removeTableRow(value, r))
  }
  const handleRemoveColumn = (c: number) => {
    setAnchorCell(null)
    setSelectionEnd(null)
    onChange(removeTableColumn(value, c))
  }
  const handleCellText = (r: number, c: number, text: string) => onChange(updateTableCellText(value, r, c, text))

  if (value.rows.length === 0) {
    return (
      <button
        type="button"
        onClick={handleAddColumn}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-input-border py-6 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
      >
        <Icon icon={faPlus} className="text-xs" />
        Add Column
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] text-body-subtle">Click a cell, Shift+click another to select a range, then merge.</p>
        {canMerge && (
          <button
            type="button"
            onClick={handleMerge}
            className="flex items-center gap-1 rounded-md border border-primary-border-accent bg-primary-gradient-from px-2 py-1 text-xs font-medium text-primary hover:bg-primary-gradient-to"
          >
            <Icon icon={faObjectGroup} className="text-xs" />
            Merge Selected
          </button>
        )}
        {canUnmerge && (
          <button
            type="button"
            onClick={handleUnmerge}
            className="flex items-center gap-1 rounded-md border border-input-border px-2 py-1 text-xs font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
          >
            <Icon icon={faObjectUngroup} className="text-xs" />
            Unmerge
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c} className="border-b border-border bg-page p-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(c)}
                    aria-label={`Remove column ${c + 1}`}
                    className="text-body-subtle hover:text-error"
                  >
                    <Icon icon={faTrashCan} className="text-xs" />
                  </button>
                </td>
              ))}
              <td className="border-b border-border bg-page p-1 text-center">
                <button type="button" onClick={handleAddColumn} aria-label="Add column" className="text-primary hover:underline">
                  <Icon icon={faPlus} className="text-xs" />
                </button>
              </td>
            </tr>

            {value.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => {
                  if (cell.kind === 'covered') return null
                  const selected =
                    selection && r >= selection.r1 && r <= selection.r2 && c >= selection.c1 && c <= selection.c2
                  return (
                    <td
                      key={c}
                      rowSpan={cell.rowSpan}
                      colSpan={cell.colSpan}
                      onMouseDown={(e) => selectCell(r, c, e.shiftKey)}
                      className={clsx('border-b border-border p-1.5 align-top', selected && 'bg-primary-gradient-from')}
                    >
                      <input
                        type="text"
                        value={cell.text}
                        onChange={(e) => handleCellText(r, c, e.target.value)}
                        className="w-full min-w-[90px] rounded-md border border-input-border px-2 py-1 text-xs focus:border-primary focus:outline-none"
                      />
                    </td>
                  )
                })}
                <td className="border-b border-border p-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(r)}
                    aria-label={`Remove row ${r + 1}`}
                    className="text-body-subtle hover:text-error"
                  >
                    <Icon icon={faTrashCan} className="text-xs" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={handleAddRow} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <Icon icon={faPlus} className="text-xs" />
        Add Row
      </button>
    </div>
  )
}
