import type { TagSection } from '@/types/tags'

// The spec documents the "section_tag" scope explicitly; "global" and "intro" are inferred
// to match the app-wide panel's two targets (not spelled out in the reference).
export type BroadcastScope = 'global' | 'intro' | 'section_tag'
export type BroadcastTargetKind = 'top' | 'tag' | 'state'

export interface BroadcastMessage {
  id: number
  scope: BroadcastScope
  section: TagSection | null
  target_kind: BroadcastTargetKind | null
  target_tag: number | null
  target_state: number | null
  text: string
  is_active: boolean
  order: number
  created_at: string
}

export type BroadcastTarget =
  | { kind: 'intro' }
  | { kind: 'global' }
  | { kind: 'section-top'; section: TagSection }
  | { kind: 'section-tag'; section: TagSection; tagId: number }
  | { kind: 'section-state'; section: TagSection; stateId: number }

export function targetToQuery(target: BroadcastTarget): { scope: BroadcastScope; section?: TagSection } {
  switch (target.kind) {
    case 'intro':
      return { scope: 'intro' }
    case 'global':
      return { scope: 'global' }
    case 'section-top':
    case 'section-tag':
    case 'section-state':
      return { scope: 'section_tag', section: target.section }
  }
}

export function messageMatchesTarget(message: BroadcastMessage, target: BroadcastTarget): boolean {
  switch (target.kind) {
    case 'intro':
      return message.scope === 'intro'
    case 'global':
      return message.scope === 'global'
    case 'section-top':
      return message.scope === 'section_tag' && message.target_kind === 'top'
    case 'section-tag':
      return (
        message.scope === 'section_tag' &&
        message.target_kind === 'tag' &&
        message.target_tag === target.tagId
      )
    case 'section-state':
      return (
        message.scope === 'section_tag' &&
        message.target_kind === 'state' &&
        message.target_state === target.stateId
      )
  }
}

export function targetToCreatePayload(
  target: BroadcastTarget,
): Pick<BroadcastMessage, 'scope' | 'section' | 'target_kind' | 'target_tag' | 'target_state'> {
  switch (target.kind) {
    case 'intro':
      return { scope: 'intro', section: null, target_kind: null, target_tag: null, target_state: null }
    case 'global':
      return { scope: 'global', section: null, target_kind: null, target_tag: null, target_state: null }
    case 'section-top':
      return {
        scope: 'section_tag',
        section: target.section,
        target_kind: 'top',
        target_tag: null,
        target_state: null,
      }
    case 'section-tag':
      return {
        scope: 'section_tag',
        section: target.section,
        target_kind: 'tag',
        target_tag: target.tagId,
        target_state: null,
      }
    case 'section-state':
      return {
        scope: 'section_tag',
        section: target.section,
        target_kind: 'state',
        target_tag: null,
        target_state: target.stateId,
      }
  }
}
