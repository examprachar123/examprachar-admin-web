import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  qualificationLevelsApi,
  qualificationParentsApi,
  type ConfirmRequired,
} from '@/api/profileOptionsApi'
import type { MoveDirection } from '@/types/profileOptions'

export function useQualificationLevels() {
  return useQuery({
    queryKey: ['qualification-levels'],
    queryFn: qualificationLevelsApi.list,
    staleTime: Infinity,
  })
}

export function useQualificationParents(levelId: number) {
  return useQuery({
    queryKey: ['qualification-parents', levelId],
    queryFn: () => qualificationParentsApi.list(levelId),
    staleTime: 60_000,
  })
}

export function useCreateQualificationParent(levelId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => qualificationParentsApi.create(levelId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qualification-parents', levelId] }),
  })
}

/** First step of the two-step delete: returns the child count without deleting anything. */
export function useDeleteQualificationParent() {
  return useMutation<ConfirmRequired, unknown, number>({
    mutationFn: (id: number) => qualificationParentsApi.remove(id),
  })
}

export function useConfirmDeleteQualificationParent(levelId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => qualificationParentsApi.removeConfirmed(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qualification-parents', levelId] }),
  })
}

export interface ManagedListItem {
  id: number
  name: string
  order: number
}

export interface ManagedListAdapter<T extends ManagedListItem> {
  queryKey: readonly unknown[]
  list: () => Promise<T[]>
  create: (name: string, order: number) => Promise<T>
  remove: (id: number) => Promise<void>
  move: (id: number, direction: MoveDirection) => Promise<T>
}

/**
 * Shared by qualification-children (two-level's second step) and qualification-options
 * (one-level flat lists) — both are ordered lists with identical create/delete/move
 * semantics, differing only in which REST resource backs them.
 */
export function useManagedList<T extends ManagedListItem>(adapter: ManagedListAdapter<T>) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: adapter.queryKey, queryFn: adapter.list, staleTime: 60_000 })
  const items = query.data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: adapter.queryKey })

  const create = useMutation({
    mutationFn: (name: string) => adapter.create(name, items.length),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => adapter.remove(id),
    onSuccess: invalidate,
  })

  const move = useMutation({
    mutationFn: (vars: { id: number; direction: MoveDirection }) => adapter.move(vars.id, vars.direction),
    onSuccess: invalidate,
  })

  return { query, items, create, remove, move }
}
