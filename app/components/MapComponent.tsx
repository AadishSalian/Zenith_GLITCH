"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Location } from "./SpaceTrackerContext";

// Fix default icon issue with Next.js/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapProps {
  activeLocation: Location;
  setActiveLocation: (loc: Location) => void;
}

const LocationMarker = ({ activeLocation, setActiveLocation }: MapProps) => {
  const map = useMapEvents({
    click(e) {
      setActiveLocation({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
        label: "Custom Map Coordinates",
      });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.flyTo([activeLocation.lat, activeLocation.lng], map.getZoom());
  }, [activeLocation.lat, activeLocation.lng, map]);

  return (
    <Marker position={[activeLocation.lat, activeLocation.lng]} />
  );
};

const MapComponent: React.FC<MapProps> = ({ activeLocation, setActiveLocation }) => {
  return (
    <MapContainer 
      center={[activeLocation.lat, activeLocation.lng]} 
      zoom={3} 
      style={{ height: "100%", width: "100%", background: "#050b18" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <LocationMarker activeLocation={activeLocation} setActiveLocation={setActiveLocation} />
    </MapContainer>
  );
};

export default MapComponent;
