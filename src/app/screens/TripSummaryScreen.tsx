"use client";

import { motion } from "framer-motion";
import { Clock, DollarSign, AlertTriangle, MapPin, Download } from "lucide-react";
import { jsPDF } from "jspdf";

interface Route {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  tolls?: number;
  congestion?: string;
  steps?: Array<{
    maneuver: { instruction: string };
    distance: number;
  }>;
}

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
}

export default function TripSummaryScreen({
  name,
  origin,
  destination,
  vehicle,
  selectedRoute,
  weather,
}: {
  name: string;
  origin: string;
  destination: string;
  vehicle: string;
  selectedRoute: Route | null;
  weather: WeatherData | null;
}) {
  const formatDistance = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters.toFixed(0)} m`;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const usdToInr = (usd: number) => (usd * 83).toFixed(2);

  const downloadPDF = () => {
    if (!selectedRoute || !weather) return;

    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(22);
    doc.text(`Trip Summary for ${name}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(16);
    doc.text("Route Details 🗺️", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`From: ${origin}`, 20, yPos);
    yPos += 7;
    doc.text(`To: ${destination}`, 20, yPos);
    yPos += 7;
    doc.text(`Vehicle: ${vehicle}`, 20, yPos);
    yPos += 7;
    doc.text(`Duration: ${formatDuration(selectedRoute.duration)}`, 20, yPos);
    yPos += 7;
    doc.text(`Distance: ${formatDistance(selectedRoute.distance)}`, 20, yPos);
    yPos += 7;
    if (selectedRoute.tolls && selectedRoute.tolls > 0) {
      doc.text(`Estimated Tolls: ₹${usdToInr(selectedRoute.tolls)}`, 20, yPos);
      yPos += 7;
    }
    doc.text(`Congestion: ${selectedRoute.congestion || "Unknown"}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(16);
    doc.text("Navigation Instructions 🧭", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    const steps = selectedRoute.steps || [];
    if (steps.length > 0) {
      steps.forEach((step, index: number) => {
        const instruction = `${index + 1}. ${step.maneuver.instruction} (${formatDistance(step.distance)})`;
        const lines = doc.splitTextToSize(instruction, 170);
        lines.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 7;
        });
      });
    } else {
      doc.text("No navigation instructions available.", 20, yPos);
      yPos += 7;
    }

    yPos += 15;
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.text("Weather at Destination 🌤️", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Condition: ${weather.condition}`, 20, yPos);
    yPos += 7;
    doc.text(`Temperature: ${weather.temperature}°C`, 20, yPos);
    yPos += 7;
    doc.text(`Wind: ${weather.windSpeed} m/s`, 20, yPos);
    yPos += 7;
    doc.text(`Humidity: ${weather.humidity}%`, 20, yPos);

    doc.save(`${name}_Trip_Summary_${origin}_to_${destination}.pdf`);
  };

  if (!selectedRoute || !weather) {
    return <div className="text-white p-4">Loading trip summary...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full space-y-6 px-4 sm:px-0"
    >
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold max-w-4xl">Trip Summary! 🎉</h1>
      <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold max-w-4xl">Ready, {name}?</h2>
      <div className="max-w-md space-y-6">
        <div>
          <div className="text-xl sm:text-2xl font-medium mb-2">Route Details 🗺️</div>
          <div className="space-y-2 text-base sm:text-lg">
            <div>
              <MapPin size={20} className="inline mr-2" /> From: {origin}
            </div>
            <div>
              <MapPin size={20} className="inline mr-2" /> To: {destination}
            </div>
            <div>
              Vehicle: {vehicle}{" "}
              {vehicle === "car" ? "🚗" : vehicle === "bike" ? "🚲" : "🚶"}
            </div>
            <div>
              <Clock size={20} className="inline mr-2" /> ⏰{" "}
              {formatDuration(selectedRoute.duration)}
            </div>
            <div>{formatDistance(selectedRoute.distance)} 📏</div>
            {selectedRoute.tolls && selectedRoute.tolls > 0 && (
              <div>
                <DollarSign size={20} className="inline mr-2" /> 💰 Tolls: ₹
                {usdToInr(selectedRoute.tolls)}
              </div>
            )}
            <div>
              <AlertTriangle size={20} className="inline mr-2" /> 🚦 Congestion:{" "}
              {selectedRoute.congestion || "Unknown"}
            </div>
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-medium mb-2">Weather at Destination 🌤️</div>
          <div className="space-y-2 text-base sm:text-lg">
            <div>
              {weather.condition}{" "}
              {weather.condition === "Clear" ? "☀️" : "☁️"}
            </div>
            <div>{weather.temperature}°C 🌡️</div>
            <div>Wind: {weather.windSpeed} m/s 💨</div>
            <div>Humidity: {weather.humidity}% 💧</div>
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-medium mb-2">Navigation Instructions 🧭</div>
          <div className="space-y-2 text-base sm:text-lg max-h-48 overflow-y-auto">
            {selectedRoute.steps && selectedRoute.steps.length > 0 ? (
              selectedRoute.steps.map((step, index: number) => (
                <div key={index}>
                  {index + 1}. {step.maneuver.instruction} (
                  {formatDistance(step.distance)})
                </div>
              ))
            ) : (
              <div>No navigation instructions available.</div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            className="px-6 py-3 rounded-full bg-[#7628DD] text-white font-semibold flex items-center justify-center"
          >
            <Download size={20} className="mr-2" /> Download PDF 📥
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-full bg-gray-700 text-white font-semibold"
          >
            Plan Another Trip! 🔄
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}