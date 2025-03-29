# EventConnect Custom Hooks

This directory contains custom React hooks for the EventConnect application.

## Available Hooks

### Authentication Hooks
- `useAuth`: Provides authentication state and methods
- `useRole`: Checks if the current user has a specific role
- `useProtectedRoute`: Protects routes based on authentication and roles

### Data Fetching Hooks
- `useEvents`: Fetches and manages events data
- `useEvent`: Fetches a single event by ID
- `useUsers`: Fetches and manages users data
- `useUser`: Fetches a single user by ID
- `useServices`: Fetches and manages vendor services
- `useService`: Fetches a single service by ID

### User Interaction Hooks
- `useConnections`: Manages user connections
- `useMessages`: Handles messaging functionality
- `useNotifications`: Manages user notifications
- `useRegistrations`: Handles event registrations

### Form Hooks
- `useForm`: Generic form state management
- `useEventForm`: Specialized hook for event forms
- `useServiceForm`: Specialized hook for service forms
- `useProfileForm`: Specialized hook for profile forms

### UI Hooks
- `useModal`: Controls modal visibility
- `useToast`: Manages toast notifications
- `useMediaQuery`: Responsive design helper
- `useOutsideClick`: Detects clicks outside an element

## Hook Implementation Pattern

Each hook should follow this pattern:

```tsx
import { useState, useEffect } from 'react';

export function useCustomHook(params) {
  // State and logic implementation
  
  // Return values and methods
  return {
    // Data
    // Methods
    // Status flags
  };
}
```

## Best Practices

1. Keep hooks focused on a single responsibility
2. Implement proper error handling
3. Use TypeScript for type safety
4. Document complex hooks with comments
5. Handle loading and error states
6. Implement cleanup functions in useEffect when necessary
7. Use memoization for expensive calculations
8. Avoid nested hooks when possible