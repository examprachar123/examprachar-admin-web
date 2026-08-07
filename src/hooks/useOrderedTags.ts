import { useQuery } from '@tanstack/react-query'
import { tagsApi } from '@/api/tagsApi'
import type { TagSection } from '@/types/tags'

/**
 * Fixed display order for any "tag row" in the app: Top -> State -> Custom (by rank).
 * Reused by Manage Tags, TargetAudienceTagsField (post forms), and Broadcast targeting
 * so the ordering logic lives in exactly one place.
 */
export function useOrderedTags(section: TagSection) {
  return useQuery({
    queryKey: ['tags', 'ordered', section],
    queryFn: () => tagsApi.orderedOptions(section),
    staleTime: 5 * 60_000,
  })
}
