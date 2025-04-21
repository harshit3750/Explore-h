"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  tolls?: number;
  congestion?: string;
}

interface GraphNode {
  id: string;
  lat: number;
  lon: number;
}

interface GraphEdge {
  source: string;
  target: string;
  distance: number; // in meters
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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routingMethod, setRoutingMethod] = useState<"osrm" | "dijkstra">("osrm");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const geocode = async (query: string): Promise<LatLngExpression | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { signal: AbortSignal.timeout(5000) } // 5-second timeout
      );
      const data = await response.json();
      return data.length > 0 ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // Haversine formula to calculate distance between two coordinates (in meters)
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch road network graph from Overpass API with optimized query
  const fetchRoadNetwork = async (
    originCoords: LatLngExpression,
    destCoords: LatLngExpression
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> => {
    try {
      // Create a tighter bounding box
      const padding = 0.02; // ~2km in degrees
      const minLat = Math.min(originCoords[0], destCoords[0]) - padding;
      const maxLat = Math.max(originCoords[0], destCoords[0]) + padding;
      const minLon = Math.min(originCoords[1], destCoords[1]) - padding;
      const maxLon = Math.max(originCoords[1], destCoords[1]) + padding;

      const overpassQuery = `
        [out:json][timeout:10];
        (
          way["highway"~"motorway|trunk|primary|secondary"](around:2000,${originCoords[0]},${originCoords[1]});
          way["highway"~"motorway|trunk|primary|secondary"](around:2000,${destCoords[0]},${destCoords[1]});
        );
        out body;
        >;
        out skel qt;
      `;
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
        signal: AbortSignal.timeout(10000), // 10-second timeout
      });
      const data = await response.json();

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      const nodeMap = new Map<string, GraphNode>();

      // Process nodes
      data.elements
        .filter((element: any) => element.type === "node")
        .forEach((node: any) => {
          nodeMap.set(node.id.toString(), {
            id: node.id.toString(),
            lat: node.lat,
            lon: node.lon,
          });
          nodes.push({
            id: node.id.toString(),
            lat: node.lat,
            lon: node.lon,
          });
        });

      // Process ways (roads)
      data.elements
        .filter((element: any) => element.type === "way")
        .forEach((way: any) => {
          for (let i = 0; i < way.nodes.length - 1; i++) {
            const sourceId = way.nodes[i].toString();
            const targetId = way.nodes[i + 1].toString();
            const sourceNode = nodeMap.get(sourceId);
            const targetNode = nodeMap.get(targetId);
            if (sourceNode && targetNode) {
              const distance = haversineDistance(sourceNode.lat, sourceNode.lon, targetNode.lat, targetNode.lon);
              edges.push({
                source: sourceId,
                target: targetId,
                distance,
              });
              edges.push({
                source: targetId,
                target: sourceId,
                distance,
              });
            }
          }
        });

      return { nodes, edges };
    } catch (error) {
      console.error("Error fetching road network:", error);
      return { nodes: [], edges: [] };
    }
  };

  // Dijkstra's algorithm implementation
  const dijkstra = (
    nodes: GraphNode[],
    edges: GraphEdge[],
    startNodeId: string,
    endNodeId: string
  ): { path: string[]; distance: number } => {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>(nodes.map((node) => node.id));

    // Initialize distances
    nodes.forEach((node) => {
      distances.set(node.id, Infinity);
    });
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let minDistance = Infinity;
      let currentNodeId: string | null = null;
      for (const nodeId of unvisited) {
        if (distances.get(nodeId)! < minDistance) {
          minDistance = distances.get(nodeId)!;
          currentNodeId = nodeId;
        }
      }

      if (currentNodeId === null || currentNodeId === endNodeId) break;

      unvisited.delete(currentNodeId);

      // Get neighbors
      const neighbors = edges.filter((edge) => edge.source === currentNodeId);
      for (const edge of neighbors) {
        const neighborId = edge.target;
        if (unvisited.has(neighborId)) {
          const newDistance = distances.get(currentNodeId)! + edge.distance;
          if (newDistance < distances.get(neighborId)!) {
            distances.set(neighborId, newDistance);
            previous.set(neighborId, currentNodeId);
          }
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let currentNodeId: string | null = endNodeId;
    while (currentNodeId !== null) {
      path.unshift(currentNodeId);
      currentNodeId = previous.get(currentNodeId) || null;
      if (currentNodeId === startNodeId) {
        path.unshift(startNodeId);
        break;
      }
    }

    return {
      path,
      distance: distances.get(endNodeId) || Infinity,
    };
  };

  // Find nearest node in the graph to a given coordinate
  const findNearestNode = (coords: LatLngExpression, nodes: GraphNode[]): string | null => {
    let minDistance = Infinity;
    let nearestNodeId: string | null = null;
    nodes.forEach((node) => {
      const distance = haversineDistance(coords[0], coords[1], node.lat, node.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNodeId = node.id;
      }
    });
    return nearestNodeId;
  };

  // Fallback route if Dijkstra fails
  const createFallbackRoute = (
    originCoords: LatLngExpression,
    destCoords: LatLngExpression
  ): Route => {
    const distance = haversineDistance(originCoords[0], originCoords[1], destCoords[0], destCoords[1]);
    const duration = (distance / 1000 / 40) * 3600; // Assume 40 km/h
    return {
      distance,
      duration,
      geometry: {
        coordinates: [
          [originCoords[1], originCoords[0]],
          [destCoords[1], destCoords[0]],
        ],
      },
      tolls: 0,
      congestion: "unknown",
    };
  };

  // Real Dijkstra's algorithm routing
  const getDijkstraRoute = async (
    originCoords: LatLngExpression,
    destCoords: LatLngExpression
  ): Promise<Route[]> => {
    try {
      console.log("Fetching road network...");
      const { nodes, edges } = await fetchRoadNetwork(originCoords, destCoords);
      if (nodes.length === 0 || edges.length === 0) {
        throw new Error("No road network data available");
      }
      console.log(`Fetched ${nodes.length} nodes and ${edges.length} edges`);

      console.log("Finding nearest nodes...");
      const startNodeId = findNearestNode(originCoords, nodes);
      const endNodeId = findNearestNode(destCoords, nodes);
      if (!startNodeId || !endNodeId) {
        throw new Error("Could not find nearest nodes");
      }
      console.log(`Start node: ${startNodeId}, End node: ${endNodeId}`);

      console.log("Running Dijkstra's algorithm...");
      const { path, distance } = dijkstra(nodes, edges, startNodeId, endNodeId);
      if (path.length === 0 || distance === Infinity) {
        throw new Error("No path found");
      }
      console.log(`Path found with ${path.length} nodes, distance: ${distance}m`);

      // Convert path to coordinates
      const coordinates: [number, number][] = path
        .map((nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          return node ? [node.lon, node.lat] : null;
        })
        .filter((coord): coord is [number, number] => coord !== null);

      // Estimate duration (assuming average speed of 40 km/h)
      const averageSpeedKmh = 40;
      const duration = (distance / 1000 / averageSpeedKmh) * 3600; // seconds

      const route: Route = {
        distance,
        duration,
        geometry: {
          coordinates,
        },
        tolls: 0,
        congestion: "low",
      };

      return [route];
    } catch (error) {
      console.error("Dijkstra routing error:", error);
      // setErrorMessage("The Route for your destination will be as follows");
      return [createFallbackRoute(originCoords, destCoords)];
    }
  };

  const handleSearch = useCallback(
    async (mapInstance: L.Map, L: typeof import("leaflet")) => {
      setIsLoading(true);
      setRoutes([]);
      setErrorMessage(null);

      try {
        console.log("Geocoding origin and destination...");
        const originCoords = await geocode(origin);
        const destCoords = await geocode(destination);

        if (originCoords && destCoords) {
          console.log("Clearing existing map layers...");
          mapInstance.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
              mapInstance.removeLayer(layer);
            }
          });

          console.log("Adding markers...");
          L.marker(originCoords).addTo(mapInstance).bindPopup("Origin").openPopup();
          L.marker(destCoords).addTo(mapInstance).bindPopup("Destination");

          console.log("Fitting map bounds...");
          const bounds = L.latLngBounds([originCoords, destCoords]);
          mapInstance.fitBounds(bounds, { padding: [50, 50] });

          let enhancedRoutes: Route[] = [];
          if (routingMethod === "osrm") {
            console.log("Fetching OSRM routes...");
            const routeResponse = await fetch(
              `http://router.project-osrm.org/route/v1/${vehicle}/${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson&alternatives=true&steps=true`,
              { signal: AbortSignal.timeout(10000) } // 10-second timeout
            );
            const routeData = await routeResponse.json();

            if (routeData.routes && routeData.routes.length > 0) {
              enhancedRoutes = routeData.routes.map((route: Route, index: number) => ({
                ...route,
                tolls: route.distance > 10000 ? (route.distance / 10000) * (index + 1) : 0,
                congestion: index === 0 ? "low" : index === 1 ? "medium" : "high",
              }));
            } else {
              throw new Error("No OSRM routes found");
            }
          } else {
            console.log("Computing Dijkstra route...");
            enhancedRoutes = await getDijkstraRoute(originCoords, destCoords);
          }

          if (enhancedRoutes.length > 0) {
            console.log("Displaying routes...");
            setRoutes(enhancedRoutes);
            displayRoute(enhancedRoutes[0], L, 0, mapInstance);
          } else {
            throw new Error("No routes available");
          }
        } else {
          throw new Error("Geocoding failed");
        }
      } catch (error) {
        console.error("Routing error:", error);
        setErrorMessage("Failed to find routes. Please try again.");
      } finally {
        console.log("Resetting loading state...");
        setIsLoading(false);
      }
    },
    [origin, destination, vehicle, routingMethod]
  );

  const displayRoute = (route: Route, L: typeof import("leaflet"), index: number, mapInstance: L.Map) => {
    if (routeLayerRef.current) {
      mapInstance.removeLayer(routeLayerRef.current);
    }

    const routeCoords = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] as LatLngExpression
    );

    routeLayerRef.current = L.polyline(routeCoords, {
      color: index === 0 ? "#00bcd4" : index === 1 ? "#4caf50" : "#ff9800",
      weight: index === selectedRouteIndex ? 6 : 4,
      opacity: index === selectedRouteIndex ? 1 : 0.7,
      dashArray: index === selectedRouteIndex ? undefined : "5, 10",
    }).addTo(mapInstance);

    setSelectedRouteIndex(index);
  };

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
          center: [51.505, -0.09] as LatLngExpression,
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
  }, [origin, destination, vehicle, handleSearch]);

  const formatDistance = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters.toFixed(0)} m`;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const usdToInr = (usd: number) => (usd * 83).toFixed(2);

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
        className="relative z-10 p-4 sm:p-6 md:p-8"
      >
        <div className="bg-black bg-opacity-70 p-4 rounded-lg max-w-md mx-auto sm:mx-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Your {vehicle} routes from {origin} to {destination} 🗺️
          </h2>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mb-4"
            >
              {errorMessage}
            </motion.div>
          )}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Routing Method</label>
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRoutingMethod("osrm")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  routingMethod === "osrm" ? "bg-[#7628DD] text-white" : "bg-gray-800 text-gray-400"
                }`}
              >
                OSRM (Fastest)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRoutingMethod("dijkstra")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  routingMethod === "dijkstra" ? "bg-[#7628DD] text-white" : "bg-gray-800 text-gray-400"
                }`}
              >
                Dijkstra (Shortest)
              </motion.button>
            </div>
          </div>
          <AnimatePresence>
            {routes.map((route, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectRoute(index)}
                className={`p-4 mb-2 rounded-lg cursor-pointer ${
                  selectedRouteIndex === index ? "bg-gray-900" : "bg-gray-800/50"
                }`}
              >
                <div className="flex items-center mb-2">
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${
                      index === 0 ? "bg-cyan-400" : index === 1 ? "bg-green-400" : "bg-orange-400"
                    }`}
                  />
                  <span className="font-medium text-base sm:text-lg">
                    {routingMethod === "dijkstra"
                      ? "Shortest Route"
                      : index === 0
                      ? "Fastest Route"
                      : `Alternative ${index + 1}`}
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
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNext(routes[selectedRouteIndex])}
            disabled={routes.length === 0}
            className="mt-4 px-6 py-3 w-full rounded-full bg-[#7628DD] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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