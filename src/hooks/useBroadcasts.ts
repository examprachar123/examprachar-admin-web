import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { broadcastsApi } from '@/api/broadcastsApi'
import type { BroadcastMessage, BroadcastTarget } from '@/types/broadcasts'
import { messageMatchesTarget, targetToCreatePayload, targetToQuery } from '@/types/broadcasts'

function targetQueryKey(target: BroadcastTarget) {
  return ['broadcasts', 'messages', JSON.stringify(target)] as const
}

export function useBroadcastMessages(target: BroadcastTarget) {
  const { scope, section } = targetToQuery(target)
  return useQuery({
    queryKey: targetQueryKey(target),
    queryFn: async () => {
      const messages = await broadcastsApi.list(scope, section)
      // The API doesn't document a default ordering for the list endpoint, so sort by
      // `order` explicitly — otherwise the editor and its drag list load in whatever
      // sequence the server happens to return rows in, not the admin's saved order.
      return messages.filter((m) => messageMatchesTarget(m, target)).sort((a, b) => a.order - b.order)
    },
    staleTime: 30_000,
  })
}

/**
 * The API has no bulk-save endpoint (each message is its own CRUD resource), so saving
 * the client-edited list diffs it against what the server last returned: messages removed
 * from the list are deleted, messages carried over are PATCHed, and messages the editor
 * added locally (negative temp ids — see MessageBoxList) are POSTed as new rows.
 */
export function useSaveBroadcastMessages(target: BroadcastTarget) {
  const queryClient = useQueryClient()
  const key = targetQueryKey(target)

  return useMutation({
    mutationFn: async ({
      original,
      edited,
    }: {
      original: BroadcastMessage[]
      edited: BroadcastMessage[]
    }) => {
      const originalIds = new Set(original.map((m) => m.id))
      const editedIds = new Set(edited.filter((m) => m.id > 0).map((m) => m.id))

      const removed = original.filter((m) => !editedIds.has(m.id))
      await Promise.all(removed.map((m) => broadcastsApi.remove(m.id)))

      return Promise.all(
        edited.map((m, order) => {
          if (m.id > 0 && originalIds.has(m.id)) {
            return broadcastsApi.update(m.id, { text: m.text, is_active: m.is_active, order })
          }
          return broadcastsApi.create({
            ...targetToCreatePayload(target),
            text: m.text,
            is_active: m.is_active,
            order,
          })
        }),
      )
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved)
    },
  })
}
