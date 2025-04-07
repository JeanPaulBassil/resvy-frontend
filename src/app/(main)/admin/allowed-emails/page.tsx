'use client';

import { AllowedEmailList } from '@/components/admin/AllowedEmailList';
import { AdminRoute } from '@/components/auth/ProtectedRoute';

export default function AllowedEmailsPage() {
  return (
    <AdminRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Email Allowlist Management</h1>
          <p className="text-gray-500 mt-2">
            Manage the list of email addresses that are allowed to access the system.
          </p>
        </div>
        <AllowedEmailList />
      </div>
    </AdminRoute>
  );
} 