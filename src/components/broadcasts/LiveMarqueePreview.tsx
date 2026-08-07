import { faBullhorn } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

const MARQUEE_SPEED_PX_PER_SEC = 50
const APPROX_PX_PER_CHAR = 7.5

interface LiveMarqueePreviewProps {
  messages: string[]
}

export function LiveMarqueePreview({ messages }: LiveMarqueePreviewProps) {
  const text = messages.join('  •  ')
  const estimatedWidth = Math.max(text.length * APPROX_PX_PER_CHAR, 200)
  const durationSeconds = estimatedWidth / MARQUEE_SPEED_PX_PER_SEC

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-body-subtle">Live App Preview</p>
      <div className="flex h-[38px] items-center overflow-hidden rounded-lg border border-[#fef3c7] bg-[#fffbeb] px-3">
        <Icon icon={faBullhorn} className="mr-2 shrink-0 text-sm text-amber-600" />
        <div className="relative flex-1 overflow-hidden">
          {text ? (
            <span
              className="inline-block whitespace-nowrap text-sm font-medium text-amber-800"
              style={{
                animation: `marquee-scroll ${durationSeconds}s linear infinite`,
              }}
            >
              {text}
            </span>
          ) : (
            <span className="text-sm text-amber-700/60">No active messages for this target.</span>
          )}
        </div>
      </div>
    </div>
  )
}
