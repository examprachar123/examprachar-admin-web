import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { makePostsApi, latestExamParentOptionsApi } from '@/api/postsApi'
import type { ConfirmRequiredDelete, PostGroup, PostResource, PostSummary } from '@/types/posts'

/** Shared by every post type's create/edit form — swap the generic and the resource name. */
export function usePostDetail<T>(resource: PostResource, id: number | null) {
  const api = makePostsApi<T>(resource)
  return useQuery({
    queryKey: ['posts', resource, id],
    queryFn: () => api.detail(id as number),
    enabled: id !== null,
  })
}

export function useCreatePost<T>(resource: PostResource) {
  const api = makePostsApi<T>(resource)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: unknown) => api.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', resource] }),
  })
}

export function useUpdatePost<T>(resource: PostResource) {
  const api = makePostsApi<T>(resource)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: unknown }) => api.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', resource] }),
  })
}

/** Manage Published: paginated list backing every post type's list view. */
export function usePostList(resource: PostResource, params: { group?: PostGroup; search?: string }) {
  const api = makePostsApi<unknown>(resource)
  return useQuery({
    queryKey: ['posts', resource, 'list', params],
    queryFn: () => api.list(params),
    staleTime: 30_000,
  })
}

/**
 * First step of delete. For Latest Exam this returns a ConfirmRequiredDelete (never actually
 * deletes); for every other post type the API performs a plain delete on this call already.
 */
export function useDeletePost(resource: PostResource) {
  const api = makePostsApi<unknown>(resource)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: (result) => {
      if (!(result as ConfirmRequiredDelete | undefined)?.confirm_required) {
        queryClient.invalidateQueries({ queryKey: ['posts', resource] })
      }
    },
  })
}

/** Second step: re-issues the delete with ?confirm=true, cascading to linked Tracked Alerts. */
export function useConfirmDeletePost(resource: PostResource) {
  const api = makePostsApi<unknown>(resource)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.removeConfirmed(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', resource] }),
  })
}

/** Feeds the Tracked Alert "Parent Selection" step: published exams matching group, searchable. */
export function useLatestExamParentOptions(group: PostGroup, search: string) {
  return useQuery<PostSummary[]>({
    queryKey: ['posts', 'latest-exams', 'parent-options', group, search],
    queryFn: () => latestExamParentOptionsApi.list(group, search || undefined),
    staleTime: 30_000,
  })
}
