import ReservationDashboard from '@/components/reservations/ReservationDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reservations',
  description: 'Manage your restaurant reservations',
};

export default function ReservationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <ReservationDashboard />
    </div>
  );
}
