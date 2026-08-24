import type { ReactNode } from 'react'

/** Renders *bold* and _red_ inline markup -- the only formatting a handful of freeform text fields support. */
export function renderRichText(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\*(.+?)\*|_(.+?)_/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      parts.push(
        <span key={key++} className="font-extrabold text-heading">
          {match[1]}
        </span>,
      )
    } else {
      parts.push(
        <span key={key++} className="font-extrabold text-error">
          {match[2]}
        </span>,
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
