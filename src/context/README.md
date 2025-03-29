# EventConnect Context Providers

This directory contains React Context providers for the EventConnect application.

## Available Contexts

### Authentication Context
- Manages user authentication state
- Provides login, logout, and registration methods
- Stores current user information
- Handles authentication tokens

### User Context
- Manages current user profile data
- Provides methods to update user information
- Tracks user preferences and settings

### Event Context
- Manages event-related state
- Provides methods for event CRUD operations
- Handles event filtering and searching

### Notification Context
- Manages user notifications
- Provides methods to mark notifications as read
- Handles real-time notification updates

### Message Context
- Manages user messages
- Provides methods for sending and receiving messages
- Handles real-time message updates

### UI Context
- Manages global UI state
- Controls theme settings
- Manages modal and drawer states

## Context Implementation Pattern

Each context should follow this pattern:

```tsx
import React, { createContext, useContext, useState } from 'react';

// Define the context value type
interface ContextValue {
  // State and methods
}

// Create the context with a default value
const ExampleContext = createContext<ContextValue | undefined>(undefined);

// Create a provider component
export const ExampleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implement state and methods
  
  const value = {
    // State and methods
  };
  
  return <ExampleContext.Provider value={value}>{children}</ExampleContext.Provider>;
};

// Create a custom hook to use the context
export const useExample = () => {
  const context = useContext(ExampleContext);
  if (context === undefined) {
    throw new Error('useExample must be used within an ExampleProvider');
  }
  return context;
};
```

## Context Composition

The application will use a composition pattern for contexts:

```tsx
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>
        <EventProvider>
          <NotificationProvider>
            <MessageProvider>
              <UIProvider>
                {children}
              </UIProvider>
            </MessageProvider>
          </NotificationProvider>
        </EventProvider>
      </UserProvider>
    </AuthProvider>
  );
};
```

## Best Practices

1. Keep contexts focused on specific domains
2. Use TypeScript for type safety
3. Implement proper error handling
4. Optimize re-renders by splitting contexts when appropriate
5. Use context selectors to prevent unnecessary re-renders
6. Document complex contexts with comments
7. Consider using reducers for complex state management
8. Implement proper cleanup for subscriptions and side effects