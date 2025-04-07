"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { X, ZoomIn, ZoomOut } from "lucide-react"
import type { Table } from "@/types/table"
import type { Floor } from "@/types/floor"
import { Button } from "@heroui/react"
import MergeTablesModal from "./merge-tables-modal"
import FloorSelector from "./floor-selector"
import { TableStatus, getTableColor } from "@/types/table"
import { cn } from "@heroui/react"
interface FullScreenFloorPlanProps {
  tables: Table[]
  floors: Floor[]
  activeFloorId: string
  restaurantId: string
  selectedTableIds: string[]
  onSelectTable: (id: string) => void
  onUpdateTablePosition: (id: string, x: number, y: number) => void
  onEditTable: () => void
  onClose: () => void
  onMergeTables: (tableIds: string[]) => void
  onFloorChange: (floorId: string) => void
  onAddFloor: (floor: Floor) => void
  onUpdateFloor: (floor: Floor) => void
  onDeleteFloor: (floorId: string) => void
}

export default function FullScreenFloorPlan({
  tables,
  floors,
  activeFloorId,
  restaurantId,
  selectedTableIds,
  onSelectTable,
  onClose,
  onMergeTables,
  onFloorChange,
  onAddFloor,
  onUpdateFloor,
  onDeleteFloor,
}: FullScreenFloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const floorPlanRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [adjacentTables, setAdjacentTables] = useState<Table[]>([])
  const [showMergeModal, setShowMergeModal] = useState(false)

  const activeFloor = floors.find((f) => f.id === activeFloorId) || floors[0]

  // Set initial viewport size
  useEffect(() => {
    const handleResize = () => {
      // Handle resize if needed in the future
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Handle mouse/touch events for panning
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
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
      if (!isDragging) return

      // Handle both mouse and touch events
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

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
    [isDragging, dragStart, scale],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add and remove event listeners
  useEffect(() => {
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
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle zoom in/out
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        zoomIn()
      } else {
        zoomOut()
      }
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
              {activeFloor?.name || "Restaurant Floor Plan"}
            </h2>
            <p className="text-sm text-gray-500">Fullscreen Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button 
              variant="flat" 
              size="sm" 
              onClick={zoomOut}
              className="min-w-0 h-8 w-8 p-0 bg-transparent hover:bg-gray-200"
            >
              <ZoomOut className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="px-2 text-sm font-medium text-gray-700">{Math.round(scale * 100)}%</div>
            <Button 
              variant="flat" 
              size="sm" 
              onClick={zoomIn}
              className="min-w-0 h-8 w-8 p-0 bg-transparent hover:bg-gray-200"
            >
              <ZoomIn className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
          <Button 
            variant="flat" 
            size="sm" 
            onClick={onClose}
            className="min-w-0 h-9 w-9 p-0 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
          >
            <X className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      </div>

      {/* Floor Selector */}
      <div className="px-4 py-2 border-b bg-white shadow-sm">
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

      {/* Main Floor Plan */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-gray-50"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onWheel={handleWheel}
      >
        <div
          ref={floorPlanRef}
          className="absolute inset-0 transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            backgroundColor: activeFloor?.color || "#f5f5f4",
            backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.15) 2px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        >
          {/* Restaurant floor design elements */}
          <div className="absolute inset-0">
            {/* Horizontal guide lines */}
            <div className="absolute left-0 top-1/4 right-0 border-t border-dashed border-[#75CAA6]/10 h-0"></div>
            <div className="absolute left-0 top-1/2 right-0 border-t border-dashed border-[#75CAA6]/10 h-0"></div>
            <div className="absolute left-0 top-3/4 right-0 border-t border-dashed border-[#75CAA6]/10 h-0"></div>
            
            {/* Vertical guide lines */}
            <div className="absolute top-0 left-1/4 bottom-0 border-l border-dashed border-[#75CAA6]/10 w-0"></div>
            <div className="absolute top-0 left-1/2 bottom-0 border-l border-dashed border-[#75CAA6]/10 w-0"></div>
            <div className="absolute top-0 left-3/4 bottom-0 border-l border-dashed border-[#75CAA6]/10 w-0"></div>

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
          </div>

          {/* Tables */}
          {tables.map((table) => (
            <div
              key={table.id}
              className={cn(
                "absolute rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                selectedTableIds.includes(table.id) ? "ring-2 ring-primary ring-opacity-50 z-10" : "",
                table.status === TableStatus.AVAILABLE ? "bg-green-500 text-white" : 
                table.status === TableStatus.OCCUPIED ? "bg-red-500 text-white" : 
                "bg-blue-500 text-white",
                table.isMerged ? "border-dashed border-2" : "border"
              )}
              style={{
                left: `${table.x}px`,
                top: `${table.y}px`,
                width: `80px`,
                height: `80px`,
                borderColor: selectedTableIds.includes(table.id) ? "rgb(var(--primary))" : "rgba(0,0,0,0.2)",
              }}
              onClick={() => onSelectTable(table.id)}
            >
              {/* Table content */}
            </div>
          ))}
        </div>

        {/* Controls overlay */}
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-600 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
            Drag to pan, scroll to zoom
          </div>
        </div>

        {/* Mini map */}
        <div className="absolute bottom-4 right-4 w-40 h-32 bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="w-full h-full p-1 opacity-70" style={{ backgroundColor: activeFloor?.color }}>
            {tables.map((table) => (
              <div
                key={`mini-${table.id}`}
                className="absolute rounded-sm border border-gray-400"
                style={{
                  left: `${(table.x / 2000) * 100}%`,
                  top: `${(table.y / 2000) * 100}%`,
                  width: `4%`,
                  height: `4%`,
                  backgroundColor: getTableColor(table.status),
                }}
              />
            ))}
            {/* Viewport indicator */}
            <div 
              className="absolute border-2 border-[#75CAA6] rounded-sm pointer-events-none"
              style={{
                left: `${(-position.x / 2000 / scale) * 100}%`,
                top: `${(-position.y / 2000 / scale) * 100}%`,
                width: `${(containerRef.current?.clientWidth || 0) / 2000 / scale * 100}%`,
                height: `${(containerRef.current?.clientHeight || 0) / 2000 / scale * 100}%`,
              }}
            ></div>
          </div>
          <div className="absolute top-1 left-1 text-[8px] font-medium text-gray-600 bg-white/70 px-1 rounded">
            Overview
          </div>
        </div>
      </div>

      {/* Merge Tables Modal */}
      <MergeTablesModal
        isOpen={showMergeModal}
        onClose={handleCloseMergeModal}
        onConfirm={handleConfirmMerge}
        tables={adjacentTables}
      />
    </div>
  )
}

