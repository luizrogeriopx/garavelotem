import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Props {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QrReader({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader-target",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      },
      (error) => {
        // Handle scan errors quietly
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div id="qr-reader-target" className="overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5"></div>
      <p className="text-xs text-center text-muted-foreground">Posicione o QR Code do cupom do cliente dentro da área marcada.</p>
    </div>
  );
}
