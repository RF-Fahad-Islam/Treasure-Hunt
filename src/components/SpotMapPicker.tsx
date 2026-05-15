import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number | null;
  lng: number | null;
  radius: number | null;
  onChange: (lat: number, lng: number) => void;
}

const pickerIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--color-brand-blue);border:3px solid white;box-shadow:0 0 14px rgba(28,176,246,0.6);font-size:16px;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function DraggableMarker({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const handler = () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    };
    marker.on("dragend", handler);
    return () => { marker.off("dragend", handler); };
  }, [onChange]);

  return (
    // @ts-ignore
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={pickerIcon}
      draggable={true}
    />
  );
}

export function SpotMapPicker({ lat, lng, radius, onChange }: Props) {
  const center: [number, number] = lat && lng ? [lat, lng] : [23.8103, 90.4125];
  const hasPosition = lat !== null && lng !== null;

  return (
    <div style={{ height: "320px", borderRadius: "24px", overflow: "hidden", border: "3px solid var(--border-soft)" }}>
      {/* @ts-ignore */}
      <MapContainer
        center={center}
        zoom={hasPosition ? 16 : 14}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {hasPosition && (
          <>
            <DraggableMarker lat={lat} lng={lng} onChange={onChange} />
            {radius && radius > 0 && (
              // @ts-ignore
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color: "var(--color-brand-blue)",
                  fillColor: "var(--color-brand-blue)",
                  fillOpacity: 0.1,
                  weight: 2,
                  opacity: 0.5,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
