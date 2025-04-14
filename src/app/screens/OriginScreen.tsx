// app/screens/OriginScreen.tsx
"use client"

import { motion } from "framer-motion";
import { useState } from "react";
import { MapPin } from "lucide-react";

export default function OriginScreen({
  name,
  onNext,
}: {
  name: string;
  onNext: (origin: string) => void;
}) {
  const [origin, setOrigin] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          setOrigin(data.display_name);
          setIsLoadingLocation(false);
        } catch (error) {
          console.error("Geolocation error:", error);
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full space-y-6 px-4 sm:px-0"
    >
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold max-w-4xl">So {name}, 🌟</h1>
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold max-w-4xl">Where are you starting from?</h1>
      <div className="relative max-w-md">
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Enter your location"
          className="w-full p-0 bg-transparent border-0 border-b-2 border-zinc-700 focus:border-white text-white placeholder-zinc-500 focus:outline-none text-lg pb-2"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={getCurrentLocation}
        disabled={isLoadingLocation}
        className="mt-4 flex items-center text-[#7628DD] font-semibold"
      >
        <MapPin size={18} className="mr-2" />
        {isLoadingLocation ? "Getting location... 📍" : "Use current location 📍"}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => origin && onNext(origin)}
        disabled={!origin}
        className="mt-6 px-6 py-3 rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Proceed 🚀
      </motion.button>
    </motion.div>
  );
}