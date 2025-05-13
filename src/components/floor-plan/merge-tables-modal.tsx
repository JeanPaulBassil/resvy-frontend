"use client"

import { Table, getTableColor } from "@/types/table"
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface MergeTablesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tables: Table[]
}

export default function MergeTablesModal({ isOpen, onClose, onConfirm, tables }: MergeTablesModalProps) {
  if (!tables || tables.length < 2) return null

  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);

  // Animation variants for staggered animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      backdrop="blur"
      size="md"
      className="overflow-hidden"
    >
      <ModalContent className="bg-white rounded-2xl shadow-2xl">
        <ModalHeader className="flex flex-col gap-1 border-b bg-gradient-to-r from-indigo-50 to-blue-50 py-5">
          <div className="flex items-center gap-3 px-2">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-2.5 rounded-xl shadow-md">
              <Icon icon="solar:merge-linear" className="text-white" width={24} />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
              Merge Tables
            </h2>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <motion.div 
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item} className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
              <div className="bg-indigo-100 p-2 rounded-xl">
                <Icon icon="solar:info-circle-linear" className="text-indigo-600" width={24} />
              </div>
              <p className="text-sm font-medium text-indigo-800">
                You're about to merge {tables.length} adjacent tables into a single larger table with {totalCapacity} seats.
              </p>
            </motion.div>

            <motion.div variants={item} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Icon icon="solar:list-linear" className="text-indigo-500" width={18} />
                Tables to be merged:
              </h3>
              <motion.div 
                className="grid grid-cols-1 gap-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {tables.map((table) => (
                  <motion.div
                    key={table.id}
                    variants={item} 
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${getTableColor(table.status)}, ${getTableColor(table.status)}dd)`,
                      }}
                    >
                      <span className="text-sm font-bold">{table.name.replace(/[^0-9]/g, '') || '?'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{table.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Icon icon="solar:users-group-rounded-linear" width={12} />
                        {table.capacity} {table.capacity === 1 ? 'seat' : 'seats'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div 
              variants={item}
              className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 shadow-sm"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Icon icon="solar:magic-stick-linear" className="text-indigo-500" width={18} />
                  Result Preview
                </h3>
                <div className="text-sm font-semibold flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-indigo-100">
                  <Icon icon="solar:users-group-rounded-bold" width={16} className="text-indigo-600" />
                  {totalCapacity} total seats
                </div>
              </div>
              <div className="mt-3 relative h-28 bg-[#f5f5f4] rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Original tables visualization */}
                  {tables.map((table, index) => (
                    <motion.div 
                      key={`preview-${table.id}`}
                      className="absolute w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center text-xs font-bold"
                      initial={{ 
                        x: (index - Math.floor(tables.length/2)) * 30 - 30,
                        opacity: 1,
                        scale: 1
                      }}
                      animate={{ 
                        x: 0,
                        opacity: 0,
                        scale: 0,
                        transition: { delay: 1 + index * 0.2, duration: 0.5 }
                      }}
                      style={{ backgroundColor: getTableColor(table.status) }}
                    >
                      {table.name.replace(/[^0-9]/g, '')}
                    </motion.div>
                  ))}

                  {/* Merged table */}
                  <motion.div
                    className="absolute rounded-xl border-2 border-indigo-300 flex flex-col items-center justify-center bg-gradient-to-r from-indigo-100/50 to-blue-100/50 shadow-lg text-center z-10"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      transition: { 
                        delay: 1.5,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }
                    }}
                    style={{
                      width: Math.min(160, 60 + tables.length * 15),
                      height: 80,
                    }}
                  >
                    <div className="font-bold text-indigo-700 mb-1">
                      Merged Table
                    </div>
                    <div className="text-xs flex items-center gap-1 text-indigo-600">
                      <Icon icon="solar:users-group-rounded-bold-duotone" width={12} />
                      {totalCapacity} seats
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </ModalBody>

        <ModalFooter className="border-t bg-gray-50 py-4 gap-3">
          <Button 
            variant="flat" 
            onClick={onClose}
            className="bg-white border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={onConfirm}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
          >
            <div className="flex items-center gap-2">
              <Icon icon="solar:magic-stick-linear" width={18} />
              Merge Tables
            </div>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

