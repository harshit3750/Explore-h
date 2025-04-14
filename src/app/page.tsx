// app/page.tsx
"use client";

import { useState } from "react";
import NameScreen from "./screens/NameScreen";
import OriginScreen from "./screens/OriginScreen";
import DestinationScreen from "./screens/DestinationScreen";
import VehicleScreen from "./screens/VehicleScreen";
import MapScreen from "./screens/MapScreen";
import WeatherScreen from "./screens/WeatherScreen";
import TripSummaryScreen from "./screens/TripSummaryScreen";

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

export default function Home() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {step === 1 && (
          <NameScreen key="name" onNext={(n: string) => { setName(n); setStep(2); }} />
        )}
        {step === 2 && (
          <OriginScreen 
            key="origin" 
            name={name}
            onNext={(o: string) => { setOrigin(o); setStep(3); }} 
          />
        )}
        {step === 3 && (
          <DestinationScreen 
            key="destination" 
            onNext={(d: string) => { setDestination(d); setStep(4); }} 
          />
        )}
        {step === 4 && (
          <VehicleScreen
            key="vehicle"
            origin={origin}
            destination={destination}
            onNext={(v: string) => { setVehicle(v); setStep(5); }}
          />
        )}
        {step === 5 && (
          <MapScreen 
            key="map" 
            origin={origin} 
            destination={destination} 
            vehicle={vehicle}
            onNext={(route: Route) => { setSelectedRoute(route); setStep(6); }}
          />
        )}
        {step === 6 && (
          <WeatherScreen
            key="weather"
            destination={destination}
            vehicle={vehicle}
            onNext={(w: WeatherData) => { setWeather(w); setStep(7); }}
          />
        )}
        {step === 7 && (
          <TripSummaryScreen
            key="summary"
            name={name}
            origin={origin}
            destination={destination}
            vehicle={vehicle}
            selectedRoute={selectedRoute}
            weather={weather}
          />
        )}
      </div>
    </div>
  );
}