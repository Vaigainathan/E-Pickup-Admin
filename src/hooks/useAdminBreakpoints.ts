import { useMediaQuery, useTheme } from '@mui/material'

export function useAdminBreakpoints() {
  const theme = useTheme()
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  return { isPhone, isTablet, isMobileDialog: isPhone }
}
