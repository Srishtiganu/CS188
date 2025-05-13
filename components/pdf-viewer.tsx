"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { Upload, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Trash } from "lucide-react"

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export default function PdfViewer() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type !== "application/pdf") {
        setError("Please upload a valid PDF file")
        return
      }

      setError(null)
      setPdfFile(file)
      setPageNumber(1)
      setIsLoading(true)
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error)
    setError("Failed to load PDF. Please try another file.")
    setIsLoading(false)
  }

  const handlePreviousPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1))
  }

  const handleNextPage = () => {
    setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages || 1))
  }

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3))
  }

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5))
  }

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360)
  }

  const handleRemovePdf = () => {
    setPdfFile(null)
    setNumPages(null)
    setPageNumber(1)
    setScale(1.0)
    setRotation(0)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">PDF Viewer</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={triggerFileInput} className="flex items-center gap-1">
            <Upload className="h-4 w-4" />
            {pdfFile ? "Change PDF" : "Upload PDF"}
          </Button>
          {pdfFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemovePdf}
              className="flex items-center gap-1 text-red-500 hover:text-red-600"
            >
              <Trash className="h-4 w-4" />
              Remove
            </Button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
        </div>
      </div>

      {error && <div className="p-4 text-red-500 bg-red-50 text-center">{error}</div>}

      {!pdfFile && !error && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Upload a PDF file to view it here</p>
            <Button onClick={triggerFileInput}>Select PDF</Button>
          </div>
        </div>
      )}

      {pdfFile && (
        <>
          <div className="flex-1 overflow-auto flex justify-center p-4 bg-gray-100">
            <div className="pdf-container">
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="flex justify-center items-center h-full">Loading PDF...</div>}
                error={<div className="text-red-500">Failed to load PDF</div>}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-lg"
                  />
                )}
              </Document>
            </div>
          </div>

          <div className="p-3 border-t bg-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages || "?"}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={pageNumber >= (numPages || 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
