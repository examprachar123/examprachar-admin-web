import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tagsApi } from '@/api/tagsApi'
import type { CustomTag, TagSection } from '@/types/tags'

function customTagsKey(section: TagSection) {
  return ['tags', 'custom', section] as const
}

function orderedTagsKey(section: TagSection) {
  return ['tags', 'ordered', section] as const
}

export function useCustomTags(section: TagSection) {
  return useQuery({
    queryKey: customTagsKey(section),
    queryFn: () => tagsApi.customList(section),
    staleTime: 60_000,
  })
}

function invalidateSection(queryClient: ReturnType<typeof useQueryClient>, section: TagSection) {
  queryClient.invalidateQueries({ queryKey: customTagsKey(section) })
  queryClient.invalidateQueries({ queryKey: orderedTagsKey(section) })
}

export function useCreateCustomTag(section: TagSection) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => {
      const existing = queryClient.getQueryData<CustomTag[]>(customTagsKey(section)) ?? []
      return tagsApi.createCustom(section, name, existing.length + 1)
    },
    onSuccess: () => invalidateSection(queryClient, section),
  })
}

export function useUpdateCustomTag(section: TagSection) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Pick<CustomTag, 'name' | 'is_visible'>> }) =>
      tagsApi.updateCustom(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: customTagsKey(section) })
      const previous = queryClient.getQueryData<CustomTag[]>(customTagsKey(section))
      queryClient.setQueryData<CustomTag[]>(customTagsKey(section), (prev) =>
        prev?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(customTagsKey(section), context.previous)
    },
    onSettled: () => invalidateSection(queryClient, section),
  })
}

export function useReorderCustomTag(section: TagSection) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newRank }: { id: number; newRank: number }) => tagsApi.reorderCustom(id, newRank),
    onSuccess: () => invalidateSection(queryClient, section),
  })
}

export function useDeleteCustomTag(section: TagSection) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tagsApi.deleteCustom(id),
    onSuccess: () => invalidateSection(queryClient, section),
  })
}

export function usePscMapping(stateId: number | null) {
  return useQuery({
    queryKey: ['tags', 'psc-mapping', stateId],
    queryFn: async () => {
      const mappings = await tagsApi.listPscMappings(stateId as number)
      return mappings[0] ?? null
    },
    enabled: stateId !== null,
  })
}

export function useSavePscMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      stateId,
      existingId,
      commissionName,
    }: {
      stateId: number
      existingId: number | null
      commissionName: string
    }) =>
      existingId !== null
        ? tagsApi.updatePscMapping(existingId, commissionName)
        : tagsApi.createPscMapping(stateId, commissionName),
    onSuccess: (_data, { stateId }) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'psc-mapping', stateId] })
    },
  })
}
