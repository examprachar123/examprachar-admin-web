import { useEffect, useRef, useState, type ReactNode } from 'react'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import clsx from 'clsx'
import { Icon } from '@/components/ui/Icon'

interface HorizontalScrollerProps {
  children: ReactNode
  className?: string
}

/**
 * A horizontally-scrolling row that also works with a plain vertical-only mouse wheel (no
 * trackpad/shift needed) and exposes click-to-scroll arrow buttons for pure-mouse desktop use.
 */
export function HorizontalScroller({ children, className }: HorizontalScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateEdges = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateEdges()

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    // Native listener (not passive) so preventDefault actually stops the page from also scrolling.
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('scroll', updateEdges)
    const resizeObserver = new ResizeObserver(updateEdges)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', updateEdges)
      resizeObserver.disconnect()
    }
  }, [])

  const scrollBy = (amount: number) => scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })

  return (
    <div className="relative flex items-center gap-1.5">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-160)}
          aria-label="Scroll left"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-white text-body-subtle shadow-sm hover:border-primary-border-accent hover:text-primary"
        >
          <Icon icon={faChevronLeft} className="text-xs" />
        </button>
      )}
      <div ref={scrollRef} className={clsx('flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(160)}
          aria-label="Scroll right"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-white text-body-subtle shadow-sm hover:border-primary-border-accent hover:text-primary"
        >
          <Icon icon={faChevronRight} className="text-xs" />
        </button>
      )}
    </div>
  )
}
