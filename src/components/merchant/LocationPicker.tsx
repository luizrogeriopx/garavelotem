import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

export function LocationPicker({ lat, lng, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Seu navegador não suporta geolocalização.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Habilite nas configurações do navegador."
            : "Não foi possível obter sua localização. Tente novamente.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleManual = (which: "lat" | "lng", value: string) => {
    const n = value === "" ? NaN : Number(value);
    if (which === "lat") onChange(Number.isFinite(n) ? n : 0, lng ?? 0);
    else onChange(lat ?? 0, Number.isFinite(n) ? n : 0);
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Localização exata (GPS)</p>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          <span className="ml-1">Usar minha localização</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          step="any"
          placeholder="Latitude"
          value={lat ?? ""}
          onChange={(e) => handleManual("lat", e.target.value)}
        />
        <Input
          type="number"
          step="any"
          placeholder="Longitude"
          value={lng ?? ""}
          onChange={(e) => handleManual("lng", e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Clique em "Usar minha localização" estando no endereço da empresa para capturar as coordenadas via GPS.
        Elas serão usadas para o botão "Ver rota" abrir o Google Maps com o destino exato.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
