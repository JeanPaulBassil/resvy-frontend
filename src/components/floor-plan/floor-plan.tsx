"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import type { Table } from "@/types/table"
import { X, ZoomIn, ZoomOut } from "lucide-react"
import { Button, cn } from "@heroui/react"
import TableComponent from "./table-component"
import MergeTablesModal from "./merge-tables-modal"
import FloorSelector from "./floor-selector"
import type { Floor } from "@/types/floor"
import { getTableColor, TableAnimationState, type TableMergeAnimation } from "@/types/table"
import { motion, AnimatePresence } from "framer-motion"

interface FloorPlanProps {
  tables: Table[]
  selectedTableIds: string[]
  onSelectTable: (id: string) => void
  onUpdateTablePosition: (id: string, x: number, y: number) => void
  onEditTable: () => void
  onMergeTables: (tableIds: string[]) => void
  floorColor?: string
  // Full screen mode props
  isFullScreen?: boolean
  onClose?: () => void
  // Floor management props (only needed in full screen mode)
  floors?: Floor[]
  activeFloorId?: string
  restaurantId?: string
  onFloorChange?: (floorId: string) => void
  onAddFloor?: (floor: Floor) => void
  onUpdateFloor?: (floor: Floor) => void
  onDeleteFloor?: (floorId: string) => void
}

export default function FloorPlan({
  tables,
  selectedTableIds,
  onSelectTable,
  onUpdateTablePosition,
  onEditTable,
  onMergeTables,
  floorColor = "#f5f5f4", // Default stone-100 color
  // Full screen mode props
  isFullScreen = false,
  onClose,
  // Floor management props
  floors = [],
  activeFloorId = "",
  restaurantId = "",
  onFloorChange,
  onAddFloor,
  onUpdateFloor,
  onDeleteFloor
}: FloorPlanProps) {
  const floorPlanRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [adjacentTables, setAdjacentTables] = useState<Table[]>([])
  const [showMergeModal, setShowMergeModal] = useState(false)
  
  // New state for tracking potential merge candidates and the currently dragged table
  const [mergeCandidates, setMergeCandidates] = useState<string[]>([])
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null)
  
  // Animation states for merging and unmerging tables
  const [mergeAnimations, setMergeAnimations] = useState<TableMergeAnimation[]>([])
  const [completedMerges, setCompletedMerges] = useState<string[]>([])
  const [animatingMerge, setAnimatingMerge] = useState(false)
  
  // Full screen mode state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Add a state for tracking original positions of tables before dragging
  const [originalPositions, setOriginalPositions] = useState<{[key: string]: {x: number, y: number}}>({});

  // Enhanced adjacency detection
  const areTablesAdjacent = (table1: Table, table2: Table) => {
    // More forgiving threshold for adjacency (in pixels)
    const threshold = 30

    // Estimated table dimensions based on floorPlanRef
    const tableSize = 80 // Base size of 80px
    const scale = 1 // Use scale if needed in the future

    const effectiveSize = tableSize * scale
    
    // Calculate the centers and distances between tables
    const center1 = {
      x: table1.x + effectiveSize / 2,
      y: table1.y + effectiveSize / 2
    }
    
    const center2 = {
      x: table2.x + effectiveSize / 2,
      y: table2.y + effectiveSize / 2
    }
    
    // Calculate distance between centers
    const distance = Math.sqrt(
      Math.pow(center2.x - center1.x, 2) + 
      Math.pow(center2.y - center1.y, 2)
    )
    
    // Calculate the minimum distance for them to be "touching"
    const touchingDistance = effectiveSize
    
    // Check if tables are close enough to be merged
    return distance <= touchingDistance + threshold
  }

  // Enhanced check for finding all adjacent tables
  const findAdjacentTables = (tableId: string) => {
    const currentTable = tables.find(t => t.id === tableId)
    if (!currentTable || currentTable.isHidden) return []
    
    // Find all tables that are adjacent to the current table
    const adjacent = tables.filter(
      t => t.id !== tableId && !t.isHidden && !t.isMerged && areTablesAdjacent(currentTable, t)
    )
    
    return adjacent.map(t => t.id)
  }

  // Update merge candidates when dragging
  useEffect(() => {
    if (draggingTableId) {
      const candidates = findAdjacentTables(draggingTableId)
      setMergeCandidates([draggingTableId, ...candidates])
    } else {
      setMergeCandidates([])
    }
  }, [draggingTableId, tables])

  // Handle table drag start - save the position before any dragging
  const handleTableDragStart = (tableId: string) => {
    // Don't allow drag operations during animations
    if (animatingMerge) return;
    
    // Save the original position when starting to drag
    const draggedTable = tables.find(t => t.id === tableId);
    if (draggedTable) {
      setOriginalPositions(prev => ({
        ...prev,
        [tableId]: { x: draggedTable.x, y: draggedTable.y }
      }));
    }
    
    setDraggingTableId(tableId);
  }

  // Handle table drag move (called continuously during drag)
  const handleTableDragMove = (tableId: string) => {
    // Don't process drag moves during animations
    if (animatingMerge) return;
    
    // This will be called frequently during drag, so no heavy operations
    if (tableId !== draggingTableId) {
      setDraggingTableId(tableId);
    }
  }

  // Handle table drag end
  const handleTableDragEnd = (tableId: string, _x: number, _y: number) => {
    // Skip drag end processing during animations
    if (animatingMerge) return;
    
    // Find the table that was dragged
    const draggedTable = tables.find((t) => t.id === tableId)
    if (!draggedTable) return

    // Get all adjacent tables
    const adjacentTableIds = findAdjacentTables(tableId)
    
    if (adjacentTableIds.length > 0) {
      // Get the full table objects for the modal
      const adjacentTablesList = tables.filter(t => adjacentTableIds.includes(t.id))
      
      // Store the draggedTable as the second item since we want target tables as primary
      // This reverses the merge animation direction
      setAdjacentTables([...adjacentTablesList, draggedTable])
      setShowMergeModal(true)
      
      // At this point, we don't update the table position in the backend
      // We'll wait for the merge confirmation or cancellation
    } else {
      // No adjacent tables, so we can finalize the position
      onUpdateTablePosition(tableId, draggedTable.x, draggedTable.y)
      
      // If we didn't merge, clear the original position for this table
      setOriginalPositions(prev => {
        const newPositions = {...prev};
        delete newPositions[tableId];
        return newPositions;
      });
    }
    
    // Reset dragging state
    setDraggingTableId(null)
    setMergeCandidates([])
  }

  // Update the confirm merge function
  const handleConfirmMerge = () => {
    if (adjacentTables.length < 2) return
    
    // Setup merge animations before actually merging tables
    // The target table (where we want things to merge into) is the first table
    const mainTable = adjacentTables[0]; 
    // The source tables (including the dragged table) are the rest
    const tablesToMerge = adjacentTables.slice(1);
    
    // Use the saved original positions instead of current positions
    const initialPositions: {[key: string]: {x: number, y: number}} = {};
    tablesToMerge.forEach(table => {
      // If we have a saved original position for this table, use it
      // Otherwise fall back to current position
      initialPositions[table.id] = originalPositions[table.id] || { x: table.x, y: table.y };
    });
    
    // Create animation entries for each table being merged
    const animations = tablesToMerge.map(table => ({
      sourceTableId: table.id,
      targetTableId: mainTable.id,
      progress: 0,
      state: TableAnimationState.MERGING,
      initialPositions
    }));
    
    setMergeAnimations(animations);
    setAnimatingMerge(true);
    
    // Use setTimeout to allow animations to complete before actually merging
    setTimeout(() => {
      // Get all table IDs for merging
      const tableIds = adjacentTables.map((table) => table.id)
      
      // Call the merge API
      onMergeTables(tableIds)
      
      // Add to completed merges list for future unmerge animations
      setCompletedMerges(prev => [...prev, mainTable.id])
      
      // Close the modal and reset state
      setShowMergeModal(false)
      setAdjacentTables([])
      setAnimatingMerge(false)
      setMergeAnimations([]);
      
      // Clear original positions since merge is complete
      setOriginalPositions({});
    }, 650);
  }
  
  // Function to handle canceling merge
  const handleCancelMerge = () => {
    // Close the modal
    setShowMergeModal(false);
    
    // Get the tables that were adjacent
    const tablesToUpdate = [...adjacentTables];
    
    // For each table, restore its original position if available
    tablesToUpdate.forEach(table => {
      const originalPos = originalPositions[table.id];
      if (originalPos) {
        // Update the position in the backend to restore to original
        onUpdateTablePosition(table.id, originalPos.x, originalPos.y);
      }
    });
    
    // Clear adjacent tables
    setAdjacentTables([]);
    
    // Clear original positions
    setOriginalPositions({});
  }

  // Use handleCancelMerge as the onClose handler
  const handleCloseMergeModal = () => {
    handleCancelMerge();
  }

  // Add this function to prepare unmerge animations
  const prepareUnmergeAnimation = (parentTableId: string, childTableIds: string[]) => {
    const parentTable = tables.find(t => t.id === parentTableId);
    if (!parentTable) return;
    
    const childTables = tables.filter(t => childTableIds.includes(t.id));
    
    // Create animation entries for each table being unmerged
    const animations = childTables.map(table => ({
      sourceTableId: parentTableId,
      targetTableId: table.id,
      progress: 0,
      state: TableAnimationState.UNMERGING,
      // Include the target positions (original positions) for proper animation
      initialPositions: {
        [table.id]: { 
          x: table.originalX !== undefined ? table.originalX : table.x, 
          y: table.originalY !== undefined ? table.originalY : table.y 
        }
      }
    }));
    
    setMergeAnimations(animations);
    setAnimatingMerge(true);
    
    // After animation completes, clear the animation state
    setTimeout(() => {
      // Complete reset of animation state
      setAnimatingMerge(false);
      setMergeAnimations([]);
    }, 650);
  }

  // Detect unmerge operations to trigger animations
  useEffect(() => {
    // This effect watches for changes in the tables array
    // If a previously merged table is now unmerged, trigger animation
    const mergedTables = tables.filter(t => t.isMerged && !t.isHidden);
    const mergedTableIds = mergedTables.map(t => t.id);
    
    // Check if any previously completed merges are no longer in the merged tables list
    const unmergedTableIds = completedMerges.filter(id => !mergedTableIds.includes(id));
    
    if (unmergedTableIds.length > 0) {
      // Find the parent table and child tables for unmerge animation
      const unmergedTable = unmergedTableIds[0];
      const childTableIds = tables
        .filter(t => t.parentTableId === unmergedTable && !t.isHidden)
        .map(t => t.id);
        
      if (childTableIds.length > 0) {
        prepareUnmergeAnimation(unmergedTable, childTableIds);
      }
      
      // Update the completed merges list
      setCompletedMerges(prev => prev.filter(id => !unmergedTableIds.includes(id)));
    }
    
    // Update completed merges with current merged tables
    setCompletedMerges(mergedTableIds);
  }, [tables]);

  // Full screen mode functions
  // Handle mouse/touch events for panning
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isFullScreen) return;
    
    // Only initiate panning if we're clicking on the background (not a table)
    if (e.target === containerRef.current) {
      setIsDragging(true)

      // Handle both mouse and touch events
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      setDragStart({
        x: clientX - position.x,
        y: clientY - position.y,
      })

      e.preventDefault()
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isFullScreen || !isDragging) return

      // Handle both mouse and touch events
      const clientX = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      const clientY = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY

      // Calculate new position
      let newX = clientX - dragStart.x
      let newY = clientY - dragStart.y

      // Get container dimensions
      const containerWidth = containerRef.current?.clientWidth || 0
      const containerHeight = containerRef.current?.clientHeight || 0

      // Calculate bounds to prevent panning too far
      // This ensures at least 25% of the floor plan is always visible
      const minX = Math.min(0, containerWidth - 2000 * scale)
      const maxX = 0
      const minY = Math.min(0, containerHeight - 2000 * scale)
      const maxY = 0

      // Apply bounds
      newX = Math.max(minX, Math.min(maxX, newX))
      newY = Math.max(minY, Math.min(maxY, newY))

      setPosition({
        x: newX,
        y: newY,
      })
    },
    [isDragging, dragStart, scale, isFullScreen],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add and remove event listeners for full screen mode
  useEffect(() => {
    if (!isFullScreen) return;
    
    const handleMouseMoveWrapper = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        handleMouseMove(e)
      }
    }

    const handleMouseUpWrapper = () => {
      handleMouseUp()
    }

    window.addEventListener("mousemove", handleMouseMoveWrapper)
    window.addEventListener("touchmove", handleMouseMoveWrapper)
    window.addEventListener("mouseup", handleMouseUpWrapper)
    window.addEventListener("touchend", handleMouseUpWrapper)

    return () => {
      window.removeEventListener("mousemove", handleMouseMoveWrapper)
      window.removeEventListener("touchmove", handleMouseMoveWrapper)
      window.removeEventListener("mouseup", handleMouseUpWrapper)
      window.removeEventListener("touchend", handleMouseUpWrapper)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, isFullScreen])

  // Handle zoom in/out
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!isFullScreen) return;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        zoomIn()
      } else {
        zoomOut()
      }
    }
  }

  // Render the floor plan content
  const renderFloorPlanContent = () => (
    <>
      {/* Restaurant floor design elements */}
      <div className="absolute inset-0">
        {/* Decorative header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/5 to-transparent pointer-events-none">
          <div className="absolute top-4 left-4 text-sm text-stone-600 font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]"><path d="M3 7V5c0-1.1.9-2 2-2h2"></path><path d="M17 3h2c1.1 0 2 .9 2 2v2"></path><path d="M21 17v2c0 1.1-.9 2-2 2h-2"></path><path d="M7 21H5c-1.1 0-2-.9-2-2v-2"></path><rect width="7" height="7" x="7" y="7" rx="1"></rect></svg>
            Interactive Floor Plan
          </div>
        </div>

        {/* Grid lines for alignment - replaced with background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Horizontal guide lines */}
          <div className="absolute left-0 top-1/4 right-0 border-t border-dashed border-[#75CAA6]/10 h-0"></div>
          <div className="absolute left-0 top-1/2 right-0 border-t border-dashed border-[#75CAA6]/10 h-0"></div>
          <div className="absolute left-0 top-3/4 right-0 border-t border-dashed border-[#75CAA6]/10 h-0"></div>
          
          {/* Vertical guide lines */}
          <div className="absolute top-0 left-1/4 bottom-0 border-l border-dashed border-[#75CAA6]/10 w-0"></div>
          <div className="absolute top-0 left-1/2 bottom-0 border-l border-dashed border-[#75CAA6]/10 w-0"></div>
          <div className="absolute top-0 left-3/4 bottom-0 border-l border-dashed border-[#75CAA6]/10 w-0"></div>
        </div>

        {/* Entrance and pathways */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-28 h-10 border-2 border-[#75CAA6]/60 rounded-t-lg bg-[#75CAA6]/10 flex items-center justify-center shadow-md">
            <div className="text-xs text-[#75CAA6] font-medium flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6v11a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2z"></path><path d="M3 10v6a2 2 0 0 0 2 2h2"></path><path d="M10 8V6a2 2 0 0 0-2-2H6"></path><path d="M7 8v1"></path></svg>
              Entrance
            </div>
          </div>
          <div className="w-16 h-10 bg-[#75CAA6]/10 border-l-2 border-r-2 border-[#75CAA6]/60"></div>
        </div>

        {/* Main pathway */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-dashed border-[#75CAA6]/30 rounded-lg opacity-40 pointer-events-none"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-8 w-16 h-16 rounded-full bg-[#75CAA6]/5 border border-[#75CAA6]/20 flex items-center justify-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]/40"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        
        <div className="absolute bottom-1/4 right-8 w-16 h-16 rounded-full bg-[#75CAA6]/5 border border-[#75CAA6]/20 flex items-center justify-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]/40"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path></svg>
        </div>
        
        {/* Additional decorative elements */}
        <div className="absolute top-1/3 right-1/4 w-12 h-12 rounded-full bg-[#75CAA6]/5 border border-[#75CAA6]/20 flex items-center justify-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]/40"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>
        </div>
        
        <div className="absolute bottom-1/3 left-1/4 w-12 h-12 rounded-full bg-[#75CAA6]/5 border border-[#75CAA6]/20 flex items-center justify-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]/40"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-gray-200 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <span className="text-gray-700">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#75CAA6]"></div>
            <span className="text-gray-700">Reserved</span>
          </div>
        </div>
      </div>

      {/* Merge animation overlay - shows during active merge */}
      <AnimatePresence>
        {animatingMerge && (
          <motion.div 
            className="absolute inset-0 bg-indigo-50/30 backdrop-blur-[1px] z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="flex items-center gap-2 text-indigo-700 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse text-indigo-500">
                    <rect width="8" height="8" x="2" y="2" rx="2"></rect>
                    <rect width="8" height="8" x="14" y="2" rx="2"></rect>
                    <rect width="8" height="8" x="2" y="14" rx="2"></rect>
                    <rect width="8" height="8" x="14" y="14" rx="2"></rect>
                  </svg>
                  <span>
                    {mergeAnimations[0]?.state === TableAnimationState.MERGING 
                      ? "Merging Tables..."
                      : "Unmerging Tables..."}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tables */}
      {tables.map((table) => (
        <TableComponent
          key={table.id}
          table={table}
          tables={tables}
          isSelected={selectedTableIds.includes(table.id)}
          onSelect={() => onSelectTable(table.id)}
          onUpdatePosition={(x, y) => onUpdateTablePosition(table.id, x, y)}
          containerRef={floorPlanRef}
          onDoubleClick={onEditTable}
          isMerged={table.isMerged}
          onDragEnd={handleTableDragEnd}
          onDragStart={() => handleTableDragStart(table.id)}
          onDragMove={() => handleTableDragMove(table.id)}
          isAdjacentForMerge={mergeCandidates.includes(table.id) && mergeCandidates.length >= 2}
          mergeAnimation={mergeAnimations.find(
            anim => anim.sourceTableId === table.id || anim.targetTableId === table.id
          )}
          animatingMerge={animatingMerge}
        />
      ))}
      
      {/* Animation traces/particles for merging tables */}
      <AnimatePresence>
        {mergeAnimations.map((anim) => {
          const sourceTable = tables.find(t => t.id === anim.sourceTableId);
          const targetTable = tables.find(t => t.id === anim.targetTableId);
          
          if (!sourceTable || !targetTable) return null;
          
          // Calculate source and target positions
          const sourceX = sourceTable.x + 40;
          const sourceY = sourceTable.y + 40;
          const targetX = targetTable.x + 40;
          const targetY = targetTable.y + 40;
          
          // Calculate midpoint for additional effects
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;
          
          // Calculate angle between tables for directional effects
          const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
          
          // For unmerging, create additional effects
          const isUnmerging = anim.state === TableAnimationState.UNMERGING;
          
          return (
            <motion.div 
              key={`anim-${anim.sourceTableId}-${anim.targetTableId}`}
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-40"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Particles moving along the path - more varied and organic */}
              {[...Array(isUnmerging ? 15 : 12)].map((_, i) => {
                // Vary particle sizes for more organic feel
                const size = (i % 3 === 0) ? 3 : (i % 3 === 1) ? 2 : 1.5;
                // Vary particle colors
                const color = (i % 4 === 0) ? 
                  "bg-indigo-600" : (i % 4 === 1) ? 
                  "bg-indigo-400" : (i % 4 === 2) ? 
                  "bg-75CAA6" : "bg-violet-500";
                
                // Calculate curved paths with some randomness
                const curveAmplitude = 15 + Math.random() * 20;
                const directionX = Math.cos(angle + (Math.random() * 0.4 - 0.2));
                const directionY = Math.sin(angle + (Math.random() * 0.4 - 0.2));
                
                return (
                  <motion.div
                    key={`particle-${anim.sourceTableId}-${i}`}
                    className={`absolute rounded-full shadow-md ${color}`}
                    style={{ 
                      width: `${size}px`, 
                      height: `${size}px`,
                      boxShadow: `0 0 ${size * 2}px ${size}px ${color.replace('bg', 'rgba').replace('-', '(').replace('600', '0.6)').replace('500', '0.5)').replace('400', '0.4)')}`,
                    }}
                    initial={{ 
                      x: isUnmerging ? sourceX : (anim.state === TableAnimationState.MERGING ? sourceX : targetX),
                      y: isUnmerging ? sourceY : (anim.state === TableAnimationState.MERGING ? sourceY : targetY),
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{ 
                      x: isUnmerging ? 
                        // For unmerging, explode particles outward in all directions
                        [sourceX, sourceX + Math.cos(i * (Math.PI * 2 / 15)) * (50 + (i * 5))] :
                        // For merging, use the existing curved path
                        [
                          anim.state === TableAnimationState.MERGING ? sourceX : targetX,
                          anim.state === TableAnimationState.MERGING ? 
                            sourceX + (targetX - sourceX) * 0.4 + curveAmplitude * directionY : 
                            targetX + (sourceX - targetX) * 0.4 + curveAmplitude * directionY,
                          anim.state === TableAnimationState.MERGING ? 
                            sourceX + (targetX - sourceX) * 0.6 - curveAmplitude * directionY : 
                            targetX + (sourceX - targetX) * 0.6 - curveAmplitude * directionY,
                          anim.state === TableAnimationState.MERGING ? targetX : sourceX
                        ],
                      y: isUnmerging ? 
                        // For unmerging, explode particles outward in all directions
                        [sourceY, sourceY + Math.sin(i * (Math.PI * 2 / 15)) * (50 + (i * 5))] :
                        // For merging, use the existing curved path
                        [
                          anim.state === TableAnimationState.MERGING ? sourceY : targetY,
                          anim.state === TableAnimationState.MERGING ? 
                            sourceY + (targetY - sourceY) * 0.4 - curveAmplitude * directionX : 
                            targetY + (sourceY - targetY) * 0.4 - curveAmplitude * directionX,
                          anim.state === TableAnimationState.MERGING ? 
                            sourceY + (targetY - sourceY) * 0.6 + curveAmplitude * directionX : 
                            targetY + (sourceY - targetY) * 0.6 + curveAmplitude * directionX,
                          anim.state === TableAnimationState.MERGING ? targetY : sourceY
                        ],
                      opacity: isUnmerging ? [0, 1, 0] : [0, 1, 1, 0],
                      scale: isUnmerging ? [0, 1.5, 0] : [0, 1.5, 1.5, 0]
                    }}
                    transition={{ 
                      duration: 0.6 + (i * 0.03),
                      delay: i * 0.04,
                      ease: "easeInOut",
                      times: isUnmerging ? [0, 0.5, 1] : undefined
                    }}
                  />
                )
              })}
              
              {/* Energy burst at midpoint - larger for unmerging */}
              <motion.div
                className={`absolute rounded-full ${isUnmerging ? 
                  'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500' : 
                  'bg-gradient-to-r from-indigo-400 to-blue-500'}`}
                style={{
                  left: midX - (isUnmerging ? 25 : 15),
                  top: midY - (isUnmerging ? 25 : 15),
                  width: isUnmerging ? '50px' : '30px',
                  height: isUnmerging ? '50px' : '30px',
                }}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ 
                  opacity: [0, isUnmerging ? 0.9 : 0.8, 0],
                  scale: [0.2, isUnmerging ? 1.8 : 1.2, isUnmerging ? 3 : 2.5],
                  boxShadow: [
                    '0 0 0px rgba(79, 70, 229, 0)',
                    `0 0 ${isUnmerging ? 50 : 30}px rgba(79, 70, 229, ${isUnmerging ? 0.8 : 0.7})`,
                    '0 0 0px rgba(79, 70, 229, 0)'
                  ]
                }}
                transition={{ duration: isUnmerging ? 0.7 : 0.5, delay: 0.15 }}
              />
              
              {/* Unmerge-specific explosion ring effect */}
              {isUnmerging && (
                <motion.div
                  className="absolute rounded-full border-2 border-indigo-500"
                  style={{
                    left: sourceX - 50,
                    top: sourceY - 50,
                    width: '100px',
                    height: '100px',
                  }}
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ 
                    opacity: [0, 0.7, 0],
                    scale: [0.2, 2, 3],
                  }}
                  transition={{ duration: 0.7 }}
                />
              )}
              
              {/* Connecting line with dash animation - more elegant curved path */}
              {!isUnmerging && (
                <svg className="absolute top-0 left-0 w-full h-full">
                  <defs>
                    <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="50%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <motion.path
                    d={`M${sourceX},${sourceY} C${sourceX + (targetX - sourceX) * 0.4},${sourceY + (targetY - sourceY) * 0.1} ${sourceX + (targetX - sourceX) * 0.6},${sourceY + (targetY - sourceY) * 0.9} ${targetX},${targetY}`}
                    stroke="url(#gradientPath)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="8 4"
                    filter="url(#glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: 1, 
                      opacity: [0, 0.8, 0.8, 0],
                    }}
                    transition={{ duration: 0.6, times: [0, 0.3, 0.7, 1] }}
                  />
                </svg>
              )}
              
              {/* Unmerge radial line effect */}
              {isUnmerging && (
                <svg className="absolute top-0 left-0 w-full h-full">
                  <defs>
                    <linearGradient id="unmergeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c4b5fd" />
                      <stop offset="50%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                    <filter id="unmergeGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Create radial lines emanating from the source */}
                  {[...Array(8)].map((_, i) => {
                    const angle = i * (Math.PI * 2 / 8);
                    const endX = sourceX + Math.cos(angle) * 80;
                    const endY = sourceY + Math.sin(angle) * 80;
                    
                    return (
                      <motion.path
                        key={`radial-${i}`}
                        d={`M${sourceX},${sourceY} L${endX},${endY}`}
                        stroke="url(#unmergeGradient)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        filter="url(#unmergeGlow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: [0, 1], 
                          opacity: [0, 0.8, 0],
                        }}
                        transition={{ 
                          duration: 0.5,
                          delay: i * 0.05,
                          times: [0, 0.7, 1] 
                        }}
                      />
                    );
                  })}
                </svg>
              )}
              
              {/* Target table highlight ring */}
              <motion.div
                className="absolute rounded-xl border-2 border-indigo-500"
                style={{ 
                  left: anim.state === TableAnimationState.MERGING ? targetTable.x - 5 : sourceTable.x - 5,
                  top: anim.state === TableAnimationState.MERGING ? targetTable.y - 5 : sourceTable.y - 5,
                  width: '90px',
                  height: '90px',
                }}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  scale: [0.9, 1.1, 1.3],
                }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              
              {/* Unmerge-specific sparkle effects */}
              {isUnmerging && [...Array(12)].map((_, i) => {
                const distance = 30 + (i * 5);
                const angle = i * (Math.PI * 2 / 12);
                const delayOffset = i * 0.05;
                
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute w-1.5 h-1.5 rounded-full bg-white"
                    style={{
                      left: sourceX - 1.5,
                      top: sourceY - 1.5,
                      boxShadow: "0 0 10px 2px rgba(255, 255, 255, 0.8), 0 0 15px 5px rgba(99, 102, 241, 0.4)"
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      x: [0, Math.cos(angle) * distance],
                      y: [0, Math.sin(angle) * distance],
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 0.7,
                      delay: 0.1 + delayOffset,
                      ease: "easeOut"
                    }}
                  />
                );
              })}
              
              {/* Circles rippling out from source */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`ripple-${anim.sourceTableId}-${i}`}
                  className="absolute rounded-full border border-indigo-400/40"
                  style={{ 
                    left: anim.state === TableAnimationState.MERGING ? sourceX - 40 : targetX - 40,
                    top: anim.state === TableAnimationState.MERGING ? sourceY - 40 : targetY - 40,
                    width: '80px',
                    height: '80px',
                  }}
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ 
                    opacity: [0, 0.5, 0],
                    scale: [1, 1.5 + (i * 0.2), 2 + (i * 0.3)],
                  }}
                  transition={{ 
                    duration: 0.5 + (i * 0.1),
                    delay: 0.1 + (i * 0.1),
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Hint text when no tables */}
      {tables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 max-w-xs text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-[#75CAA6]"><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"></path><path d="m12 12 4 10 1.7-4.3L22 16Z"></path></svg>
            <p className="text-gray-700 font-medium mb-1">No Tables Yet</p>
            <p className="text-gray-500 text-sm">Click the "Add Table" button to create your first table</p>
          </div>
        </div>
      )}
      
      {/* Drag hint */}
      {tables.length > 0 && !isFullScreen && (
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-600 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l4-4 4 4"></path><path d="M5 15l4 4 4-4"></path><path d="M19 5l-4 4 4 4"></path></svg>
            Drag tables to position them
          </div>
        </div>
      )}
      
      {/* Zoom controls for full screen mode */}
      {isFullScreen && (
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <button 
            className="p-1.5 hover:bg-gray-100 rounded-t-lg border-b border-gray-200"
            onClick={zoomIn}
          >
            <ZoomIn className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            className="p-1.5 hover:bg-gray-100 rounded-b-lg"
            onClick={zoomOut}
          >
            <ZoomOut className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      )}
      
      {/* Pan/zoom hint for full screen mode */}
      {isFullScreen && (
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-600 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Drag to pan, scroll to zoom
          </div>
        </div>
      )}
    </>
  )

  // Render full screen mode
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ touchAction: "none" }}>
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-[#75CAA6]/10 p-1.5 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path><path d="M12 3v6"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {floors.find(f => f.id === activeFloorId)?.name || "Restaurant Floor Plan"}
              </h2>
              <p className="text-sm text-gray-500">Fullscreen Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="flat" 
              className="bg-white border border-gray-200 hover:bg-gray-50 shadow-sm h-9 w-9 p-0 min-w-0"
              onClick={onClose}
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
        
        {/* Floor selector */}
        {floors.length > 0 && onFloorChange && onAddFloor && onUpdateFloor && onDeleteFloor && (
          <div className="p-2 border-b bg-gray-50">
            <FloorSelector
              floors={floors}
              activeFloorId={activeFloorId}
              restaurantId={restaurantId}
              onFloorChange={onFloorChange}
              onAddFloor={onAddFloor}
              onUpdateFloor={onUpdateFloor}
              onDeleteFloor={onDeleteFloor}
            />
          </div>
        )}
        
        {/* Main content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onWheel={handleWheel}
        >
          <div
            ref={floorPlanRef}
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: floorColor,
              backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.15) 2px, transparent 0)',
              backgroundSize: '40px 40px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: '100%',
              height: '100%'
            }}
            onClick={(e) => {
              if (e.target === floorPlanRef.current) {
                onSelectTable("")
              }
            }}
          >
            {renderFloorPlanContent()}
          </div>
          
          {/* Mini map */}
          <div className="absolute bottom-3 right-3 w-32 h-24 bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="w-full h-full p-1 opacity-70" style={{ backgroundColor: floorColor }}>
              {tables.map((table) => (
                <div
                  key={`mini-${table.id}`}
                  className={cn(
                    "absolute rounded-sm border border-gray-400",
                    selectedTableIds.includes(table.id) && "border-2 border-primary"
                  )}
                  style={{
                    left: `${(table.x / 1000) * 100}%`,
                    top: `${(table.y / 600) * 100}%`,
                    width: `4%`,
                    height: `4%`,
                    backgroundColor: getTableColor(table.status),
                  }}
                />
              ))}
            </div>
            <div className="absolute top-1 left-1 text-[8px] font-medium text-gray-600 bg-white/70 px-1 rounded">
              Overview
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render normal mode
  return (
    <>
      <div
        ref={floorPlanRef}
        className="w-full h-full relative rounded-lg overflow-hidden"
        style={{ 
          backgroundColor: floorColor,
          backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.15) 2px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
        onClick={(e) => {
          if (e.target === floorPlanRef.current) {
            onSelectTable("")
          }
        }}
      >
        {renderFloorPlanContent()}
        
        {/* Merge connection lines */}
        {mergeCandidates.length >= 2 && (
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 drop-shadow-lg">
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <defs>
              <linearGradient id="mergeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#75CAA6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <marker 
                id="mergeArrow" 
                viewBox="0 0 10 10" 
                refX="5" 
                refY="5"
                markerWidth="6" 
                markerHeight="6" 
                orient="auto-start-reverse">
                <circle cx="5" cy="5" r="4" fill="url(#mergeGradient)" />
              </marker>
            </defs>
            {mergeCandidates.slice(1).map(candidateId => {
              const sourceTable = tables.find(t => t.id === draggingTableId)
              const targetTable = tables.find(t => t.id === candidateId)
              
              if (!sourceTable || !targetTable) return null
              
              // Calculate centers
              const sourceX = sourceTable.x + 40
              const sourceY = sourceTable.y + 40
              const targetX = targetTable.x + 40
              const targetY = targetTable.y + 40
              
              // Calculate midpoint for the animated circle
              const midX = (sourceX + targetX) / 2
              const midY = (sourceY + targetY) / 2
              
              return (
                <g key={`connection-${candidateId}`} filter="url(#glow)">
                  {/* Path with animated dash */}
                  <path 
                    d={`M${sourceX},${sourceY} Q${midX+30},${midY-30} ${targetX},${targetY}`}
                    stroke="url(#mergeGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    markerEnd="url(#mergeArrow)"
                    className="animate-dash"
                    style={{
                      strokeDasharray: '6 4',
                      animation: 'dash 3s linear infinite'
                    }}
                  />
                  
                  {/* Glowing center circle */}
                  <circle 
                    cx={midX} 
                    cy={midY} 
                    r="8" 
                    fill="url(#mergeGradient)" 
                    className="animate-pulse-slow"
                    style={{opacity: 0.8}}
                  />
                  
                  <circle 
                    cx={midX} 
                    cy={midY} 
                    r="4" 
                    fill="white" 
                    className="animate-pulse"
                    style={{opacity: 0.9}}
                  />
                </g>
              )
            })}
          </svg>
        )}

        {/* Add a tooltip or context label when tables can be merged */}
        {mergeCandidates.length >= 2 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce-subtle z-20 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="8" x="2" y="2" rx="2"></rect>
              <rect width="8" height="8" x="14" y="2" rx="2"></rect>
              <rect width="8" height="8" x="2" y="14" rx="2"></rect>
              <rect width="8" height="8" x="14" y="14" rx="2"></rect>
            </svg>
            <span>Release to merge {mergeCandidates.length} tables</span>
          </div>
        )}
      </div>

      {/* Merge Tables Modal */}
      <MergeTablesModal
        isOpen={showMergeModal}
        onClose={handleCloseMergeModal}
        onConfirm={handleConfirmMerge}
        tables={adjacentTables}
      />
    </>
  )
}

