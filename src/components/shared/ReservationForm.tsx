import { Guest } from '@/api/guest';
import { CreateReservationDto, ReservationSource, ReservationStatus } from '@/api/reservation';
import { useShifts } from '@/hooks/useShift';
import { useTables } from '@/hooks/useTable';
import {
  Avatar,
  Button,
  Calendar,
  Chip,
  ChipProps,
  Radio,
  RadioGroup,
  ScrollShadow,
  Select,
  Selection,
  SelectItem,
  Tab,
  Tabs,
  Textarea,
  Input,
} from '@heroui/react';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { AlertTriangle, CalendarDays, Clock, Info } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../providers/RestaurantProvider';

const getTagColor = (tag: string): ChipProps['color'] => {
  const colorMap: Record<string, ChipProps['color']> = {
    VIP: 'danger',
    Regular: 'success',
    'First-time': 'primary',
    Birthday: 'warning',
    Vegetarian: 'secondary',
  };
  return colorMap[tag] || 'default';
};

interface TableOption {
  id: string;
  name: string;
  capacity: {
    min: number;
    max: number;
  };
  status: string;
  locationTag?: string;
}

// Time slot definition
interface TimeSlot {
  value: string; // 24-hour format: "HH:MM"
  label: string; // Formatted display time
}

enum TimeFormatEnum {
  TwelveHour = '12h',
  TwentyFourHour = '24h',
}

const timeFormats = [
  { key: TimeFormatEnum.TwelveHour, label: '12h' },
  { key: TimeFormatEnum.TwentyFourHour, label: '24h' },
];

// Component for a single time slot button
function TimeSlotButton({
  slot,
  isSelected,
  onTimeSelect,
}: {
  slot: TimeSlot;
  isSelected: boolean;
  onTimeSelect: (time: string) => void;
}) {
  return (
    <Button
      className={`w-full h-[36px] text-sm font-medium rounded-md transition-colors ${
        isSelected
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-gray-50/60 text-gray-700 hover:bg-gray-100 dark:bg-gray-800/30 dark:text-gray-300 dark:hover:bg-gray-800/50'
      }`}
      onPress={() => onTimeSelect(slot.value)}
      variant="flat"
    >
      {slot.label}
    </Button>
  );
}

// Generate time slots from 00:00 to 23:30 in 30-minute increments
const generateTimeSlots = (format: TimeFormatEnum = TimeFormatEnum.TwelveHour) => {
  const slots: TimeSlot[] = [];
  for (let hour = 10; hour < 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // 24-hour format for value
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Format for display based on preferred format
      let label: string;
      if (format === TimeFormatEnum.TwentyFourHour) {
        label = value;
      } else {
        const isPM = hour >= 12;
        const displayHour = hour % 12 || 12;
        label = `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
      }

      slots.push({ value, label });
    }
  }
  return slots;
};

interface ReservationFormProps {
  guest: Guest;
  preferredSeating?: string;
  dietaryRestrictions?: string[];
  allergies?: string;
  restaurantId?: string;
  onSubmit: (reservationData: CreateReservationDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ReservationForm({
  guest,
  dietaryRestrictions = [],
  allergies = '',
  restaurantId,
  onSubmit,
  onCancel,
  isSubmitting,
}: ReservationFormProps) {
  const { currentRestaurant } = useRestaurant();
  const actualRestaurantId = restaurantId || currentRestaurant?.id || '';

  // Get shifts and tables from the database
  const { data: shifts, isLoading: isLoadingShifts } = useShifts(actualRestaurantId);
  const { data: tablesData } = useTables(actualRestaurantId);

  // Get a reasonable default time (first time slot after current time, or noon if morning)
  const getDefaultTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // If it's before restaurant hours, default to opening (11:00)
    if (hour < 11) {
      return '11:00';
    }

    // If it's after closing, default to next day opening (handled by date selection)
    if (hour >= 22) {
      return '11:00';
    }

    // Round up to the next half hour
    let nextHour = hour;
    let nextMinute = minutes >= 30 ? 0 : 30;

    if (minutes >= 30) {
      nextHour++;
      nextMinute = 0;
    }

    return `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
  };

  // State for form fields
  const [reservationDate, setReservationDate] = useState<CalendarDate>(today(getLocalTimeZone()));
  const [reservationTime, setReservationTime] = useState<string>(getDefaultTime());
  const [partySize, setPartySize] = useState<string>('2');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [timeFormat, setTimeFormat] = useState<TimeFormatEnum>(TimeFormatEnum.TwelveHour);
  const [step, setStep] = useState<'date-time' | 'details'>('date-time');
  const [source, setSource] = useState<ReservationSource>(ReservationSource.PHONE);

  // Automatically determine the appropriate shift based on reservation time
  const getMatchingShift = () => {
    if (!shifts || shifts.length === 0 || !reservationTime) return null;
    
    // Parse the reservation time (HH:MM)
    const [hours, minutes] = reservationTime.split(':').map(Number);
    
    // Find shift that encompasses this time
    return shifts.find(shift => {
      // Parse shift times (HH:MM)
      const [shiftStartHours, shiftStartMinutes] = shift.startTime.split(':').map(Number);
      const [shiftEndHours, shiftEndMinutes] = shift.endTime.split(':').map(Number);
      
      // Convert everything to minutes for easy comparison
      const reservationTimeMinutes = hours * 60 + minutes;
      const shiftStartTimeMinutes = shiftStartHours * 60 + shiftStartMinutes;
      const shiftEndTimeMinutes = shiftEndHours * 60 + shiftEndMinutes;
      
      // Check if reservation time falls within shift time
      // Account for shifts that go past midnight
      if (shiftEndTimeMinutes <= shiftStartTimeMinutes) {
        // Shift spans midnight
        return reservationTimeMinutes >= shiftStartTimeMinutes || reservationTimeMinutes <= shiftEndTimeMinutes;
      } else {
        // Regular shift (e.g., 11:00 to 15:00)
        return reservationTimeMinutes >= shiftStartTimeMinutes && reservationTimeMinutes <= shiftEndTimeMinutes;
      }
    }) || null;
  };

  // Format tables into the required structure
  const availableTables = React.useMemo(() => {
    if (!tablesData) return [];

    return tablesData.map((table) => ({
      id: table.id,
      name: table.name,
      capacity: {
        min: 1,
        max: table.capacity,
      },
      status: table.status,
    }));
  }, [tablesData]);

  // Filter tables based on party size
  const getFilteredTables = () => {
    const size = parseInt(partySize);
    return availableTables.filter((table) => size <= table.capacity.max);
  };

  const filteredTables = getFilteredTables();

  // Reset table if current selection doesn't support the party size
  React.useEffect(() => {
    if (selectedTable) {
      const tableStillValid = filteredTables.some((table) => table.id === selectedTable);
      if (!tableStillValid) {
        setSelectedTable('');
      }
    }
  }, [partySize, selectedTable, filteredTables]);

  // Format table name with capacity
  const formatTableName = (table: TableOption) => {
    return `${table.name} (${table.capacity.max} people)`;
  };

  const timeSlots = generateTimeSlots(timeFormat);

  const handleTimeSelect = (time: string) => {
    setReservationTime(time);
  };

  // Update to handle numeric input instead of dropdown selection
  const handlePartySizeChange = (value: string) => {
    // Only allow numbers between 1 and 20
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 20)) {
      setPartySize(value);
    }
  };

  const handleTableSelect = (keys: Selection) => {
    const selected = Array.from(keys)[0]?.toString() || '';
    setSelectedTable(selected);
  };

  const handleSourceSelect = (value: string) => {
    setSource(value as ReservationSource);
  };

  const handleSubmit = async () => {
    // Convert time strings to ISO format
    const dateString = reservationDate.toString(); // YYYY-MM-DD
    const timeString = reservationTime; // HH:MM

    // Create startTime by combining date and time
    const [hours, minutes] = timeString.split(':').map(Number);
    const startTime = new Date(dateString);
    startTime.setHours(hours, minutes, 0, 0);

    // Automatically set endTime to be 2 hours after startTime
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);

    // Automatically determine the shift based on reservation time
    const matchingShift = getMatchingShift();

    const reservationData: CreateReservationDto = {
      guestId: guest.id,
      restaurantId: actualRestaurantId,
      date: dateString,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      numberOfGuests: parseInt(partySize),
      note: specialRequests || undefined,
      status: ReservationStatus.PENDING,
      source,
      shiftId: matchingShift?.id, // Use automatically determined shift
      tableId: selectedTable || undefined,
    };

    await onSubmit(reservationData);
  };

  const onDateChange = (date: CalendarDate) => {
    setReservationDate(date);
  };

  const onTimeFormatChange = (selectedKey: React.Key) => {
    const newFormat = selectedKey.toString() as TimeFormatEnum;
    setTimeFormat(newFormat);
  };

  const continueToDetails = () => {
    if (reservationTime) {
      setStep('details');
    }
  };

  const goBackToDateTime = () => {
    setStep('date-time');
  };

  const getSelectedTimeLabel = () => {
    const slot = timeSlots.find((slot) => slot.value === reservationTime);
    return slot ? slot.label : '';
  };

  const formattedDate = format(new Date(reservationDate.toString()), 'EEEE, MMMM d, yyyy', {
    locale: enUS,
  });
  const weekday = format(new Date(reservationDate.toString()), 'EEE', { locale: enUS });
  const day = reservationDate.day;

  if (step === 'date-time') {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Left side - Guest info */}
          <div className="flex flex-col mb-6 md:mb-0 md:w-72">
            <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-lg p-4 flex items-center mb-5">
              <Avatar
                name={guest.name}
                className="h-12 w-12 text-sm mr-4 flex-shrink-0"
                color="primary"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {guest.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{guest.phone}</p>
              </div>
              {guest.tags.length > 0 && (
                <Chip
                  color={getTagColor(guest.tags[0])}
                  variant="flat"
                  radius="sm"
                  size="sm"
                  className="ml-auto"
                >
                  {guest.tags[0]}
                </Chip>
              )}
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reservation Details
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select a date and time for {guest.name}'s reservation
              </p>
            </div>

            {reservationTime && (
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 rounded-lg p-4 mb-5">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {formattedDate}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                      {getSelectedTimeLabel()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              color="success"
              radius="sm"
              size="lg"
              isDisabled={!reservationTime}
              className="mt-auto text-white"
              onPress={continueToDetails}
            >
              Continue to Details
            </Button>
          </div>

          {/* Right side - Calendar and Time slots */}
          <div className="flex flex-col md:flex-row gap-6 flex-1">
            <div className="flex-shrink-0">
              <Calendar
                calendarWidth="372px"
                className="shadow-none dark:bg-transparent"
                classNames={{
                  headerWrapper: 'bg-transparent px-3 pt-1.5 pb-3',
                  title: 'text-default-700 text-small font-semibold',
                  gridHeader: 'bg-transparent shadow-none',
                  gridHeaderCell: 'font-medium text-default-400 text-xs p-0 w-full',
                  gridHeaderRow: 'px-3 pb-3',
                  gridBodyRow: 'gap-x-1 px-3 mb-1 first:mt-4 last:mb-0',
                  gridWrapper: 'pb-3',
                  cell: 'p-1.5 w-full',
                  cellButton:
                    'w-full h-9 rounded-medium data-[selected]:shadow-[0_2px_12px_0] data-[selected]:shadow-emerald-300 text-small font-medium',
                }}
                isDateUnavailable={(date) => {
                  // Disallow dates in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dateToCheck = new Date(date.toString());
                  return dateToCheck < today;
                }}
                value={reservationDate}
                weekdayStyle="short"
                onChange={onDateChange}
              />
            </div>

            <div className="w-full md:w-60">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium">
                  <span className="text-gray-900 dark:text-gray-100">{weekday}</span>{' '}
                  <span className="text-gray-500">{day}</span>
                </div>
                <Tabs
                  size="sm"
                  aria-label="Time format"
                  selectedKey={timeFormat}
                  onSelectionChange={onTimeFormatChange}
                  classNames={{
                    tabList: 'h-7 min-h-unit-0 p-0',
                    tab: 'h-7 px-2 text-xs',
                  }}
                >
                  {timeFormats.map((format) => (
                    <Tab key={format.key} title={format.label} />
                  ))}
                </Tabs>
              </div>

              <ScrollShadow hideScrollBar className="max-h-[380px] pr-2">
                <div className="flex flex-col gap-2">
                  {timeSlots.map((slot) => (
                    <TimeSlotButton
                      key={slot.value}
                      slot={slot}
                      isSelected={slot.value === reservationTime}
                      onTimeSelect={handleTimeSelect}
                    />
                  ))}
                </div>
              </ScrollShadow>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Left side - Guest info and summary */}
        <div className="flex flex-col mb-6 md:mb-0 md:w-72">
          <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-lg p-4 flex items-center mb-5">
            <Avatar
              name={guest.name}
              className="h-12 w-12 text-sm mr-4 flex-shrink-0"
              color="primary"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {guest.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{guest.phone}</p>
            </div>
            {guest.tags.length > 0 && (
              <Chip
                color={getTagColor(guest.tags[0])}
                variant="flat"
                radius="sm"
                size="sm"
                className="ml-auto"
              >
                {guest.tags[0]}
              </Chip>
            )}
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 rounded-lg p-4 mb-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {formattedDate}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    {getSelectedTimeLabel()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {partySize} {parseInt(partySize) === 1 ? 'guest' : 'guests'}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="flat"
            radius="sm"
            className="mb-5"
            size="md"
            startContent={<Info className="h-4 w-4" />}
            onPress={goBackToDateTime}
          >
            Change Date/Time
          </Button>
        </div>

        {/* Right side - Additional details */}
        <div className="flex-1 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Number of Guests
            </h3>
            <Input
              type="number"
              min={1}
              max={20}
              value={partySize}
              onValueChange={handlePartySizeChange}
              radius="sm"
              variant="flat"
              classNames={{
                inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm h-[44px]',
                input: 'text-sm',
              }}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Table Preference{' '}
              {filteredTables.length === 0
                ? '(No tables available for this party size)'
                : '(Optional)'}
            </h3>
            <Select
              selectedKeys={selectedTable ? new Set([selectedTable]) : new Set([])}
              onSelectionChange={handleTableSelect}
              radius="sm"
              variant="flat"
              isDisabled={filteredTables.length === 0}
              placeholder="Select a table (optional)"
              classNames={{
                trigger: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm h-[44px]',
                value: 'text-sm',
              }}
            >
              {filteredTables.map((table) => (
                <SelectItem key={table.id}>{formatTableName(table)}</SelectItem>
              ))}
            </Select>
            <p className="text-xs text-gray-500 mt-1.5">
              <Info className="h-3.5 w-3.5 inline-block mr-1 align-text-bottom" />
              Tables can be assigned or changed later
            </p>
          </div>

          {/* Automatic shift selection */}
          {!isLoadingShifts && shifts && shifts.length > 0 && getMatchingShift() && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Shift</h3>
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-md px-4 py-3 shadow-sm border border-gray-200">
                <p className="text-sm">
                  <span className="font-medium">Automatic:</span>{' '}
                  {getMatchingShift()?.name} ({getMatchingShift()?.startTime}-{getMatchingShift()?.endTime})
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <Info className="h-3 w-3 inline-block mr-1 align-text-bottom" />
                  Shift is automatically determined based on reservation time
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Reservation Source
            </h3>
            <RadioGroup
              orientation="horizontal"
              value={source}
              onValueChange={handleSourceSelect}
              classNames={{
                wrapper: 'gap-4',
              }}
            >
              <Radio value={ReservationSource.PHONE}>Phone</Radio>
              <Radio value={ReservationSource.ONLINE}>Online</Radio>
              <Radio value={ReservationSource.WALK_IN}>Walk-in</Radio>
              <Radio value={ReservationSource.OTHER}>Other</Radio>
            </RadioGroup>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Special Requests
            </h3>
            <Textarea
              placeholder="Any special requests or notes for this reservation"
              value={specialRequests}
              onValueChange={setSpecialRequests}
              radius="sm"
              variant="flat"
              rows={3}
              classNames={{
                inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                input: 'text-sm',
              }}
            />
          </div>

          {dietaryRestrictions.length > 0 && (
            <div className="bg-amber-50/60 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Dietary Information
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {dietaryRestrictions.map((restriction, index) => (
                      <Chip key={index} color="warning" variant="flat" radius="sm" size="sm">
                        {restriction}
                      </Chip>
                    ))}
                  </div>
                  {allergies && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                      <span className="font-medium">Allergies:</span> {allergies}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Button
              variant="flat"
              radius="sm"
              className="flex-1"
              onPress={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="success"
              radius="sm"
              className="flex-1 text-white"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Reservation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
