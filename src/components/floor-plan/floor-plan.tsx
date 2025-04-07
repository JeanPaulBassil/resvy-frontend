"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import type { Table } from "@/types/table"
import { X, ZoomIn, ZoomOut } from "lucide-react"
import { Button, cn } from "@heroui/react"
import TableComponent from "./table-component"
import MergeTablesModal from "./merge-tables-modal"
import FloorSelector from "./floor-selector"
import type { Floor } from "@/types/floor"
import { getTableColor } from "@/types/table"

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
  
  // Full screen mode state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Check if two tables are adjacent
  const areTablesAdjacent = (table1: Table, table2: Table) => {
    // Define the threshold for adjacency (in pixels)
    const threshold = 20

    // Use static table dimensions (80x80 pixels)
    const tableWidth = 80
    const tableHeight = 80

    // Calculate the edges of each table
    const table1Right = table1.x + tableWidth
    const table1Bottom = table1.y + tableHeight
    const table2Right = table2.x + tableWidth
    const table2Bottom = table2.y + tableHeight

    // Check if tables are adjacent horizontally (sides are close)
    const horizontallyAdjacent =
      (Math.abs(table1Right - table2.x) <= threshold && 
       Math.max(table1.y, table2.y) <= Math.min(table1Bottom, table2Bottom) + threshold) || 
      (Math.abs(table2Right - table1.x) <= threshold &&
       Math.max(table1.y, table2.y) <= Math.min(table1Bottom, table2Bottom) + threshold)

    // Check if tables are adjacent vertically (top/bottom are close)
    const verticallyAdjacent =
      (Math.abs(table1Bottom - table2.y) <= threshold &&
       Math.max(table1.x, table2.x) <= Math.min(table1Right, table2Right) + threshold) ||
      (Math.abs(table2Bottom - table1.y) <= threshold &&
       Math.max(table1.x, table2.x) <= Math.min(table1Right, table2Right) + threshold)

    // Tables are adjacent if they are adjacent either horizontally or vertically
    return horizontallyAdjacent || verticallyAdjacent
  }

  // Handle table drag end
  const handleTableDragEnd = (tableId: string, _x: number, _y: number) => {
    // Find the table that was dragged
    const draggedTable = tables.find((t) => t.id === tableId)
    if (!draggedTable) return

    // Check if this table is adjacent to any other table
    const adjacentTablesList = tables.filter(
      (t) => t.id !== tableId && !t.isHidden && areTablesAdjacent(draggedTable, t),
    )

    if (adjacentTablesList.length > 0) {
      // Show merge modal with the dragged table and adjacent tables
      setAdjacentTables([draggedTable, ...adjacentTablesList])
      setShowMergeModal(true)
    }
  }

  const handleConfirmMerge = () => {
    if (adjacentTables.length >= 2) {
      onMergeTables(adjacentTables.map((t) => t.id))
    }
    setShowMergeModal(false)
    setAdjacentTables([])
  }

  const handleCloseMergeModal = () => {
    setShowMergeModal(false)
    setAdjacentTables([])
  }

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
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span className="text-gray-700">Reserved</span>
          </div>
        </div>
      </div>

      {/* Tables */}
      {tables.map((table) => (
        <TableComponent
          key={table.id}
          table={table}
          isSelected={selectedTableIds.includes(table.id)}
          onSelect={() => onSelectTable(table.id)}
          onUpdatePosition={(x, y) => onUpdateTablePosition(table.id, x, y)}
          containerRef={floorPlanRef}
          onDoubleClick={onEditTable}
          isMerged={table.isMerged}
          onDragEnd={handleTableDragEnd}
        />
      ))}
      
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

