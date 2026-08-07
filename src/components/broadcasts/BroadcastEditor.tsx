import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { MessageBoxList } from '@/components/broadcasts/MessageBoxList'
import { LiveMarqueePreview } from '@/components/broadcasts/LiveMarqueePreview'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import type { BroadcastMessage, BroadcastTarget } from '@/types/broadcasts'
import { useBroadcastMessages, useSaveBroadcastMessages } from '@/hooks/useBroadcasts'

interface BroadcastEditorProps {
  target: BroadcastTarget
  /** Prefix the preview with Global's active messages (skipped when editing Global/Intro themselves). */
  prefixWithGlobal?: boolean
}

export function BroadcastEditor({ target, prefixWithGlobal = false }: BroadcastEditorProps) {
  const { data: serverMessages, isLoading } = useBroadcastMessages(target)
  const { data: globalMessages } = useBroadcastMessages({ kind: 'global' })
  const saveMessages = useSaveBroadcastMessages(target)
  const { showToast } = useToast()

  const [messages, setMessages] = useState<BroadcastMessage[]>([])

  useEffect(() => {
    setMessages(serverMessages ?? [])
  }, [serverMessages])

  const previewMessages = [
    ...(prefixWithGlobal ? (globalMessages ?? []).filter((m) => m.is_active) : []),
    ...messages.filter((m) => m.is_active),
  ].map((m) => m.text)
    .filter((t) => t.trim().length > 0)

  const handleSave = () => {
    saveMessages.mutate(
      { original: serverMessages ?? [], edited: messages },
      {
        onSuccess: () => showToast('Broadcast saved.', 'success'),
        onError: (err) =>
          showToast(err instanceof ApiError ? err.message : 'Could not save broadcast. Please try again.', 'error'),
      },
    )
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-heading">Message Boxes</h2>

      {isLoading ? (
        <p className="py-4 text-sm text-body-subtle">Loading messages...</p>
      ) : (
        <MessageBoxList messages={messages} onChange={setMessages} />
      )}

      <div className="my-5 border-t border-border" />

      <LiveMarqueePreview messages={previewMessages} />

      <button
        type="button"
        onClick={handleSave}
        disabled={saveMessages.isPending}
        className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        Save Broadcast
      </button>
    </Card>
  )
}
