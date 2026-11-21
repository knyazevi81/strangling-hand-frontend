import { Component, type ReactNode } from 'react'
import { Alert, Button } from '@mui/material'

/** Ошибка в одном блоке не должна превращать всё приложение в белый экран. */
export default class ErrorBoundary extends Component<{ children: ReactNode; title?: string }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <Alert severity="error" sx={{ mb: 2 }}
        action={<Button color="inherit" size="small" onClick={() => this.setState({ error: null })}>Ещё раз</Button>}>
        {this.props.title ?? 'Этот блок не загрузился'}. Остальное работает, попробуй обновить страницу.
      </Alert>
    )
  }
}
