import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

/**
 * Selfie capture — uses getUserMedia so the photo is taken at the moment of
 * sign-up, with no option to pick from gallery. Uploads to the `user-selfies`
 * private bucket under <user.id>/selfie.jpg.
 */
export function SelfieCapture({ value, onChange }: Props) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  };

  useEffect(() => () => stopStream(), []);

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
      // wait next tick for video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (e) {
      setErr("Não foi possível acessar a câmera. Habilite a permissão e tente novamente.");
    }
  };

  const capture = async () => {
    if (!videoRef.current || !user) return;
    setBusy(true);
    try {
      const v = videoRef.current;
      const size = Math.min(v.videoWidth, v.videoHeight);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const sx = (v.videoWidth - size) / 2;
      const sy = (v.videoHeight - size) / 2;
      ctx.drawImage(v, sx, sy, size, size, 0, 0, size, size);
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85),
      );
      const path = `${user.id}/selfie-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("user-selfies").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from("user-selfies")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      onChange(signed?.signedUrl ?? path);
      stopStream();
      toast.success("Foto capturada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar foto");
    } finally {
      setBusy(false);
    }
  };

  if (value && !active) {
    return (
      <div className="space-y-2">
        <img src={value} alt="Sua foto" className="size-40 rounded-full object-cover border" />
        <Button type="button" variant="outline" size="sm" onClick={start} className="rounded-full">
          <RotateCcw className="size-4" /> Tirar outra foto
        </Button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-2">
        <div className="size-40 rounded-full bg-muted grid place-items-center border">
          <Camera className="size-8 text-muted-foreground" />
        </div>
        <Button type="button" onClick={start} className="rounded-full">
          <Camera className="size-4" /> Abrir câmera
        </Button>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="size-40 rounded-full overflow-hidden border bg-black">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={capture} disabled={busy} className="rounded-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Tirar foto
        </Button>
        <Button type="button" variant="ghost" onClick={stopStream} className="rounded-full">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
