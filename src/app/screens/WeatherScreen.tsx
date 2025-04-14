// app/screens/WeatherScreen.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sun, CloudRain, Cloud, Thermometer, Wind } from "lucide-react";

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
}

export default function WeatherScreen({
  destination,
  vehicle,
  onNext,
}: {
  destination: string;
  vehicle: string;
  onNext: (weather: WeatherData) => void;
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`
        );
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData || geocodeData.length === 0) {
          throw new Error("Could not geocode destination");
        }

        const lat = geocodeData[0].lat;
        const lon = geocodeData[0].lon;

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weathercode,wind_speed_10m`
        );
        const weatherData = await weatherResponse.json();

        if (weatherData.current) {
          const weatherCode = weatherData.current.weathercode;
          const condition = mapWeatherCodeToCondition(weatherCode);

          setWeather({
            temperature: weatherData.current.temperature_2m ?? 25,
            condition: condition ?? "Clear",
            windSpeed: weatherData.current.wind_speed_10m ?? 5,
            humidity: weatherData.current.relative_humidity_2m ?? 60,
          });
        } else {
          throw new Error("Weather data not found");
        }
      } catch (error) {
        console.error("Weather fetch error:", error);
        setWeather({
          temperature: 25,
          condition: "Clear",
          windSpeed: 5,
          humidity: 60,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [destination]);

  const mapWeatherCodeToCondition = (code: number): string => {
    switch (code) {
      case 0:
        return "Clear";
      case 1:
      case 2:
      case 3:
        return "Clouds";
      case 51:
      case 53:
      case 55:
      case 61:
      case 63:
      case 65:
        return "Rain";
      default:
        return "Clouds";
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun size={32} />;
      case "rain":
        return <CloudRain size={32} />;
      default:
        return <Cloud size={32} />;
    }
  };

  const getTravelAdvice = () => {
    if (!weather) return "";
    if (weather.condition.toLowerCase() === "rain" && vehicle === "bike") {
      return "Consider a raincoat or switching to a car! ☔";
    }
    if (weather.windSpeed > 10 && vehicle === "walking") {
      return "It might be windy, hold onto your hat! 🌬️";
    }
    return "Looks like a great day for your trip! 🌞";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full space-y-6 px-4 sm:px-0"
    >
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold max-w-4xl">Weather Check! 🌈</h1>
      <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold max-w-4xl">At {destination}</h2>
      <div className="max-w-md">
        {isLoading ? (
          <div className="text-center">Loading weather... ⏳</div>
        ) : (
          weather && (
            <div className="space-y-6">
              <div className="flex items-center">
                {getWeatherIcon(weather.condition)}
                <div className="ml-4">
                  <div className="text-xl sm:text-2xl font-medium">{weather.condition}</div>
                  <div className="text-3xl sm:text-4xl">{weather.temperature}°C 🌡️</div>
                </div>
              </div>
              <div className="text-base sm:text-lg">
                <Wind size={20} className="inline mr-2" /> Wind: {weather.windSpeed} m/s
              </div>
              <div className="text-base sm:text-lg">
                <Thermometer size={20} className="inline mr-2" /> Humidity: {weather.humidity}%
              </div>
              <div className="text-base sm:text-lg text-[#7628DD] font-medium">
                Travel Tip: {getTravelAdvice()}
              </div>
            </div>
          )
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => weather && onNext(weather)}
          disabled={!weather}
          className="mt-8 px-6 py-3 w-full rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50"
        >
          View Trip Summary 📋
        </motion.button>
      </div>
    </motion.div>
  );
}