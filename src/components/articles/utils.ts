const TAG_PRESETS = [
  { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4' },
  { bg: '#EAF3DE', color: '#3B6D11', border: '#C0DD97' },
  { bg: '#EEEDFE', color: '#534AB7', border: '#AFA9EC' },
  { bg: '#FAECE7', color: '#993C1D', border: '#F0997B' },
  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  { bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
]

export function getTagColor(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  }
  return TAG_PRESETS[hash % TAG_PRESETS.length]
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateStr))
}
