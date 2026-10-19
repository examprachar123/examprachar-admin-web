import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { officialSourcesApi } from '@/api/officialSourcesApi'
import type { OfficialSource, OfficialSourceInput } from '@/types/officialSources'

export const officialSourcesQueryKey = ['official-sources'] as const
const publicOfficialSourcesQueryKey = ['official-sources', 'public'] as const

export function useOfficialSources() {
  return useQuery({
    queryKey: officialSourcesQueryKey,
    queryFn: officialSourcesApi.list,
    staleTime: 5 * 60_000,
  })
}

export function usePublicOfficialSources() {
  return useQuery({
    queryKey: publicOfficialSourcesQueryKey,
    queryFn: officialSourcesApi.listPublic,
    staleTime: 5 * 60_000,
  })
}

function useInvalidateSources() {
  const queryClient = useQueryClient()
  // Prefix match also refreshes the public list.
  return () => queryClient.invalidateQueries({ queryKey: officialSourcesQueryKey })
}

export function useCreateOfficialSource() {
  const invalidate = useInvalidateSources()
  return useMutation({
    mutationFn: (input: OfficialSourceInput) => officialSourcesApi.create(input),
    onSuccess: invalidate,
  })
}

export function useUpdateOfficialSource() {
  const invalidate = useInvalidateSources()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<OfficialSourceInput> }) =>
      officialSourcesApi.update(id, input),
    onSuccess: invalidate,
  })
}

export function useSetOfficialSourceActive() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateSources()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      officialSourcesApi.update(id, { is_active: isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: officialSourcesQueryKey })
      const previous = queryClient.getQueryData<OfficialSource[]>(officialSourcesQueryKey)
      queryClient.setQueryData<OfficialSource[]>(officialSourcesQueryKey, (prev) =>
        prev?.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(officialSourcesQueryKey, context.previous)
    },
    onSettled: invalidate,
  })
}

export function useDeleteOfficialSource() {
  const invalidate = useInvalidateSources()
  return useMutation({
    mutationFn: (id: number) => officialSourcesApi.remove(id),
    onSuccess: invalidate,
  })
}
