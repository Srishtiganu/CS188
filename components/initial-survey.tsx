"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface SurveyProps {
  onSubmit: (preferences: { familiarity: string; goal: string }) => void;
}

export default function InitialSurvey({ onSubmit }: SurveyProps) {
  const [familiarity, setFamiliarity] = useState(0); // 0-1 scale
  const [goal, setGoal] = useState("Just skimming");

  const familiarityLabels = ["Beginner", "Expert"];
  const goalOptions = ["Just skimming", "Deep dive"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      familiarity: familiarityLabels[familiarity],
      goal,
    });
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-6 h-full min-h-screen"
      style={{ backgroundColor: "#FBFBFB" }}
    >
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Before we start</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Familiarity Toggle Boxes */}
          <div className="space-y-4">
            <label className="text-lg font-medium block">
              How familiar are you with this topic?
            </label>

            <div className="flex gap-4 pt-2">
              {familiarityLabels.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFamiliarity(index)}
                  className={`flex-1 bg-white text-gray-700 font-thin px-6 py-4 text-lg flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-200 ${
                    index === familiarity
                      ? "border-4 border-orange-500 text-orange-600 shadow-lg"
                      : "border-4 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-4xl">{index === 0 ? "🤔" : "🎓"}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-orange-400/20 to-transparent" />

          {/* Goal Radio Buttons */}
          <div className="space-y-4">
            <label className="text-lg font-medium block">
              What is your goal regarding this paper?
            </label>

            <div className="flex gap-4 pt-2">
              {goalOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGoal(option)}
                  className={`flex-1 bg-white text-gray-700 font-thin px-6 py-4 text-lg flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-200 ${
                    goal === option
                      ? "border-4 border-orange-500 text-orange-600 shadow-lg"
                      : "border-4 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-4xl">
                    {option === "Just skimming" ? "📖" : "🔬"}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-thin px-8 py-6 text-xl rounded-2xl transition-colors duration-200"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
