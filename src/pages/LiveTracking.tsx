import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  // Dialog, // Removed unused import
  // DialogTitle, // Removed unused import
  // DialogContent, // Removed unused import
  // DialogActions, // Removed unused import
  // TextField, // Removed unused import
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  // Paper, // Removed unused import
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  // LocationOn as LocationIcon, // Removed unused import
  // Person as PersonIcon // Removed unused import
} from '@mui/icons-material';
import LiveTrackingMap from '../components/LiveTrackingMap';
import { liveTrackingService } from '../services/liveTrackingService';

interface Booking {
  id: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  fare: number;
  driverName?: string;
  trackingData?: {
    currentLocation: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
    locationHistory: Array<{
      latitude: number;
      longitude: number;
      timestamp: string;
    }>;
  };
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

// Transform API data to match expected interfaces
const transformBookingData = (apiBooking: any): Booking => {
  return {
    id: apiBooking.id,
    customerName: apiBooking.customerInfo?.name || 'Unknown Customer',
    pickupLocation: apiBooking.pickup?.address || 'Unknown Location',
    dropoffLocation: apiBooking.dropoff?.address || 'Unknown Location',
    status: apiBooking.status,
    fare: apiBooking.fare?.total || 0,
    driverName: apiBooking.driverInfo?.name,
    trackingData: apiBooking.trackingData ? {
      currentLocation: apiBooking.trackingData.currentLocation,
      locationHistory: apiBooking.trackingData.locationHistory || []
    } : undefined
  };
};

const transformDriverData = (apiDriver: any): Driver => {
  return {
    id: apiDriver.driverId,
    name: apiDriver.driverInfo?.name || 'Unknown Driver',
    phone: apiDriver.driverInfo?.phone || 'Unknown Phone',
    isOnline: apiDriver.isOnline,
    currentLocation: apiDriver.currentLocation
  };
};

const LiveTracking: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load live tracking data using the service
      const trackingData = await liveTrackingService.getLiveBookings();
      const driversData = await liveTrackingService.getOnlineDrivers();

      if (trackingData.success && trackingData.data) {
        const transformedBookings = trackingData.data.map(transformBookingData);
        setBookings(transformedBookings);
      } else {
        console.warn('Failed to load bookings:', trackingData.error);
        // Fallback to empty array if API fails
        setBookings([]);
      }

      if (driversData.success && driversData.data) {
        const transformedDrivers = driversData.data.map(transformDriverData);
        setDrivers(transformedDrivers);
      } else {
        console.warn('Failed to load drivers:', driversData.error);
        // Fallback to empty array if API fails
        setDrivers([]);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Set empty arrays on error
      setBookings([]);
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTracking = async () => {
    try {
      setIsTrackingActive(true);
      // Start live tracking using the service
      await liveTrackingService.startLiveTracking();
      console.log('Live tracking started');
    } catch (err) {
      console.error('Error starting tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    }
  };

  const handleStopTracking = async () => {
    try {
      setIsTrackingActive(false);
      // Stop live tracking using the service
      await liveTrackingService.stopLiveTracking();
      console.log('Live tracking stopped');
    } catch (err) {
      console.error('Error stopping tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop tracking');
    }
  };

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Live Tracking Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <IconButton onClick={loadData} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={isTrackingActive ? <StopIcon /> : <PlayIcon />}
            onClick={isTrackingActive ? handleStopTracking : handleStartTracking}
            color={isTrackingActive ? 'error' : 'primary'}
          >
            {isTrackingActive ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Live Tracking Map */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Tracking Map
              </Typography>
              <LiveTrackingMap
                onBookingSelect={handleBookingSelect}
                onDriverSelect={handleDriverSelect}
                refreshInterval={10000}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Active Bookings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Bookings ({bookings.length})
              </Typography>
              {isLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {bookings.map((booking) => (
                    <ListItem
                      key={booking.id}
                      button
                      onClick={() => handleBookingSelect(booking)}
                      selected={selectedBooking?.id === booking.id}
                    >
                      <ListItemText
                        primary={booking.customerName}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {booking.pickupLocation}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              → {booking.dropoffLocation}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip
                                label={booking.status}
                                color={getStatusColor(booking.status) as any}
                                size="small"
                              />
                              <Chip
                                label={`₹${booking.fare}`}
                                color="primary"
                                size="small"
                              />
                            </Box>
                            {booking.driverName && (
                              <Typography variant="body2" color="text.secondary">
                                Driver: {booking.driverName}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Online Drivers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Online Drivers ({drivers.filter(d => d.isOnline).length})
              </Typography>
              <List>
                {drivers.filter(driver => driver.isOnline).map((driver) => (
                  <ListItem
                    key={driver.id}
                    button
                    onClick={() => handleDriverSelect(driver)}
                    selected={selectedDriver?.id === driver.id}
                  >
                    <ListItemText
                      primary={driver.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {driver.phone}
                          </Typography>
                          {driver.currentLocation && (
                            <Typography variant="body2" color="text.secondary">
                              Last seen: {new Date(driver.currentLocation.timestamp).toLocaleTimeString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip label="Online" color="success" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Item Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              {selectedBooking ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Booking #{selectedBooking.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer: {selectedBooking.customerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pickup: {selectedBooking.pickupLocation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dropoff: {selectedBooking.dropoffLocation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fare: ₹{selectedBooking.fare}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {selectedBooking.status}
                  </Typography>
                  {selectedBooking.driverName && (
                    <Typography variant="body2" color="text.secondary">
                      Driver: {selectedBooking.driverName}
                    </Typography>
                  )}
                  {selectedBooking.trackingData?.currentLocation && (
                    <Typography variant="body2" color="text.secondary">
                      Last Location: {new Date(selectedBooking.trackingData.currentLocation.timestamp).toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              ) : selectedDriver ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Driver: {selectedDriver.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {selectedDriver.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {selectedDriver.isOnline ? 'Online' : 'Offline'}
                  </Typography>
                  {selectedDriver.currentLocation && (
                    <Typography variant="body2" color="text.secondary">
                      Last Location: {new Date(selectedDriver.currentLocation.timestamp).toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Select a booking or driver to view details
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveTracking;
