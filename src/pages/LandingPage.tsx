import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-6">Plan2Fund NextGen</h1>
      <p className="text-gray-600 mb-8">Choose your path to success</p>
      <div className="space-x-4">
        <button
          onClick={() => navigate("/reco")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Find Funding
        </button>
        <button
          onClick={() => navigate("/plan")}
          className="px-6 py-3 bg-green-600 text-white rounded-lg"
        >
          Generate Plan
        </button>
      </div>
    </div>
  );
}
