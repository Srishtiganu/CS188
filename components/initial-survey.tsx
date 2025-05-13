"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface SurveyProps {
  onSubmit: (preferences: { familiarity: string; goal: string }) => void
}

export default function InitialSurvey({ onSubmit }: SurveyProps) {
  const [familiarity, setFamiliarity] = useState(1) // 0-3 scale
  const [goal, setGoal] = useState("Just skimming")

  const familiarityLabels = ["Not at all", "A little", "Somewhat", "Very Familiar"]
  const goalOptions = [
    "Just skimming",
    "Trying to understand key ideas",
    "Deep dive into mathematical details",
    "Reading to reproduce results",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      familiarity: familiarityLabels[familiarity],
      goal,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-6">Before we start</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Familiarity Slider */}
          <div className="space-y-4">
            <label className="text-sm font-medium block">How familiar are you with this topic?</label>

            <div className="pt-4">
              <Slider
                value={[familiarity]}
                min={0}
                max={3}
                step={1}
                onValueChange={(value) => setFamiliarity(value[0])}
                className="mb-6"
              />

              <div className="flex justify-between text-xs text-gray-500">
                {familiarityLabels.map((label, index) => (
                  <div
                    key={label}
                    className={`text-center ${index === familiarity ? "font-bold text-blue-600" : ""}`}
                    style={{ width: "25%" }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Goal Radio Buttons */}
          <div className="space-y-4">
            <label className="text-sm font-medium block">What is your goal regarding this paper?</label>

            <div className="space-y-3 pt-2">
              {goalOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={option.replace(/\s+/g, "-").toLowerCase()}
                    name="goal"
                    value={option}
                    checked={goal === option}
                    onChange={(e) => setGoal(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={option.replace(/\s+/g, "-").toLowerCase()} className="ml-2 block text-sm">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </div>
    </div>
  )
}
