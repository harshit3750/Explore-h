// app/page.tsx
"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import NameScreen from "./screens/NameScreen";
import OriginScreen from "./screens/OriginScreen";
import DestinationScreen from "./screens/DestinationScreen";
import VehicleScreen from "./screens/VehicleScreen";
import MapScreen from "./screens/MapScreen";
import WeatherScreen from "./screens/WeatherScreen";
import TripSummaryScreen from "./screens/TripSummaryScreen";

export default function Home() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <NameScreen key="name" onNext={(n) => { setName(n); setStep(2); }} />
      )}
      {step === 2 && (
        <OriginScreen 
          key="origin" 
          name={name}
          onNext={(o) => { setOrigin(o); setStep(3); }} 
        />
      )}
      {step === 3 && (
        <DestinationScreen 
          key="destination" 
          onNext={(d) => { setDestination(d); setStep(4); }} 
        />
      )}
      {step === 4 && (
        <VehicleScreen
          key="vehicle"
          origin={origin}
          destination={destination}
          onNext={(v) => { setVehicle(v); setStep(5); }}
        />
      )}
      {step === 5 && (
        <MapScreen 
          key="map" 
          origin={origin} 
          destination={destination} 
          vehicle={vehicle}
          onNext={(route) => { setSelectedRoute(route); setStep(6); }}
        />
      )}
      {step === 6 && (
        <WeatherScreen
          key="weather"
          origin={origin}
          destination={destination}
          vehicle={vehicle}
          selectedRoute={selectedRoute}
          onNext={(w) => { setWeather(w); setStep(7); }}
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
    </AnimatePresence>
  );
}