// src/components/Map.tsx
"use client";

import { useEffect, useState } from 'react';
import { GoogleMap, useLoadScript, Polyline, Marker } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '100%' };

interface MapProps {
  pickupCoords: { lat: number; lng: number } | null;
  dropoffCoords: { lat: number; lng: number } | null;
  waypoints?: { lat: number; lng: number }[];
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export default function Map({ pickupCoords, dropoffCoords, waypoints = [], onMapClick }: MapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // NYC Default

  useEffect(() => {
    if (mapRef && pickupCoords) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(pickupCoords);
      if (dropoffCoords) bounds.extend(dropoffCoords);
      waypoints.forEach(wp => bounds.extend(wp));
      
      mapRef.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(mapRef, "idle", function() { 
        if (mapRef.getZoom()! > 16) mapRef.setZoom(16); 
        window.google.maps.event.removeListener(listener); 
      });
    }
  }, [mapRef, pickupCoords, dropoffCoords, waypoints]);

  if (!isLoaded) return <div className="flex items-center justify-center h-full bg-gray-100">Loading Map...</div>;

  // Combine all points into one path for the Polyline
  const fullPath = [pickupCoords, ...waypoints, dropoffCoords].filter(Boolean) as google.maps.LatLngLiteral[];

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={pickupCoords || defaultCenter}
      zoom={13}
      onLoad={(map) => setMapRef(map)}
      onClick={(e) => {
        if (e.latLng && onMapClick) onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }}
      // Notice we removed the 'styles' property here so it defaults to full color!
      options={{ 
        disableDefaultUI: true, 
        zoomControl: true, 
        draggableCursor: 'crosshair' 
      }}
    >
      {fullPath.length > 1 && (
        <Polyline path={fullPath} options={{ strokeColor: "#2563EB", strokeOpacity: 0.8, strokeWeight: 5, geodesic: true }} />
      )}
      {pickupCoords && <Marker position={pickupCoords} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />}
      {waypoints.map((wp, i) => (
        <Marker key={i} position={wp} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png' }} />
      ))}
      {dropoffCoords && <Marker position={dropoffCoords} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />}
    </GoogleMap>
  );
}