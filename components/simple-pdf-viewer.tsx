"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";

export default function SimplePdfViewer({
  onPdfChange,
}: {
  onPdfChange?: (pdfUrl: string | null) => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      onPdfChange(pdfUrl);
    }
  }, [pdfUrl]); // onPdfChange is intentionally omitted as it's a prop and would cause unnecessary updates

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl);
      setPdfName(file.name);
      setIsLoading(false);
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
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          {pdfUrl ? "Change PDF" : "Upload PDF"}
        </Button>
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
          <div className="flex-1 overflow-hidden bg-gray-100">
            <object
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
