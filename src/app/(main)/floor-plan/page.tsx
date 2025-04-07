'use client';

import FloorPlanManager from '@/components/floor-plan/floor-plan-manager';
import { useRestaurant } from '@/components/providers/RestaurantProvider';

export default function FloorPlanPage() {
  const { currentRestaurant } = useRestaurant();

  // The main layout will handle the loading state for restaurant data
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto h-[calc(100vh-80px)]">
      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm h-full">
        {currentRestaurant && (
          <FloorPlanManager restaurantId={currentRestaurant.id} />
        )}
      </div>
    </div>
  );
}
