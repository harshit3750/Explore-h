// app/screens/VehicleScreen.tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Car, Bike, Footprints } from "lucide-react";

type VehicleOption = "car" | "bike" | "walking";

export default function VehicleScreen({
  origin,
  destination,
  onNext,
}: {
  origin: string;
  destination: string;
  onNext: (vehicle: VehicleOption) => void;
}) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);

  const vehicleOptions = [
    {
      id: "car",
      name: "Car",
      icon: <Car size={32} />,
      description: "Fastest option for longer distances 🚗",
    },
    {
      id: "bike",
      name: "Bike",
      icon: <Bike size={32} />,
      description: "Eco-friendly option for medium distances 🚲",
    },
    {
      id: "walking",
      name: "Walking",
      icon: <Footprints size={32} />,
      description: "Healthiest option for shorter distances 🚶",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      <h1 className="text-8xl font-bold mb-6 ml-18 max-w-4xl">Awesome! ✨</h1>
      <h1 className="text-7xl font-bold mb-6 ml-18 max-w-4xl mt-4">How will you get there?</h1>
      <div className="ml-18 mt-9 max-w-md">
        <div className="mb-6">
          <div className="text-lg text-gray-400 mb-1">From</div>
          <div className="text-white font-medium truncate">{origin}</div>
        </div>
        <div className="mb-8">
          <div className="text-lg text-gray-400 mb-1">To</div>
          <div className="text-white font-medium truncate">{destination}</div>
        </div>
        <div className="space-y-4">
          {vehicleOptions.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedVehicle(vehicle.id as VehicleOption)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedVehicle === vehicle.id
                  ? "border-[#7628DD] bg-[#7628DD]/20"
                  : "border-zinc-700 bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center">
                <div className={`mr-4 text-${selectedVehicle === vehicle.id ? "[#7628DD]" : "white"}`}>
                  {vehicle.icon}
                </div>
                <div>
                  <h3 className="font-medium text-lg">{vehicle.name}</h3>
                  <p className="text-sm text-gray-400">{vehicle.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => selectedVehicle && onNext(selectedVehicle)}
        disabled={!selectedVehicle}
        className="mt-8 px-6 py-3 ml-18 rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Proceed 🚀
      </motion.button>
    </motion.div>
  );
}