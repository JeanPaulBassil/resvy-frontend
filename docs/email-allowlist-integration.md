# Email Allowlist Integration - Frontend Documentation

## Overview

The Email Allowlist feature provides an additional layer of access control by ensuring that only users with pre-approved email addresses can register and log in to the system. This document describes how this feature is integrated into the frontend of the Reservations application.

## Components

### 1. AllowedEmailList Component

This component displays a list of allowed emails and provides functionality to add, edit, and delete entries:

```tsx
import React, { useState } from 'react';
import { useAllowedEmails } from '@/hooks/useAllowedEmails';
import { Button, Input, Table, Modal, Form } from '@/components/ui';

export const AllowedEmailList: React.FC = () => {
  const { data, isLoading, error, mutate } = useAllowedEmails();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  
  // Component implementation...
  
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Allowed Emails</h2>
        <Button onClick={() => {
          setEditingEmail(null);
          setIsModalOpen(true);
        }}>
          Add New Email
        </Button>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">Error loading allowed emails</p>
      ) : (
        <Table
          data={data}
          columns={[
            { header: 'Email', accessor: 'email' },
            { header: 'Description', accessor: 'description' },
            { header: 'Created At', accessor: 'createdAt', 
              cell: (row) => new Date(row.createdAt).toLocaleDateString() 
            },
            { header: 'Actions', accessor: 'id',
              cell: (row) => (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleEdit(row)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(row.id)}>
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}
      
      {/* Modal for adding/editing emails */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmail ? 'Edit Allowed Email' : 'Add Allowed Email'}
      >
        <Form onSubmit={handleSubmit}>
          {/* Form fields */}
        </Form>
      </Modal>
    </div>
  );
};
```

### 2. useAllowedEmails Hook

This custom hook fetches and manages allowed emails data:

```tsx
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { AllowedEmail } from '@/types';

export function useAllowedEmails() {
  const { data, error, mutate } = useSWR<AllowedEmail[]>(
    '/api/allowed-emails',
    fetcher
  );

  const addAllowedEmail = async (email: string, description?: string) => {
    try {
      const response = await fetch('/api/allowed-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, description }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add allowed email');
      }
      
      mutate();
      return true;
    } catch (error) {
      console.error('Error adding allowed email:', error);
      return false;
    }
  };

  const updateAllowedEmail = async (id: string, data: { email?: string; description?: string }) => {
    // Implementation...
  };

  const deleteAllowedEmail = async (id: string) => {
    // Implementation...
  };

  return {
    data,
    isLoading: !error && !data,
    error,
    addAllowedEmail,
    updateAllowedEmail,
    deleteAllowedEmail,
    mutate,
  };
}
```

### 3. API Routes

Next.js API routes that connect to the backend:

```tsx
// pages/api/allowed-emails/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { fetchWithAuth } from '@/utils/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const backendUrl = process.env.BACKEND_URL;
  
  try {
    if (req.method === 'GET') {
      const response = await fetchWithAuth(
        `${backendUrl}/allowed-emails`,
        session.accessToken
      );
      
      const data = await response.json();
      return res.status(200).json(data);
    }
    
    if (req.method === 'POST') {
      const { email, description } = req.body;
      
      const response = await fetchWithAuth(
        `${backendUrl}/allowed-emails`,
        session.accessToken,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, description, createdBy: session.user.id }),
        }
      );
      
      const data = await response.json();
      return res.status(201).json(data);
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
```

## Integration with Authentication

The email allowlist is integrated with the authentication system to ensure that only users with allowed emails can register and log in:

### Login Process

```tsx
// components/auth/LoginForm.tsx
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/utils/firebase';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Authenticate with backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || '',
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        
        // Check if the error is due to email not being allowed
        if (data.message?.includes('Email not allowed')) {
          throw new Error('Your email is not authorized to access this system. Please contact an administrator.');
        }
        
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Successful login, redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Component rendering...
};
```

## Admin Interface

The admin interface provides a way for administrators to manage the email allowlist:

### AllowedEmailsPage

```tsx
// pages/admin/allowed-emails.tsx
import { AdminLayout } from '@/components/layout';
import { AllowedEmailList } from '@/components/admin';
import { withAuth } from '@/components/auth';

function AllowedEmailsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Allowed Emails</h1>
        <AllowedEmailList />
      </div>
    </AdminLayout>
  );
}

// Only allow admins to access this page
export default withAuth(AllowedEmailsPage, ['ADMIN']);
```

## Error Handling

The frontend handles various error scenarios related to the email allowlist:

1. **Email Not Allowed During Login**:
   - Clear error message explaining that the email is not authorized
   - Suggestion to contact an administrator

2. **Failed API Requests**:
   - Error messages for failed CRUD operations
   - Retry mechanisms for transient failures

3. **Permission Errors**:
   - Redirect to appropriate error page when non-admin users try to access admin features

## Future Enhancements

1. **Bulk Import/Export**:
   - Add functionality to import/export allowed emails in CSV format

2. **Domain Allowlisting**:
   - Support for allowing entire domains (e.g., `@company.com`)

3. **Request Access Form**:
   - Public form for users to request access to the system

4. **Email Notifications**:
   - Send notifications when new emails are added to the allowlist
