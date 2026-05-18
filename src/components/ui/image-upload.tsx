import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  bucket: string;
  pathPrefix: string;
  label?: string;
  aspect?: string;
};

export function ImageUpload({ value, onChange, bucket, pathPrefix, label = "Imagem", aspect = "aspect-video" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 5MB");
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {value ? (
        <div className={`relative ${aspect} w-full rounded-lg overflow-hidden bg-muted border`}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Trocar"}
            </Button>
            <Button type="button" size="icon" variant="destructive" onClick={() => onChange("")}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`${aspect} w-full rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors`}
        >
          {loading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
          <span className="text-sm">{loading ? "Enviando..." : `Enviar ${label.toLowerCase()}`}</span>
        </button>
      )}
    </div>
  );
}
