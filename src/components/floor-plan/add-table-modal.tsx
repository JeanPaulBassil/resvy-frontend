'use client'

import { useEffect, useState } from 'react'
import { type Table, type CreateTableDto, TableStatus } from '@/types/table'
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Slider, Tabs, Tab } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useCreateTable } from '@/hooks/useTable'
import { generateId } from '@/lib/utils'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface AddTableModalProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  floorId: string
  onTableAdded: (table: Table) => void
}

// Define the Zod schema for table form validation
const tableFormSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(50, 'Table name must be less than 50 characters'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(20, 'Capacity must be at most 20'),
  x: z.number().int(),
  y: z.number().int(),
  status: z.nativeEnum(TableStatus),
  color: z.string().min(1, 'Color is required'),
  floorId: z.string().min(1, 'Floor ID is required'),
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  mergedTableIds: z.array(z.string()),
  parentTableId: z.string().nullable(),
  isHidden: z.boolean(),
  isMerged: z.boolean(),
});

// Helper function to convert TableStatus enum to string representation
const getTableStatusString = (status: TableStatus): string => {
  return TableStatus[status];
};

// Helper function to convert string representation back to TableStatus enum
const getTableStatusEnum = (statusString: string): TableStatus => {
  return TableStatus[statusString as keyof typeof TableStatus];
};

// Define the form values type from the Zod schema
type TableFormValues = z.infer<typeof tableFormSchema>;

export default function AddTableModal({
  isOpen,
  onClose,
  restaurantId,
  floorId,
  onTableAdded
}: AddTableModalProps) {
  const [activeTab, setActiveTab] = useState('basic')
  
  // Use React Query hook for creating tables
  const createTableMutation = useCreateTable(restaurantId, floorId)
  
  // Setup react-hook-form with Zod validation
  const { 
    control, 
    handleSubmit, 
    reset, 
    setValue, 
    watch,
    formState: { isValid }
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    mode: 'onChange',
    defaultValues: {
      x: 100,
      y: 100,
      capacity: 2,
      status: TableStatus.AVAILABLE,
      color: '#10b981', // green for available
      name: 'New Table',
      floorId: floorId,
      restaurantId,
      mergedTableIds: [],
      parentTableId: null,
      isHidden: false,
      isMerged: false,
    }
  })
  
  // Watch the status to update color when status changes
  const status = watch('status')
  
  // Keyboard handling for iPad - Set CSS custom property for actual viewport height
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial value
    setVh();
    
    // Listen for resize events
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    
    // Also listen for visual viewport changes (keyboard)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', setVh);
    }
    
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', setVh);
      }
    };
  }, []);
  
  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form with default values
      reset({
        x: 100,
        y: 100,
        capacity: 2,
        status: TableStatus.AVAILABLE,
        color: '#10b981', // green for available
        name: 'New Table',
        floorId: floorId,
        restaurantId,
        mergedTableIds: [],
        parentTableId: null,
        isHidden: false,
        isMerged: false,
      })
    }
  }, [isOpen, floorId, restaurantId, reset])
  
  // Update color when status changes
  useEffect(() => {
    const statusColors = {
      [TableStatus.AVAILABLE]: '#10b981', // green
      [TableStatus.OCCUPIED]: '#ef4444', // red
      [TableStatus.RESERVED]: '#75CAA6', // blue
    }
    
    setValue('color', statusColors[status])
  }, [status, setValue])
  
  // Reset state when modal closes
  const handleClose = () => {
    onClose()
    // Reset after animation completes
    setTimeout(() => {
      reset()
      setActiveTab('basic')
    }, 300)
  }
  
  const onSubmit = (data: TableFormValues) => {
    // Create a complete table object with generated ID and timestamps
    const newTable: Table = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Prepare the data for API submission
    const createTableDto: CreateTableDto = {
      name: data.name,
      capacity: data.capacity,
      x: data.x,
      y: data.y,
      status: data.status,
      floorId: floorId
    }
    
    // Optimistically add the table to the UI
    onTableAdded(newTable)
    
    // Close the modal
    handleClose()

    // Submit to the API
    createTableMutation.mutate(createTableDto, {
      onError: (error: Error) => {
        console.error('Failed to create table:', error)
        // The parent component should handle error cases
      }
    })
  }
  
  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={(open) => !open && handleClose()}
      size="full"
      backdrop="blur"
      placement="top"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[calc(var(--vh,1vh)*90)]",
        backdrop: "bg-black/40",
        body: "py-4 px-4",
        header: "py-3 px-4 border-b",
        footer: "py-3 px-4 border-t"
      }}
    >
      <ModalContent className="bg-white overflow-hidden flex flex-col max-h-[calc(var(--vh,1vh)*90)]">
        <ModalHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-[#75CAA6]/10 p-1.5 rounded-md">
              <Icon icon="solar:table-2-linear" className="text-[#75CAA6]" width={20} />
            </div>
            <h2 className="text-lg font-semibold">Add New Table</h2>
          </div>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="flex-1 overflow-y-auto py-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Table Name</div>
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input 
                        {...field}
                        placeholder="Enter table name"
                        className={`border-gray-300 ${fieldState.error ? 'border-red-500' : ''}`}
                        startContent={<Icon icon="solar:pen-linear" width={16} className="text-gray-500" />}
                        isInvalid={!!fieldState.error}
                        size="sm"
                      />
                      {fieldState.error && (
                        <div className="text-xs text-red-500 mt-1">{fieldState.error.message}</div>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Seating Capacity</div>
                <div className="flex items-center gap-3">
                  <Controller
                    name="capacity"
                    control={control}
                    render={({ field: { onChange, value }, fieldState }) => (
                      <div className="w-full">
                        <div className="flex items-center gap-3">
                          <Slider
                            size="sm"
                            step={1}
                            minValue={1}
                            maxValue={12}
                            value={value}
                            onChange={onChange}
                            className={`flex-1 ${fieldState.error ? 'border-red-500' : ''}`}
                            color="primary"
                          />
                          <div className="w-12 h-8 bg-gray-100 rounded-md flex items-center justify-center text-sm font-medium">
                            {value}
                          </div>
                        </div>
                        {fieldState.error && (
                          <div className="text-xs text-red-500 mt-1">{fieldState.error.message}</div>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Table Status</div>
                <Controller
                  name="status"
                  control={control}
                  render={({ field: { onChange, value }, fieldState }) => (
                    <div>
                      <Select 
                        selectedKeys={[getTableStatusString(value)]}
                        onChange={(e) => onChange(getTableStatusEnum(e.target.value))}
                        className={`border-gray-300 ${fieldState.error ? 'border-red-500' : ''}`}
                        isInvalid={!!fieldState.error}
                        size="sm"
                      >
                        <SelectItem 
                          key={TableStatus[TableStatus.AVAILABLE]} 
                          startContent={<div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>}
                        >
                          Available
                        </SelectItem>
                        <SelectItem 
                          key={TableStatus[TableStatus.OCCUPIED]} 
                          startContent={<div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>}
                        >
                          Occupied
                        </SelectItem>
                        <SelectItem 
                          key={TableStatus[TableStatus.RESERVED]} 
                          startContent={<div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>}
                        >
                          Reserved
                        </SelectItem>
                      </Select>
                      {fieldState.error && (
                        <div className="text-xs text-red-500 mt-1">{fieldState.error.message}</div>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="flex-shrink-0 gap-2">
            <Button 
              variant="flat" 
              onClick={handleClose}
              className="bg-white border border-gray-200"
              type="button"
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              type="submit"
              className="bg-[#75CAA6]"
              isLoading={createTableMutation.isPending}
              isDisabled={!isValid}
              size="sm"
            >
              Create Table
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
} 