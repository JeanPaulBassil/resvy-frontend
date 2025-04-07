"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Plus, Settings, Trash2, Maximize2, Layers } from "lucide-react"
import { TableStatus, type Table, UpdateTableDto } from "@/types/table"
import type { Floor } from "@/types/floor"
import { Button, Tab, Tabs, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"
import FloorPlan from "./floor-plan"
import TableListView from "./table-list-view"
import TableDetailsModal from "./table-details-modal"
import FloorSelector from "./floor-selector"
import { useFloors, useCreateFloor, useUpdateFloor, useDeleteFloor } from '@/hooks/useFloor'
import { useTables, useUpdateTable, useDeleteTable, useUpdateTablePosition, useUpdateTableStatus, useMergeTables, useUnmergeTables, tableKeys } from '@/hooks/useTable'
import AddTableModal from "./add-table-modal"
import { useQueryClient } from "@tanstack/react-query"

export interface FloorPlanManagerProps {
  restaurantId: string;
}

export default function FloorPlanManager({ restaurantId }: FloorPlanManagerProps) {
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"floor" | "list">("floor")
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<string | undefined>(undefined)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false)

  // Use React Query hooks for floors
  const { data: floors = [], isLoading: isLoadingFloors } = useFloors(restaurantId)
  const [activeFloorId, setActiveFloorId] = useState<string>("")
  const createFloorMutation = useCreateFloor(restaurantId)
  const updateFloorMutation = useUpdateFloor(activeFloorId, restaurantId)
  const deleteFloorMutation = useDeleteFloor(restaurantId)
  
  // Use React Query hooks for tables
  const { data: tables = [], isLoading: isLoadingTables } = useTables(restaurantId, activeFloorId)
  const updateTableMutation = useUpdateTable(selectedTableIds[0] || "", restaurantId, activeFloorId)
  const deleteTableMutation = useDeleteTable(restaurantId, activeFloorId)
  const updateTablePositionMutation = useUpdateTablePosition(selectedTableIds[0] || "", restaurantId, activeFloorId)
  const updateTableStatusMutation = useUpdateTableStatus(selectedTableIds[0] || "", restaurantId, activeFloorId)
  const mergeTablesMutation = useMergeTables(restaurantId, activeFloorId)
  const unmergeTablesMutation = useUnmergeTables(restaurantId, activeFloorId)
  
  // Refs for debouncing table position updates
  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTablePositionRef = useRef<{ id: string, x: number, y: number } | null>(null)
  
  // Local state for optimistic table positions
  const [localTablePositions, setLocalTablePositions] = useState<Record<string, { x: number, y: number }>>({})
  
  // Get the query client for manual cache updates
  const queryClient = useQueryClient();
  
  // Initialize floors from backend data when available
  useEffect(() => {
    if (floors && floors.length > 0) {
      // Set active floor to the first one if not already set
      if (!activeFloorId || !floors.find(f => f.id === activeFloorId)) {
        setActiveFloorId(floors[0].id)
      }
    }
  }, [floors, activeFloorId])

  // Get tables for the active floor only with optimistic positions applied
  const activeFloorTables = tables.filter((table) => !table.isHidden).map(table => {
    // Apply optimistic position updates if available
    if (localTablePositions[table.id]) {
      return {
        ...table,
        x: localTablePositions[table.id].x,
        y: localTablePositions[table.id].y
      };
    }
    return table;
  });

  const selectedTable = tables.find((table) => table.id === selectedTableIds[0])
  const canUnmergeTable = selectedTableIds.length === 1 && selectedTable?.isMerged
  const activeFloor = floors.find((floor) => floor.id === activeFloorId) || floors[0]

  const addTable = () => {
    // Just open the modal instead of directly creating a table
    setIsAddTableModalOpen(true)
  }

  const removeTable = (id: string) => {
    deleteTableMutation.mutate(id)
    
    // Clear selection if the deleted table was selected
    if (selectedTableIds.includes(id)) {
      setSelectedTableIds([])
    }
    
    // Close the delete modal
    setIsDeleteModalOpen(false)
    setTableToDelete(undefined)
  }

  const handleRemoveClick = (id: string) => {
    setTableToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const updateTable = (updatedTable: Table) => {
    // Convert Table to UpdateTableDto
    const updateTableDto: UpdateTableDto = {
      name: updatedTable.name,
      capacity: updatedTable.capacity,
      x: updatedTable.x,
      y: updatedTable.y,
      status: updatedTable.status,
      floorId: updatedTable.floorId || undefined,
      mergedTableIds: updatedTable.mergedTableIds,
      parentTableId: updatedTable.parentTableId || undefined,
    }
    
    updateTableMutation.mutate(updateTableDto)
  }

  const handleTableAdded = (_newTable: Table) => {
    // The table will be added to the tables list via React Query cache invalidation
    // No need to manually update the state
  }

  const updateTablePosition = useCallback((id: string, x: number, y: number) => {
    // Immediately update the position in the UI (optimistic update)
    setLocalTablePositions(prev => ({
      ...prev,
      [id]: { x, y }
    }));
    
    // Store the latest position for backend update
    lastTablePositionRef.current = { id, x, y };
    
    // Clear any existing timeout
    if (positionUpdateTimeoutRef.current) {
      clearTimeout(positionUpdateTimeoutRef.current);
    }
    
    // Set a new timeout to update the position in the backend after the user stops moving
    positionUpdateTimeoutRef.current = setTimeout(() => {
      // Only send the update if we have a valid position
      if (lastTablePositionRef.current && lastTablePositionRef.current.id === id) {
        const { x, y } = lastTablePositionRef.current;
        
        // Manually update the cache before sending the request to prevent flicker
        queryClient.setQueryData(
          tableKeys.list(restaurantId, activeFloorId),
          (old: Table[] | undefined) => {
            if (!old) return old;
            return old.map(table => 
              table.id === id ? { ...table, x, y } : table
            );
          }
        );
        
        // Update the position in the backend
        updateTablePositionMutation.mutate({ x, y }, {
          // Don't refetch on success to prevent flicker
          onSuccess: () => {
            // We've already updated the cache, so we just need to clean up our local state
            setLocalTablePositions(prev => {
              const newPositions = { ...prev };
              delete newPositions[id];
              return newPositions;
            });
          }
        });
      }
    }, 500); // 500ms debounce time
  }, [updateTablePositionMutation, restaurantId, activeFloorId, queryClient]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
    };
  }, []);

  const handleTableSelect = (id: string) => {
    if (id === "") {
      setSelectedTableIds([])
      setIsDetailsModalOpen(false)
      return
    }

    // Always single select mode
    setSelectedTableIds([id])
  }

  const openDetailsModal = () => {
    if (selectedTableIds.length === 1) {
      setIsDetailsModalOpen(true)
    }
  }

  const updateTableStatus = (id: string, status: TableStatus) => {
    // Optimistically update the cache with new status
    queryClient.setQueryData(
      tableKeys.list(restaurantId, activeFloorId),
      (old: Table[] | undefined) => {
        if (!old) return old;
        return old.map(table => 
          table.id === id ? { ...table, status } : table
        );
      }
    );

    // Send the update to the backend
    updateTableStatusMutation.mutate({ status }, {
      // If the mutation fails, revert the optimistic update
      onError: () => {
        queryClient.setQueryData(
          tableKeys.list(restaurantId, activeFloorId),
          (old: Table[] | undefined) => {
            if (!old) return old;
            // Find the original status
            const originalTable = tables.find(t => t.id === id);
            return old.map(table => 
              table.id === id ? { 
                ...table, 
                status: originalTable?.status || status
              } : table
            );
          }
        );
      }
    });
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const mergeTables = (tableIds: string[]) => {
    if (tableIds.length < 2) return
    
    mergeTablesMutation.mutate({ tableIds })
    
    // Clear selection after merging
    setSelectedTableIds([])
  }

  const unmergeTables = () => {
    if (selectedTableIds.length !== 1) return

    const mergedTable = tables.find((table) => table.id === selectedTableIds[0])
    if (!mergedTable?.isMerged || !mergedTable.mergedTableIds) return

    // Call the unmerge API
    unmergeTablesMutation.mutate(selectedTableIds[0])
    
    // Clear selection
    setSelectedTableIds([])
  }

  // Floor management functions
  const handleFloorChange = (floorId: string) => {
    setActiveFloorId(floorId)
    setSelectedTableIds([]) // Clear selection when changing floors
  }

  const handleAddFloor = (floor: Floor) => {
    // The floor will be added via React Query cache invalidation
    // No need to manually update the state
    createFloorMutation.mutate(
      {
        name: floor.name,
        type: floor.type,
        color: floor.color,
      },
      {
        onSuccess: (newFloor) => {
          // Set the new floor as active
          setActiveFloorId(newFloor.id)
        },
      }
    )
  }

  const handleUpdateFloor = (updatedFloor: Floor) => {
    // Update floor in the backend
    const updateFloorDto = {
      name: updatedFloor.name,
      type: updatedFloor.type,
      color: updatedFloor.color
    }
    
    updateFloorMutation.mutate(updateFloorDto)
  }

  const handleDeleteFloor = (floorId: string) => {
    // Don't delete if it's the last floor
    if (floors.length <= 1) return

    // Delete floor in the backend
    deleteFloorMutation.mutate(floorId, {
      onSuccess: () => {
        // If the active floor was deleted, set a new active floor
        if (activeFloorId === floorId && floors.length > 0) {
          const remainingFloors = floors.filter(floor => floor.id !== floorId)
          if (remainingFloors.length > 0) {
            setActiveFloorId(remainingFloors[0].id)
          }
        }
      }
    })
  }

  const resetView = () => {
    // Reset the view by clearing selection and centering the view
    setSelectedTableIds([]);
    setIsDetailsModalOpen(false);
    
    // If there are tables, scroll to center them
    if (activeFloorTables.length > 0) {
      // Find the center point of all tables
      const allX = activeFloorTables.map(t => t.x);
      const allY = activeFloorTables.map(t => t.y        / 2);
      
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Scroll to center (implementation depends on your scroll container)
      const container = document.querySelector('.floor-plan-container');
      if (container) {
        container.scrollLeft = centerX - container.clientWidth / 2;
        container.scrollTop = centerY - container.clientHeight / 2;
      }
    }
  }

  const showTutorial = () => {
    setIsTutorialOpen(true);
  }

  return (
    <div className="flex flex-col h-full">
      {isFullScreen ? (
        <FloorPlan
          tables={isLoadingTables ? [] : activeFloorTables}
          selectedTableIds={selectedTableIds}
          onSelectTable={handleTableSelect}
          onUpdateTablePosition={updateTablePosition}
          onEditTable={openDetailsModal}
          onMergeTables={mergeTables}
          floorColor={activeFloor?.color}
          isFullScreen={true}
          onClose={toggleFullScreen}
          floors={floors}
          activeFloorId={activeFloorId}
          restaurantId={restaurantId}
          onFloorChange={handleFloorChange}
          onAddFloor={handleAddFloor}
          onUpdateFloor={handleUpdateFloor}
          onDeleteFloor={handleDeleteFloor}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                color="primary" 
                className="bg-[#75CAA6] hover:bg-[#75CAA6]/90 shadow-sm"
                startContent={<Plus className="h-4 w-4" />}
                onClick={addTable}
                size="sm"
              >
                Add Table
              </Button>

              {selectedTableIds.length > 0 && (
                <>
                  {selectedTableIds.length === 1 && (
                    <Button 
                      variant="flat" 
                      className="bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
                      startContent={<Settings className="h-4 w-4 text-gray-600" />}
                      onClick={openDetailsModal}
                      size="sm"
                    >
                      Edit Table
                    </Button>
                  )}

                  <Button
                    variant="flat"
                    className="bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-red-500 hover:text-red-600"
                    startContent={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleRemoveClick(selectedTableIds[0])}
                    size="sm"
                  >
                    Remove
                  </Button>
                </>
              )}

              {canUnmergeTable && (
                <Button 
                  variant="flat" 
                  className="bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
                  startContent={<Layers className="h-4 w-4 text-indigo-500" />}
                  onClick={unmergeTables}
                  size="sm"
                >
                  Unmerge
                </Button>
              )}
              
              {/* Status indicators */}
              {selectedTableIds.length === 1 && selectedTable && (
                <div className="flex items-center gap-2 ml-1">
                  <div className="h-5 border-l border-gray-300"></div>
                  <Button
                    size="sm"
                    variant="flat"
                    className={`min-w-0 h-7 px-2 ${selectedTable.status === TableStatus.AVAILABLE ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-gray-200 text-gray-600'}`}
                    onClick={() => updateTableStatus(selectedTable.id, TableStatus.AVAILABLE)}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    Available
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    className={`min-w-0 h-7 px-2 ${selectedTable.status === TableStatus.OCCUPIED ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white border-gray-200 text-gray-600'}`}
                    onClick={() => updateTableStatus(selectedTable.id, TableStatus.OCCUPIED)}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                    Occupied
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    className={`min-w-0 h-7 px-2 ${selectedTable.status === TableStatus.RESERVED ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white border-gray-200 text-gray-600'}`}
                    onClick={() => updateTableStatus(selectedTable.id, TableStatus.RESERVED)}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                    Reserved
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {viewMode === "floor" && (
                <Button 
                  variant="flat" 
                  className="bg-white border border-gray-200 hover:bg-gray-50 shadow-sm h-9 w-9 p-0 min-w-0"
                  onClick={toggleFullScreen}
                >
                  <Maximize2 className="h-4 w-4 text-gray-600" />
                </Button>
              )}

              <Tabs
                aria-label="View options"
                color="primary"
                variant="bordered"
                classNames={{
                  tabList: "bg-white border border-gray-200 shadow-sm",
                  cursor: "bg-[#75CAA6]",
                  tab: "text-gray-600 data-[selected=true]:text-[#75CAA6]",
                }}
                selectedKey={viewMode}
                onSelectionChange={(key) => {
                  setViewMode(key as "floor" | "list")
                  if (key === "list" && isFullScreen) {
                    setIsFullScreen(false)
                  }
                }}
              >
                <Tab 
                  key="floor"
                  title={
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>Floor View</span>
                    </div>
                  }
                />
                <Tab 
                  key="list"
                  title={
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                      <span>List View</span>
                    </div>
                  }
                />
              </Tabs>
            </div>
          </div>

          {/* Floor Selector - Enhanced */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100 p-2">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-xs font-medium text-gray-500">FLOOR SELECTION</span>
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="light" 
                  className="min-w-0 h-6 px-1.5 text-xs text-[#75CAA6]"
                  onClick={showTutorial}
                  startContent={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6V4H6v2"></path><path d="M18 14v-4H6v4"></path><path d="M18 20v-2H6v2"></path><path d="M12 14v4"></path><path d="M12 4v4"></path></svg>}
                >
                  Tutorial
                </Button>
                <Button 
                  size="sm" 
                  variant="light" 
                  className="min-w-0 h-6 px-1.5 text-xs text-[#75CAA6]"
                  onClick={resetView}
                  startContent={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>}
                >
                  Reset View
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {isLoadingFloors ? (
                // Enhanced skeleton loader for floors
                <div className="w-full">
                  <div className="flex gap-2">
                    {/* Active floor skeleton */}
                    <div className="h-8 w-28 rounded-md bg-[#75CAA6]/20 border border-[#75CAA6]/30 flex items-center px-2 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-[#75CAA6]/30 mr-2"></div>
                      <div className="h-3 w-16 bg-[#75CAA6]/30 rounded"></div>
                    </div>
                    
                    {/* Other floors skeletons */}
                    <div className="h-8 w-24 rounded-md bg-gray-100 border border-gray-200 flex items-center px-2 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
                      <div className="h-3 w-14 bg-gray-300 rounded"></div>
                    </div>
                    
                    <div className="h-8 w-26 rounded-md bg-gray-100 border border-gray-200 flex items-center px-2 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                    </div>
                    
                    {/* Add floor button skeleton */}
                    <div className="h-8 w-20 rounded-md bg-white border border-dashed border-gray-300 flex items-center justify-center px-2 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-gray-300 mr-1"></div>
                      <div className="h-3 w-12 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <FloorSelector
                  floors={floors}
                  activeFloorId={activeFloorId}
                  restaurantId={restaurantId}
                  onFloorChange={handleFloorChange}
                  onAddFloor={handleAddFloor}
                  onUpdateFloor={handleUpdateFloor}
                  onDeleteFloor={handleDeleteFloor}
                />
              )}
            </div>
          </div>

          {/* Main Floor Plan */}
          <div className="flex-1 overflow-hidden bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-[calc(100vh-220px)]">
            {isLoadingFloors ? (
              // Loading state for floors
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center justify-center p-8 max-w-md text-center">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-[#75CAA6]/10"></div>
                    <div className="absolute inset-0 rounded-full border-t-4 border-[#75CAA6] animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Floor Plans</h3>
                  <p className="text-gray-500">Please wait while we retrieve your restaurant's floor plans...</p>
                </div>
              </div>
            ) : (!floors || floors.length === 0) ? (
              // Welcome UI when no floors exist
              <div className="h-[650px] relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#75CAA6]/5"></div>
                  <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-[#75CAA6]/5"></div>
                  <div className="absolute right-1/4 bottom-1/4 w-64 h-64 rounded-full bg-[#75CAA6]/3"></div>
                  <div className="absolute left-1/3 top-1/3 w-48 h-48 rounded-full bg-[#75CAA6]/3"></div>
                  <div className="absolute inset-0" style={{ 
                    backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(117, 202, 166, 0.1) 2px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>
                
                {/* Main content */}
                <div className="relative h-full flex flex-col items-center justify-center px-4">
                  <div className="w-full max-w-lg text-center space-y-6">
                    {/* Icon */}
                    <div className="mb-8 relative">
                      <div className="absolute inset-0 animate-pulse bg-[#75CAA6]/20 rounded-full transform scale-150 blur-xl"></div>
                      <div className="relative bg-white rounded-xl shadow-lg border border-[#75CAA6]/20 p-4 inline-block">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]">
                          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                          <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path>
                          <path d="M12 3v6"></path>
                        </svg>
                      </div>
                    </div>

                    {/* Text content */}
                    <div className="space-y-3">
                      <h1 className="text-3xl font-bold text-gray-900">Create Your First Floor</h1>
                      <p className="text-lg text-gray-600">
                        Start designing your restaurant's layout by adding your first floor plan.
                        Create indoor dining areas, outdoor spaces, or custom sections.
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="pt-4">
                      <Button
                        size="lg"
                        color="primary"
                        className="bg-[#75CAA6] hover:bg-[#75CAA6]/90 shadow-lg hover:shadow-xl transition-all duration-200 group h-12"
                        startContent={
                          <div className="transition-transform duration-200 group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14"></path>
                              <path d="M12 5v14"></path>
                            </svg>
                          </div>
                        }
                        onClick={() => {
                          const floorSelector = document.querySelector('[data-add-floor-button]');
                          if (floorSelector) {
                            (floorSelector as HTMLButtonElement).click();
                          }
                        }}
                      >
                        Add Your First Floor
                      </Button>
                    </div>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-2 gap-4 pt-8">
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-left border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-md bg-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                              <path d="m9 12 2 2 4-4"></path>
                            </svg>
                          </div>
                          <h3 className="font-semibold text-gray-900">Easy Setup</h3>
                        </div>
                        <p className="text-sm text-gray-600">Create and customize your floor plan in minutes with our intuitive design tools</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-left border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-md bg-amber-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                              <path d="M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2"></path>
                              <path d="m15.194 13.707 3.814 1.86-1.86 3.814"></path>
                              <path d="M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4"></path>
                            </svg>
                          </div>
                          <h3 className="font-semibold text-gray-900">Flexible Layout</h3>
                        </div>
                        <p className="text-sm text-gray-600">Design multiple floors with indoor and outdoor spaces to match your venue</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : viewMode === "floor" ? (
              <div className="flex-1 h-full relative">
                {isLoadingTables ? (
                  <div className="absolute inset-0" style={{ 
                    backgroundColor: activeFloor?.color || "#f5f5f4",
                    backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.15) 2px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }}>
                    {/* Elegant skeleton tables with staggered animations */}
                    <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-20 h-20 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 shadow-sm animate-pulse" 
                        style={{ animationDuration: "2s" }}></div>
                      <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold text-gray-400">1</div>
                    </div>
                    
                    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-20 h-20 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 shadow-sm animate-pulse" 
                        style={{ animationDuration: "2.2s", animationDelay: "0.1s" }}></div>
                      <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold text-gray-400">2</div>
                    </div>
                    
                    <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-20 h-20 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 shadow-sm animate-pulse" 
                        style={{ animationDuration: "2.4s", animationDelay: "0.2s" }}></div>
                      <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold text-gray-400">3</div>
                    </div>
                    
                    <div className="absolute top-2/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-20 h-20 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 shadow-sm animate-pulse" 
                        style={{ animationDuration: "2.6s", animationDelay: "0.3s" }}></div>
                      <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold text-gray-400">4</div>
                    </div>
                    
                    {/* Animated loading indicator */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="flex flex-col items-center justify-center bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50">
                        <div className="relative w-12 h-12 mb-3">
                          <div className="absolute inset-0 rounded-full border-2 border-[#75CAA6]/20"></div>
                          <div className="absolute inset-0 rounded-full border-t-2 border-[#75CAA6] animate-spin"></div>
                          <div className="absolute inset-2 rounded-full bg-[#75CAA6]/10 animate-pulse"></div>
                          <div className="absolute inset-4 rounded-full bg-[#75CAA6]/20 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Loading tables</p>
                        <p className="text-xs text-gray-500 mt-1">Preparing your floor plan</p>
                      </div>
                    </div>
                    
                    {/* Legend with shimmer effect */}
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-gray-200 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FloorPlan
                    tables={activeFloorTables}
                    selectedTableIds={selectedTableIds}
                    onSelectTable={handleTableSelect}
                    onUpdateTablePosition={updateTablePosition}
                    onEditTable={openDetailsModal}
                    onMergeTables={mergeTables}
                    floorColor={activeFloor?.color}
                  />
                )}
              </div>
            ) : (
              <div className="h-full overflow-auto flex-1">
                {isLoadingTables ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center gap-3 shadow-sm animate-pulse" 
                        style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                        </div>
                        <div className="w-16 h-6 bg-gray-100 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TableListView
                    tables={activeFloorTables}
                    selectedTableIds={selectedTableIds}
                    onSelectTable={handleTableSelect}
                    onUpdateTableStatus={updateTableStatus}
                    onEditTable={openDetailsModal}
                    floorName={activeFloor?.name || ""}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      <TableDetailsModal
        table={selectedTable || null}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onUpdateTable={updateTable}
        isCreating={false}
      />

      {/* Add Table Modal */}
      <AddTableModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        restaurantId={restaurantId}
        floorId={activeFloorId}
        onTableAdded={handleTableAdded}
      />

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="border-b">
            <div className="text-lg font-semibold text-danger">Delete Table</div>
          </ModalHeader>
          <ModalBody className="py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                <span className="font-medium">This action cannot be undone</span>
              </div>
              <p>
                Are you sure you want to delete this table? {selectedTable?.isMerged && "This is a merged table and will also delete all its component tables."}
              </p>
            </div>
          </ModalBody>
          <ModalFooter className="border-t">
            <Button
              variant="flat"
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-white border border-gray-200"
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => tableToDelete && removeTable(tableToDelete)}
            >
              Delete Table
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Tutorial Modal */}
      <Modal 
        isOpen={isTutorialOpen} 
        onOpenChange={(open) => !open && setIsTutorialOpen(false)}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          backdrop: "bg-gradient-to-tr from-gray-900/60 to-gray-900/40 backdrop-blur-sm",
          wrapper: "p-4",
          body: "p-0",
          closeButton: "hover:bg-white/10 active:bg-white/20 right-3 top-3"
        }}
      >
        <ModalContent className="rounded-xl overflow-hidden">
          <ModalHeader className="border-b bg-gradient-to-r from-[#75CAA6]/20 to-white rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="bg-[#75CAA6] p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M18 6V4H6v2"></path><path d="M18 14v-4H6v4"></path><path d="M18 20v-2H6v2"></path><path d="M12 14v4"></path><path d="M12 4v4"></path></svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Floor Plan Tutorial</h2>
                <p className="text-sm text-gray-500">Learn how to use the floor plan manager</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Creating and Managing Tables */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#75CAA6]/10 p-3 border-b border-gray-100">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <div className="bg-[#75CAA6] p-1.5 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </div>
                    <span>Creating & Managing Tables</span>
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#75CAA6] text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium">Add Table</p>
                      <p className="text-sm text-gray-600">Click the "Add Table" button to create a new table</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#75CAA6] text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium">Position Tables</p>
                      <p className="text-sm text-gray-600">Drag tables to position them on the floor plan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#75CAA6] text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium">Select & Edit</p>
                      <p className="text-sm text-gray-600">Click a table to select it, then use the buttons to edit or remove</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#75CAA6] text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">4</div>
                    <div>
                      <p className="font-medium">Quick Edit</p>
                      <p className="text-sm text-gray-600">Double-click a table to open its details for editing</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Merging Tables */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-blue-50 p-3 border-b border-gray-100">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <div className="bg-blue-500 p-1.5 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="8" height="8" x="2" y="2" rx="2"></rect><rect width="8" height="8" x="14" y="2" rx="2"></rect><rect width="8" height="8" x="2" y="14" rx="2"></rect><rect width="8" height="8" x="14" y="14" rx="2"></rect></svg>
                    </div>
                    <span>Merging Tables</span>
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium">Drag to Connect</p>
                      <p className="text-sm text-gray-600">Drag a table close to another until they touch or overlap slightly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium">Confirm Merge</p>
                      <p className="text-sm text-gray-600">Click "Merge Tables" in the confirmation dialog to combine them</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium">Unmerge Tables</p>
                      <p className="text-sm text-gray-600">Select a merged table and click the "Unmerge Table" button</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Managing Floors */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-amber-50 p-3 border-b border-gray-100">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <div className="bg-amber-500 p-1.5 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path><path d="M12 3v6"></path></svg>
                    </div>
                    <span>Managing Floors</span>
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium">Add New Floor</p>
                      <p className="text-sm text-gray-600">Click "Add Floor" to create a new floor section</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium">Switch Floors</p>
                      <p className="text-sm text-gray-600">Click on a floor button to switch between different floors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium">Edit or Delete</p>
                      <p className="text-sm text-gray-600">Use the dropdown menu on each floor to edit or delete it</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-purple-50 p-3 border-b border-gray-100">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <div className="bg-purple-500 p-1.5 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path><path d="M19 3v4"></path><path d="M21 5h-4"></path></svg>
                    </div>
                    <span>Pro Tips</span>
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">💡</div>
                    <div>
                      <p className="font-medium">Fullscreen Mode</p>
                      <p className="text-sm text-gray-600">Use fullscreen mode for a more immersive editing experience</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">💡</div>
                    <div>
                      <p className="font-medium">List View</p>
                      <p className="text-sm text-gray-600">Switch to list view to quickly update table statuses</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">💡</div>
                    <div>
                      <p className="font-medium">Mini-Map Navigation</p>
                      <p className="text-sm text-gray-600">Use the mini-map in the bottom right to navigate large floor plans</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter className="border-t bg-gray-50 rounded-b-xl">
            <Button
              color="primary"
              onClick={() => setIsTutorialOpen(false)}
              className="bg-[#75CAA6] hover:bg-[#75CAA6]/90 px-6"
              size="lg"
            >
              Got it!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

