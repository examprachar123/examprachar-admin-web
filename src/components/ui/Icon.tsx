import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'

interface IconProps {
  icon: IconProp
  className?: string
}

export function Icon({ icon, className }: IconProps) {
  return <FontAwesomeIcon icon={icon} className={className} />
}
