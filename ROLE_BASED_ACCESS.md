# Role-Based Access Control Implementation

This document outlines the implementation of role-based access control (RBAC) in the Next.js frontend application.

## Overview

The RBAC system allows for conditional rendering of UI components and route protection based on user roles. The primary roles in the system are:

- `ADMIN`: Users with administrative privileges
- Regular users (any other role)

## Implementation Components

### 1. Authentication Service (`src/services/authService.ts`)

The authentication service has been updated to:
- Store user role information from the backend in localStorage
- Provide utility functions to check user roles

```typescript
// Get user role
export function getUserRole() {
  const userData = localStorage.getItem('userData');
  if (!userData) return null;
  
  try {
    const user = JSON.parse(userData);
    return user.role || null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

// Check if user is admin
export function isAdmin() {
  return getUserRole() === 'ADMIN';
}
```

### 2. Auth Provider (`src/components/providers/AuthProvider.tsx`)

The Auth Provider has been extended to:
- Include user role information in the auth context
- Provide the role information to all components via context

```typescript
interface AuthContextType {
  user: ExtendedUser | null;
  isInitializing: boolean;
  userRole: string | null;
  isAdmin: boolean;
}
```

### 3. Role-Based Access Components (`src/components/auth/RoleBasedAccess.tsx`)

These components conditionally render content based on user roles:

- `RoleBasedAccess`: Base component that renders content only for users with specified roles
- `AdminOnly`: Renders content only for admin users
- `NonAdminOnly`: Renders content only for non-admin users

Usage example:
```tsx
<AdminOnly>
  <div>This content is only visible to administrators</div>
</AdminOnly>

<NonAdminOnly>
  <div>This content is only visible to regular users</div>
</NonAdminOnly>
```

### 4. Protected Routes (`src/components/auth/ProtectedRoute.tsx`)

These components protect routes based on user roles:

- `ProtectedRoute`: Base component that redirects users without specified roles
- `AdminRoute`: Protects routes that should only be accessible to admin users

Usage example:
```tsx
<AdminRoute>
  <div>This page is only accessible to administrators</div>
</AdminRoute>
```

### 5. Role-Based Navigation (`src/components/navigation/RoleBasedNavigation.tsx`)

This component displays different navigation links based on user roles.

## Example Pages

1. **Dashboard Page** (`src/app/(main)/dashboard/page.tsx`)
   - Shows different dashboard content based on user role
   - Common content visible to all users
   - Admin-specific content only visible to admins
   - User-specific content only visible to regular users

2. **Admin Page** (`src/app/(main)/admin/page.tsx`)
   - Protected route that only allows access to admin users
   - Redirects non-admin users to the dashboard

## Backend Integration

The system expects the backend to return user role information in the authentication response. The backend should:

1. Validate the Firebase token
2. Return user information including the role
3. Format the response as:
   ```json
   {
     "user": {
       "id": "user-id",
       "email": "user@example.com",
       "role": "ADMIN" // or other role
     }
   }
   ```

## Security Considerations

1. **Client-side role checking is not secure on its own**
   - Always validate permissions on the backend for any sensitive operations
   - The frontend RBAC is for UI purposes only

2. **Token validation**
   - Ensure Firebase tokens are properly validated on the backend
   - Set appropriate token expiration times

3. **Route protection**
   - Protected routes should be enforced on both client and server sides
   - Use middleware or API route handlers to validate permissions for data access

## Future Improvements

1. **Role-based API access**
   - Implement an API client that includes role validation

2. **More granular permissions**
   - Extend the system to support specific permissions beyond just roles

3. **Server-side rendering with roles**
   - Implement server components that can check roles during SSR 