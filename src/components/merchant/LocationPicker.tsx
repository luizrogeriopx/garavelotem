import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: any;
    __initGaravMap?: () => void;
  }
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

const DEFAULT = { lat: -16.8239, lng: -49.2438 }; // Aparecida de Goiânia

let loadPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Google Maps key not configured"));
  loadPromise = new Promise<void>((resolve, reject) => {
    window.__initGaravMap = () => resolve();
    const s = document.createElement("script");
    const channel = TRACKING_ID ? `&channel=${TRACKING_ID}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__initGaravMap${channel}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loadPromise;
}

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

export function LocationPicker({ lat, lng, onChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        const center = { lat: lat ?? DEFAULT.lat, lng: lng ?? DEFAULT.lng };
        const map = new window.google.maps.Map(ref.current, {
          center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: true,
        });
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (p) onChange(p.lat(), p.lng());
        });
        map.addListener("click", (e: any) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          onChange(e.latLng.lat(), e.latLng.lng());
        });
        mapRef.current = map;
        markerRef.current = marker;
      })
      .catch((err) => console.error("Maps load error", err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external lat/lng changes (e.g. when editing existing business loads)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || lat == null || lng == null) return;
    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
  }, [lat, lng]);

  if (!BROWSER_KEY) {
    return (
      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        Mapa indisponível: chave do Google Maps não configurada.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={ref} className="w-full h-64 rounded-lg border bg-muted" />
      <p className="text-xs text-muted-foreground">
        Arraste o pino ou toque no mapa para marcar a localização exata.
        {lat != null && lng != null && (
          <> Coordenadas: <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span></>
        )}
      </p>
    </div>
  );
}
