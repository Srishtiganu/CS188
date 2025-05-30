"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, Scissors } from "lucide-react";

export default function SimplePdfViewer({
  onPdfChange,
  onTextSelection,
}: {
  onPdfChange?: (pdfUrl: string | null, pdfData?: ArrayBuffer | null) => void;
  onTextSelection?: (selectedText: string) => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

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
    // Only notify if we have an onPdfChange handler
    if (onPdfChange) {
      onPdfChange(pdfUrl, pdfData);
    }
  }, [pdfUrl, pdfData]); // onPdfChange is intentionally omitted as it's a prop and would cause unnecessary updates

  // Handle text selection from the PDF
  useEffect(() => {
    const handleDocumentSelection = (event: MouseEvent | TouchEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        // Check if the selection is within the PDF viewer area
        const target = event.target as Element;
        const pdfViewerElement = objectRef.current || iframeRef.current;

        // Only process selection if it's within the PDF viewer or its parent container
        if (
          pdfViewerElement &&
          (pdfViewerElement.contains(target) ||
            target.closest(".pdf-viewer-container"))
        ) {
          const text = selection.toString().trim();
          setSelectedText(text);

          console.log("PDF Viewer - Text selected:", text);
          console.log("PDF Viewer - Selection length:", text.length);

          // Notify parent component of the selected text
          if (onTextSelection) {
            onTextSelection(text);
          }
        }
      }
    };

    // Add listeners to capture text selection
    document.addEventListener("mouseup", handleDocumentSelection);
    document.addEventListener("touchend", handleDocumentSelection);

    return () => {
      document.removeEventListener("mouseup", handleDocumentSelection);
      document.removeEventListener("touchend", handleDocumentSelection);
    };
  }, [onTextSelection]);

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

        // Notify parent with both URL and data
        if (onPdfChange) {
          onPdfChange(fileUrl, fileData);
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

  // Handle iframe load error
  const handleIframeError = () => {
    setError(
      "Failed to load PDF. Please try another file or use a different browser."
    );
  };

  // Handle clearing the selected text
  const clearSelectedText = () => {
    console.log("PDF Viewer - Clearing selected text");
    setSelectedText(null);
    if (onTextSelection) {
      onTextSelection("");
    }
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
          {selectedText && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelectedText}
              className="flex items-center gap-1"
            >
              <Scissors className="h-4 w-4" />
              Clear Selection
            </Button>
          )}
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
          <div className="flex-1 overflow-hidden bg-gray-100 pdf-viewer-container">
            <object
              ref={objectRef}
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
              aria-label={pdfName || "PDF Document"}
            >
              <div className="flex flex-col items-center justify-center h-full p-8">
                <p className="mb-4 text-center">
                  Your browser doesn't support embedded PDFs.
                  <a
                    href={pdfUrl}
                    download={pdfName || "document.pdf"}
                    className="text-blue-500 ml-1"
                  >
                    Click here to download the PDF
                  </a>
                </p>
                <Button asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    Open PDF in new tab
                  </a>
                </Button>
              </div>
            </object>
          </div>
        )
      )}
    </div>
  );
}
