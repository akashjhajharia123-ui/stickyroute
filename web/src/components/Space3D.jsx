import { lazy, Suspense, useEffect, useState } from 'react'

const Galaxy = lazy(() => import('./rb/Galaxy.jsx'))

const WIDE_SCREEN_PX = 760
const STAR_COLORS = ['#4f8df5', '#7fb0ff', '#f0954f', '#ffffff']

/**
 * A fixed 3D starfield behind the whole page (React Bits Galaxy). It mounts only once the reader
 * scrolls past most of the hero, so it never competes with the hero's highway for the GPU, and
 * only on wide screens without reduced motion.
 */
export default function Space3D() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const capable = window.matchMedia(`(min-width: ${WIDE_SCREEN_PX}px) and (prefers-reduced-motion: no-preference)`)
    const hero = document.getElementById('top')
    if (!capable.matches || !hero) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.4) {
        setShow(true)
        observer.disconnect()
      }
    }, { threshold: [0, 0.4, 1] })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="space3d" aria-hidden="true">
      {show ? (
        <Suspense fallback={null}>
          <Galaxy
            starColors={STAR_COLORS}
            density={0.9}
            starSpeed={0.35}
            speed={0.6}
            glowIntensity={0.35}
            twinkleIntensity={0.4}
            mouseRepulsion
            repulsionStrength={1.5}
            clickWarp={false}
            transparent
            opacity={0.85}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
