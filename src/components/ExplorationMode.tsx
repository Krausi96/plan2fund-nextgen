import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";

interface ExplorationModeProps {
  onAdd: (program: string) => void;
}

export default function ExplorationMode({ onAdd }: ExplorationModeProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <motion.div
      className="mt-10 p-6 bg-white rounded-2xl shadow-md max-w-2xl mx-auto text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2">Didn’t find your program?</h3>
      <p className="text-sm text-gray-600 mb-4">
        Manually add a program you know about and include it in your plan.
      </p>

      <div className="flex items-center gap-3 justify-center">
        <input
          type="text"
          placeholder="Enter program name..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 w-64"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          <PlusCircle size={18} /> Add
        </button>
      </div>
    </motion.div>
  );
}
