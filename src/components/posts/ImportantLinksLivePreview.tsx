import { faFilePdf, faLink } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'
import type { ImportantLinkItem } from '@/types/postCommon'

interface ImportantLinksLivePreviewProps {
  value: ImportantLinkItem[]
}

export function ImportantLinksLivePreview({ value }: ImportantLinksLivePreviewProps) {
  const links = [...value]
    .filter((link) => (link.source_mode === 'url' ? link.url.trim() : link.pdf_url.trim()))
    .sort((a, b) => a.order - b.order)

  if (links.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xs rounded-2xl border-2 border-dashed border-border bg-white p-4 text-center">
        <span className="text-xs font-bold text-body-subtle">Links hidden (no URLs provided)</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-2.5">
      {links.map((link) => (
        <div
          key={link.id}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-page py-3.5 text-sm font-bold text-body"
        >
          <Icon icon={link.source_mode === 'pdf' ? faFilePdf : faLink} className="text-primary" />
          {link.label}
        </div>
      ))}
    </div>
  )
}
