import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff',
      light: '#6effff',
      dark: '#00b2cc',
      contrastText: '#000',
    },
    secondary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    background: {
      default: '#080810',
      paper: '#0f0f1a',
    },
    success: { main: '#00e676' },
    error: { main: '#ff1744' },
    warning: { main: '#ff9100' },
    text: {
      primary: '#e8eaf6',
      secondary: '#9e9eb8',
    },
    divider: 'rgba(255,255,255,0.07)',
  },
  typography: {
    fontFamily: '"Outfit", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontFamily: '"Outfit", sans-serif' },
    body2: { fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#080810',
          minHeight: '100vh',
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent',
        },
        '*': { boxSizing: 'border-box' },
        '::-webkit-scrollbar': { width: 4 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(0,229,255,0.2)',
          borderRadius: 4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"Outfit", sans-serif',
          fontSize: '0.95rem',
          letterSpacing: 0.3,
        },
        contained: {
          boxShadow: '0 0 20px rgba(0,229,255,0.25)',
          '&:hover': {
            boxShadow: '0 0 30px rgba(0,229,255,0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(0,229,255,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#00e5ff' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 10, fontFamily: '"Outfit", sans-serif' },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: 'rgba(10,10,20,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.4)',
          '&.Mui-selected': { color: '#00e5ff' },
          '& .MuiBottomNavigationAction-label': {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 500,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 500,
          fontSize: '0.9rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#0f0f1a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          margin: 16,
          width: 'calc(100% - 32px)',
          maxWidth: 480,
        },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
    },
  },
})
