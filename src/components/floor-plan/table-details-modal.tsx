"use client"

import { useState, useEffect } from "react"
import { Table, TableStatus } from "@/types/table"
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Slider } from "@heroui/react"
import { Icon } from '@iconify/react';

interface TableDetailsModalProps {
  table: Table | null
  isOpen: boolean
  onClose: () => void
  onUpdateTable: (table: Table) => void
  isCreating?: boolean
}

export default function TableDetailsModal({ 
  table, 
  isOpen, 
  onClose, 
  onUpdateTable,
  isCreating = false
}: TableDetailsModalProps) {
  const [tableData, setTableData] = useState<Table | null>(table)

  // Update local state when selected table changes
  useEffect(() => {
    setTableData(table)
  }, [table])

  if (!tableData) return null

  const handleInputChange = (field: keyof Table, value: Table[keyof Table]) => {
    const updatedTable = { ...tableData, [field]: value }
    setTableData(updatedTable)
    onUpdateTable(updatedTable)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      backdrop="blur"
      size="md"
      scrollBehavior="inside"
    >
      <ModalContent className="bg-white">
        <ModalHeader className="flex flex-col gap-1 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-[#75CAA6]/10 p-1.5 rounded-md">
              <Icon icon="solar:table-2-linear" className="text-[#75CAA6]" width={20} />
            </div>
            <h2 className="text-xl font-semibold">{isCreating ? 'Add New Table' : 'Edit Table'}</h2>
          </div>
          {tableData.isMerged && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Icon icon="solar:info-circle-linear" width={14} />
              This is a merged table combining multiple tables
            </div>
          )}
        </ModalHeader>

        <ModalBody className="py-5">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-sm font-medium">Table Name</div>
              <Input 
                value={tableData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter table name"
                className="border-gray-300"
                startContent={<Icon icon="solar:pen-linear" width={16} className="text-gray-500" />}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Seating Capacity</div>
              <div className="flex items-center gap-3">
                <Slider
                  size="sm"
                  step={1}
                  minValue={1}
                  maxValue={12}
                  value={tableData.capacity}
                  onChange={(value) => handleInputChange('capacity', Array.isArray(value) ? value[0] : value)}
                  className="flex-1"
                  color="primary"
                />
                <div className="w-12 h-9 bg-gray-100 rounded-md flex items-center justify-center text-sm font-medium">
                  {tableData.capacity}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Table Status</div>
              <Select 
                selectedKeys={[TableStatus[tableData.status]]}
                onChange={(e) => handleInputChange('status', TableStatus[e.target.value as keyof typeof TableStatus])}
                className="border-gray-300"
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
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-t">
          <Button 
            variant="flat" 
            onClick={onClose}
            className="bg-white border border-gray-200"
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={() => {
              onUpdateTable(tableData);
              if (!isCreating) {
                onClose();
              }
            }}
            className="bg-[#75CAA6]"
          >
            {isCreating ? 'Create Table' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

