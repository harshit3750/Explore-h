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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      <h1 className="text-8xl font-bold mb-6 ml-18 max-w-4xl">Cool! 🍬</h1>
      <h1 className="text-7xl font-bold mb-6 ml-18 max-w-4xl mt-4">Where are you headed?</h1>
      <div className="relative max-w-md ml-18 mt-9">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter your destination"
          className="w-full p-0 bg-transparent border-0 border-b-2 border-zinc-700 focus:border-white text-white placeholder-zinc-500 focus:outline-none text-lg pb-2"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => destination && onNext(destination)}
        disabled={!destination}
        className="mt-6 px-6 py-3 ml-18 rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Proceed 🚀
      </motion.button>
    </motion.div>
  );
}