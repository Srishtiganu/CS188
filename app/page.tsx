"use client";

import {
  specialGothic,
  specialGothicExpanded,
  zodiak,
  generalSans,
} from "./fonts";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // dataUrl is like "data:application/pdf;base64,...."
        const base64 = dataUrl.split(",")[1];
        localStorage.setItem("uploadedPdf", base64);
        localStorage.setItem("uploadedPdfName", file.name);
        router.push("/chat");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="min-h-screen bg-orange-500 bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/background.png')",
      }}
    >
      {/* Content */}
      <div className="text-center space-y-8">
        {/* Title */}
        <h1
          className={`text-7xl font-normal text-white/70 ${specialGothicExpanded.className}`}
        >
          PaperClip
        </h1>

        {/* Upload Button */}
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          className={`bg-white/10 hover:bg-white/20 border border-white/30 rounded-2xl text-white/70 hover:text-orange-50 backdrop-blur-2xl font-thin px-[115px] py-4 text-lg`}
          size="lg"
          onClick={handleButtonClick}
        >
          Upload Research Paper
        </Button>
      </div>
    </div>
  );
}
