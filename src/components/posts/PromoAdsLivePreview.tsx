import type { PromoAdItem } from '@/types/postCommon'

interface PromoAdsLivePreviewProps {
  value: PromoAdItem[]
  activeState: number | null
}

export function PromoAdsLivePreview({ value, activeState }: PromoAdsLivePreviewProps) {
  const active = [...value]
    .filter((ad) => ad.state === activeState && ad.is_active && ad.image_url)
    .sort((a, b) => a.order - b.order)

  if (active.length === 0) {
    return (
      <div className="mx-auto flex h-32 w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-white text-center">
        <span className="text-xs font-bold text-body-subtle">No active ads in this group</span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {active.map((ad) => (
          <div key={ad.id} className="aspect-[1.91/1] w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-page shadow-sm">
            <img src={ad.image_url} alt={ad.internal_label || 'Promo ad'} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {active.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {active.map((ad, i) => (
            <span key={ad.id} className={i === 0 ? 'h-1.5 w-4 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-border'} />
          ))}
        </div>
      )}
    </div>
  )
}
