import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Card } from '@/components/ui/Card'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { Icon } from '@/components/ui/Icon'
import { EditableHeading } from '@/components/ui/EditableHeading'
import { TableEditor } from '@/components/posts/TableEditor'
import { emptyTableContent, type OptionalSectionValue, type SectionContentMode } from '@/types/postCommon'

const MODE_LABELS: Record<SectionContentMode, string> = {
  table: 'Table',
  bullets: 'Bullets',
  text: 'Text',
}

interface OptionalSectionEditorProps {
  title: string
  allowedModes: SectionContentMode[]
  maxHeadingLength?: number
  hasSubheading?: boolean
  value: OptionalSectionValue
  onChange: (value: OptionalSectionValue) => void
}

export function OptionalSectionEditor({
  title,
  allowedModes,
  maxHeadingLength = 60,
  hasSubheading = true,
  value,
  onChange,
}: OptionalSectionEditorProps) {
  const setEnabled = (enabled: boolean) => {
    onChange({ ...value, enabled, heading: enabled && !value.heading.trim() ? title : value.heading })
  }

  if (!value.enabled) {
    return (
      <Card className="flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">{title}</span>
        <ToggleSwitch checked={false} onChange={setEnabled} label={`Enable ${title}`} />
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">{title}</span>
        <ToggleSwitch checked onChange={setEnabled} label={`Disable ${title}`} />
      </div>

      <EditableHeading
        value={value.heading}
        fallback={title}
        maxLength={maxHeadingLength}
        onChange={(heading) => onChange({ ...value, heading })}
      />

      {hasSubheading && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-body">Subheading</span>
            <ToggleSwitch
              checked={value.subheading_enabled}
              onChange={(subheading_enabled) => onChange({ ...value, subheading_enabled })}
              label="Toggle subheading"
            />
          </div>
          {value.subheading_enabled && (
            <input
              type="text"
              value={value.subheading}
              onChange={(e) => onChange({ ...value, subheading: e.target.value })}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          )}
        </div>
      )}

      {allowedModes.length > 1 && (
        <div className="mb-4">
          <span className="mb-1.5 block text-sm font-medium text-body">Content Format</span>
          <SegmentedToggle
            options={allowedModes.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
            value={value.content_mode}
            onChange={(content_mode) => onChange({ ...value, content_mode })}
          />
        </div>
      )}

      {value.content_mode === 'bullets' && <BulletsEditor value={value} onChange={onChange} />}
      {value.content_mode === 'text' && (
        <textarea
          value={value.content.text}
          onChange={(e) => onChange({ ...value, content: { ...value.content, text: e.target.value } })}
          rows={4}
          className="w-full resize-none rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      )}
      {value.content_mode === 'table' && (
        <TableEditor
          value={value.content.table ?? emptyTableContent()}
          onChange={(table) => onChange({ ...value, content: { ...value.content, table } })}
        />
      )}
    </Card>
  )
}

function BulletsEditor({
  value,
  onChange,
}: {
  value: OptionalSectionValue
  onChange: (value: OptionalSectionValue) => void
}) {
  const bullets = value.content.bullets
  const setBullets = (next: string[]) => onChange({ ...value, content: { ...value.content, bullets: next } })

  const updateBullet = (index: number, text: string) => {
    setBullets(bullets.map((b, i) => (i === index ? text : b)))
  }
  const removeBullet = (index: number) => setBullets(bullets.filter((_, i) => i !== index))
  const addBullet = () => setBullets([...bullets, ''])

  return (
    <div>
      <div className="space-y-2">
        {bullets.map((bullet, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-body-subtle">&bull;</span>
            <input
              type="text"
              value={bullet}
              onChange={(e) => updateBullet(index, e.target.value)}
              className="flex-1 rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeBullet(index)}
              aria-label="Remove bullet"
              className="text-body-subtle hover:text-error"
            >
              <Icon icon={faTrashCan} className="text-xs" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addBullet}
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Icon icon={faPlus} className="text-xs" />
        Add Bullet
      </button>
    </div>
  )
}
