import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { statesApi } from '@/api/statesApi'
import type { StateItem } from '@/types/states'

export const statesQueryKey = ['states'] as const

export function useStates() {
  return useQuery({
    queryKey: statesQueryKey,
    queryFn: statesApi.list,
    staleTime: 5 * 60_000,
  })
}

export function useCreateState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => statesApi.create(name),
    onSuccess: (created) => {
      queryClient.setQueryData<StateItem[]>(statesQueryKey, (prev) =>
        prev ? [created, ...prev] : [created],
      )
    },
  })
}

export function useSetStateActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      statesApi.setActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: statesQueryKey })
      const previous = queryClient.getQueryData<StateItem[]>(statesQueryKey)
      queryClient.setQueryData<StateItem[]>(statesQueryKey, (prev) =>
        prev?.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(statesQueryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statesQueryKey })
    },
  })
}

export function useRenameState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => statesApi.rename(id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: statesQueryKey })
      const previous = queryClient.getQueryData<StateItem[]>(statesQueryKey)
      queryClient.setQueryData<StateItem[]>(statesQueryKey, (prev) =>
        prev?.map((s) => (s.id === id ? { ...s, name } : s)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(statesQueryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statesQueryKey })
    },
  })
}

export function useDeleteState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => statesApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: statesQueryKey })
      const previous = queryClient.getQueryData<StateItem[]>(statesQueryKey)
      queryClient.setQueryData<StateItem[]>(statesQueryKey, (prev) => prev?.filter((s) => s.id !== id))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(statesQueryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statesQueryKey })
    },
  })
}
