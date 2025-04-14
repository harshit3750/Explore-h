// app/screens/DestinationScreen.tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function DestinationScreen({
  onNext,
}: {
  onNext: (destination: string) => void;
}) {
  const [destination, setDestination] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full space-y-6 px-4 sm:px-0"
    >
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold max-w-4xl">Cool! 🍬</h1>
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold max-w-4xl">Where are you headed?</h1>
      <div className="relative max-w-md">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter your destination"
          className="w-full p-0 bg-transparent border-0 border-b-2 border-zinc-700 focus:border-white text-white placeholder-zinc-500 focus:outline-none text-lg pb-2"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => destination && onNext(destination)}
        disabled={!destination}
        className="mt-6 px-6 py-3 rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Proceed 🚀
      </motion.button>
    </motion.div>
  );
}