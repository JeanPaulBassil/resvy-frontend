'use client';

import type { Floor } from '@/types/floor';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import FloorFormModal from './floor-form-modal';
import FloorDeleteModal from './floor-delete-modal';
import { getFloorTypeIcon, getFloorTypeLabel } from './floor-icons';

interface FloorSelectorProps {
  floors: Floor[];
  activeFloorId: string;
  restaurantId: string;
  onFloorChange: (floorId: string) => void;
  onAddFloor: (floor: Floor) => void;
  onUpdateFloor: (floor: Floor) => void;
  onDeleteFloor: (floorId: string) => void;
}

export default function FloorSelector({
  floors,
  activeFloorId,
  restaurantId,
  onFloorChange,
  onAddFloor,
  onUpdateFloor,
  onDeleteFloor,
}: FloorSelectorProps) {
  // Use useDisclosure for modal states
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  
  // State for tracking which floor is being edited or deleted
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<Floor | null>(null);

  // Handler for adding a new floor
  const handleAddFloor = () => {
    setEditingFloor(null);
    editModal.onOpen();
  };

  // Handler for editing a floor
  const handleEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
    editModal.onOpen();
  };

  // Handler for saving a floor (new or edited)
  const handleSaveFloor = (floor: Floor) => {
    if (editingFloor) {
      onUpdateFloor(floor);
    } else {
      onAddFloor(floor);
    }
    editModal.onClose();
  };

  // Handler for initiating floor deletion
  const handleDeleteClick = (floor: Floor) => {
    setFloorToDelete(floor);
    deleteModal.onOpen();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {floors.map((floor) => (
          <Tooltip
            key={floor.id}
            content={getFloorTypeLabel(floor.type)}
          >
            <Button
              size="sm"
              variant={activeFloorId === floor.id ? 'solid' : 'flat'}
              className={`min-w-0 h-8 px-3 ${
                activeFloorId === floor.id
                  ? 'bg-[#75CAA6] text-white'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
              startContent={getFloorTypeIcon(floor.type)}
              endContent={
                <Dropdown>
                  <DropdownTrigger>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1 p-0.5 rounded-full hover:bg-black/10 focus:outline-none"
                    >
                      <Icon icon="solar:menu-dots-bold" width={12} className="text-current" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem key="edit">
                      <button 
                        className="w-full flex items-center gap-2 text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFloor(floor);
                        }}
                      >
                        <Icon icon="solar:pen-linear" width={16} />
                        <span>Edit Floor</span>
                      </button>
                    </DropdownItem>
                    <DropdownItem 
                      key="delete" 
                      className="text-danger"
                      isDisabled={floors.length <= 1}
                    >
                      <button 
                        className="w-full flex items-center gap-2 text-left text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(floor);
                        }}
                        disabled={floors.length <= 1}
                      >
                        <Icon icon="solar:trash-bin-trash-linear" width={16} />
                        <span>Delete Floor</span>
                      </button>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              }
              onClick={() => onFloorChange(floor.id)}
            >
              {floor.name}
            </Button>
          </Tooltip>
        ))}

        <Button
          variant="flat"
          className="h-8 px-2 min-w-0 bg-white border border-dashed border-gray-300 hover:bg-gray-50/50"
          startContent={<Plus className="h-4 w-4 text-gray-500" />}
          onClick={handleAddFloor}
          data-add-floor-button
        >
          <span className="text-gray-600">Add Floor</span>
        </Button>
      </div>

      {/* Floor Form Modal - Using useDisclosure */}
      <FloorFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        editingFloor={editingFloor}
        restaurantId={restaurantId}
        onSubmit={handleSaveFloor}
      />

      {/* Delete Confirmation Modal - Using the new component */}
      <FloorDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        floor={floorToDelete}
        onConfirmDelete={onDeleteFloor}
        isLastFloor={floors.length <= 1}
      />
    </>
  );
}
