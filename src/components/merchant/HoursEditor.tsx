import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type DayHours = { closed: boolean; open: string; close: string };
export type WeekHours = Record<string, DayHours>;

const DAYS: { key: string; label: string }[] = [
  { key: "sun", label: "Domingo" },
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
];

export function defaultHours(): WeekHours {
  return DAYS.reduce((acc, d) => {
    acc[d.key] = { closed: d.key === "sun", open: "08:00", close: "18:00" };
    return acc;
  }, {} as WeekHours);
}

export function normalizeHours(raw: unknown): WeekHours {
  const base = defaultHours();
  if (raw && typeof raw === "object") {
    for (const d of DAYS) {
      const v = (raw as Record<string, Partial<DayHours>>)[d.key];
      if (v && typeof v === "object") {
        base[d.key] = {
          closed: !!v.closed,
          open: typeof v.open === "string" ? v.open : base[d.key].open,
          close: typeof v.close === "string" ? v.close : base[d.key].close,
        };
      }
    }
  }
  return base;
}

export function HoursEditor({
  value,
  onChange,
}: {
  value: WeekHours;
  onChange: (v: WeekHours) => void;
}) {
  const update = (key: string, patch: Partial<DayHours>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  return (
    <div className="rounded-xl border divide-y bg-background">
      {DAYS.map((d) => {
        const h = value[d.key];
        return (
          <div
            key={d.key}
            className="flex flex-wrap items-center gap-3 px-3 py-2"
          >
            <div className="w-24 text-sm font-medium">{d.label}</div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!h.closed}
                onCheckedChange={(v) => update(d.key, { closed: !v })}
                id={`open-${d.key}`}
              />
              <Label htmlFor={`open-${d.key}`} className="text-xs text-muted-foreground">
                {h.closed ? "Fechado" : "Aberto"}
              </Label>
            </div>
            {!h.closed && (
              <div className="flex items-center gap-2 ml-auto">
                <Input
                  type="time"
                  value={h.open}
                  onChange={(e) => update(d.key, { open: e.target.value })}
                  className="w-28"
                />
                <span className="text-muted-foreground text-xs">às</span>
                <Input
                  type="time"
                  value={h.close}
                  onChange={(e) => update(d.key, { close: e.target.value })}
                  className="w-28"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
