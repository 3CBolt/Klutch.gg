# EventConnect Services

This directory contains service modules that handle API communication and data processing for the EventConnect application.

## Available Services

### Authentication Service
- Handles user registration
- Manages login and logout
- Refreshes authentication tokens
- Resets passwords

### User Service
- Fetches and updates user profiles
- Manages user connections
- Handles user settings
- Processes user search and discovery

### Event Service
- Creates and updates events
- Fetches event listings and details
- Manages event registrations
- Handles event search and filtering

### Vendor Service
- Manages vendor profiles
- Handles service listings
- Processes service requests
- Manages vendor availability

### Messaging Service
- Sends and receives messages
- Fetches message threads
- Marks messages as read
- Handles real-time updates

### Notification Service
- Fetches user notifications
- Marks notifications as read
- Manages notification preferences
- Handles real-time updates

### Admin Service
- Manages user accounts
- Moderates content
- Handles user reports
- Fetches platform analytics

## Service Implementation Pattern

Each service should follow this pattern:

```tsx
/**
 * Service for handling user-related operations
 */
export const UserService = {
  /**
   * Fetches a user by ID
   * 
   * @param userId - The ID of the user to fetch
   * @returns Promise resolving to the user data
   */
  async getUserById(userId: string): Promise<User> {
    // Implementation
    return userData;
  },
  
  // Other methods...
};
```

## API Communication

Services should use a consistent approach to API communication:

```tsx
import { API_BASE_URL } from '../config';

// Reusable fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers if needed
    },
    ...options,
  });
  
  if (!response.ok) {
    // Handle error responses
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }
  
  return response.json();
}
```

## Error Handling

Services should implement consistent error handling:

```tsx
try {
  const data = await UserService.getUserById(userId);
  return data;
} catch (error) {
  // Log the error
  console.error('Failed to fetch user:', error);
  
  // Rethrow with context
  throw new Error(`Failed to fetch user: ${error.message}`);
}
```

## Best Practices

1. Use TypeScript for type safety
2. Document service methods with JSDoc comments
3. Implement proper error handling
4. Use consistent naming conventions
5. Keep services focused on specific domains
6. Handle authentication and authorization properly
7. Implement request caching when appropriate
8. Use request cancellation for long-running requests