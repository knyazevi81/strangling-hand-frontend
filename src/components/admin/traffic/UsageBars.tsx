import { Box, Typography } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { bytes } from '../../vpn/utils'

const SERIES = '#185FA5'     // единственная серия: цвет бренда, легенда не нужна, подпись в заголовке
const GRID = '#E6F1FB'
const INK_MUTED = '#5B7BA3'

export interface UsagePoint {
  label: string      // подпись на оси
  title: string      // заголовок подсказки
  up: number
  down: number
  totalOnly?: boolean // направления неизвестны: в подсказке только сумма
}

/** Одна единица на всю ось (по максимуму), чтобы деления были круглыми: 0 / 50 / 100 МБ. */
function axisUnit(max: number): { div: number; name: string } {
  const units = [{ div: 1024 ** 3, name: 'ГБ' }, { div: 1024 ** 2, name: 'МБ' }, { div: 1024, name: 'КБ' }]
  return units.find((u) => max >= u.div) ?? { div: 1, name: 'Б' }
}

function TipBox({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p: UsagePoint = payload[0].payload
  return (
    <Box sx={{
      background: '#fff', border: '1px solid #B5D4F4', borderRadius: 2, px: 1.25, py: 0.75,
      boxShadow: '0 2px 8px rgba(24,95,165,0.12)',
    }}>
      <Typography variant="caption" color="#042C53" fontWeight={600} display="block">{p.title}</Typography>
      <Typography variant="caption" color="#042C53" display="block">Всего: {bytes(p.up + p.down)}</Typography>
      {!p.totalOnly && (
        <Typography variant="caption" color={INK_MUTED} display="block">
          ↓ {bytes(p.down)} · ↑ {bytes(p.up)}
        </Typography>
      )}
    </Box>
  )
}

/** Столбцы трафика: одна серия (сумма вверх+вниз), подсказка раскрывает направления. */
export default function UsageBars({ data, height = 180, tickEvery }: {
  data: UsagePoint[]
  height?: number
  tickEvery?: number
}) {
  const unit = axisUnit(Math.max(0, ...data.map((d) => d.up + d.down)))
  const rows = data.map((d) => ({ ...d, total: (d.up + d.down) / unit.div }))
  const interval = tickEvery ?? Math.max(0, Math.ceil(rows.length / 7) - 1)
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
          <XAxis dataKey="label" interval={interval} tickLine={false} axisLine={{ stroke: GRID }}
            tick={{ fontSize: 10, fill: INK_MUTED }} />
          <YAxis tickFormatter={(v: number) => (v === 0 ? '0' : `${v} ${unit.name}`)} tickLine={false}
            axisLine={false} width={52} tick={{ fontSize: 10, fill: INK_MUTED }} />
          <Tooltip content={<TipBox />} cursor={{ fill: 'rgba(24,95,165,0.06)' }} />
          <Bar dataKey="total" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
