"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, X, MessageSquare } from "lucide-react";

// React PDF Viewer imports
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import type {
  RenderHighlightTargetProps,
  RenderHighlightContentProps,
  HighlightArea,
} from "@react-pdf-viewer/highlight";

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

interface SelectedTextInfo {
  text: string;
  highlightAreas: HighlightArea[];
}

export default function SimplePdfViewer({
  onPdfChange,
  onTextSelection,
  pdfData: propPdfData,
}: {
  onPdfChange?: (pdfUrl: string | null, pdfData?: ArrayBuffer | null) => void;
  onTextSelection?: (selectedText: string) => void;
  pdfData?: ArrayBuffer;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTextInfo, setSelectedTextInfo] =
    useState<SelectedTextInfo | null>(null);
  const [showHighlightForm, setShowHighlightForm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          background: "#3b82f6",
          color: "white",
          display: "flex",
          position: "absolute",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          transform: "translate(0, 8px)",
          borderRadius: "6px",
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

  // Create highlight plugin instance
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
  });

  // Create default layout plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

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
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {pdfName ? (
            <span className="truncate max-w-[200px]" title={pdfName}>
              {pdfName}
            </span>
          ) : (
            "PDF Viewer"
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            className="flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            {pdfUrl ? "Change PDF" : "Upload PDF"}
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
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
          <div className="flex-1 h-full overflow-auto bg-gray-100">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer
                fileUrl={pdfUrl}
                plugins={[highlightPluginInstance, defaultLayoutPluginInstance]}
              />
            </Worker>
          </div>
        )
      )}
    </div>
  );
}
