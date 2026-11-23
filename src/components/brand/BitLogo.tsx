import { BIT_PATHS, type BitMood } from './bitPaths'

/** Бит — пиксельный маскот Savebit. tile — на светлой скруглённой плитке (как иконка приложения). */
export default function BitLogo({ size = 32, mood = 'main', tile = false, title }: {
  size?: number; mood?: BitMood; tile?: boolean; title?: string
}) {
  return (
    <svg width={size} height={size} viewBox={tile ? '-3 -3 30 30' : '0 0 24 24'} shapeRendering="crispEdges"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      style={{ display: 'block', flexShrink: 0 }}>
      {tile && <rect x="-3" y="-3" width="30" height="30" rx="7.5" fill="#E6F1FB" />}
      {BIT_PATHS[mood].map(([fill, d]) => <path key={fill} fill={fill} d={d} />)}
    </svg>
  )
}

/** Живой Бит (GIF из /mascot): idle — машет, happy — прыгает, connecting, offline, sleep. */
export function BitAnimated({ state = 'idle', height = 112, alt = '' }: {
  state?: 'idle' | 'happy' | 'connecting' | 'offline' | 'sleep'; height?: number; alt?: string
}) {
  return (
    <img src={`/mascot/bit-${state}.gif`} alt={alt} height={height} width={Math.round(height * 24 / 28)}
      style={{ imageRendering: 'pixelated', display: 'block' }} />
  )
}
