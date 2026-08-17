import { faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { TableContentPreview } from '@/components/posts/TableContentPreview'
import type { OptionalSectionValue } from '@/types/postCommon'

interface OptionalSectionLivePreviewProps {
  value: OptionalSectionValue
}

export function OptionalSectionLivePreview({ value }: OptionalSectionLivePreviewProps) {
  if (!value.enabled) {
    return (
      <div className="mx-auto flex h-24 w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-white text-center">
        <Icon icon={faEyeSlash} className="text-lg text-body-subtle" />
        <span className="text-xs font-bold text-body-subtle">Section Hidden</span>
      </div>
    )
  }

  const bullets = value.content.bullets.filter((b) => b.trim())

  return (
    <div className="mx-auto w-full max-w-xs rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-base font-bold text-heading">{value.heading || 'Section Heading'}</h3>
      {value.subheading_enabled && value.subheading.trim() && (
        <h4 className="mb-2.5 text-sm font-bold text-body">{value.subheading}</h4>
      )}

      {value.content_mode === 'bullets' && (
        <ul className="list-disc space-y-2 pl-4 text-sm font-medium leading-relaxed text-body marker:text-body-subtle">
          {bullets.length === 0 ? (
            <li className="italic text-body-subtle">Add points to preview...</li>
          ) : (
            bullets.map((b, i) => <li key={i}>{b}</li>)
          )}
        </ul>
      )}

      {value.content_mode === 'text' &&
        (value.content.text.trim() ? (
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-body">{value.content.text}</p>
        ) : (
          <p className="text-sm italic text-body-subtle">Empty paragraph...</p>
        ))}

      {value.content_mode === 'table' && <TableContentPreview table={value.content.table} />}
    </div>
  )
}
