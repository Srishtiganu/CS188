"use client"

import { Button } from "@/components/ui/button"
import { FileText, Download, ExternalLink } from "lucide-react"

interface PdfFallbackProps {
  pdfUrl: string
  pdfName: string | null
}

export default function PdfFallback({ pdfUrl, pdfName }: PdfFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
      <FileText className="h-16 w-16 text-gray-400 mb-4" />
      <p className="text-lg font-medium mb-2">Unable to display PDF</p>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Your browser cannot display this PDF directly. You can download it or open it in a new tab.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex items-center gap-2">
          <a href={pdfUrl} download={pdfName || "document.pdf"}>
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        </Button>
        <Button asChild className="flex items-center gap-2">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </a>
        </Button>
      </div>
    </div>
  )
}
