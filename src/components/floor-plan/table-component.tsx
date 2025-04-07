"use client"

import type React from "react"

import { useEffect, useRef, type RefObject, useState, useCallback } from "react"
import { TableStatus, type Table, getTableColor } from "@/types/table"
import { cn, Tooltip } from "@heroui/react"

interface TableComponentProps {
  table: Table
  isSelected: boolean
  onSelect: (tableId: string) => void
  onUpdatePosition: (x: number, y: number) => void
  containerRef: RefObject<HTMLDivElement | null>
  onDoubleClick?: () => void
  isMerged?: boolean
  onDragEnd?: (tableId: string, x: number, y: number) => void
}

export default function TableComponent({
  table,
  isSelected,
  onSelect: onSelectTable,
  onUpdatePosition,
  containerRef,
  onDoubleClick,
  isMerged = false,
  onDragEnd,
}: TableComponentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const tableRef = useRef<HTMLDivElement>(null)
  const [currentPosition, setCurrentPosition] = useState({ x: table.x, y: table.y })

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tableRef.current) {
      // Handle both mouse and touch events
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      const rect = tableRef.current.getBoundingClientRect()
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      })
      setIsDragging(true)
    }

    if (!("touches" in e)) {
      onSelectTable(table.id)
    } else {
      onSelectTable(table.id)
    }

    e.stopPropagation()

    // Prevent the event from bubbling up to the container
    if ("touches" in e) {
      e.preventDefault()
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isDragging && containerRef.current && tableRef.current) {
        // Handle both mouse and touch events
        const clientX = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
        const clientY = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY

        const containerRect = containerRef.current.getBoundingClientRect()
        const tableRect = tableRef.current.getBoundingClientRect()

        // Calculate new position
        let newX = clientX - containerRect.left - dragOffset.x
        let newY = clientY - containerRect.top - dragOffset.y

        // Grid snap (20px grid)
        const gridSize = 20
        newX = Math.round(newX / gridSize) * gridSize
        newY = Math.round(newY / gridSize) * gridSize

        // Ensure table stays within container bounds
        newX = Math.max(0, Math.min(newX, containerRect.width - tableRect.width))
        newY = Math.max(0, Math.min(newY, containerRect.height - tableRect.height))

        setCurrentPosition({ x: newX, y: newY })
        onUpdatePosition(newX, newY)
      }
    },
    [isDragging, dragOffset, onUpdatePosition, containerRef],
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging && onDragEnd) {
      onDragEnd(table.id, currentPosition.x, currentPosition.y)
    }
    setIsDragging(false)
  }, [isDragging, onDragEnd, table.id, currentPosition])

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (onDoubleClick) {
      onDoubleClick()
    }
    e.stopPropagation()
  }

  const handleTouchEnd = useCallback(() => {
    if (isDragging && onDragEnd) {
      onDragEnd(table.id, currentPosition.x, currentPosition.y)
    }
    setIsDragging(false)
  }, [isDragging, onDragEnd, table.id, currentPosition])

  // Add and remove event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("touchmove", handleMouseMove, { passive: false })
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchEnd])

  // Update current position when table position changes from props
  useEffect(() => {
    setCurrentPosition({ x: table.x, y: table.y })
  }, [table.x, table.y])

  // Get text color based on background color brightness
  const getTextColor = () => {
    // Simple check - if using a dark color, use white text
    if (table.status === TableStatus.OCCUPIED || table.status === TableStatus.RESERVED) {
      return "text-white"
    }
    return "text-gray-800"
  }

  // Get tooltip content
  const getTooltipContent = () => {
    return (
      <div className="text-sm p-1">
        <div className="font-bold mb-1">{table.name}</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Capacity: {table.capacity} seats</span>
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Status: {table.status}</span>
          </div>
          {isMerged && (
            <div className="flex items-center gap-2 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><rect width="8" height="8" x="2" y="2" rx="2"></rect><rect width="8" height="8" x="14" y="2" rx="2"></rect><rect width="8" height="8" x="2" y="14" rx="2"></rect><rect width="8" height="8" x="14" y="14" rx="2"></rect></svg>
              <span className="text-indigo-600 font-medium">Merged table</span>
            </div>
          )}
        </div>
        {table.status !== TableStatus.AVAILABLE && (
          <div className="mt-2 text-xs bg-gray-100 p-1 rounded text-gray-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Double-click to edit
          </div>
        )}
      </div>
    )
  }

  return (
    <Tooltip content={getTooltipContent()} placement="top">
      <div
        ref={tableRef}
        className={cn(
          "absolute rounded-xl border flex flex-col items-center justify-center cursor-move transition-all duration-200",
          "w-20 h-20", // Static dimensions: 80x80px
          isSelected
            ? "ring-2 ring-primary ring-opacity-50 z-10 scale-[1.03]"
            : "hover:shadow-md hover:scale-[1.01]",
          getTextColor(),
          isDragging ? "opacity-80" : "opacity-100",
          isMerged ? "border-dashed border-2" : "border"
        )}
        style={{
          left: `${table.x}px`,
          top: `${table.y}px`,
          backgroundColor: getTableColor(table.status),
          borderColor: isSelected ? "rgb(var(--primary))" : isMerged ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)",
          padding: "4px",
          transition: isDragging ? "none" : "all 0.2s ease",
        }}
        onClick={(_e) => onSelectTable(table.id)}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="text-center w-full h-full flex flex-col items-center justify-center relative">
          {/* Table number indicator - always visible */}
          <div className="absolute -top-2 -left-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-gray-200 text-xs font-bold text-gray-700">
            {table.name.replace(/[^0-9]/g, '')}
          </div>
          
          {/* Table content */}
          <div className="flex flex-col items-center justify-center gap-1 w-full">
            {/* Table name */}
            <div className="font-semibold text-sm truncate w-full">
              {table.name}
            </div>

            {/* Capacity */}
            <div className="flex items-center justify-center gap-1 text-sm">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={table.status === TableStatus.OCCUPIED || table.status === TableStatus.RESERVED ? "text-white/70" : "text-gray-600"}
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {table.capacity}
            </div>

            {/* Merged indicator */}
            {isMerged && (
              <div className="text-xs font-medium flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="2" y="2" rx="2"></rect><rect width="8" height="8" x="14" y="2" rx="2"></rect><rect width="8" height="8" x="2" y="14" rx="2"></rect><rect width="8" height="8" x="14" y="14" rx="2"></rect></svg>
                Merged
              </div>
            )}
          </div>
        </div>
      </div>
    </Tooltip>
  )
}

