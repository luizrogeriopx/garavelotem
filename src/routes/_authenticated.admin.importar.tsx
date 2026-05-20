import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { searchPlaces, importPlaces } from "@/lib/places-import.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, MapPin, Phone, Star, Loader2, Download, CheckCircle2, Info, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/importar")({
  component: ImportPage,
});

type Place = {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  category_hint: string | null;
  hours: string[];
  rating: number | null;
  rating_count: number | null;
  photo_name: string | null;
  photo_url: string | null;
  already_imported: boolean;
};


// Aparecida de Goiânia center
const DEFAULT_LAT = -16.8233;
const DEFAULT_LNG = -49.2436;

function ImportPage() {
  const qc = useQueryClient();
  const search = useServerFn(searchPlaces);
  const importFn = useServerFn(importPlaces);

  const [query, setQuery] = useState("restaurantes em Garavelo, Aparecida de Goiânia");
  const [radius, setRadius] = useState(5);
  const [results, setResults] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [categoryId, setCategoryId] = useState<string>("");

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-import"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const searchMut = useMutation({
    mutationFn: () =>
      search({ data: { query, lat: DEFAULT_LAT, lng: DEFAULT_LNG, radiusKm: radius } }),
    onSuccess: (data) => {
      setResults(data.results as Place[]);
      setSelected({});
      if (data.results.length === 0) toast.info("Nenhum resultado encontrado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: async () => {
      const items = results
        .filter((r) => selected[r.place_id] && !r.already_imported)
        .map((r) => ({
          place_id: r.place_id,
          name: r.name,
          address: r.address,
          phone: r.phone,
          neighborhood: r.neighborhood,
          lat: r.lat,
          lng: r.lng,
          category_id: categoryId || null,
          photo_name: r.photo_name,
        }));
      if (items.length === 0) throw new Error("Selecione ao menos uma empresa.");
      return importFn({ data: { items } });
    },
    onSuccess: (data) => {
      toast.success(`${data.imported} empresa(s) importada(s) como pendente.`);
      if (data.skipped.length) toast.info(`${data.skipped.length} ignoradas (já existem).`);
      if (data.errors.length) toast.error(`${data.errors.length} erros.`);
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      // Mark imported in UI
      setResults((rs) =>
        rs.map((r) => (selected[r.place_id] ? { ...r, already_imported: true } : r)),
      );
      setSelected({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectableCount = results.filter((r) => !r.already_imported).length;
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Buscar empresas no Google</h2>
          <p className="text-sm text-muted-foreground">
            Use uma busca livre como no Google Maps. Ex: "pizzaria em Garavelo" ou "salão de beleza Aparecida de Goiânia".
            Resultados ficam centrados em Aparecida de Goiânia.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <div>
            <Label>Busca</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex: restaurantes em Garavelo" />
          </div>
          <div>
            <Label>Raio (km)</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value) || 5)}
              className="w-24"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => searchMut.mutate()} disabled={searchMut.isPending || !query.trim()}>
              {searchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {results.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-3 justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">{results.length} resultado(s)</h3>
              <p className="text-xs text-muted-foreground">
                Empresas marcadas como "já importada" não podem ser duplicadas.
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <Label>Categoria para todas</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="(opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (allSelected) setSelected({});
                  else {
                    const all: Record<string, boolean> = {};
                    results.forEach((r) => {
                      if (!r.already_imported) all[r.place_id] = true;
                    });
                    setSelected(all);
                  }
                }}
              >
                {allSelected ? "Desmarcar todas" : "Selecionar todas"}
              </Button>
              <Button
                onClick={() => {
                  const catName = categoryId
                    ? (categories ?? []).find((c) => c.id === categoryId)?.name ?? "selecionada"
                    : "Sem categoria";
                  if (confirm(`Confirma importar ${selectedCount} empresa(s) na categoria "${catName}"?`)) {
                    importMut.mutate();
                  }
                }}
                disabled={importMut.isPending || selectedCount === 0}
              >
                {importMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Importar {selectedCount > 0 ? `(${selectedCount})` : ""}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.place_id}
                className={`flex items-start gap-3 p-3 border rounded-lg ${
                  r.already_imported ? "opacity-60 bg-muted/30" : ""
                }`}
              >
                <Checkbox
                  checked={!!selected[r.place_id]}
                  disabled={r.already_imported}
                  onCheckedChange={(v) =>
                    setSelected((s) => ({ ...s, [r.place_id]: !!v }))
                  }
                  className="mt-1"
                />
                {r.photo_url ? (
                  <img
                    src={r.photo_url}
                    alt={r.name}
                    loading="lazy"
                    className="w-20 h-20 rounded-md object-cover shrink-0 border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-muted shrink-0 border flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                    sem foto
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{r.name}</h4>

                    {r.category_hint && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">{r.category_hint}</span>
                    )}
                    {r.already_imported && (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                        já importada
                      </span>
                    )}
                    {r.rating != null && (
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {r.rating.toFixed(1)} ({r.rating_count ?? 0})
                      </span>
                    )}
                  </div>
                  {r.address && (
                    <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      {r.address}
                    </p>
                  )}
                  {r.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {r.phone}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-right">Powered by Google</p>
        </Card>
      )}
    </div>
  );
}
