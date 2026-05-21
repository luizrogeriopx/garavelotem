import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw } from "lucide-react";

type Props = {
  previewUrl: string | null;
  onCaptured: (blob: Blob, previewUrl: string) => void;
};

/**
 * Selfie capture that does NOT upload — keeps the blob locally so the parent
 * can upload it after creating the user account (we need user.id for the path).
 */
export function SelfieCaptureLocal({ previewUrl, onCaptured }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
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
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setErr("Não foi possível acessar a câmera. Habilite a permissão e tente novamente.");
    }
  };

  const capture = async () => {
    if (!videoRef.current) return;
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
    const url = URL.createObjectURL(blob);
    onCaptured(blob, url);
    stopStream();
  };

  if (previewUrl && !active) {
    return (
      <div className="space-y-2 flex flex-col items-center">
        <img src={previewUrl} alt="Sua foto" className="size-32 rounded-full object-cover border" />
        <Button type="button" variant="outline" size="sm" onClick={start} className="rounded-full">
          <RotateCcw className="size-4" /> Tirar outra
        </Button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-2 flex flex-col items-center">
        <div className="size-32 rounded-full bg-muted grid place-items-center border">
          <Camera className="size-8 text-muted-foreground" />
        </div>
        <Button type="button" onClick={start} size="sm" className="rounded-full">
          <Camera className="size-4" /> Abrir câmera
        </Button>
        {err && <p className="text-xs text-destructive text-center">{err}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2 flex flex-col items-center">
      <div className="size-32 rounded-full overflow-hidden border bg-black">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={capture} size="sm" className="rounded-full">
          <Camera className="size-4" /> Tirar foto
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={stopStream} className="rounded-full">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
