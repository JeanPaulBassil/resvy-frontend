import GuestDashboard from '@/components/guests/GuestDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guest Management',
  description: 'Manage your restaurant guests',
};

export default function GuestsPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <GuestDashboard />
    </div>
  );
} 