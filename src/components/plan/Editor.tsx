"use client"
import { useEffect, useState } from "react"

export default function Editor() {
  const [content, setContent] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("plan-editor")
    if (saved) setContent(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem("plan-editor", content)
  }, [content])

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Business Plan Editor</h2>
      <textarea
        className="w-full h-64 border rounded p-2"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your plan..."
      />
    </div>
  )
}
