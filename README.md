# EPickup Admin Dashboard

A comprehensive real-time admin dashboard for the EPickup delivery service platform built with React, TypeScript, and Material-UI.

## 🔐 Security Setup

**IMPORTANT:** Never commit your `.env` file with real credentials!

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update your `.env` file** with your actual Firebase credentials from the Firebase Console.

3. **The `.env` file is already in `.gitignore`** to prevent accidental commits.

## Features

### 🚀 Real-Time Monitoring
- Live WebSocket connections for real-time updates
- Real-time driver location tracking
- Live booking status updates
- Emergency alert notifications
- System health monitoring

### 👥 Driver Management
- Driver verification workflow
- Document verification with image viewer
- Driver status management
- Bulk approval/rejection capabilities
- Driver analytics and performance metrics

### 📦 Booking Management
- Live booking dashboard
- Trip tracking and intervention
- Fare management and adjustments
- Booking analytics and reports
- Customer and driver communication

### 🚨 Emergency Services
- Real-time emergency alert monitoring
- Priority-based alert handling
- Emergency response workflow
- Contact emergency services integration
- Emergency analytics and reporting

### 🎫 Support System
- Support ticket management
- Real-time chat support
- Ticket assignment and escalation
- Support analytics and metrics
- Broadcast messaging capabilities

### 📊 Analytics & Reporting
- Comprehensive analytics dashboard
- Revenue and booking trends
- Driver performance metrics
- System performance monitoring
- Custom report generation

### 🔧 System Monitoring
- Real-time system health monitoring
- Performance metrics tracking
- Error logging and monitoring
- Resource usage monitoring
- Automated alerting system

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Real-time**: Socket.IO Client
- **Charts**: Recharts
- **Build Tool**: Vite
- **Database**: Firebase Firestore
- **Authentication**: JWT with Firebase Auth

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+
- Access to EPickup backend API
- Firebase project credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd admin-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

Important for API URL changes:
- Vite injects VITE_API_URL and VITE_SOCKET_URL at build time.
- After changing .env values, you must rebuild and redeploy the dist output, otherwise the old backend URL remains in the live bundle.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── DriverManagement.tsx
│   ├── BookingManagement.tsx
│   ├── EmergencyServices.tsx
│   ├── SupportTickets.tsx
│   ├── SystemMonitoring.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
├── layouts/            # Layout components
├── services/           # API and external services
│   ├── apiService.ts
│   ├── authService.ts
│   ├── driverService.ts
│   ├── bookingService.ts
│   ├── emergencyService.ts
│   ├── supportService.ts
│   ├── systemService.ts
│   ├── analyticsService.ts
│   ├── websocketService.ts
│   └── firebaseService.ts
├── store/              # Redux store and slices
│   ├── index.ts
│   └── slices/
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── contexts/           # React contexts
```

## API Integration

The dashboard integrates with the EPickup backend API through the following endpoints:

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/verify-otp` - OTP verification
- `GET /api/auth/admin/profile` - Get admin profile

### Driver Management
- `GET /api/admin/drivers` - Get all drivers
- `PUT /api/admin/drivers/:id/verify` - Verify driver
- `GET /api/admin/drivers/pending-verification` - Get pending verifications

### Booking Management
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/bookings/active` - Get active bookings
- `PUT /api/admin/bookings/:id/status` - Update booking status

### Emergency Services
- `GET /api/admin/emergency/alerts` - Get emergency alerts
- `POST /api/admin/emergency/response` - Respond to emergency

### Support System
- `GET /api/admin/support/tickets` - Get support tickets
- `POST /api/admin/support/tickets/:id/message` - Send message

### System Monitoring
- `GET /api/admin/system/health` - Get system health
- `GET /api/admin/system/metrics` - Get system metrics

## Real-Time Features

The dashboard uses WebSocket connections for real-time updates:

### WebSocket Events
- `driver_verification_request` - New driver verification
- `booking_status_update` - Booking status changes
- `emergency_alert` - Emergency alerts
- `support_ticket_created` - New support tickets
- `system_health_update` - System health changes

### Real-Time Data
- Live driver locations
- Active booking updates
- Emergency alert notifications
- System health monitoring
- Support ticket updates

## Security

- JWT-based authentication
- Role-based access control
- Secure API communication
- Input validation and sanitization
- CORS configuration

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Demo Credentials

For testing purposes, use:
- Email: `admin@epickup.com`
- Password: `admin123`

**Note**: These are demo credentials for development only. Change them in production.
"# E-Pickup-Admin" 
