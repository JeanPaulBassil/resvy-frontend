'use client';

import { Reservation, UpdateReservationDto } from '@/api/reservation';
import { useUpdateReservation } from '@/hooks/useReservation';
import { useShifts } from '@/hooks/useShift';
import { useTables } from '@/hooks/useTable';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Selection,
  SelectItem,
  Textarea,
  Tooltip,
} from '@heroui/react';
import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import { format, isAfter, isBefore, parse } from 'date-fns';
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardEdit,
  Clock,
  Coffee,
  ScrollText,
  Users,
  Utensils,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRestaurant } from '../providers/RestaurantProvider';

interface EditReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReservationModal({
  reservation,
  onClose,
  onSuccess,
}: EditReservationModalProps) {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id || reservation.restaurantId;

  // Get shifts and tables
  const { data: shifts = [] } = useShifts(restaurantId);
  const { data: tables = [] } = useTables(restaurantId);

  // Convert reservation date to CalendarDate
  const datePart = reservation.date.split('T')[0]; // Extract just the YYYY-MM-DD part
  const initialDate = parseDate(datePart);

  // Extract hours and minutes from the startTime
  const startTimeDate = new Date(reservation.startTime);
  const initialHours = startTimeDate.getHours();
  const initialMinutes = startTimeDate.getMinutes();
  const initialTimeString = `${String(initialHours).padStart(2, '0')}:${String(initialMinutes).padStart(2, '0')}`;

  // Form state
  const [date, setDate] = useState<CalendarDate | null>(initialDate);
  const [startTime, setStartTime] = useState<string>(initialTimeString);
  const [numberOfGuests, setNumberOfGuests] = useState<string>(
    reservation.numberOfGuests.toString()
  );
  const [tableId, setTableId] = useState<string>(reservation.tableId || '');
  const [note, setNote] = useState<string>(reservation.note || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generate time slots for dropdown (30-minute intervals from 6:00 AM to 11:30 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 23 && minute > 30) continue; // Stop at 11:30 PM

        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isPM = hour >= 12;
        const displayHour = hour % 12 || 12;
        const timeLabel = `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
        slots.push({ value: timeValue, label: timeLabel });
      }
    }
    return slots;
  }, []);

  // Calculate shift automatically based on time
  const automaticShiftId = useMemo(() => {
    if (!date || !startTime || shifts.length === 0) return '';

    // Get date and time values
    const dateStr = date.toString();
    const [hours, minutes] = startTime.split(':').map(Number);

    // Create a Date object for the selected date and time
    const reservationDateTime = new Date(dateStr);
    reservationDateTime.setHours(hours, minutes, 0, 0);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = reservationDateTime.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Check which shift covers this time
    for (const shift of shifts) {
      // Check if shift is active for this day
      if (!shift.days.includes(dayName)) continue;

      // Parse shift start and end times
      try {
        const shiftStart = parse(shift.startTime, 'HH:mm', new Date());
        const shiftEnd = parse(shift.endTime, 'HH:mm', new Date());

        // Copy reservation date parts to shift times for comparison
        shiftStart.setFullYear(
          reservationDateTime.getFullYear(),
          reservationDateTime.getMonth(),
          reservationDateTime.getDate()
        );

        shiftEnd.setFullYear(
          reservationDateTime.getFullYear(),
          reservationDateTime.getMonth(),
          reservationDateTime.getDate()
        );

        // Handle overnight shifts (end time is less than start time)
        if (isBefore(shiftEnd, shiftStart)) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        // Check if reservation time falls within shift hours
        if (isAfter(reservationDateTime, shiftStart) && isBefore(reservationDateTime, shiftEnd)) {
          return shift.id;
        }
      } catch (error) {
        console.error('Error parsing shift times:', error);
      }
    }

    return ''; // No matching shift found
  }, [date, startTime, shifts]);

  // Handle form submission
  const handleSubmit = async () => {
    // Form validation
    if (!date) {
      setValidationError('Please select a date');
      return;
    }
    if (!startTime) {
      setValidationError('Please select a time');
      return;
    }
    if (!numberOfGuests || parseInt(numberOfGuests) < 1) {
      setValidationError('Please enter a valid number of guests');
      return;
    }

    // Clear validation errors
    setValidationError(null);

    // Format date as YYYY-MM-DD
    const dateString = date.toString();

    // Create startTime by combining date and time
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTimeDate = new Date(dateString);
    startTimeDate.setHours(hours, minutes, 0, 0);

    // Create endTime (2 hours after startTime)
    const endTimeDate = new Date(startTimeDate);
    endTimeDate.setHours(endTimeDate.getHours() + 2);

    const updateData: UpdateReservationDto = {
      date: dateString,
      startTime: startTimeDate.toISOString(),
      endTime: endTimeDate.toISOString(),
      numberOfGuests: parseInt(numberOfGuests),
      tableId: tableId === '' ? null : tableId,
      shiftId: automaticShiftId || null, // Use automatically calculated shift
      note: note || undefined,
    };

    try {
      await updateReservationMutation.mutateAsync(updateData);
      onSuccess();
    } catch (error) {
      console.error('Error updating reservation:', error);
      setValidationError('Failed to update reservation. Please try again.');
    }
  };

  // Handle select changes
  const handleTableSelect = (keys: Selection) => {
    const selected = Array.from(keys)[0]?.toString() || '';
    setTableId(selected);
  };

  // Setup mutation
  const updateReservationMutation = useUpdateReservation(reservation.id);

  // Find shift name for display
  const selectedShiftName = useMemo(() => {
    if (!automaticShiftId) return '';
    const shift = shifts.find((s) => s.id === automaticShiftId);
    return shift?.name || '';
  }, [automaticShiftId, shifts]);

  // Find table details for display
  const selectedTable = useMemo(() => {
    if (!tableId) return null;
    return tables.find((t) => t.id === tableId);
  }, [tableId, tables]);

  // Find matching time slot label
  const selectedTimeLabel = useMemo(() => {
    const slot = timeSlots.find((slot) => slot.value === startTime);
    return slot?.label || startTime;
  }, [startTime, timeSlots]);

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="bg-primary/10 p-2.5 rounded-full">
          <ClipboardEdit className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Edit Reservation</h2>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{reservation.guest?.name || 'Guest'}</span>
            {' • '}
            {reservation.guest?.phone || 'No phone'}
          </p>
        </div>
        <Avatar
          name={reservation.guest?.name || 'Guest'}
          size="md"
          color="primary"
          className="border-2 border-white shadow-md"
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Form content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <span>Date & Time</span>
            </h3>
            <Card className="p-4 space-y-4">
              <DatePicker
                label="Reservation Date"
                value={date}
                onChange={setDate}
                isDateUnavailable={(date) => {
                  // Disallow dates in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dateToCheck = new Date(date.toString());
                  return dateToCheck < today;
                }}
                minValue={today(getLocalTimeZone())}
                className="w-full"
                classNames={{
                  label: 'font-medium text-sm',
                  inputWrapper: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
                }}
                popoverProps={{
                  classNames: {
                    content: 'p-0 shadow-xl border border-gray-200 dark:border-gray-700',
                  },
                }}
              />

              <Select
                label="Reservation Time"
                placeholder="Select time"
                selectedKeys={startTime ? [startTime] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0]?.toString() || '';
                  setStartTime(selected);
                }}
                items={timeSlots}
                classNames={{
                  label: 'font-medium text-sm',
                  trigger: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
                }}
              >
                {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
              </Select>

              {automaticShiftId && (
                <div className="pt-2">
                  <div className="text-xs text-gray-500 mb-1">Automatically assigned shift:</div>
                  <div className="flex items-center">
                    <Badge color="primary" size="sm" variant="flat" className="mr-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {selectedShiftName}
                    </Badge>
                    <Tooltip content="Shift is determined by the reservation time">
                      <span className="text-xs text-gray-500 cursor-help">
                        <AlertCircle className="w-3 h-3" />
                      </span>
                    </Tooltip>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div>
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Party Details</span>
            </h3>
            <Card className="p-4 space-y-4">
              <Input
                type="number"
                label="Number of Guests"
                placeholder="Enter number of guests"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(e.target.value)}
                min={1}
                max={20}
                classNames={{
                  label: 'font-medium text-sm',
                  input: 'bg-white dark:bg-gray-800',
                }}
                startContent={<Users className="w-4 h-4 text-gray-400" />}
                description="Maximum 20 guests per reservation"
              />
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <span>Table Assignment</span>
            </h3>
            <Card className="p-4 space-y-4">
              <Select
                label="Table Assignment"
                placeholder="Select a table (optional)"
                selectedKeys={tableId ? [tableId] : []}
                onSelectionChange={handleTableSelect}
                aria-label="Select a table"
                items={[
                  { key: '', label: 'No table assigned' },
                  ...tables.map((table) => ({
                    key: table.id,
                    label: `${table.name} (${table.capacity} people)`,
                  })),
                ]}
                classNames={{
                  label: 'font-medium text-sm',
                  trigger: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
                }}
                startContent={<Utensils className="w-4 h-4 text-gray-400" />}
                description="Table can be assigned later in the floor plan"
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>

              {selectedTable && (
                <div className="mt-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Table {selectedTable.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Capacity: {selectedTable.capacity} guests
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div>
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              <span>Notes</span>
            </h3>
            <Card className="p-4">
              <Textarea
                label="Special Requests & Notes"
                placeholder="Add any special requests, dietary restrictions, or notes for this reservation"
                value={note}
                onValueChange={setNote}
                rows={4}
                classNames={{
                  label: 'font-medium text-sm',
                  input: 'bg-white dark:bg-gray-800 min-h-[120px]',
                }}
                description="Optional: Include any information that might help provide better service"
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Summary section */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-base font-medium mb-3">Reservation Summary</h3>
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1 flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Date
            </span>
            <span className="font-medium">
              {date ? format(new Date(date.toString()), 'EEE, MMM d, yyyy') : 'Not set'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Time
            </span>
            <span className="font-medium">{selectedTimeLabel || 'Not set'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Party Size
            </span>
            <span className="font-medium">
              {numberOfGuests} {parseInt(numberOfGuests) === 1 ? 'guest' : 'guests'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1 flex items-center gap-1">
              <Utensils className="h-3.5 w-3.5" /> Table
            </span>
            <span className="font-medium">
              {selectedTable ? `Table ${selectedTable.name}` : 'Not assigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <Button
          variant="flat"
          onPress={onClose}
          disabled={updateReservationMutation.isPending}
          className="bg-white"
        >
          Cancel
        </Button>
        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={updateReservationMutation.isPending}
          startContent={
            updateReservationMutation.isPending ? (
              <Coffee className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )
          }
        >
          {updateReservationMutation.isPending ? 'Updating...' : 'Update Reservation'}
        </Button>
      </div>
    </div>
  );
}
