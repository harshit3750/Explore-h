"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

export default function DestinationScreen({
  onNext,
}: {
  onNext: (destination: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample list of popular destinations (replace with API call in production)
  const popularDestinations = [
    "New York, NY, USA",
    "London, UK",
    "Paris, France",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Mumbai, India",
    "Cape Town, South Africa",
    "Rio de Janeiro, Brazil",
  ];

  // Filter suggestions based on input
  useEffect(() => {
    if (destination.trim() && isFocused) {
      const filtered = popularDestinations.filter((place) =>
        place.toLowerCase().includes(destination.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [destination, isFocused]);

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setDestination(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Validate and proceed
  const handleProceed = () => {
    const trimmedDestination = destination.trim();
    if (trimmedDestination.length >= 2) {
      onNext(trimmedDestination);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      <h1 className="text-8xl font-bold mb-6 ml-18 max-w-4xl">Cool! 🍬</h1>
      <h1 className="text-7xl font-bold mb-6 ml-18 max-w-4xl mt-4">
        Where are you headed?
      </h1>
      <div className="relative max-w-md ml-18 mt-9">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500"
          />
          <input
            ref={inputRef}
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter your destination"
            aria-label="Destination input"
            className="w-full pl-10 pr-4 py-2 bg-transparent border-0 border-b-2 border-zinc-700 focus:border-[#7628DD] text-white placeholder-zinc-500 focus:outline-none text-lg transition-colors duration-200"
          />
        </div>
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-10 w-full bg-gray-900 rounded-lg mt-2 max-h-60 overflow-y-auto shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 text-white hover:bg-gray-800 cursor-pointer text-sm"
              >
                {suggestion}
              </li>
            ))}
          </motion.ul>
        )}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleProceed}
        disabled={destination.trim().length < 2}
        aria-label="Proceed to next step"
        className="mt-6 px-6 py-3 ml-18 rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
      >
        Proceed 🚀
      </motion.button>
    </motion.div>
  );
}