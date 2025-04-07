'use client';

import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import Link from 'next/link';

import { AdminRoute } from '@/components/auth/ProtectedRoute';

export default function AdminPage() {
  return (
    <AdminRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage clients and system access.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-xl font-semibold">Client Management</h3>
            </CardHeader>
            <CardBody>
              <p className="mb-4">Manage restaurant clients and their reservations.</p>
              <Link href="/admin/clients">
                <Button color="primary">View Clients</Button>
              </Link>
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-xl font-semibold">Email Allowlist</h3>
            </CardHeader>
            <CardBody>
              <p className="mb-4">Manage the list of email addresses that are allowed to access the system.</p>
              <Link href="/admin/allowed-emails">
                <Button color="primary">Manage Emails</Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </AdminRoute>
  );
} 