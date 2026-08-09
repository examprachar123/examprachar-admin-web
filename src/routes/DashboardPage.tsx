import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  faTags,
  faBroadcastTower,
  faMapMarkedAlt,
  faUserGraduate,
  faCog,
  faChevronRight,
  faFileAlt,
  faIdCard,
  faPollH,
  faClock,
  faBell,
  faBullseye,
} from '@fortawesome/free-solid-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { Icon } from '@/components/ui/Icon'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const GROUPS = [
  { value: 'general', label: 'General' },
  { value: 'all-updates', label: 'All Updates' },
  { value: 'personalized', label: 'Personalized' },
] as const

const GENERAL_TILES = [
  { title: 'Manage Tags', subtitle: 'App-wide and section tags', icon: faTags, path: '/tags' },
  { title: 'Manage Broadcasts', subtitle: 'Marquee messages and targeting', icon: faBroadcastTower, path: '/broadcasts' },
  { title: 'Manage States', subtitle: 'States and union territories', icon: faMapMarkedAlt, path: '/states' },
  { title: 'Manage Profile Options', subtitle: 'Education levels and qualifications', icon: faUserGraduate, path: '/profile-options' },
  { title: 'App Settings', subtitle: 'Coming soon', icon: faCog, path: null },
]

interface PostTile {
  title: string
  icon: IconDefinition
  createPath: string | null
  managePath: string | null
}

const ALL_UPDATES_TILES: PostTile[] = [
  {
    title: 'Latest Exam',
    icon: faFileAlt,
    createPath: '/all-updates/latest-exam/new',
    managePath: '/all-updates/latest-exam',
  },
  {
    title: 'Admit Card',
    icon: faIdCard,
    createPath: '/all-updates/admit-card/new',
    managePath: '/all-updates/admit-card',
  },
  {
    title: 'Result',
    icon: faPollH,
    createPath: '/all-updates/result/new',
    managePath: '/all-updates/result',
  },
  {
    title: 'Upcoming Exams',
    icon: faClock,
    createPath: '/all-updates/upcoming-exam/new',
    managePath: '/all-updates/upcoming-exam',
  },
  {
    title: 'Tracked Alerts',
    icon: faBell,
    createPath: '/all-updates/tracked-alert/new',
    managePath: '/tracked-alerts',
  },
]

const PERSONALIZED_TILES: PostTile[] = [
  {
    title: 'Latest Exam',
    icon: faBullseye,
    createPath: '/personalized/latest-exam/new',
    managePath: '/personalized/latest-exam',
  },
  {
    title: 'Upcoming Exams',
    icon: faClock,
    createPath: '/personalized/upcoming-exam/new',
    managePath: '/personalized/upcoming-exam',
  },
  {
    title: 'Tracked Alerts',
    icon: faBell,
    createPath: '/personalized/tracked-alert/new',
    managePath: '/tracked-alerts',
  },
]

const CREATE_MANAGE = [
  { value: 'create', label: 'Create New' },
  { value: 'manage', label: 'Manage Published' },
] as const

// The dashboard fully remounts on every return to `/` (e.g. via the back button from a
// tile's create/manage page), which would otherwise reset these toggles to their defaults.
// Persisting the last selection in sessionStorage keeps the admin on the tab they came from.
const GROUP_STORAGE_KEY = 'dashboard.group'
const MODE_STORAGE_KEY = 'dashboard.mode'

function readStoredOption<T extends string>(key: string, options: readonly { value: T }[], fallback: T): T {
  const stored = sessionStorage.getItem(key)
  return options.some((o) => o.value === stored) ? (stored as T) : fallback
}

export function DashboardPage() {
  const [group, setGroupState] = useState<(typeof GROUPS)[number]['value']>(() =>
    readStoredOption(GROUP_STORAGE_KEY, GROUPS, 'general'),
  )
  const [mode, setModeState] = useState<(typeof CREATE_MANAGE)[number]['value']>(() =>
    readStoredOption(MODE_STORAGE_KEY, CREATE_MANAGE, 'create'),
  )
  const navigate = useNavigate()

  const setGroup = (value: (typeof GROUPS)[number]['value']) => {
    setGroupState(value)
    sessionStorage.setItem(GROUP_STORAGE_KEY, value)
  }
  const setMode = (value: (typeof CREATE_MANAGE)[number]['value']) => {
    setModeState(value)
    sessionStorage.setItem(MODE_STORAGE_KEY, value)
  }

  const postTiles = group === 'all-updates' ? ALL_UPDATES_TILES : group === 'personalized' ? PERSONALIZED_TILES : []

  return (
    <AppShell title="Admin Dashboard">
      <SegmentedToggle options={[...GROUPS]} value={group} onChange={setGroup} className="mb-6" />

      {group === 'general' && (
        <div className="space-y-3">
          {GENERAL_TILES.map((tile) => (
            <Card
              key={tile.title}
              interactive={tile.path !== null}
              className={tile.path === null ? 'opacity-60' : undefined}
              onClick={tile.path ? () => navigate(tile.path!) : undefined}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to text-primary">
                  <Icon icon={tile.icon} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-heading">{tile.title}</p>
                  <p className="text-sm text-body-subtle">{tile.subtitle}</p>
                </div>
                {tile.path !== null && <Icon icon={faChevronRight} className="text-body-subtle" />}
              </div>
            </Card>
          ))}
        </div>
      )}

      {group !== 'general' && (
        <>
          <SegmentedToggle options={[...CREATE_MANAGE]} value={mode} onChange={setMode} className="mb-6" />
          <div className="space-y-3">
            {postTiles.map((tile) => {
              const path = mode === 'create' ? tile.createPath : tile.managePath
              return (
                <Card
                  key={tile.title}
                  interactive={path !== null}
                  className={path === null ? 'opacity-60' : undefined}
                  onClick={path ? () => navigate(path) : undefined}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to text-primary">
                      <Icon icon={tile.icon} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-heading">{tile.title}</p>
                      <p className="text-sm text-body-subtle">{path === null ? 'Coming soon' : mode === 'create' ? 'Publish a new post' : 'View and edit published posts'}</p>
                    </div>
                    {path !== null && <Icon icon={faChevronRight} className="text-body-subtle" />}
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </AppShell>
  )
}
