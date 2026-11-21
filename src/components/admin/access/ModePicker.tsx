import { Box, ButtonBase, Typography } from '@mui/material'

export interface ModeOption<T extends string> { value: T; title: string; sub: string }

/** Две большие кнопки режима, как в макете. */
export default function ModePicker<T extends string>({ value, options, onChange }: {
  value: T; options: ModeOption<T>[]; onChange: (v: T) => void
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
      {options.map((o) => {
        const sel = o.value === value
        return (
          <ButtonBase key={o.value} onClick={() => onChange(o.value)} aria-pressed={sel}
            sx={{
              display: 'block', textAlign: 'left', borderRadius: 3, p: 1.25, minHeight: 60,
              border: `1px solid ${sel ? '#185FA5' : '#B5D4F4'}`, background: sel ? '#E6F1FB' : '#fff',
            }}>
            <Typography variant="body2" fontWeight={600} color="#042C53">{o.title}</Typography>
            <Typography variant="caption" color="#1E5A9A">{o.sub}</Typography>
          </ButtonBase>
        )
      })}
    </Box>
  )
}
