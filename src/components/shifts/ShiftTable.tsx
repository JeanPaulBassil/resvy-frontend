import React from 'react';
import { 
  Button, 
  Chip, 
  Dropdown, 
  DropdownItem, 
  DropdownMenu, 
  DropdownTrigger, 
  Input, 
  Select, 
  SelectItem 
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Shift } from '@/types/shift';

interface ShiftTableProps {
  shifts: Shift[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  onEdit: (shift: Shift) => void;
  onToggleActive: (shiftId: string) => void;
  onDelete: (shift: Shift) => void;
  onCreate: () => void;
}

export default function ShiftTable({ 
  shifts, 
  searchQuery, 
  setSearchQuery, 
  filter, 
  setFilter, 
  onEdit, 
  onToggleActive, 
  onDelete,
  onCreate
}: ShiftTableProps) {
  return (
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
            {shifts.map(shift => (
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
                          onClick={() => onEdit(shift)}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem 
                          key="toggle"
                          startContent={<Icon icon={shift.active ? "solar:eye-closed-linear" : "solar:eye-linear"} />}
                          onClick={() => onToggleActive(shift.id)}
                        >
                          {shift.active ? "Deactivate" : "Activate"}
                        </DropdownItem>
                        <DropdownItem 
                          key="delete"
                          startContent={<Icon icon="solar:trash-bin-trash-linear" className="text-danger" />}
                          className="text-danger"
                          onClick={() => onDelete(shift)}
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
        
        {shifts.length === 0 && (
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
                className="bg-[#75CAA6] hover:bg-[#5fb992]"
                startContent={<Icon icon="solar:add-circle-linear" />}
                onClick={onCreate}
              >
                Create New Shift
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 