import { faArrowLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'

interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export function Header({ title, showBack = false, onBack }: HeaderProps) {
  const navigate = useNavigate()
  const { logout, admin } = useAuth()

  return (
    <header className="relative overflow-hidden rounded-b-[32px] bg-primary px-6 pb-8 pt-6 text-white">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative mx-auto flex max-w-[800px] items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={onBack ?? (() => navigate(-1))}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-[10px] hover:bg-white/25"
            >
              <Icon icon={faArrowLeft} />
            </button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-[10px]">
            {admin?.name || admin?.username || 'Admin'}
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-[10px] hover:bg-white/25"
          >
            <Icon icon={faRightFromBracket} />
          </button>
        </div>
      </div>
    </header>
  )
}
