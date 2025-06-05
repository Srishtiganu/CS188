"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  MessageSquare,
  PanelLeft,
  Home,
  FileIcon,
  Plus,
  Minus,
} from "lucide-react";

// React PDF Viewer imports
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import { thumbnailPlugin } from "@react-pdf-viewer/thumbnail";
import type {
  RenderHighlightTargetProps,
  RenderHighlightContentProps,
  HighlightArea,
} from "@react-pdf-viewer/highlight";

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import "@react-pdf-viewer/thumbnail/lib/styles/index.css";

// Import UI components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface SelectedTextInfo {
  text: string;
  highlightAreas: HighlightArea[];
}

export default function SimplePdfViewer({
  onPdfChange,
  onTextSelection,
  pdfData: propPdfData,
  pdfName: propPdfName,
}: {
  onPdfChange?: (pdfUrl: string | null, pdfData?: ArrayBuffer | null) => void;
  onTextSelection?: (selectedText: string) => void;
  pdfData?: ArrayBuffer;
  pdfName?: string | null;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(propPdfName || null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTextInfo, setSelectedTextInfo] =
    useState<SelectedTextInfo | null>(null);
  const [showHighlightForm, setShowHighlightForm] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<string>("100");
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());

  // Use refs to store latest callback functions to avoid dependency issues
  const onPdfChangeRef = useRef(onPdfChange);
  const onTextSelectionRef = useRef(onTextSelection);

  // Update refs when props change
  useEffect(() => {
    onPdfChangeRef.current = onPdfChange;
  }, [onPdfChange]);

  useEffect(() => {
    onTextSelectionRef.current = onTextSelection;
  }, [onTextSelection]);

  // Clean up object URLs when component unmounts or when a new PDF is loaded
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Notify parent component when PDF changes
  useEffect(() => {
    if (onPdfChangeRef.current) {
      onPdfChangeRef.current(pdfUrl, pdfData);
    }
  }, [pdfUrl, pdfData]); // Removed onPdfChange from dependencies to prevent infinite loops

  // Handle text selection callback
  const handleTextSelection = useCallback(
    (text: string, highlightAreas: HighlightArea[]) => {
      console.log("PDF Viewer - Text selected:", text);
      setSelectedTextInfo({ text, highlightAreas });

      if (onTextSelectionRef.current) {
        onTextSelectionRef.current(text);
      }
    },
    []
  ); // Removed onTextSelection from dependencies

  // Clear selected text
  const clearSelectedText = useCallback(() => {
    console.log("PDF Viewer - Clearing selected text");
    setSelectedTextInfo(null);
    setShowHighlightForm(false);

    if (onTextSelectionRef.current) {
      onTextSelectionRef.current("");
    }
  }, []); // Removed onTextSelection from dependencies

  // Render highlight target (the bubble that appears after text selection)
  const renderHighlightTarget = (props: RenderHighlightTargetProps) => {
    // Don't show the button if this text has already been added to chat
    if (selectedTextInfo && selectedTextInfo.text === props.selectedText) {
      return <></>;
    }

    return (
      <div
        style={{
          background: "#fb923c", // Lighter orange
          color: "white",
          display: "flex",
          position: "absolute",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          transform: "translate(0, 8px)",
          borderRadius: "12px", // Less rounded
          padding: "8px 12px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          alignItems: "center",
          gap: "6px",
        }}
        onClick={() => {
          // Store the selected text and highlight areas
          handleTextSelection(props.selectedText, props.highlightAreas);
          // Close the popup immediately without showing the expanded form
          props.cancel();
        }}
      >
        <MessageSquare size={16} />
        Add to Chat
      </div>
    );
  };

  // Render highlight content (expanded form)
  const renderHighlightContent = (props: RenderHighlightContentProps) => (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        position: "absolute",
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: "translate(0, 8px)",
        minWidth: "300px",
        maxWidth: "400px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-900">Selected Text</h4>
        <button
          onClick={() => {
            setShowHighlightForm(false);
            props.cancel();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
          <p className="text-sm text-gray-700 line-clamp-4">
            "{props.selectedText}"
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            // The text is already stored, just close the form
            setShowHighlightForm(false);
            props.cancel();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Added to Chat
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Clear selection and close form
            clearSelectedText();
            props.cancel();
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  // Create plugin instances
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
  });

  // Create zoom plugin instance
  const zoomPluginInstance = zoomPlugin();
  const { zoomTo } = zoomPluginInstance;

  // Create page navigation plugin instance
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Create thumbnail plugin instance with higher resolution
  const thumbnailPluginInstance = thumbnailPlugin({
    thumbnailWidth: 150,
  });
  const { Thumbnails } = thumbnailPluginInstance;

  // Handle zoom change
  const handleZoomChange = useCallback(
    (value: string) => {
      setCurrentZoom(value);
      const zoomLevel = parseFloat(value) / 100;
      if (zoomTo) {
        zoomTo(zoomLevel);
      }
    },
    [zoomTo]
  );

  // Handle zoom increment
  const handleZoomIncrement = useCallback(() => {
    const current = parseInt(currentZoom);
    let newZoom: number;

    if (current < 100) {
      newZoom = current + 25;
    } else if (current < 200) {
      newZoom = current + 50;
    } else {
      newZoom = Math.min(current + 50, 500); // Cap at 500%
    }

    handleZoomChange(newZoom.toString());
  }, [currentZoom, handleZoomChange]);

  // Handle zoom decrement
  const handleZoomDecrement = useCallback(() => {
    const current = parseInt(currentZoom);
    let newZoom: number;

    if (current <= 100) {
      newZoom = Math.max(current - 25, 25); // Minimum 25%
    } else if (current <= 200) {
      newZoom = current - 50;
    } else {
      newZoom = current - 50;
    }

    handleZoomChange(newZoom.toString());
  }, [currentZoom, handleZoomChange]);

  // Handle document load to get total pages
  const handleDocumentLoad = useCallback((e: any) => {
    console.log("Document loaded:", e);
    if (e.doc && e.doc.numPages) {
      setTotalPages(e.doc.numPages);
      setCurrentPage(1);
    }
  }, []);

  // Handle page change from PDF viewer
  const handlePageChange = useCallback((e: any) => {
    console.log("Page changed:", e);
    if (e.currentPage !== undefined) {
      setCurrentPage(e.currentPage + 1); // PDF viewer uses 0-based indexing
    }
  }, []);

  // Handle page input change
  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInput(e.target.value);
    },
    []
  );

  // Handle page input submit (Enter key or blur)
  const handlePageInputSubmit = useCallback(() => {
    const pageNum = parseInt(pageInput, 10);
    if (
      !isNaN(pageNum) &&
      pageNum >= 1 &&
      pageNum <= totalPages &&
      jumpToPage
    ) {
      setCurrentPage(pageNum);
      jumpToPage(pageNum - 1);
    } else {
      // Revert to currentPage if invalid
      setPageInput(currentPage.toString());
    }
  }, [pageInput, totalPages, currentPage, jumpToPage]);

  // Handle Enter key in page input
  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handlePageInputSubmit();
        (e.target as HTMLInputElement).blur();
      }
    },
    [handlePageInputSubmit]
  );

  // Reset page state when PDF changes
  useEffect(() => {
    if (pdfUrl) {
      setCurrentPage(1);
      setTotalPages(0);
      setCurrentZoom("100");
    }
  }, [pdfUrl]);

  // Keep input field in sync with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // If propPdfData is provided, use it and skip upload UI
  useEffect(() => {
    if (propPdfData) {
      setPdfData(propPdfData);
      const blob = new Blob([propPdfData], { type: "application/pdf" });
      const fileUrl = URL.createObjectURL(blob);
      setPdfUrl(fileUrl);
    }
  }, [propPdfData]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Check if it's a PDF
      if (file.type !== "application/pdf") {
        setError("Please upload a valid PDF file");
        return;
      }

      setError(null);
      setIsLoading(true);

      // Revoke previous URL if it exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      try {
        // Read file as ArrayBuffer
        const fileData = await file.arrayBuffer();
        setPdfData(fileData);

        // Create a URL for the file
        const fileUrl = URL.createObjectURL(file);
        setPdfUrl(fileUrl);
        setPdfName(file.name);

        // Clear any previous selection
        clearSelectedText();

        // Notify parent with both URL and data
        if (onPdfChangeRef.current) {
          onPdfChangeRef.current(fileUrl, fileData);
        }
      } catch (error) {
        setError("Failed to read PDF file");
        console.error("Error reading PDF:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="border-b border-gray-200 px-4 py-2 flex justify-between items-center flex-shrink-0"
        style={{ backgroundColor: "#FBFBFB" }}
      >
        <h2 className="text-lg font-normal flex items-center gap-2">
          {/* <FileIcon className="w-5 h-5" /> */}
          {pdfName ? (
            <span className="max-w-[400px] font-semibold" title={pdfName}>
              {pdfName.replace(/\.pdf$/i, "")}
            </span>
          ) : (
            "PDF Viewer"
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="h-8 px-3"
            title="Go to home page"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
        {/* <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        /> */}
      </div>

      {error && (
        <div className="p-4 text-red-500 bg-red-50 text-center flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!pdfUrl && !error && !isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Upload a PDF file to view it here
            </p>
            <Button onClick={triggerFileInput}>Select PDF</Button>
          </div>
        </div>
      ) : (
        !isLoading &&
        pdfUrl && (
          <div className="flex-1 flex flex-col bg-gray-100 min-h-0">
            {/* Custom Toolbar */}
            <div
              className="border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0"
              style={{ backgroundColor: "#FBFBFB" }}
            >
              {/* Thumbnail Toggle - Left */}
              <div className="w-24 flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className={`h-8 px-3 transition-all ${
                    showThumbnails
                      ? "bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200"
                      : "hover:bg-orange-50 hover:border-orange-200"
                  }`}
                  title="Toggle Thumbnails"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Page Input - Center */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputSubmit}
                  onKeyDown={handlePageInputKeyDown}
                  inputMode="numeric"
                  pattern="\d*"
                  className="w-12 h-8 text-center text-sm"
                  disabled={totalPages === 0}
                />
                <span className="font-medium">of {totalPages || 0}</span>
              </div>

              {/* Zoom Control - Right */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomDecrement}
                  className="h-7 w-7 p-0"
                  disabled={parseInt(currentZoom) <= 25}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Select value={currentZoom} onValueChange={handleZoomChange}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                    <SelectItem value="125">125%</SelectItem>
                    <SelectItem value="150">150%</SelectItem>
                    <SelectItem value="200">200%</SelectItem>
                    <SelectItem value="250">250%</SelectItem>
                    <SelectItem value="300">300%</SelectItem>
                    <SelectItem value="400">400%</SelectItem>
                    <SelectItem value="500">500%</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIncrement}
                  className="h-7 w-7 p-0"
                  disabled={parseInt(currentZoom) >= 500}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* PDF Viewer with Thumbnails */}
            <div className="flex-1 flex min-h-0">
              {/* Thumbnail Panel */}
              {showThumbnails && (
                <div className="w-48 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                  <div className="p-2">
                    <div className="thumbnail-container">
                      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Thumbnails />
                      </Worker>
                    </div>
                  </div>
                </div>
              )}

              {/* Main PDF Viewer */}
              <div className="flex-1 overflow-auto min-h-0">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={pdfUrl}
                    plugins={[
                      highlightPluginInstance,
                      zoomPluginInstance,
                      pageNavigationPluginInstance,
                      thumbnailPluginInstance,
                    ]}
                    onDocumentLoad={handleDocumentLoad}
                    onPageChange={handlePageChange}
                  />
                </Worker>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
