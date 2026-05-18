export function formatBRL(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function whatsappLink(phone: string | null | undefined, message?: string): string {
  if (!phone) return "#";
  let clean = phone.replace(/\D/g, "");
  // Remove leading zeros (ex: 0xx)
  clean = clean.replace(/^0+/, "");
  // Garante prefixo do Brasil (55). Números BR têm 10 ou 11 dígitos (DDD + número).
  if (!clean.startsWith("55") || clean.length <= 11) {
    if (clean.length === 10 || clean.length === 11) {
      clean = "55" + clean;
    }
  }
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${text}`;
}
