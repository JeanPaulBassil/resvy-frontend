import React from 'react';
import { Card, CardHeader, CardBody, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { format, parseISO } from 'date-fns';
import { Shift, UpcomingShift } from '@/types/shift';

interface ShiftCalendarProps {
  upcomingShifts: Record<string, UpcomingShift[]>;
  activeShifts: Shift[];
}

export default function ShiftCalendar({ upcomingShifts, activeShifts }: ShiftCalendarProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(upcomingShifts).map(([date, dayShifts]) => {
          const formattedDate = format(parseISO(date), 'EEEE, MMMM d');
          const isToday = format(new Date(), 'yyyy-MM-dd') === date;
          
          return (
            <Card key={date} className={`border ${isToday ? 'border-[#75CAA6]' : 'border-gray-200'}`}>
              <CardHeader className={`flex justify-between items-center pb-2 ${isToday ? 'bg-[#75CAA6]/10' : ''}`}>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:calendar-date-linear" className={isToday ? 'text-[#75CAA6]' : 'text-gray-500'} />
                  <h3 className="font-semibold">
                    {formattedDate}
                    {isToday && <span className="ml-2 text-xs font-normal bg-[#75CAA6] text-white px-2 py-0.5 rounded-full">Today</span>}
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="py-3">
                <div className="space-y-3">
                  {dayShifts.map(shift => (
                    <div 
                      key={shift.id} 
                      className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
                      style={{ borderLeftWidth: '4px', borderLeftColor: shift.color }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{shift.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Icon icon="solar:clock-circle-linear" className="text-xs" />
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        className="bg-gray-100"
                      >
                        {shift.reservations} reservations
                      </Chip>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
      
      {/* Calendar Legend */}
      <div className="mt-8 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Shift Legend</h3>
        <div className="flex flex-wrap gap-3">
          {activeShifts.map(shift => (
            <div key={shift.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }}></div>
              <span className="text-sm">{shift.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 