"use client"

import { useDocumentEditor } from "@/features/viewer/hooks/use-document-editor"
import { type PdfObject } from "@/lib/pdf/analyzer"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface PdfObjectLayerProps {
  pageNumber: number
  objects: PdfObject[]
  zoom: number
  rotation: number
  screenWidth: number
  screenHeight: number
}

import { useState, useEffect } from "react"
import { ObjectManipulator } from "@/features/viewer/services/object-manipulator"
import { useViewer } from "@/features/viewer/provider"
import { toast } from "sonner"
import { useCoarsePointer } from "@/hooks/use-coarse-pointer"

export function PdfObjectLayer({
  objects,
  zoom,
  screenWidth,
  screenHeight,
}: PdfObjectLayerProps) {
  const { isEditMode, selectedObjectId, setSelectedObject, setHoveredObject } = useDocumentEditor()
  const documentId = useViewer((s) => s.documentId)
  const isCoarse = useCoarsePointer()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempText, setTempText] = useState("")

  const handleSize = isCoarse ? 16 : 8
  const handleOffset = handleSize / 2

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!selectedObjectId || editingId) return
      
      if (e.key === "Delete" || e.key === "Backspace") {
        const obj = objects.find(o => o.id === selectedObjectId)
        if (!obj) return
        
        toast.promise(ObjectManipulator.deleteObject(documentId, obj), {
          loading: "Deleting object...",
          success: "Object removed from PDF",
          error: "Failed to delete object",
        })
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedObjectId, editingId, objects, documentId])

  if (!isEditMode) return null

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-30"
      style={{ width: screenWidth, height: screenHeight }}
    >
      {objects.map((obj) => {
        const isSelected = selectedObjectId === obj.id
        const isEditing = editingId === obj.id

        return (
          <motion.div
            key={obj.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "absolute cursor-pointer pointer-events-auto transition-all",
              isSelected ? "ring-2 ring-primary shadow-lg z-40" : "hover:ring-1 hover:ring-primary/50",
              isEditing && "ring-0 shadow-none z-50"
            )}
            style={{
              left: obj.x * zoom,
              top: obj.y * zoom,
              width: obj.width * zoom,
              height: obj.height * zoom,
              backgroundColor: isSelected ? "rgba(var(--primary-rgb), 0.05)" : "transparent",
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              if (!isEditing) setSelectedObject(obj.id)
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              if (obj.type === "text") {
                setEditingId(obj.id)
                setTempText(obj.content || "")
              }
            }}
            onMouseEnter={() => setHoveredObject(obj.id)}
            onMouseLeave={() => setHoveredObject(null)}
          >
            {isEditing ? (
              <textarea
                autoFocus
                className="size-full bg-white border-2 border-primary rounded-sm outline-none resize-none p-0 overflow-hidden leading-tight shadow-2xl"
                style={{
                  fontSize: (obj.fontSize || 12) * zoom,
                  fontFamily: obj.fontName || "Inter",
                }}
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onBlur={async () => {
                  setEditingId(null)
                  if (tempText !== obj.content) {
                    toast.promise(ObjectManipulator.updateText(documentId, obj, tempText), {
                      loading: "Updating PDF...",
                      success: "Text updated",
                      error: "Failed to update text",
                    })
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) e.currentTarget.blur()
                  if (e.key === "Escape") setEditingId(null)
                }}
              />
            ) : (
              <>
                {isSelected && (
                  <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm pointer-events-auto">
                      {obj.type}
                    </div>
                  </div>
                )}
                
                {isSelected && (
                  <>
                    <div 
                      className="absolute bg-white border-2 border-primary rounded-full" 
                      style={{ 
                        width: handleSize, 
                        height: handleSize, 
                        left: -handleOffset, 
                        top: -handleOffset 
                      }} 
                    />
                    <div 
                      className="absolute bg-white border-2 border-primary rounded-full" 
                      style={{ 
                        width: handleSize, 
                        height: handleSize, 
                        right: -handleOffset, 
                        top: -handleOffset 
                      }} 
                    />
                    <div 
                      className="absolute bg-white border-2 border-primary rounded-full" 
                      style={{ 
                        width: handleSize, 
                        height: handleSize, 
                        left: -handleOffset, 
                        bottom: -handleOffset 
                      }} 
                    />
                    <div 
                      className="absolute bg-white border-2 border-primary rounded-full" 
                      style={{ 
                        width: handleSize, 
                        height: handleSize, 
                        right: -handleOffset, 
                        bottom: -handleOffset 
                      }} 
                    />
                  </>
                )}
              </>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
