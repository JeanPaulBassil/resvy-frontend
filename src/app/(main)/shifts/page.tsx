'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Dropdown, 
  DropdownItem, 
  DropdownMenu, 
  DropdownTrigger, 
  Input, 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalFooter, 
  ModalHeader, 
  Select, 
  SelectItem, 
  Tab, 
  Tabs, 
  useDisclosure 
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { format, addDays, isAfter, parseISO, isValid } from 'date-fns';
import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { Shift, UpcomingShift, CreateShiftDto, ShiftReservationCount } from '@/types/shift';
import { 
  useShifts, 
  useCreateShift, 
  useDeleteShift, 
  toggleShiftActiveDirectly, 
  updateShiftDirectly,
  useShiftReservationCounts 
} from '@/hooks/useShift';
import { useToast } from '@/contexts/ToastContext';

interface FormErrors {
  name?: string;
  startTime?: string;
  endTime?: string;
  days?: string;
}

// Generate time options in 30-minute intervals
const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      times.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return times;
};

// Format time for display (convert from 24h to 12h format)
const formatTimeDisplay = (time: string): string => {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minute} ${period}`;
};

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ShiftsPage() {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id || '';
  const toast = useToast();
  
  // Use React Query hooks
  const { data: shifts = [], isLoading: isLoadingShifts, refetch: refetchShifts } = useShifts(restaurantId);
  const { data: reservationCounts = [], isLoading: isLoadingReservationCounts } = useShiftReservationCounts(restaurantId);
  const createShiftMutation = useCreateShift(restaurantId);
  const deleteShiftMutation = useDeleteShift(restaurantId);
  
  // State to track the currently selected shift for editing
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  
  // Other state
  const [upcomingShifts, setUpcomingShifts] = useState<UpcomingShift[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [newShift, setNewShift] = useState<CreateShiftDto>({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    days: [],
    color: '#75CAA6'
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Memoize the generateUpcomingShifts function to prevent recreating it on every render
  const generateUpcomingShifts = useCallback((shiftList: Shift[], reservationCountsList: ShiftReservationCount[] = []): UpcomingShift[] => {
    const upcomingShifts: UpcomingShift[] = [];
    const today = new Date();
    
    // Create a lookup map for reservation counts
    const reservationCountMap: Record<string, number> = {};
    reservationCountsList.forEach(count => {
      const key = `${count.shiftId}-${count.date}`;
      reservationCountMap[key] = count.count;
    });
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dayName = format(date, 'EEEE');
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      shiftList.forEach(shift => {
        if (shift.days.includes(dayName) && shift.active) {
          const shiftDateKey = `${shift.id}-${formattedDate}`;
          upcomingShifts.push({
            id: shiftDateKey,
            shiftId: shift.id,
            name: shift.name,
            date: formattedDate,
            startTime: shift.startTime,
            endTime: shift.endTime,
            color: shift.color,
            reservations: reservationCountMap[shiftDateKey] || 0
          });
        }
      });
    }
    
    return upcomingShifts;
  }, []);

  // Update upcoming shifts only when shifts or reservation counts change significantly
  useEffect(() => {
    if (shifts.length > 0) {
      setUpcomingShifts(generateUpcomingShifts(shifts, reservationCounts));
    }
  }, [shifts, JSON.stringify(reservationCounts), generateUpcomingShifts]);

  // Filter shifts based on search query and filter
  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                          (filter === 'active' && shift.active) || 
                          (filter === 'inactive' && !shift.active);
    return matchesSearch && matchesFilter;
  });

  // Group upcoming shifts by date
  const groupedUpcomingShifts = upcomingShifts.reduce<Record<string, UpcomingShift[]>>((acc, shift) => {
    if (!acc[shift.date]) {
      acc[shift.date] = [];
    }
    acc[shift.date].push(shift);
    return acc;
  }, {});

  const handleCreateShift = async () => {
    // Validate form
    const newErrors: FormErrors = {};
    if (!newShift.name.trim()) newErrors.name = 'Name is required';
    if (!newShift.startTime) newErrors.startTime = 'Start time is required';
    if (!newShift.endTime) newErrors.endTime = 'End time is required';
    if (newShift.days.length === 0) newErrors.days = 'At least one day must be selected';
    
    // Check if end time is after start time
    if (newShift.startTime && newShift.endTime) {
      const start = parseISO(`2023-01-01T${newShift.startTime}`);
      const end = parseISO(`2023-01-01T${newShift.endTime}`);
      if (isValid(start) && isValid(end) && !isAfter(end, start)) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      try {
        if (selectedShift) {
          // Update existing shift using direct function
          await updateShiftDirectly(selectedShift.id, newShift, restaurantId);
          toast.success('Shift updated successfully');
        } else {
          // Create new shift using mutation
          await createShiftMutation.mutateAsync(newShift);
        }
        
        // Refetch shifts to update the list
        refetchShifts();
        
        // Reset form and close modal
        setNewShift({
          name: '',
          startTime: '09:00',
          endTime: '17:00',
          days: [],
          color: '#75CAA6'
        });
        setSelectedShift(null);
        onClose();
      } catch (error) {
        toast.error('Failed to ' + (selectedShift ? 'update' : 'create') + ' shift: ' + (error as Error).message);
      }
    }
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setNewShift({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      days: [...shift.days],
      color: shift.color
    });
    onOpen();
  };

  const handleDeleteShift = () => {
    if (selectedShift) {
      deleteShiftMutation.mutate(selectedShift.id);
      onDeleteClose();
      setSelectedShift(null);
    }
  };

  const handleToggleDay = (day: string) => {
    if (newShift.days.includes(day)) {
      setNewShift({
        ...newShift,
        days: newShift.days.filter(d => d !== day)
      });
    } else {
      setNewShift({
        ...newShift,
        days: [...newShift.days, day]
      });
    }
  };

  const handleToggleActive = async (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      try {
        // Call the direct function
        await toggleShiftActiveDirectly(shiftId, !shift.active, restaurantId);
        // On success, refetch the shifts list
        refetchShifts();
        toast.success('Shift status updated successfully');
      } catch (error) {
        toast.error('Failed to update shift status: ' + (error as Error).message);
      }
    }
  };

  const colorOptions = [
    { value: '#75CAA6', label: 'Green (Default)' },
    { value: '#FFB347', label: 'Orange' },
    { value: '#77DD77', label: 'Green' },
    { value: '#836FFF', label: 'Purple' },
    { value: '#FF6961', label: 'Red' },
    { value: '#AEC6CF', label: 'Blue' },
    { value: '#FDFD96', label: 'Yellow' },
    { value: '#FFD1DC', label: 'Pink' },
  ];

  // Show loading state
  if (isLoadingShifts || isLoadingReservationCounts) {
    return (
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 mb-3">
                <div className="absolute inset-0 rounded-full border-2 border-[#75CAA6]/20"></div>
                <div className="absolute inset-0 rounded-full border-t-2 border-[#75CAA6] animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-[#75CAA6]/10 animate-pulse"></div>
                <div className="absolute inset-4 rounded-full bg-[#75CAA6]/20 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
              </div>
              <p className="text-sm font-medium text-gray-600">Loading shifts</p>
              <p className="text-xs text-gray-500 mt-1">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Shift Management</h1>
            <p className="text-gray-500 mt-1">
              Create and manage shifts for {currentRestaurant?.name || 'your restaurant'}
            </p>
          </div>
          <Button 
            color="primary" 
            className="bg-[#75CAA6] hover:bg-[#5eb08a]"
            startContent={<Icon icon="solar:add-circle-linear" />}
            onClick={() => {
              setSelectedShift(null);
              setNewShift({
                name: '',
                startTime: '09:00',
                endTime: '17:00',
                days: [],
                color: '#75CAA6'
              });
              setErrors({});
              onOpen();
            }}
          >
            Create New Shift
          </Button>
        </div>

        {/* Tabs */}
        <Tabs 
          selectedKey={selectedTab} 
          onSelectionChange={(key) => setSelectedTab(key.toString())}
          className="mb-6"
          color="primary"
          variant="underlined"
        >
          <Tab 
            key="upcoming" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:calendar-linear" className="text-lg" />
                <span>Upcoming Shifts</span>
              </div>
            }
          />
          <Tab 
            key="manage" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:settings-linear" className="text-lg" />
                <span>Manage Shifts</span>
              </div>
            }
          />
        </Tabs>

        {/* Upcoming Shifts View */}
        {selectedTab === 'upcoming' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groupedUpcomingShifts).map(([date, dayShifts]) => {
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
                {shifts.filter(s => s.active).map(shift => (
                  <div key={shift.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }}></div>
                    <span className="text-sm">{shift.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manage Shifts View */}
        {selectedTab === 'manage' && (
          <div>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                placeholder="Search shifts..."
                startContent={<Icon icon="solar:magnifer-linear" className="text-gray-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <div className="flex gap-2 ml-auto">
                <Select
                  placeholder="Filter"
                  selectedKeys={new Set([filter])}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0]?.toString() || 'all';
                    setFilter(selected);
                  }}
                  startContent={<Icon icon="solar:filter-linear" className="text-gray-400" />}
                  className="w-40"
                >
                  <SelectItem key="all">All Shifts</SelectItem>
                  <SelectItem key="active">Active</SelectItem>
                  <SelectItem key="inactive">Inactive</SelectItem>
                </Select>
              </div>
            </div>

            {/* Shifts Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Time</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Days</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredShifts.map(shift => (
                    <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }}></div>
                          <span className="font-medium">{shift.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {shift.startTime} - {shift.endTime}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {shift.days.map(day => (
                            <Chip 
                              key={day} 
                              size="sm" 
                              variant="flat" 
                              className="bg-gray-100 text-xs"
                            >
                              {day.substring(0, 3)}
                            </Chip>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Chip 
                          color={shift.active ? "success" : "default"}
                          variant={shift.active ? "flat" : "bordered"}
                          size="sm"
                        >
                          {shift.active ? "Active" : "Inactive"}
                        </Chip>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Dropdown>
                            <DropdownTrigger>
                              <Button 
                                isIconOnly 
                                variant="light" 
                                size="sm"
                                aria-label="More options"
                              >
                                <Icon icon="solar:menu-dots-bold" className="text-lg" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Shift actions">
                              <DropdownItem 
                                key="edit"
                                startContent={<Icon icon="solar:pen-linear" />}
                                onClick={() => handleEditShift(shift)}
                              >
                                Edit
                              </DropdownItem>
                              <DropdownItem 
                                key="toggle"
                                startContent={<Icon icon={shift.active ? "solar:eye-closed-linear" : "solar:eye-linear"} />}
                                onClick={() => handleToggleActive(shift.id)}
                              >
                                {shift.active ? "Deactivate" : "Activate"}
                              </DropdownItem>
                              <DropdownItem 
                                key="delete"
                                startContent={<Icon icon="solar:trash-bin-trash-linear" className="text-danger" />}
                                className="text-danger"
                                onClick={() => {
                                  setSelectedShift(shift);
                                  onDeleteOpen();
                                }}
                              >
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredShifts.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Icon icon="solar:calendar-search-linear" className="text-2xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-1">No shifts found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? 'Try adjusting your search or filters' : 'Create your first shift to get started'}
                  </p>
                  {!searchQuery && (
                    <Button 
                      color="primary" 
                      className="bg-[#75CAA6] hover:bg-[#5eb08a]"
                      startContent={<Icon icon="solar:add-circle-linear" />}
                      onClick={() => {
                        setSelectedShift(null);
                        setNewShift({
                          name: '',
                          startTime: '09:00',
                          endTime: '17:00',
                          days: [],
                          color: '#75CAA6'
                        });
                        setErrors({});
                        onOpen();
                      }}
                    >
                      Create New Shift
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Shift Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">{selectedShift ? 'Edit Shift' : 'Create New Shift'}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
                <Input
                  placeholder="e.g., Breakfast, Lunch, Dinner"
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <Select
                    placeholder="Select start time"
                    selectedKeys={newShift.startTime ? [newShift.startTime] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0]?.toString();
                      if (selected) {
                        setNewShift({ ...newShift, startTime: selected });
                      }
                    }}
                    isInvalid={!!errors.startTime}
                    errorMessage={errors.startTime}
                  >
                    {generateTimeOptions().map(time => (
                      <SelectItem key={time}>{formatTimeDisplay(time)}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <Select
                    placeholder="Select end time"
                    selectedKeys={newShift.endTime ? [newShift.endTime] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0]?.toString();
                      if (selected) {
                        setNewShift({ ...newShift, endTime: selected });
                      }
                    }}
                    isInvalid={!!errors.endTime}
                    errorMessage={errors.endTime}
                  >
                    {generateTimeOptions().map(time => (
                      <SelectItem key={time}>{formatTimeDisplay(time)}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map(day => (
                    <Chip
                      key={day}
                      variant={newShift.days.includes(day) ? "solid" : "bordered"}
                      color={newShift.days.includes(day) ? "primary" : "default"}
                      className={newShift.days.includes(day) ? "bg-[#75CAA6]" : ""}
                      onClick={() => handleToggleDay(day)}
                    >
                      {day.substring(0, 3)}
                    </Chip>
                  ))}
                </div>
                {errors.days && (
                  <p className="text-xs text-red-500 mt-1">{errors.days}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Color</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {colorOptions.map(color => (
                    <div
                      key={color.value}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                        newShift.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-[#75CAA6] scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewShift({ ...newShift, color: color.value })}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              className="bg-[#75CAA6] hover:bg-[#5eb08a]"
              onClick={handleCreateShift}
            >
              {selectedShift ? 'Save Changes' : 'Create Shift'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Delete Shift</h3>
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the <strong>{selectedShift?.name}</strong> shift? 
              This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Note: Deleting this shift will remove it from all future schedules.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onClick={handleDeleteShift}
            >
              Delete Shift
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 