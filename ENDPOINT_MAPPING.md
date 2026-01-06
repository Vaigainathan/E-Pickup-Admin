# Admin Dashboard - Backend Endpoint Mapping

**Date:** 2024-12-19  
**Purpose:** Complete mapping of backend admin endpoints to admin-dashboard service methods

---

## Endpoint Mapping Status

### ✅ IMPLEMENTED ENDPOINTS

#### Driver Management
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/drivers` | `comprehensiveAdminService.getDrivers()` | comprehensiveAdminService.ts:240 | ✅ Used |
| `GET /api/admin/drivers/pending` | `comprehensiveAdminService.getPendingVerifications()` | comprehensiveAdminService.ts:282 | ✅ Used |
| `GET /api/admin/drivers/:driverId/documents` | `comprehensiveAdminService.getDriverDocuments()` | comprehensiveAdminService.ts:1701 | ✅ Used |
| `GET /api/admin/drivers/:driverId/work-slots` | `apiService.getDriverWorkSlots()` | apiService.ts:349 | ✅ Service exists, **NO UI** |
| `GET /api/admin/drivers/:driverId/rejection-history` | `apiService.getDriverRejectionHistory()` | apiService.ts:361 | ✅ Service exists, **NO UI** |
| `GET /api/admin/drivers/:driverId/wallet` | `comprehensiveAdminService.getDriverWallet()` | comprehensiveAdminService.ts:1471 | ✅ Used |
| `GET /api/admin/drivers/:driverId/earnings` | `comprehensiveAdminService.getDriverEarnings()` | comprehensiveAdminService.ts:1426 | ✅ Used |
| `POST /api/admin/drivers/:driverId/verify` | `comprehensiveAdminService.verifyDriver()` | comprehensiveAdminService.ts:627 | ✅ Used |
| `POST /api/admin/drivers/:driverId/documents/:documentType/verify` | `comprehensiveAdminService.verifyDocument()` | comprehensiveAdminService.ts:2233 | ✅ Used |
| `POST /api/admin/drivers/:driverId/sync-status` | `comprehensiveAdminService.syncDriverStatus()` | comprehensiveAdminService.ts:1860 | ✅ Service exists, **NO UI button** |
| `POST /api/admin/sync-all-drivers-status` | `comprehensiveAdminService.syncAllDriversStatus()` | comprehensiveAdminService.ts:1933 | ✅ Service exists, **NO UI button** |
| `PUT /api/admin/drivers/:id/ban` | `comprehensiveAdminService.banDriver()` | comprehensiveAdminService.ts:168 | ✅ Used |
| `DELETE /api/admin/drivers/:id` | `comprehensiveAdminService.deleteDriver()` | comprehensiveAdminService.ts:122 | ✅ Used |

#### Booking Management
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/bookings` | `comprehensiveAdminService.getBookings()` | comprehensiveAdminService.ts:314 | ✅ Used |
| `GET /api/admin/bookings/active` | `bookingService.getActiveBookings()` | bookingService.ts:33 | ✅ Used |
| `GET /api/admin/bookings/:id` | `bookingService.getBookingById()` | bookingService.ts:42 | ✅ Used |
| `PUT /api/admin/bookings/:id/status` | `bookingService.updateBookingStatus()` | bookingService.ts:51 | ✅ Used |
| `POST /api/admin/bookings/:id/intervene` | `bookingService.interveneBooking()` | bookingService.ts:60 | ✅ Service exists, **NO UI** |
| `DELETE /api/admin/bookings/:id` | `bookingService.deleteBooking()` | bookingService.ts:159 | ✅ Used |
| `GET /api/admin/bookings/cancellations` | `comprehensiveAdminService.getCancellations()` | comprehensiveAdminService.ts:2824 | ✅ Used |
| `GET /api/admin/bookings/:bookingId/cancellation-details` | `comprehensiveAdminService.getCancellationDetails()` | comprehensiveAdminService.ts:2856 | ✅ Used |

#### Customer Management
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/customers` | `comprehensiveAdminService.getCustomers()` | comprehensiveAdminService.ts:1039 | ✅ Used |
| `GET /api/admin/customers/:id` | `customerService.getCustomer()` | customerService.ts:68 | ✅ Used |
| `GET /api/admin/customers/:id/bookings` | `customerService.getCustomerBookings()` | customerService.ts:203 | ✅ Used, **UI is basic** |
| `PUT /api/admin/customers/:id/status` | `customerService.updateCustomerStatus()` | customerService.ts:102 | ✅ Used |
| `PUT /api/admin/customers/:id/ban` | `customerService.banCustomer()` | customerService.ts:136 | ✅ Used |
| `PUT /api/admin/customers/:id/name` | ❌ **MISSING** | - | ❌ **No service method** |
| `DELETE /api/admin/customers/:id` | `customerService.deleteCustomer()` | customerService.ts:170 | ✅ Used |

#### Support Tickets
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/support/tickets` | `comprehensiveAdminService.getSupportTickets()` | comprehensiveAdminService.ts:1070 | ✅ Used |
| `POST /api/admin/support/tickets/:ticketId/resolve` | ❌ **MISSING** | - | ❌ **No service method** |

#### System & Settings
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/system/health` | `comprehensiveAdminService.getSystemHealth()` | comprehensiveAdminService.ts:1210 | ✅ Used |
| `GET /api/admin/system/backups` | `settingsService.getBackups()` | settingsService.ts:78 | ✅ Used, **UI is basic** |
| `POST /api/admin/system/backup` | `settingsService.backupData()` | settingsService.ts:38 | ✅ Used, **UI is basic** |
| `POST /api/admin/system/restore` | `settingsService.restoreData()` | settingsService.ts:46 | ✅ Used, **UI is basic** |
| `POST /api/admin/system/clear-cache` | `settingsService.clearCache()` | settingsService.ts:54 | ✅ Used, **UI is basic** |
| `POST /api/admin/system/restart` | `settingsService.restartSystem()` | settingsService.ts:62 | ✅ Used, **UI is basic** |
| `GET /api/admin/settings` | `settingsService.fetchSettings()` | settingsService.ts:22 | ✅ Used |
| `PUT /api/admin/settings` | `settingsService.updateSettings()` | settingsService.ts:30 | ✅ Used |

#### Revenue & Analytics
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/revenue/summary` | `comprehensiveAdminService.getRevenueSummary()` | comprehensiveAdminService.ts:1270 | ✅ Used |
| `GET /api/admin/revenue/total` | `comprehensiveAdminService.getTotalRevenue()` | comprehensiveAdminService.ts:1303 | ✅ Used |
| `GET /api/admin/revenue/period` | `comprehensiveAdminService.getRevenueByPeriod()` | comprehensiveAdminService.ts:1347 | ✅ Used |
| `GET /api/admin/revenue/trends` | ❌ **MISSING** | - | ❌ **No service method** |
| `GET /api/admin/revenue/real-money` | ❌ **MISSING** | - | ❌ **No service method** |
| `GET /api/admin/revenue/stats` | `comprehensiveAdminService.getRevenueStats()` | comprehensiveAdminService.ts:1504 | ✅ Used |
| `GET /api/admin/analytics/drivers` | `analyticsService.getDriverAnalytics()` | analyticsService.ts:86 | ✅ Service exists, **UI incomplete** |
| `GET /api/admin/analytics/bookings` | `analyticsService.getBookingAnalytics()` | analyticsService.ts:94 | ✅ Service exists, **UI incomplete** |
| `GET /api/admin/analytics/support` | `analyticsService.getSupportAnalytics()` | analyticsService.ts:126 | ✅ Service exists, **UI incomplete** |
| `GET /api/admin/verification/stats` | `comprehensiveAdminService.getVerificationStatistics()` | comprehensiveAdminService.ts:1969 | ✅ Service exists, **NO UI** |

#### Emergency Services
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/emergency-alerts` | `comprehensiveAdminService.getEmergencyAlerts()` | comprehensiveAdminService.ts:345 | ✅ Used |

#### Admin Management
| Backend Endpoint | Service Method | Location | Status |
|-----------------|----------------|----------|--------|
| `GET /api/admin/admins` | `apiService.get('/api/admin/admins')` | AdminManagement.tsx:94 | ✅ Used |
| `POST /api/admin/admins` | `apiService.post('/api/admin/admins')` | AdminManagement.tsx:162 | ✅ Used |
| `PUT /api/admin/admins/:uid` | `apiService.put('/api/admin/admins/:uid')` | AdminManagement.tsx:160 | ✅ Used |
| `DELETE /api/admin/admins/:uid` | `apiService.delete('/api/admin/admins/:uid')` | AdminManagement.tsx:179 | ✅ Used |

---

## ❌ MISSING SERVICE METHODS

These backend endpoints exist but have **NO service method** in admin-dashboard:

1. **`PUT /api/admin/customers/:id/name`** - Customer name update
2. **`POST /api/admin/support/tickets/:ticketId/resolve`** - Support ticket resolution
3. **`GET /api/admin/revenue/trends`** - Revenue trends (detailed)
4. **`GET /api/admin/revenue/real-money`** - Real money revenue breakdown

---

## ⚠️ PARTIALLY IMPLEMENTED (Service exists, UI missing/incomplete)

1. **Driver Work Slots** - Service: ✅, UI: ❌
2. **Driver Rejection History** - Service: ✅, UI: ❌
3. **Booking Intervention** - Service: ✅, UI: ❌
4. **System Backups Management** - Service: ✅, UI: ⚠️ Basic
5. **Customer Bookings History** - Service: ✅, UI: ⚠️ Basic
6. **Driver Sync Status** - Service: ✅, UI buttons: ❌
7. **Verification Statistics** - Service: ✅, UI: ❌
8. **Revenue Analytics** - Service: ⚠️ Partial, UI: ⚠️ Partial
9. **Driver Analytics** - Service: ✅, UI: ⚠️ Incomplete
10. **Support Analytics** - Service: ✅, UI: ⚠️ Incomplete
11. **Booking Analytics** - Service: ✅, UI: ⚠️ Incomplete

---

## Implementation Priority

### High Priority (Critical - Service exists, UI missing)
1. Booking Intervention UI
2. System Backups Management UI enhancement

### Medium Priority (Service exists, UI missing/incomplete)
3. Driver Work Slots UI
4. Driver Rejection History UI
5. Customer Bookings History enhancement
6. Support Ticket Resolution (needs service method + UI)
7. Customer Name Update (needs service method + UI)

### Low Priority (Analytics & Enhancements)
8. Verification Statistics Dashboard
9. Driver Sync Status UI buttons
10. Revenue Analytics enhancement
11. Driver Analytics completion
12. Support Analytics completion
13. Booking Analytics completion

---

**Last Updated:** 2024-12-19

