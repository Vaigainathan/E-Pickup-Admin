import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon
} from '@mui/icons-material';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  rating: number;
  totalTrips: number;
}

interface ManualDriverAssignmentProps {
  bookingId: string;
  currentDriverId?: string;
  onAssignmentComplete: (driverId: string, reason: string) => void;
  onClose: () => void;
}

const ManualDriverAssignment: React.FC<ManualDriverAssignmentProps> = ({
  bookingId,
  currentDriverId,
  onAssignmentComplete,
  onClose
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableDrivers();
  }, []);

  const loadAvailableDrivers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data - replace with actual API call
      const mockDrivers: Driver[] = [
        {
          id: '1',
          name: 'John Smith',
          phone: '+91 9876543210',
          vehicleNumber: 'TN-01-AB-1234',
          isOnline: true,
          currentLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: '123 Main St, Bangalore'
          },
          rating: 4.8,
          totalTrips: 150
        },
        {
          id: '2',
          name: 'Mike Johnson',
          phone: '+91 9876543211',
          vehicleNumber: 'TN-01-CD-5678',
          isOnline: true,
          currentLocation: {
            latitude: 12.9756,
            longitude: 77.5996,
            address: '456 Oak Ave, Bangalore'
          },
          rating: 4.6,
          totalTrips: 120
        },
        {
          id: '3',
          name: 'Sarah Wilson',
          phone: '+91 9876543212',
          vehicleNumber: 'TN-01-EF-9012',
          isOnline: false,
          currentLocation: {
            latitude: 12.9676,
            longitude: 77.5896,
            address: '789 Pine St, Bangalore'
          },
          rating: 4.9,
          totalTrips: 200
        }
      ];

      setDrivers(mockDrivers);
    } catch (err) {
      console.error('Error loading drivers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const handleAssign = () => {
    if (!selectedDriver) return;
    setShowReasonModal(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedDriver || !reason.trim()) return;

    try {
      setIsAssigning(true);
      
      // Mock API call - replace with actual assignment logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onAssignmentComplete(selectedDriver.id, reason);
      onClose();
    } catch (err) {
      console.error('Error assigning driver:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign driver');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery) ||
    driver.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineDrivers = filteredDrivers.filter(driver => driver.isOnline);
  const offlineDrivers = filteredDrivers.filter(driver => !driver.isOnline);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Assign Driver to Booking #{bookingId}
        </Typography>
        {currentDriverId && (
          <Typography variant="body2" color="text.secondary">
            Current Driver ID: {currentDriverId}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Search drivers"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Online Drivers */}
            <Typography variant="h6" gutterBottom>
              Online Drivers ({onlineDrivers.length})
            </Typography>
            <List>
              {onlineDrivers.map((driver) => (
                <ListItem
                  key={driver.id}
                  button
                  onClick={() => handleDriverSelect(driver)}
                  selected={selectedDriver?.id === driver.id}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">{driver.name}</Typography>
                        <Chip label="Online" color="success" size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <PhoneIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {driver.phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Vehicle: {driver.vehicleNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rating: {driver.rating} • Trips: {driver.totalTrips}
                        </Typography>
                        {driver.currentLocation && (
                          <Typography variant="body2" color="text.secondary">
                            <LocationIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {driver.currentLocation.address}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {selectedDriver?.id === driver.id && (
                      <CheckIcon color="primary" />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {/* Offline Drivers */}
            {offlineDrivers.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Offline Drivers ({offlineDrivers.length})
                </Typography>
                <List>
                  {offlineDrivers.map((driver) => (
                    <ListItem
                      key={driver.id}
                      button
                      onClick={() => handleDriverSelect(driver)}
                      selected={selectedDriver?.id === driver.id}
                      disabled={!driver.isOnline}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">{driver.name}</Typography>
                            <Chip label="Offline" color="default" size="small" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <PhoneIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                              {driver.phone}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Vehicle: {driver.vehicleNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Rating: {driver.rating} • Trips: {driver.totalTrips}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        {selectedDriver?.id === driver.id && (
                          <CheckIcon color="primary" />
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {filteredDrivers.length === 0 && (
              <Typography color="text.secondary" textAlign="center" p={3}>
                No drivers found matching your search.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isAssigning}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={!selectedDriver || isAssigning}
        >
          Assign Driver
        </Button>
      </DialogActions>

      {/* Reason Modal */}
      <Dialog open={showReasonModal} onClose={() => setShowReasonModal(false)}>
        <DialogTitle>Assignment Reason</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for assignment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for assigning this driver..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReasonModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAssignment}
            variant="contained"
            disabled={!reason.trim() || isAssigning}
          >
            {isAssigning ? <CircularProgress size={20} /> : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ManualDriverAssignment;
