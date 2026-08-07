import { useRef, useState } from 'react'
import { faArrowDown, faArrowUp, faImage } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { uploadsApi } from '@/api/postsApi'
import { MAX_PROMO_ADS, type PromoAdItem } from '@/types/postCommon'

interface PromoAdsCarouselEditorProps {
  value: PromoAdItem[]
  onChange: (value: PromoAdItem[]) => void
}

function reorder(ads: PromoAdItem[]): PromoAdItem[] {
  return ads.map((a, order) => ({ ...a, order }))
}

export function PromoAdsCarouselEditor({ value, onChange }: PromoAdsCarouselEditorProps) {
  const { showToast } = useToast()
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const sorted = [...value].sort((a, b) => a.order - b.order)

  const update = (id: string, patch: Partial<PromoAdItem>) => {
    onChange(value.map((ad) => (ad.id === id ? { ...ad, ...patch } : ad)))
  }

  // The upload itself is async, so by the time it resolves this render's `value`/`update`
  // closure may be stale (the admin could've edited/reordered/removed ads meanwhile) — read
  // through a ref that's always current instead of the value captured when the upload started.
  const latestValueRef = useRef(value)
  latestValueRef.current = value
  const updateLatest = (id: string, patch: Partial<PromoAdItem>) => {
    onChange(latestValueRef.current.map((ad) => (ad.id === id ? { ...ad, ...patch } : ad)))
  }

  const handleImageSelect = async (adId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file)
    update(adId, { image_url: previewUrl })
    setUploadingIds((prev) => new Set(prev).add(adId))
    try {
      const uploadedUrl = await uploadsApi.upload(file, 'image')
      updateLatest(adId, { image_url: uploadedUrl })
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not upload image. Please try again.', 'error')
      updateLatest(adId, { image_url: '' })
    } finally {
      URL.revokeObjectURL(previewUrl)
      setUploadingIds((prev) => {
        const next = new Set(prev)
        next.delete(adId)
        return next
      })
    }
  }
  const remove = (id: string) => onChange(reorder(value.filter((ad) => ad.id !== id)))
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sorted.length) return
    const next = [...sorted]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(reorder(next))
  }
  const addAd = () => {
    onChange(
      reorder([
        ...value,
        { id: crypto.randomUUID(), image_url: '', redirect_url: '', internal_label: '', is_active: true, order: 0 },
      ]),
    )
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">Promo Ad Banner</h2>
        <span className="text-xs text-body-subtle">
          {value.length}/{MAX_PROMO_ADS}
        </span>
      </div>
      <p className="mb-4 text-xs text-body-subtle">Internal only &mdash; never shown to end users, analytics-only.</p>

      <div className="space-y-3">
        {sorted.map((ad, index) => (
          <div key={ad.id} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-body">Ad {index + 1}</span>
              <div className="flex items-center gap-2">
                <ToggleSwitch checked={ad.is_active} onChange={(is_active) => update(ad.id, { is_active })} label="Toggle active" />
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowUp} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === sorted.length - 1}
                  aria-label="Move down"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowDown} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(ad.id)}
                  aria-label={`Remove ad ${index + 1}`}
                  className="text-body-subtle hover:text-error"
                >
                  <Icon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            </div>

            <label className="relative mb-2 flex aspect-[1.91/1] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-input-border bg-page text-body-subtle hover:border-primary-border-accent">
              {ad.image_url ? (
                <img src={ad.image_url} alt={`Promo ad ${index + 1}`} className="h-full w-full rounded-lg object-cover" />
              ) : (
                <>
                  <Icon icon={faImage} />
                  <span className="text-xs">1.91:1 image &mdash; click to upload</span>
                </>
              )}
              {uploadingIds.has(ad.id) && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/40 text-xs font-medium text-white">
                  Uploading...
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingIds.has(ad.id)}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageSelect(ad.id, file)
                }}
              />
            </label>

            <input
              type="url"
              value={ad.redirect_url}
              onChange={(e) => update(ad.id, { redirect_url: e.target.value })}
              placeholder="Redirect URL"
              className="mb-2 w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              value={ad.internal_label}
              onChange={(e) => update(ad.id, { internal_label: e.target.value })}
              placeholder="Internal label (for your reference only)"
              className="w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addAd}
        disabled={value.length >= MAX_PROMO_ADS}
        title={value.length >= MAX_PROMO_ADS ? `Maximum of ${MAX_PROMO_ADS} ads reached.` : undefined}
        className="mt-3 w-full rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add Ad
      </button>
    </Card>
  )
}
