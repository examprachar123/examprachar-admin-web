import { useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { faGripVertical } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import type { BroadcastMessage } from '@/types/broadcasts'

interface MessageBoxListProps {
  messages: BroadcastMessage[]
  onChange: (messages: BroadcastMessage[]) => void
}

export function MessageBoxList({ messages, onChange }: MessageBoxListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const nextTempId = useRef(-1)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = messages.findIndex((m) => m.id === active.id)
    const newIndex = messages.findIndex((m) => m.id === over.id)
    onChange(reindex(arrayMove(messages, oldIndex, newIndex)))
  }

  const updateMessage = (id: number, patch: Partial<BroadcastMessage>) => {
    onChange(messages.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const removeMessage = (id: number) => {
    onChange(reindex(messages.filter((m) => m.id !== id)))
  }

  const addMessage = () => {
    onChange([
      ...messages,
      {
        id: nextTempId.current--,
        scope: 'global',
        section: null,
        target_kind: null,
        target_tag: null,
        target_state: null,
        text: '',
        is_active: true,
        order: messages.length,
        created_at: '',
      },
    ])
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={messages.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {messages.map((message) => (
              <SortableMessageBox
                key={message.id}
                message={message}
                onUpdate={(patch) => updateMessage(message.id, patch)}
                onRemove={() => removeMessage(message.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {messages.length === 0 && (
        <p className="py-4 text-center text-sm text-body-subtle">No messages yet.</p>
      )}

      <button
        type="button"
        onClick={addMessage}
        className="mt-3 w-full rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
      >
        + Add Message Box
      </button>
    </div>
  )
}

function reindex(messages: BroadcastMessage[]): BroadcastMessage[] {
  return messages.map((m, index) => ({ ...m, order: index }))
}

function SortableMessageBox({
  message,
  onUpdate,
  onRemove,
}: {
  message: BroadcastMessage
  onUpdate: (patch: Partial<BroadcastMessage>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: message.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        'flex items-start gap-3 rounded-xl border border-border bg-white p-3 ' +
        (isDragging ? 'opacity-60 shadow-lg' : '')
      }
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="mt-2 cursor-grab touch-none text-body-subtle active:cursor-grabbing"
      >
        <Icon icon={faGripVertical} />
      </button>

      <textarea
        value={message.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Broadcast message..."
        rows={2}
        className="flex-1 resize-none rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />

      <div className="mt-1 flex flex-col items-center gap-2">
        <ToggleSwitch
          checked={message.is_active}
          onChange={(isActive) => onUpdate({ is_active: isActive })}
          label="Toggle active"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Delete message"
          className="text-body-subtle hover:text-error"
        >
          <Icon icon={faTrashCan} />
        </button>
      </div>
    </div>
  )
}
