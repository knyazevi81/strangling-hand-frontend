import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#185FA5',
      light: '#378ADD',
      dark: '#042C53',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#378ADD',
      light: '#B5D4F4',
      dark: '#0C447C',
    },
    background: {
      default: '#F0F4FF',
      paper: '#ffffff',
    },
    success: { main: '#1B7F4A' },
    error: { main: '#C0392B' },
    warning: { main: '#C07A00' },
    text: {
      primary: '#042C53',
      secondary: '#378ADD',
    },
    divider: '#E6F1FB',
  },
  typography: {
    fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
    h5: { fontWeight: 600, color: '#042C53' },
    h6: { fontWeight: 600, color: '#042C53' },
    subtitle1: { fontWeight: 500 },
    body2: { fontSize: '0.82rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#F0F4FF',
          minHeight: '100vh',
          WebkitTapHighlightColor: 'transparent',
          overscrollBehavior: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: '#ffffff',
          border: '1px solid #B5D4F4',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(24,95,165,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"Outfit", sans-serif',
          fontSize: '0.9rem',
        },
        contained: {
          background: '#185FA5',
          boxShadow: 'none',
          '&:hover': { background: '#0C447C', boxShadow: 'none' },
        },
        outlined: {
          borderColor: '#B5D4F4',
          color: '#185FA5',
          '&:hover': { background: '#E6F1FB', borderColor: '#185FA5' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: '#ffffff',
            '& fieldset': { borderColor: '#B5D4F4' },
            '&:hover fieldset': { borderColor: '#185FA5' },
            '&.Mui-focused fieldset': { borderColor: '#185FA5', borderWidth: 1.5 },
          },
          '& .MuiInputLabel-root': { color: '#378ADD' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#185FA5' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 500,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          borderTop: '1px solid #E6F1FB',
          height: 60,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#B5D4F4',
          minWidth: 64,
          '&.Mui-selected': { color: '#185FA5' },
          '& .MuiBottomNavigationAction-label': {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 500,
            fontSize: '0.7rem',
            '&.Mui-selected': { fontSize: '0.7rem' },
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
          color: '#378ADD',
          '&.Mui-selected': { color: '#185FA5' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { background: '#185FA5', borderRadius: 2 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#ffffff',
          border: '1px solid #B5D4F4',
          borderRadius: 20,
          margin: 16,
          width: 'calc(100% - 32px)',
          maxWidth: 480,
          boxShadow: '0 8px 32px rgba(24,95,165,0.12)',
        },
      },
    },
    MuiSnackbar: {
      defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
})
