// app/screens/NameScreen.tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function NameScreen({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full space-y-6 px-4 sm:px-0"
    >
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold max-w-4xl">Heyy User! 👋</h1>
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold max-w-4xl">What should we call you?</h1>
      <div className="relative max-w-md">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-0 bg-transparent border-0 border-b-2 border-zinc-700 focus:border-white text-white placeholder-zinc-500 focus:outline-none text-lg pb-2"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => name && onNext(name)}
        disabled={!name}
        className="mt-6 px-6 py-3 rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Proceed 🚀
      </motion.button>
    </motion.div>
  );
}