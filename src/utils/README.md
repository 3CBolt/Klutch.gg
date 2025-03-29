# EventConnect Utility Functions

This directory contains utility functions and helpers for the EventConnect application.

## Available Utilities

### Date Utilities
- `formatDate`: Formats dates in various formats
- `getDateRange`: Calculates the range between two dates
- `isDateInRange`: Checks if a date is within a range
- `getRelativeTime`: Returns relative time (e.g., "2 hours ago")

### Validation Utilities
- `validateEmail`: Validates email addresses
- `validatePassword`: Checks password strength
- `validatePhoneNumber`: Validates phone numbers
- `validateURL`: Validates URLs

### Formatting Utilities
- `formatCurrency`: Formats currency values
- `formatPhoneNumber`: Formats phone numbers
- `truncateText`: Truncates text with ellipsis
- `slugify`: Converts text to URL-friendly slugs

### Array and Object Utilities
- `groupBy`: Groups array items by a key
- `sortBy`: Sorts array items by a key
- `filterBy`: Filters array items by criteria
- `deepMerge`: Deep merges objects

### Storage Utilities
- `getLocalStorage`: Gets data from localStorage with type safety
- `setLocalStorage`: Sets data in localStorage
- `clearLocalStorage`: Clears localStorage
- `getSessionStorage`: Gets data from sessionStorage with type safety

### Network Utilities
- `fetchWithTimeout`: Fetch with timeout support
- `handleApiError`: Standardized API error handling
- `createQueryString`: Creates URL query strings
- `parseQueryString`: Parses URL query strings

### UI Utilities
- `debounce`: Debounces function calls
- `throttle`: Throttles function calls
- `getContrastColor`: Gets contrasting text color for backgrounds
- `generateAvatar`: Generates avatar placeholders

### Security Utilities
- `sanitizeHtml`: Sanitizes HTML content
- `generateRandomId`: Generates random IDs
- `hashString`: Creates a hash from a string
- `encodeBase64`: Encodes strings to base64

## Implementation Pattern

Utility functions should be pure, well-typed, and documented:

```tsx
/**
 * Formats a date into a human-readable string
 * 
 * @param date - The date to format
 * @param format - The format to use (default: 'medium')
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  // Implementation
  return formattedDate;
}
```

## Best Practices

1. Write pure functions when possible
2. Use TypeScript for type safety
3. Document functions with JSDoc comments
4. Include parameter and return type annotations
5. Write unit tests for utility functions
6. Handle edge cases and errors gracefully
7. Avoid side effects in utility functions
8. Export functions individually for better tree-shaking