// app/screens/MapScreen.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Clock, DollarSign, AlertTriangle } from "lucide-react";
import "leaflet/dist/leaflet.css";

type LatLngExpression = [number, number];

interface Route {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  tolls?: number; // Estimated toll cost in USD
  congestion?: string; // Congestion level: "low", "medium", "high"
}

export default function MapScreen({
  origin,
  destination,
  vehicle,
  onNext,
}: {
  origin: string;
  destination: string;
  vehicle: string;
  onNext: (selectedRoute: Route) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const routeLayerRef = useRef<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      const L = await import("leaflet");
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (mapRef.current && mounted) {
        const mapInstance = L.map(mapRef.current, {
          center: [51.505, -0.09],
          zoom: 13,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(mapInstance);

        mapInstanceRef.current = mapInstance;
        handleSearch(mapInstance, L);
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origin, destination, vehicle]);

  const geocode = async (query: string): Promise<LatLngExpression | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      const data = await response.json();
      return data.length > 0 ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleSearch = async (mapInstance: any, L: any) => {
    setIsLoading(true);
    setRoutes([]);

    try {
      const originCoords = await geocode(origin);
      const destCoords = await geocode(destination);

      if (originCoords && destCoords) {
        mapInstance.eachLayer((layer: any) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapInstance.removeLayer(layer);
          }
        });

        L.marker(originCoords).addTo(mapInstance).bindPopup("Origin").openPopup();
        L.marker(destCoords).addTo(mapInstance).bindPopup("Destination");

        const bounds = L.latLngBounds([originCoords, destCoords]);
        mapInstance.fitBounds(bounds, { padding: [50, 50] });

        const routeResponse = await fetch(
          `http://router.project-osrm.org/route/v1/${vehicle}/${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson&alternatives=true&steps=true`
        );
        const routeData = await routeResponse.json();

        if (routeData.routes && routeData.routes.length > 0) {
          const enhancedRoutes = routeData.routes.map((route: Route, index: number) => ({
            ...route,
            tolls: route.distance > 10000 ? (route.distance / 10000) * (index + 1) : 0,
            congestion: index === 0 ? "low" : index === 1 ? "medium" : "high",
          }));
          setRoutes(enhancedRoutes);
          displayRoute(enhancedRoutes[0], L, 0, mapInstance);
        }
      }
    } catch (error) {
      console.error("Routing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayRoute = (route: Route, L: any, index: number, mapInstance: any) => {
    if (routeLayerRef.current) {
      mapInstance.removeLayer(routeLayerRef.current);
    }

    const routeCoords = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    routeLayerRef.current = L.polyline(routeCoords, {
      color: index === 0 ? "#00bcd4" : index === 1 ? "#4caf50" : "#ff9800",
      weight: index === selectedRouteIndex ? 6 : 4,
      opacity: index === selectedRouteIndex ? 1 : 0.7,
      dashArray: index === selectedRouteIndex ? null : "5, 10",
    }).addTo(mapInstance);

    setSelectedRouteIndex(index);
  };

  const formatDistance = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters.toFixed(0)} m`;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const usdToInr = (usd: number) => (usd * 83).toFixed(2); // Assuming 1 USD = 83 INR

  const handleSelectRoute = async (index: number) => {
    if (routes[index] && mapInstanceRef.current) {
      const L = await import("leaflet");
      displayRoute(routes[index], L, index, mapInstanceRef.current);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen relative"
    >
      <div ref={mapRef} className="absolute inset-0 w-full h-full z-0 bg-black" />
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-4 ml-18"
      >
        <div className="bg-black bg-opacity-70 p-4 rounded-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4">
            Your {vehicle} routes from {origin} to {destination} 🗺️
          </h2>
          {routes.map((route, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelectRoute(index)}
              className={`p-4 mb-2 rounded-lg cursor-pointer ${
                selectedRouteIndex === index ? "bg-gray-900" : "bg-gray-800/50"
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  index === 0 ? "bg-cyan-400" : index === 1 ? "bg-green-400" : "bg-orange-400"
                }`}></div>
                <span className="font-medium text-lg">
                  {index === 0 ? "Fastest Route" : `Alternative ${index + 1}`}
                </span>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>
                  <Clock size={14} className="inline mr-2" /> ⏰
                  <span>{formatDuration(route.duration)}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDistance(route.distance)}</span> 📏
                </div>
                {route.tolls !== undefined && route.tolls > 0 && (
                  <div>
                    <DollarSign size={14} className="inline mr-2" /> 💰
                    <span>Est. Tolls: ₹{usdToInr(route.tolls)}</span>
                  </div>
                )}
                {route.congestion && (
                  <div className="flex items-center">
                    <AlertTriangle size={14} className="inline mr-2" /> 🚦
                    <span>Congestion: {route.congestion}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNext(routes[selectedRouteIndex])}
            className="mt-4 px-6 py-3 w-full rounded-full bg-[#7628DD] text-white font-semibold"
          >
            Check Weather 🌤️
          </motion.button>
        </div>
      </motion.div>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-gray-900 p-6 rounded-lg flex items-center">
            <Loader2 className="h-8 w-8 text-[#7628DD] animate-spin mr-4" />
            <span>Finding routes... 🔍</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}