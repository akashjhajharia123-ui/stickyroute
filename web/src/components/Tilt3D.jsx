import { useRef } from 'react'

const MAX_TILT_DEG = 8

const canTilt = () =>
  window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches

/**
 * Tilts its content toward the cursor in 3D and lifts it slightly. On touch screens and with
 * reduced motion it renders flat.
 * @param {{children: import('react').ReactNode, className?: string, max?: number, as?: string}} props
 */
export default function Tilt3D({ children, className = '', max = MAX_TILT_DEG, as: Tag = 'div' }) {
  const ref = useRef(null)

  const onMove = e => {
    const el = ref.current
    if (!el || !canTilt()) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`)
    el.style.setProperty('--lift', '18px')
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--lift', '0px')
  }

  return (
    <Tag ref={ref} className={`tilt3d ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </Tag>
  )
}
