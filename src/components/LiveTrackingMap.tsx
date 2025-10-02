import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material';

interface LiveTrackingMapProps {
  onBookingSelect?: (booking: any) => void;
  onDriverSelect?: (driver: any) => void;
  refreshInterval?: number;
}

interface Booking {
  id: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  fare: number;
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

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  onBookingSelect,
  onDriverSelect,
  refreshInterval = 10000
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadTrackingData();
    const interval = setInterval(loadTrackingData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadTrackingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockBookings: Booking[] = [
        {
          id: '1',
          customerName: 'John Doe',
          pickupLocation: '123 Main St, City',
          dropoffLocation: '456 Oak Ave, City',
          status: 'in_progress',
          fare: 150,
          trackingData: {
            currentLocation: {
              latitude: 12.9716,
              longitude: 77.5946,
              timestamp: new Date().toISOString()
            },
            locationHistory: [
              { latitude: 12.9716, longitude: 77.5946, timestamp: new Date().toISOString() }
            ]
          }
        }
      ];

      const mockDrivers: Driver[] = [
        {
          id: '1',
          name: 'Driver Smith',
          phone: '+91 9876543210',
          isOnline: true,
          currentLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            timestamp: new Date().toISOString()
          }
        }
      ];

      setBookings(mockBookings);
      setDrivers(mockDrivers);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    onBookingSelect?.(booking);
  };

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
    onDriverSelect?.(driver);
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading live tracking data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Error Loading Data</Typography>
        <Typography>{error}</Typography>
        <Button onClick={loadTrackingData} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          Live Tracking Dashboard
        </Typography>
        <Box>
          <IconButton onClick={loadTrackingData} color="primary">
            <RefreshIcon />
          </IconButton>
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Map Placeholder */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box textAlign="center">
              <LocationIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Interactive Map View
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bookings.length} active bookings, {drivers.filter(d => d.isOnline).length} online drivers
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Active Bookings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Bookings ({bookings.length})
              </Typography>
              <List>
                {bookings.map((booking) => (
                  <React.Fragment key={booking.id}>
                    <ListItem
                      button
                      onClick={() => handleBookingSelect(booking)}
                      selected={selectedBooking?.id === booking.id}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <TruckIcon />
                        </Avatar>
                      </ListItemAvatar>
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
                            <Chip
                              label={booking.status}
                              color={getStatusColor(booking.status) as any}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
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
                  <React.Fragment key={driver.id}>
                    <ListItem
                      button
                      onClick={() => handleDriverSelect(driver)}
                      selected={selectedDriver?.id === driver.id}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
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
                    </ListItem>
                    <Divider />
                  </React.Fragment>
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

export default LiveTrackingMap;
