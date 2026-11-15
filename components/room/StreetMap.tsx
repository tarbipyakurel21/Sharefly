"use client";
import { useEffect, useRef } from "react";
import type { PickedSpace } from "./ApartmentPicker";

export function StreetMap({ spaces, pickedId, onPick }: { spaces: PickedSpace[]; pickedId: string | null; onPick: (s: PickedSpace) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const onPickRef = useRef(onPick); onPickRef.current = onPick;
  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      const points = spaces.filter((s) => s.lat != null && s.lng != null);
      if (!points.length) return;
      map = L.map(el.current, { scrollWheelZoom: true, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
      const bounds = L.latLngBounds(points.map((s) => [s.lat!, s.lng!] as [number, number]));
      map.fitBounds(bounds.pad(0.15));
      for (const s of points) {
        const marker = L.circleMarker([s.lat!, s.lng!], { radius: pickedId === s.id ? 10 : 7, color: "#fff", weight: 3, fillColor: pickedId === s.id ? "#25221f" : "#b44b27", fillOpacity: 1 });
        marker.bindTooltip(`${s.communityName ?? "Apartment"} · ${s.city}`, { direction: "top" });
        marker.on("click", () => onPickRef.current(s)); marker.addTo(map);
      }
    });
    return () => { cancelled = true; map?.remove(); };
  }, [spaces, pickedId]);
  return <div ref={el} className="h-64 w-full" aria-label="Street map of apartments" />;
}
