import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  // IconButton, // Removed unused import
  // Tooltip, // Removed unused import
  Avatar,
} from '@mui/material'
import {
  Monitor as MonitorIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  // Memory as MemoryIcon, // Removed unused import
  Storage as StorageIcon,
  // Speed as SpeedIcon, // Removed unused import
  People as PeopleIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { RootState } from '../store'
import { fetchSystemHealth, fetchSystemMetrics, fetchConnectedUsers, fetchSystemLogs } from '../store/slices/systemSlice'

const SystemMonitoring: React.FC = () => {
  const dispatch = useAppDispatch()
  const { health, metrics, connectedUsers, logs, loading } = useSelector((state: RootState) => state.system)
  
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        dispatch(fetchSystemHealth()),
        dispatch(fetchSystemMetrics()),
        dispatch(fetchConnectedUsers()),
        dispatch(fetchSystemLogs({ limit: 50 })),
      ])
      setLastUpdated(new Date())
    }

    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(fetchSystemHealth())
    dispatch(fetchSystemMetrics())
    dispatch(fetchConnectedUsers())
    setLastUpdated(new Date())
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon />
      case 'warning': return <WarningIcon />
      case 'critical': return <ErrorIcon />
      default: return <WarningIcon />
    }
  }

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds < 0) return '0d 0h 0m'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  // const formatBytes = (bytes: number) => { // Removed unused function
  //   if (!bytes || bytes === 0) return '0 Bytes'
  //   const k = 1024
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  //   const i = Math.floor(Math.log(bytes) / Math.log(k))
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  // }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          System Monitoring
        </Typography>
        <Box display="flex" gap={2}>
          <Typography variant="body2" color="textSecondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    System Status
                  </Typography>
                  <Typography variant="h4" component="h2" fontWeight="bold" color={`${getHealthColor(health.status)}.main`}>
                    {health.status.toUpperCase()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${getHealthColor(health.status)}.main`, width: 56, height: 56 }}>
                  {getHealthIcon(health.status)}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Uptime
                  </Typography>
                  <Typography variant="h4" component="h2" fontWeight="bold">
                    {formatUptime(health.uptime)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <MonitorIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Connected Users
                  </Typography>
                  <Typography variant="h4" component="h2" fontWeight="bold">
                    {connectedUsers.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Service Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Status
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CloudIcon color={health.services.api ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="API Service"
                    secondary={health.services.api ? 'Online' : 'Offline'}
                  />
                  <Chip
                    label={health.services.api ? 'Online' : 'Offline'}
                    color={health.services.api ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StorageIcon color={health.services.database ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Database"
                    secondary={health.services.database ? 'Connected' : 'Disconnected'}
                  />
                  <Chip
                    label={health.services.database ? 'Online' : 'Offline'}
                    color={health.services.database ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MonitorIcon color={health.services.websocket ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="WebSocket"
                    secondary={health.services.websocket ? 'Connected' : 'Disconnected'}
                  />
                  <Chip
                    label={health.services.websocket ? 'Online' : 'Offline'}
                    color={health.services.websocket ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CloudIcon color={health.services.firebase ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Firebase"
                    secondary={health.services.firebase ? 'Connected' : 'Disconnected'}
                  />
                  <Chip
                    label={health.services.firebase ? 'Online' : 'Offline'}
                    color={health.services.firebase ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Metrics
              </Typography>
              {metrics && (
                <Box>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">CPU Usage</Typography>
                      <Typography variant="body2">{metrics.systemMetrics?.server?.cpu || 0}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.systemMetrics?.server?.cpu || 0}
                      color={(metrics.systemMetrics?.server?.cpu || 0) > 80 ? 'error' : (metrics.systemMetrics?.server?.cpu || 0) > 60 ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Memory Usage</Typography>
                      <Typography variant="body2">{metrics.systemMetrics?.server?.memory || 0}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.systemMetrics?.server?.memory || 0}
                      color={(metrics.systemMetrics?.server?.memory || 0) > 80 ? 'error' : (metrics.systemMetrics?.server?.memory || 0) > 60 ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Disk Usage</Typography>
                      <Typography variant="body2">{metrics.systemMetrics?.server?.disk || 0}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.systemMetrics?.server?.disk || 0}
                      color={(metrics.systemMetrics?.server?.disk || 0) > 80 ? 'error' : (metrics.systemMetrics?.server?.disk || 0) > 60 ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">API Response Time</Typography>
                    <Typography variant="body2">{metrics.systemMetrics?.api?.responseTime || 0}ms</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Database Connections</Typography>
                    <Typography variant="body2">{metrics.systemMetrics?.database?.connections || 0}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Error Rate</Typography>
                    <Typography variant="body2" color={(metrics.systemMetrics?.api?.errorRate || 0) > 5 ? 'error.main' : 'success.main'}>
                      {metrics.systemMetrics?.api?.errorRate || 0}%
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Connected Users */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connected Users
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {connectedUsers.customers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Customers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                      {connectedUsers.drivers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Drivers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {connectedUsers.admins}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Admins
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {connectedUsers.total}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Logs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent System Logs
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.slice(0, 10).map((log: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.level}
                            color={log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {log.message}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SystemMonitoring
