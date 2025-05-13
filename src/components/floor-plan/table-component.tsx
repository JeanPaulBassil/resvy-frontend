"use client"

import type React from "react"

import { useEffect, useRef, type RefObject, useState, useCallback } from "react"
import { TableStatus, type Table, getTableColor, type TableMergeAnimation, TableAnimationState } from "@/types/table"
import { cn, Tooltip } from "@heroui/react"
import { motion, AnimatePresence } from "framer-motion"

interface TableComponentProps {
  table: Table
  isSelected: boolean
  onSelect: (tableId: string) => void
  onUpdatePosition: (x: number, y: number) => void
  containerRef: RefObject<HTMLDivElement | null>
  onDoubleClick?: () => void
  isMerged?: boolean
  onDragEnd?: (tableId: string, x: number, y: number) => void
  onDragStart?: (tableId: string) => void
  onDragMove?: (tableId: string) => void
  isAdjacentForMerge?: boolean
  mergeAnimation?: TableMergeAnimation
  animatingMerge?: boolean
  tables: Table[]
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
  onDragStart,
  onDragMove,
  isAdjacentForMerge = false,
  mergeAnimation,
  animatingMerge = false,
  tables,
}: TableComponentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const tableRef = useRef<HTMLDivElement>(null)
  const [currentPosition, setCurrentPosition] = useState({ x: table.x, y: table.y })

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't allow dragging during animations
    if (animatingMerge) return;
    
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
      
      // Call drag start callback
      if (onDragStart) {
        onDragStart(table.id)
      }
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

        // Always update the local UI position
        setCurrentPosition({ x: newX, y: newY })
        
        // Update position in parent component
        // The FloorPlanManager will decide whether to update the backend
        onUpdatePosition(newX, newY)
        
        // Call drag move callback
        if (onDragMove) {
          onDragMove(table.id)
        }
      }
    },
    [isDragging, dragOffset, onUpdatePosition, containerRef, onDragMove, table.id, isAdjacentForMerge],
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

  // Calculate animation properties for merging/unmerging
  const getAnimationProps = () => {
    if (!mergeAnimation || !animatingMerge) return {
      animate: undefined,
      transition: undefined,
      initial: undefined
    };
    
    const isSource = mergeAnimation.sourceTableId === table.id;
    const isTarget = mergeAnimation.targetTableId === table.id;
    
    // If this table is not involved in the animation, return empty object
    if (!isSource && !isTarget) return {
      animate: undefined,
      transition: undefined,
      initial: undefined
    };
    
    // Source table animations (the table being merged into the target)
    if (isSource) {
      if (mergeAnimation.state === TableAnimationState.MERGING) {
        // Merging animation - source table wraps into target
        return {
          initial: { scale: 1, opacity: 1, rotate: 0 },
          animate: { 
            scale: [1, 0.8, 0.6, 0],
            opacity: [1, 0.9, 0.8, 0],
            rotate: [0, 5, 0],
            x: [0, (mergeAnimation.targetTableId ? getPositionDelta('x', mergeAnimation.targetTableId) * 0.6 : 0)],
            y: [0, (mergeAnimation.targetTableId ? getPositionDelta('y', mergeAnimation.targetTableId) * 0.6 : 0)]
          },
          transition: { 
            duration: 0.65,
            ease: "easeInOut"
          }
        };
      } else {
        // Unmerging animation - parent table stays in place but has unwrapping effect
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { 
            scale: [1, 1.15, 1.05, 1],
            opacity: 1,
            rotate: [0, -2, 2, 0],
            boxShadow: [
              "0 0 0px rgba(79, 70, 229, 0)",
              "0 0 30px 10px rgba(79, 70, 229, 0.7)",
              "0 0 20px 5px rgba(79, 70, 229, 0.5)",
              "0 0 0px rgba(79, 70, 229, 0)"
            ]
          },
          transition: { 
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1]
          }
        };
      }
    }
    
    // Target table animations
    if (isTarget) {
      if (mergeAnimation.state === TableAnimationState.MERGING) {
        // Merging animation - target table "receives" the source table
        return {
          initial: { 
            scale: 1,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          },
          animate: { 
            scale: [1, 1.15, 1.05, 1],
            boxShadow: [
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              "0 0 20px 5px rgba(79, 70, 229, 0.6), 0 0 30px 10px rgba(79, 70, 229, 0.3)",
              "0 0 15px 3px rgba(79, 70, 229, 0.4), 0 0 20px 5px rgba(79, 70, 229, 0.2)",
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            ]
          },
          transition: { 
            duration: 0.65,
            ease: "easeInOut"
          }
        };
      } else {
        // Unmerging animation - child tables "unwrap" from parent
        // Get the original position for this table
        const originalPosition = getOriginalPosition();
        
        return {
          initial: { 
            scale: 0,
            opacity: 0,
            x: 0,
            y: 0,
            rotate: Math.random() * 10 - 5
          },
          animate: { 
            scale: [0, 0.6, 1, 1],
            opacity: [0, 0.6, 0.9, 1],
            rotate: [Math.random() * 10 - 5, Math.random() * 20 - 10, 0],
            // Move from parent position to original position with a slight bounce
            x: originalPosition ? [0, originalPosition.x * 0.8, originalPosition.x * 1.05, originalPosition.x] : 0,
            y: originalPosition ? [0, originalPosition.y * 0.8, originalPosition.y * 1.05, originalPosition.y] : 0,
            boxShadow: [
              "0 0 0px rgba(79, 70, 229, 0)",
              "0 0 20px 5px rgba(79, 70, 229, 0.6)",
              "0 0 10px 2px rgba(79, 70, 229, 0.3)",
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            ]
          },
          transition: { 
            duration: 0.75,
            ease: [0.34, 1.56, 0.64, 1] // Spring-like effect
          }
        };
      }
    }
    
    return {
      animate: undefined,
      transition: undefined,
      initial: undefined
    };
  };
  
  // Helper function to calculate position delta between this table and target
  const getPositionDelta = (axis: 'x' | 'y', targetId: string) => {
    const targetTable = tables.find(t => t.id === targetId);
    if (!targetTable) return 0;
    
    return targetTable[axis] - table[axis];
  };
  
  // Helper function to get original position from initial positions
  const getOriginalPosition = () => {
    if (!mergeAnimation || !mergeAnimation.initialPositions || !mergeAnimation.initialPositions[table.id]) {
      return null;
    }
    
    const currentPosition = { x: table.x, y: table.y };
    const originalPosition = mergeAnimation.initialPositions[table.id];
    
    return {
      x: originalPosition.x - currentPosition.x,
      y: originalPosition.y - currentPosition.y
    };
  };

  // Get animation style properties
  const animationProps = getAnimationProps();
  const isAnimating = Object.keys(animationProps).length > 0;

  return (
    <Tooltip content={getTooltipContent()} placement="top">
      <motion.div
        ref={tableRef}
        className={cn(
          "absolute rounded-xl border flex flex-col items-center justify-center cursor-move transition-all duration-300",
          "w-20 h-20", // Static dimensions: 80x80px
          isSelected
            ? "ring-2 ring-primary ring-opacity-70 z-20 scale-[1.05] shadow-lg"
            : "hover:shadow-md hover:scale-[1.02]",
          getTextColor(),
          isDragging ? "opacity-90 shadow-xl scale-[1.05] z-30" : "opacity-100",
          isMerged ? "border-dashed border-2" : "border",
          isAdjacentForMerge && !isDragging && "ring-2 ring-indigo-500/80 z-20",
          animatingMerge && "z-40", // Keep animated tables on top
        )}
        style={{
          left: `${table.x}px`,
          top: `${table.y}px`,
          backgroundColor: getTableColor(table.status),
          borderColor: isSelected ? "rgb(var(--primary))" : isMerged ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)",
          padding: "4px",
          transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isAdjacentForMerge ? "0 0 15px rgba(79, 70, 229, 0.35)" : isDragging ? "0 10px 25px -5px rgba(0, 0, 0, 0.2)" : "",
          // Make sure dragging is always possible when not animating
          pointerEvents: animatingMerge ? "none" : "auto", // Only disable interactions during animation
        }}
        onClick={(_e) => !animatingMerge && onSelectTable(table.id)}
        onDoubleClick={(e) => !animatingMerge && handleDoubleClick(e)}
        onMouseDown={(e) => !animatingMerge && handleMouseDown(e)}
        onTouchStart={(e) => !animatingMerge && handleMouseDown(e)}
        // Apply the animation props dynamically
        initial={animationProps.initial}
        animate={animationProps.animate}
        transition={animationProps.transition}
      >
        {/* Add merged table shimmer effect */}
        {isMerged && (
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              backgroundSize: '500px 100%',
              animation: 'shimmer 5s infinite linear'
            }}
          />
        )}

        {/* Add a pulsing highlight effect to show merging/unmerging activity */}
        <AnimatePresence>
          {isAnimating && mergeAnimation?.targetTableId === table.id && (
            <motion.div 
              className="absolute inset-0 rounded-xl bg-indigo-400/20 z-10 overflow-hidden"
              animate={{ 
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 0.8
              }}
              exit={{ opacity: 0 }}
            >
              {/* Inner pulse rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`pulse-${i}`}
                  className="absolute inset-0 rounded-xl border-2 border-indigo-500/30"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: [0.8, 1.2 + (i * 0.1)], 
                    opacity: [0.7, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.3,
                    repeat: Infinity,
                    repeatDelay: 0.2
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle effects for merging tables */}
        <AnimatePresence>
          {isAnimating && (
            <>
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const x = Math.cos(angle) * 50;
                const y = Math.sin(angle) * 50;
                
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-white"
                    style={{ 
                      left: '40px', 
                      top: '40px',
                      boxShadow: '0 0 8px 2px rgba(255, 255, 255, 0.8), 0 0 12px 4px rgba(79, 70, 229, 0.4)'
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, x * 0.3, x],
                      y: [0, y * 0.3, y],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: "easeOut"
                    }}
                    exit={{ opacity: 0 }}
                  />
                );
              })}

              {/* Central glow */}
              {mergeAnimation?.targetTableId === table.id && (
                <motion.div
                  className="absolute w-12 h-12 rounded-full"
                  style={{ 
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, rgba(99, 102, 241, 0) 70%)',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1.5, 2]
                  }}
                  transition={{
                    duration: 1,
                    ease: "easeOut"
                  }}
                  exit={{ opacity: 0 }}
                />
              )}
            </>
          )}
        </AnimatePresence>

        <div className="text-center w-full h-full flex flex-col items-center justify-center relative">
          {/* Table number indicator - always visible */}
          <div className={cn(
            "absolute -top-2 -left-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-gray-200 text-xs font-bold",
            isAdjacentForMerge ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "text-gray-700",
            isMerged && "bg-indigo-100/80 text-indigo-700 border-indigo-300"
          )}>
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

            {/* Merged indicator with subtle animation */}
            {isMerged && (
              <motion.div 
                className="text-xs font-medium flex items-center justify-center gap-1 bg-indigo-100/50 text-indigo-700 px-1.5 py-0.5 rounded-full"
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="2" y="2" rx="2"></rect><rect width="8" height="8" x="14" y="2" rx="2"></rect><rect width="8" height="8" x="2" y="14" rx="2"></rect><rect width="8" height="8" x="14" y="14" rx="2"></rect></svg>
                Merged
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Merge indicator popup with animation */}
        <AnimatePresence>
          {isAdjacentForMerge && !isDragging && (
            <motion.div 
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg backdrop-blur-sm"
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><rect width="8" height="8" x="2" y="2" rx="2"></rect><rect width="8" height="8" x="14" y="2" rx="2"></rect><rect width="8" height="8" x="2" y="14" rx="2"></rect><rect width="8" height="8" x="14" y="14" rx="2"></rect></svg>
                Ready to merge
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Add a subtle glow effect for potential merge targets */}
        {isAdjacentForMerge && !isDragging && (
          <motion.div 
            className="absolute inset-0 rounded-xl bg-indigo-400/20 pointer-events-none"
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              boxShadow: [
                "0 0 10px 2px rgba(79, 70, 229, 0.3)",
                "0 0 15px 5px rgba(79, 70, 229, 0.5)",
                "0 0 10px 2px rgba(79, 70, 229, 0.3)"
              ] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        )}
      </motion.div>
    </Tooltip>
  )
}

