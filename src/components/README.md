# EventConnect Components

This directory will contain all the reusable UI components for the EventConnect application.

## Component Organization

Components are organized into the following categories:

### Layout Components
- `Header`: Main navigation header
- `Footer`: Site footer
- `Sidebar`: Navigation sidebar for dashboard views
- `Layout`: Page layout wrapper

### Authentication Components
- `LoginForm`: User login form
- `RegisterForm`: User registration form
- `RoleSelection`: Role selection during registration
- `ProfileSetup`: Initial profile setup wizard

### User Components
- `UserProfile`: User profile display
- `UserCard`: Compact user information card
- `ConnectionsList`: List of user connections
- `ConnectionRequest`: Connection request component

### Event Components
- `EventCard`: Card displaying event summary
- `EventList`: List of events
- `EventDetail`: Detailed event view
- `EventForm`: Form for creating/editing events
- `EventFilters`: Filters for event discovery
- `EventCalendar`: Calendar view of events

### Vendor Components
- `VendorProfile`: Vendor profile display
- `ServiceCard`: Card displaying vendor service
- `ServiceList`: List of vendor services
- `ServiceForm`: Form for creating/editing services

### Messaging Components
- `MessageList`: List of messages
- `MessageThread`: Conversation thread
- `MessageComposer`: Message composition interface
- `NotificationCenter`: Notification display and management

### Admin Components
- `AdminDashboard`: Main admin dashboard
- `UserManagement`: User management interface
- `ContentModeration`: Content moderation tools
- `AnalyticsDashboard`: Platform analytics display

## Component Structure

Each component should follow this structure:

```tsx
import React from 'react';

interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = (props) => {
  // Component implementation
};
```

## Best Practices

1. Use TypeScript interfaces for component props
2. Implement proper error handling and loading states
3. Make components responsive using Tailwind CSS
4. Keep components focused on a single responsibility
5. Use Lucide React for icons
6. Document complex components with comments