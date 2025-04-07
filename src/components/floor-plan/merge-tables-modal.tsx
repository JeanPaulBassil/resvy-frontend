"use client"

import { Table, getTableColor } from "@/types/table"
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"
import { Icon } from '@iconify/react';

interface MergeTablesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tables: Table[]
}

export default function MergeTablesModal({ isOpen, onClose, onConfirm, tables }: MergeTablesModalProps) {
  if (!tables || tables.length < 2) return null

  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      backdrop="blur"
      size="md"
    >
      <ModalContent className="bg-white">
        <ModalHeader className="flex flex-col gap-1 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-md">
              <Icon icon="solar:merge-linear" className="text-indigo-600" width={20} />
            </div>
            <h2 className="text-xl font-semibold">Merge Tables</h2>
          </div>
        </ModalHeader>

        <ModalBody className="py-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <Icon icon="solar:info-circle-linear" className="text-indigo-600" width={20} />
              <p className="text-sm text-indigo-700">
                You're about to merge {tables.length} adjacent tables into a single larger table.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Tables to be merged:</div>
              <div className="grid grid-cols-1 gap-2">
                {tables.map((table) => (
                  <div 
                    key={table.id} 
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: getTableColor(table.status) }}
                    >
                      <span className="text-xs font-bold text-white">{table.name.replace(/[^0-9]/g, '') || '?'}</span>
                    </div>
                    <div>
                      <div className="font-medium">{table.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Icon icon="solar:users-group-rounded-linear" width={12} />
                        {table.capacity} seats
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Result:</div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <Icon icon="solar:users-group-rounded-linear" width={14} className="text-indigo-600" />
                  {totalCapacity} total seats
                </div>
              </div>
              <div className="mt-3 relative h-20 bg-[#f5f5f4] rounded-md overflow-hidden">
                <div 
                  className="absolute rounded-xl border-2 border-dashed border-indigo-300 flex flex-col items-center justify-center bg-indigo-100/50"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70%',
                    height: '70%',
                  }}
                >
                  <div className="text-center text-xs font-bold text-indigo-700">
                    Merged Table
                  </div>
                </div>
              </div>
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
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Merge Tables
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

