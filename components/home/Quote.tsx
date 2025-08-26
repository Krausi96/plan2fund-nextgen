"use client";

import { useState, useEffect } from "react";

const phrases = [
  "Shaping your idea into reality...",
  "Applying for funding with confidence...",
  "Preparing a visa with a solid plan...",
];

export default function Quote() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (displayed.length < phrases[index].length) {
      timeout = setTimeout(() => {
        setDisplayed(phrases[index].slice(0, displayed.length + 1));
      }, 50);
    } else {
      timeout = setTimeout(() => {
        setIndex((index + 1) % phrases.length);
        setDisplayed("");
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [displayed, index]);

  return (
    <div className="text-center py-12 bg-gray-50">
      <p className="text-xl italic max-w-2xl mx-auto text-gray-700 h-8">
        {displayed}
      </p>
    </div>
  );
}
