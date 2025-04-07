"use client"

import { Table, TableStatus } from "@/types/table"
import { Badge, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
import { Edit, Users } from "lucide-react"

interface TableListViewProps {
  tables: Table[]
  selectedTableIds: string[]
  onSelectTable: (id: string) => void
  onUpdateTableStatus: (id: string, status: TableStatus) => void
  onEditTable: () => void
  floorName?: string
}

export default function TableListView({
  tables,
  selectedTableIds,
  onSelectTable,
  onUpdateTableStatus,
  onEditTable,
  floorName = "",
}: TableListViewProps) {
  // Sort tables by name
  const sortedTables = [...tables].sort((a, b) => {
    // Extract numbers from table names for natural sorting
    const aMatch = a.name.match(/\d+/)
    const bMatch = b.name.match(/\d+/)

    if (aMatch && bMatch) {
      return Number.parseInt(aMatch[0]) - Number.parseInt(bMatch[0])
    }

    return a.name.localeCompare(b.name)
  })

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case TableStatus.OCCUPIED:
        return (
          <Badge variant="flat" className="bg-red-100 text-red-700 border border-red-200">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              Occupied
            </div>
          </Badge>
        )
      case TableStatus.RESERVED:
        return (
          <Badge variant="flat" className="bg-blue-100 text-blue-700 border border-blue-200">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Reserved
            </div>
          </Badge>
        )
      case TableStatus.AVAILABLE:
      default:
        return (
          <Badge variant="flat" className="bg-green-100 text-green-700 border border-green-200">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Available
            </div>
          </Badge>
        )
    }
  }

  return (
    <div className="h-full overflow-auto p-4">
      {floorName && (
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path><path d="M12 3v6"></path></svg>
          <h3 className="text-lg font-medium">{floorName}</h3>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        <div className="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-50 rounded-md font-medium text-sm text-gray-600">
          <div className="col-span-3">Table</div>
          <div className="col-span-2">Capacity</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-4 text-right">Actions</div>
        </div>

        {sortedTables.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-400"><rect width="8" height="8" x="2" y="2" rx="2"></rect><rect width="8" height="8" x="14" y="2" rx="2"></rect><rect width="8" height="8" x="2" y="14" rx="2"></rect><rect width="8" height="8" x="14" y="14" rx="2"></rect></svg>
            <p>No tables on this floor</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Table" to create one</p>
          </div>
        ) : (
          sortedTables.map((table) => (
            <div
              key={table.id}
              className={`grid grid-cols-12 gap-4 py-3 px-4 rounded-md border transition-colors ${
                selectedTableIds.includes(table.id)
                  ? "bg-[#75CAA6]/5 border-[#75CAA6]"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => onSelectTable(table.id)}
            >
              <div className="col-span-3 font-medium flex items-center">
                <div className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 mr-2">
                  {table.name.replace(/[^0-9]/g, '') || '?'}
                </div>
                {table.name}
                {table.isMerged && (
                  <Badge variant="flat" className="ml-2 text-xs bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Merged
                  </Badge>
                )}
              </div>
              <div className="col-span-2 flex items-center">
                <Users className="h-4 w-4 mr-1 text-gray-500" />
                {table.capacity}
              </div>
              <div className="col-span-3">{getStatusBadge(table.status)}</div>
              <div className="col-span-4 flex justify-end space-x-2">
                <Dropdown>
                  <DropdownTrigger asChild>
                    <Button variant="flat" size="sm" className="bg-white border border-gray-200">
                      Set Status
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem key={TableStatus.AVAILABLE} onClick={() => onUpdateTableStatus(table.id, TableStatus.AVAILABLE)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Mark as Available
                      </div>
                    </DropdownItem>
                    <DropdownItem key={TableStatus.OCCUPIED} onClick={() => onUpdateTableStatus(table.id, TableStatus.OCCUPIED)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Mark as Occupied
                      </div>
                    </DropdownItem>
                    <DropdownItem key={TableStatus.RESERVED} onClick={() => onUpdateTableStatus(table.id, TableStatus.RESERVED)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Mark as Reserved
                      </div>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white border border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectTable(table.id)
                    onEditTable()
                  }}
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

