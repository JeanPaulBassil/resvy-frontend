'use client';

import { Guest, CreateGuestDto } from '@/api/guest';
import { CreateReservationDto } from '@/api/reservation';
import { ReservationForm } from '@/components/shared/ReservationForm';
import { useGuests } from '@/hooks/useGuest';
import { useCreateReservation } from '@/hooks/useReservation';
import { useCreateGuest } from '@/hooks/useGuest';
import { 
  Avatar, 
  Button, 
  Input, 
  Spinner,
  Card,
} from '@heroui/react';
import { Search, User, UserPlus, X, Phone, Mail, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRestaurant } from '../providers/RestaurantProvider';

interface AddReservationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  selectedGuest: Guest | null;
}

export default function AddReservationModal({
  onClose,
  onSuccess,
  selectedGuest,
}: AddReservationModalProps) {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  
  // State for steps and form data
  const [step, setStep] = useState<'guest-selection' | 'reservation-form'>(
    selectedGuest ? 'reservation-form' : 'guest-selection'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [chosenGuest, setChosenGuest] = useState<Guest | null>(selectedGuest);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // New guest form data
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestNotes, setNewGuestNotes] = useState('');
  
  // Mutations
  const createReservation = useCreateReservation();
  const createGuest = useCreateGuest(restaurantId || '');
  
  // Fetch guests for selection
  const { data: guests, isLoading: isLoadingGuests } = useGuests(restaurantId || '');
  
  // Filter guests based on search query
  const filteredGuests = guests
    ? guests.filter(
        (guest) =>
          guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (guest.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      ).slice(0, 5) // Limit to 5 results
    : [];

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Pre-fill guest form when creating new
  useEffect(() => {
    if (isCreatingGuest) {
      setNewGuestName(searchQuery);
    }
  }, [isCreatingGuest, searchQuery]);
  
  // Move to reservation form with selected guest
  const selectGuest = (guest: Guest) => {
    setChosenGuest(guest);
    setStep('reservation-form');
  };
  
  // Handle guest creation
  const handleCreateGuest = async () => {
    if (!newGuestName || !newGuestPhone) {
      return; // Skip if missing required fields
    }
    
    try {
      const guestData: CreateGuestDto = {
        name: newGuestName,
        phone: newGuestPhone,
        email: newGuestEmail || undefined,
        notes: newGuestNotes || undefined,
      };
      
      const newGuest = await createGuest.mutateAsync(guestData);
      setChosenGuest(newGuest);
      setStep('reservation-form');
    } catch (error) {
      console.error('Error creating guest:', error);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(value.length > 0);
    setIsCreatingGuest(false);
  };
  
  // Handle reservation creation
  const handleCreateReservation = async (data: CreateReservationDto) => {
    try {
      await createReservation.mutateAsync(data);
      onSuccess();
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };
  
  // Guest selection step
  if (step === 'guest-selection') {
    return (
      <div className="p-6 flex flex-col" style={{ height: '650px' }}>
        <div className="mb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold mb-1">Add Reservation</h2>
          <p className="text-gray-500">Search for an existing guest or create a new one</p>
        </div>
        
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <Input
            value={searchQuery}
            onValueChange={handleSearchChange}
            placeholder="Search for a guest by name, phone, or email"
            startContent={<Search className="text-gray-400" />}
            className="mb-1"
            onFocus={() => searchQuery && setShowDropdown(true)}
          />
          
          {showDropdown && !isCreatingGuest && (
            <Card className="absolute z-20 w-full mt-1 shadow-lg max-h-[300px] overflow-auto">
              {isLoadingGuests ? (
                <div className="p-4 flex justify-center">
                  <Spinner color="primary" size="sm" />
                </div>
              ) : filteredGuests.length > 0 ? (
                <div>
                  {filteredGuests.map((guest) => (
                    <div 
                      key={guest.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => selectGuest(guest)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={guest.name} className="h-10 w-10" color="primary" />
                        <div>
                          <p className="font-medium">{guest.name}</p>
                          <p className="text-xs text-gray-500">{guest.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 text-primary-600"
                  onClick={() => setIsCreatingGuest(true)}
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Create new guest "{searchQuery}"</span>
                </div>
              )}
            </Card>
          )}
        </div>
        
        {isCreatingGuest ? (
          <div className="mt-4 border rounded-lg p-4 overflow-auto flex-1">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Create New Guest</h3>
              <Button
                isIconOnly
                variant="light"
                onPress={() => setIsCreatingGuest(false)}
                className="text-gray-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input 
                  value={newGuestName}
                  onValueChange={setNewGuestName}
                  placeholder="Full name"
                  isRequired
                  startContent={<User className="text-gray-400 h-4 w-4" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <Input 
                  value={newGuestPhone}
                  onValueChange={setNewGuestPhone}
                  placeholder="Phone number"
                  isRequired
                  startContent={<Phone className="text-gray-400 h-4 w-4" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input 
                  value={newGuestEmail}
                  onValueChange={setNewGuestEmail}
                  placeholder="Email address"
                  type="email"
                  startContent={<Mail className="text-gray-400 h-4 w-4" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input 
                  value={newGuestNotes}
                  onValueChange={setNewGuestNotes}
                  placeholder="Any additional notes"
                  startContent={<FileText className="text-gray-400 h-4 w-4" />}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <Button 
                variant="flat" 
                onPress={() => setIsCreatingGuest(false)}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleCreateGuest}
                isLoading={createGuest.isPending}
                isDisabled={!newGuestName || !newGuestPhone}
              >
                {createGuest.isPending ? 'Creating...' : 'Create Guest & Continue'}
              </Button>
            </div>
          </div>
        ) : !searchQuery && (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="inline-flex justify-center items-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Find or Create a Guest</h3>
            <p className="text-gray-500 max-w-md text-center">
              Start typing to search for an existing guest, or create a new guest record
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // Reservation form step
  return (
    <div className="p-4" style={{ height: '650px', overflow: 'auto' }}>
      {chosenGuest && (
        <ReservationForm
          guest={chosenGuest}
          preferredSeating={chosenGuest.preferredSeating || undefined}
          dietaryRestrictions={chosenGuest.dietaryRestrictions}
          allergies={chosenGuest.allergies || ''}
          restaurantId={restaurantId}
          onSubmit={handleCreateReservation}
          onCancel={onClose}
          isSubmitting={createReservation.isPending}
        />
      )}
    </div>
  );
}
