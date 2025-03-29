# EventConnect Pages

This directory contains the main page components for the EventConnect application.

## Page Structure

Pages are organized based on user roles and functionality:

### Public Pages
- `HomePage`: Landing page for the application
- `AboutPage`: Information about the platform
- `EventsPage`: Public event discovery page
- `EventDetailPage`: Public event details page
- `LoginPage`: User login page
- `RegisterPage`: User registration page

### Shared User Pages
- `ProfilePage`: User profile page
- `SettingsPage`: User settings page
- `MessagesPage`: User messaging interface
- `NotificationsPage`: User notifications page
- `ConnectionsPage`: User connections management

### Attendee Pages
- `AttendeeEventsPage`: Events the attendee is registered for
- `EventDiscoveryPage`: Enhanced event discovery for attendees
- `EventRegistrationPage`: Event registration flow

### Planner Pages
- `PlannerDashboardPage`: Planner's main dashboard
- `EventCreationPage`: Event creation/editing interface
- `EventManagementPage`: Event management tools
- `VendorDiscoveryPage`: Vendor discovery for planners
- `AttendeeManagementPage`: Attendee management for events

### Vendor Pages
- `VendorDashboardPage`: Vendor's main dashboard
- `ServiceManagementPage`: Service listing management
- `RequestsPage`: Service requests management
- `AvailabilityPage`: Availability calendar management

### Admin Pages
- `AdminDashboardPage`: Admin's main dashboard
- `UserManagementPage`: User management interface
- `EventModerationPage`: Event moderation tools
- `ReportsPage`: User reports handling
- `AnalyticsPage`: Platform analytics dashboard

## Page Implementation

Each page should:

1. Import and compose components from the components directory
2. Handle data fetching and state management
3. Implement proper routing and navigation
4. Handle authentication and authorization checks
5. Provide appropriate error and loading states

## Routing Structure

The application will use a nested routing structure:

- `/` - Home page
- `/about` - About page
- `/events` - Events discovery
- `/events/:id` - Event details
- `/login` - Login page
- `/register` - Registration page
- `/profile/:id` - User profile
- `/settings` - User settings
- `/messages` - Messaging interface
- `/notifications` - Notifications
- `/connections` - User connections

### Role-specific routes:

- `/attendee/...` - Attendee-specific pages
- `/planner/...` - Planner-specific pages
- `/vendor/...` - Vendor-specific pages
- `/admin/...` - Admin-specific pages

## Best Practices

1. Implement proper authentication guards for protected routes
2. Use React Router for navigation
3. Keep page components focused on composition and data fetching
4. Extract reusable logic to custom hooks
5. Implement proper error boundaries
6. Use suspense for async data loading when appropriate