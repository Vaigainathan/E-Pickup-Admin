import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  LocalHospital as EmergencyIcon,
  Support as SupportIcon,
  GpsFixed as LiveTrackingIcon,
  Monitor as MonitorIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminPanelIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { RootState } from '../store'
import { logout } from '../store/slices/authSlice'
import { AdminColors } from '../constants/Colors'

const drawerWidth = 240

interface LayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Driver Management', icon: <PeopleIcon />, path: '/drivers' },
  { text: 'Customer Management', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Booking Management', icon: <LocalShippingIcon />, path: '/bookings' },
  { text: 'Live Tracking', icon: <LiveTrackingIcon />, path: '/live-tracking' },
  { text: 'Emergency Services', icon: <EmergencyIcon />, path: '/emergency' },
  { text: 'Support Tickets', icon: <SupportIcon />, path: '/support' },
  { text: 'System Monitoring', icon: <MonitorIcon />, path: '/monitoring' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Admin Management', icon: <AdminPanelIcon />, path: '/admin-management' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
]

const Layout: React.FC<LayoutProps> = React.memo(({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  
  const { user } = useSelector((state: RootState) => state.auth)
  const { activeAlerts } = useSelector((state: RootState) => state.emergency)
  const { tickets } = useSelector((state: RootState) => state.support)

  // Debug logging
  console.log('Layout render - current path:', location.pathname, 'user:', user)

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(!mobileOpen)
  }, [mobileOpen])

  const handleProfileMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleProfileMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleLogout = useCallback(() => {
    dispatch(logout())
    navigate('/login')
    handleProfileMenuClose()
  }, [dispatch, navigate, handleProfileMenuClose])

  const handleNavigation = useCallback((path: string) => {
    navigate(path)
    setMobileOpen(false)
  }, [navigate])

  const getNotificationCount = useMemo(() => {
    const activeEmergencyCount = activeAlerts.filter(alert => alert.status === 'active').length
    const openSupportCount = tickets.filter(ticket => ticket.status === 'open').length
    return activeEmergencyCount + openSupportCount
  }, [activeAlerts, tickets])

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          EPickup Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List role="list" aria-label="Navigation menu">
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding role="listitem">
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              aria-label={`Navigate to ${item.text}`}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              role="menuitem"
              tabIndex={0}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: AdminColors.primary,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(5, 1, 91, 0.9)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(5, 1, 91, 0.08)',
                },
              }}
            >
              <ListItemIcon aria-hidden="true">
                {item.text === 'Emergency Services' && getNotificationCount > 0 ? (
                  <Badge 
                    badgeContent={activeAlerts.filter(alert => alert.status === 'active').length} 
                    color="error"
                    aria-label={`${activeAlerts.filter(alert => alert.status === 'active').length} active emergency alerts`}
                  >
                    {item.icon}
                  </Badge>
                ) : item.text === 'Support Tickets' && getNotificationCount > 0 ? (
                  <Badge 
                    badgeContent={tickets.filter(ticket => ticket.status === 'open').length} 
                    color="warning"
                    aria-label={`${tickets.filter(ticket => ticket.status === 'open').length} open support tickets`}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: AdminColors.primary,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={getNotificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="Main navigation"
        role="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        id="main-content"
        role="main"
        aria-label="Main content"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  )
})

Layout.displayName = 'Layout'

export default Layout
