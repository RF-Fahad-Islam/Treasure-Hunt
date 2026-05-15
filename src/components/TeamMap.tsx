import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/types";

export interface MapTeam {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isDisqualified: boolean;
  capturedAt: string;
}

interface Props {
  teams: MapTeam[];
  spots?: Spot[];
  pathTeamId?: string | null;
  pathPoints?: [number, number][] | null;
  height?: string;
  myLocation?: { lat: number; lng: number } | null;
}

const activeIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 0 6px rgba(34,197,94,0.6);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const inactiveIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#9ca3af;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.2);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const disqualifiedIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 0 6px rgba(239,68,68,0.6);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const spotIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#1CB0F6;border:3px solid white;box-shadow:0 0 10px rgba(28,176,246,0.4);font-size:12px;">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const youAreHereIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:20px;height:20px;"><div style="position:absolute;inset:0;border-radius:50%;background:#1CB0F6;border:3px solid white;box-shadow:0 0 12px rgba(28,176,246,0.7);animation:pulse-dot 2s ease-in-out infinite;"></div><div style="position:absolute;top:-6px;left:-6px;width:32px;height:32px;border-radius:50%;background:rgba(28,176,246,0.15);animation:pulse-ring 2s ease-in-out infinite;"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function BoundsUpdater({ teams, spots, myLocation }: { teams: MapTeam[]; spots?: Spot[]; myLocation?: { lat: number; lng: number } | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const points: [number, number][] = [];
    if (myLocation?.lat && myLocation?.lng) points.push([myLocation.lat, myLocation.lng]);
    teams.filter((t) => t.latitude && t.longitude).forEach(t => points.push([t.latitude, t.longitude]));
    (spots || []).filter(s => s.latitude && s.longitude).forEach(s => points.push([s.latitude!, s.longitude!]));
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    done.current = true;
  }, [teams, spots, map, myLocation]);
  return null;
}

export function TeamMap({ teams, spots, pathPoints, height = "300px", myLocation }: Props) {
  const [mapReady, setMapReady] = useState(false);

  const center: [number, number] = myLocation?.lat && myLocation?.lng
    ? [myLocation.lat, myLocation.lng]
    : spots && spots.length > 0 && spots[0].latitude && spots[0].longitude
      ? [spots[0].latitude, spots[0].longitude]
      : teams.length > 0 && teams[0].latitude && teams[0].longitude
        ? [teams[0].latitude, teams[0].longitude]
        : [23.8103, 90.4125];

  const showOtherTeams = !myLocation;

  return (
    <div style={{ height, borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
      {/* @ts-ignore */}
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
        whenReady={() => setMapReady(true)}
      >
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsUpdater teams={teams} spots={spots} myLocation={myLocation} />
        {mapReady && myLocation?.lat && myLocation?.lng && (
          // @ts-ignore
          <Marker position={[myLocation.lat, myLocation.lng]} icon={youAreHereIcon}>
            <Popup>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 800, color: "#1CB0F6" }}>
                📍 You are here
              </div>
            </Popup>
          </Marker>
        )}
        {mapReady && showOtherTeams &&
          teams.map((t) => {
            if (!t.latitude || !t.longitude) return null;
            const icon = t.isDisqualified
              ? disqualifiedIcon
              : t.isActive
                ? activeIcon
                : inactiveIcon;
            return (
              // @ts-ignore
              <Marker key={t.id} position={[t.latitude, t.longitude]} icon={icon}>
                <Popup>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600 }}>
                    <strong>{t.name}</strong>
                    <br />
                    <span style={{ color: t.isDisqualified ? "#ef4444" : t.isActive ? "#22c55e" : "#9ca3af" }}>
                      {t.isDisqualified ? "Disqualified" : t.isActive ? "Active" : "Inactive"}
                    </span>
                    <br />
                    <span style={{ color: "#6b7280", fontSize: 11 }}>
                      {new Date(t.capturedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        {mapReady &&
          spots?.map((s) => {
            if (!s.latitude || !s.longitude) return null;
            return (
              // @ts-ignore
              <Marker key={s.id} position={[s.latitude, s.longitude]} icon={spotIcon}>
                <Popup>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 800 }}>
                    <span style={{ color: "#1CB0F6" }}>📍 {s.name}</span>
                    <br />
                    <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>{s.location_hint}</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        {pathPoints && pathPoints.length > 1 && (
          <Polyline
            positions={pathPoints}
            pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.6, dashArray: "8 4" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
