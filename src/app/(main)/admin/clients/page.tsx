'use client';

import { ClientsList } from '@/components/admin/ClientsList';
import { AdminRoute } from '@/components/auth/ProtectedRoute';

export default function ClientsPage() {
  return (
    <AdminRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Client Management</h1>
          <p className="text-gray-500 mt-2">
            Manage user access to the system.
          </p>
        </div>
        
        <ClientsList />
      </div>
    </AdminRoute>
  );
} 