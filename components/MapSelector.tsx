import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { LocateIcon } from './icons/LocateIcon';
import { Button } from './ui/Button';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

// Fix for default Leaflet icon path issues in module environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapSelectorProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lon: number) => void;
  onAreaChange: (area: number) => void;
}

type MessageType = 'info' | 'success' | 'error';

const MapSelector: React.FC<MapSelectorProps> = ({ latitude, longitude, onLocationChange, onAreaChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const isDrawingRef = useRef(false);

  const [isLocating, setIsLocating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const [mapMessage, setMapMessage] = useState<{text: string, type: MessageType}>({text: 'Use the map to find your property.', type: 'info'});

  useEffect(() => {
    isDrawingRef.current = isDrawing;
    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      if (isDrawing) {
        mapContainer.classList.add('drawing-active');
      } else {
        mapContainer.classList.remove('drawing-active');
      }
    }
  }, [isDrawing]);

  const calculateArea = (latlngs: L.LatLng[]) => {
    if (latlngs.length < 3) return 0;
    const projectedPoints = latlngs.map(latlng => L.CRS.EPSG3857.project(latlng));
    let area = 0;
    for (let i = 0, j = projectedPoints.length - 1; i < projectedPoints.length; j = i++) {
        const p1 = projectedPoints[i];
        const p2 = projectedPoints[j];
        area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area / 2);
  };

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
      if (isDrawingRef.current) {
          setPoints(prevPoints => {
              if (prevPoints.length >= 4) return prevPoints;
              
              const newPoint = e.latlng;
              const newMarker = L.marker(newPoint).addTo(mapInstanceRef.current!);
              markersRef.current.push(newMarker);
              
              return [...prevPoints, newPoint];
          });
      }
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([latitude, longitude], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      map.on('click', handleMapClick);
      mapInstanceRef.current = map;
    }
  }, [latitude, longitude, handleMapClick]);
  
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Update map view when props change (e.g., after geolocation)
      map.setView([latitude, longitude], map.getZoom() < 16 ? 18 : map.getZoom());

  }, [latitude, longitude]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
    }
    
    if(points.length > 1) {
        const newPolygon = L.polygon(points, { color: 'blue' }).addTo(map);
        polygonRef.current = newPolygon;
    }

    if (points.length < 4) {
        if (isDrawing) {
            setMapMessage({text: `Click corner ${points.length + 1}...`, type: 'info'});
        }
    } else {
        setIsDrawing(false);
        const area = calculateArea(points);
        onAreaChange(area);
        setMapMessage({text: `Area selected: ${area.toFixed(2)} m². You can now proceed.`, type: 'success'});
    }

  }, [points, onAreaChange, isDrawing]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      setMapMessage({text: 'Getting your location...', type: 'info'});
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange(
            parseFloat(position.coords.latitude.toFixed(4)),
            parseFloat(position.coords.longitude.toFixed(4))
          );
          setIsLocating(false);
          setMapMessage({text: 'Location found! You can now draw your roof area.', type: 'success'});
        },
        (error) => {
          let errorMessage = "Could not retrieve your location.";
          switch(error.code) {
              case error.PERMISSION_DENIED:
                  errorMessage = "Location access was denied. Please enable it in your browser settings.";
                  break;
              case error.POSITION_UNAVAILABLE:
                  errorMessage = "Location information is currently unavailable.";
                  break;
              case error.TIMEOUT:
                  errorMessage = "Request for location timed out.";
                  break;
          }
          console.error("Geolocation failed:", error.message);
          setMapMessage({text: errorMessage, type: 'error'});
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setMapMessage({text: "Geolocation is not supported by this browser.", type: 'error'});
    }
  };
  
  const handleStartDrawing = () => {
      handleClearDrawing();
      setIsDrawing(true);
      setMapMessage({text: 'Click the first corner of your roof...', type: 'info'});
  };

  const handleClearDrawing = () => {
    setPoints([]);
    onAreaChange(0);
    setIsDrawing(false);

    if (polygonRef.current) {
        mapInstanceRef.current?.removeLayer(polygonRef.current);
        polygonRef.current = null;
    }
    markersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker));
    markersRef.current = [];
    setMapMessage({text: 'Selection cleared. Find your location or start drawing again.', type: 'info'});
  };

  const messageStyles: Record<MessageType, string> = {
      info: 'bg-white text-gray-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-inner relative">
        <div ref={mapContainerRef} className="leaflet-container" />
        <div className="absolute top-6 right-6 z-[401] flex flex-col gap-2">
            <Button variant="icon" onClick={handleLocateMe} disabled={isLocating} title="Use My Location">
                {isLocating ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div> : <LocateIcon className="w-5 h-5"/>}
            </Button>
            <Button variant="icon" onClick={handleStartDrawing} disabled={isDrawing} title="Start Drawing Area">
                <PencilIcon className="w-5 h-5" />
            </Button>
             <Button variant="icon" onClick={handleClearDrawing} title="Clear & Redraw">
                <TrashIcon className="w-5 h-5" />
            </Button>
        </div>
        <div className={`bg-opacity-90 p-2 mt-2 rounded-md text-center text-sm font-semibold transition-colors duration-300 ${messageStyles[mapMessage.type]}`}>
            <p>{mapMessage.text}</p>
        </div>
    </div>
  );
};

export default MapSelector;