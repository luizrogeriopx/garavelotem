// Brazilian document validation utilities.

export function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

export function formatCPF(s: string): string {
  const d = onlyDigits(s).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCNPJ(s: string): string {
  const d = onlyDigits(s).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPhoneBR(s: string): string {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

export function isValidCPF(cpfRaw: string): boolean {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === parseInt(cpf[10]);
}

export function isValidCNPJ(cnpjRaw: string): boolean {
  const cnpj = onlyDigits(cnpjRaw);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(base[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(cnpj, w1);
  const d2 = calc(cnpj, w2);
  return d1 === parseInt(cnpj[12]) && d2 === parseInt(cnpj[13]);
}

export type CNPJStatus = {
  ok: boolean;
  active: boolean;
  razaoSocial?: string;
  situacao?: string;
  error?: string;
};

// BrasilAPI supports CORS, can be called directly from the browser.
export async function lookupCNPJ(cnpjRaw: string): Promise<CNPJStatus> {
  const cnpj = onlyDigits(cnpjRaw);
  if (!isValidCNPJ(cnpj)) return { ok: false, active: false, error: "CNPJ inválido" };
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!res.ok) {
      return { ok: false, active: false, error: "CNPJ não encontrado na Receita" };
    }
    const data = await res.json();
    const situacao = data.descricao_situacao_cadastral || data.situacao_cadastral || "";
    const active = String(situacao).toUpperCase() === "ATIVA";
    return {
      ok: true,
      active,
      razaoSocial: data.razao_social,
      situacao: String(situacao),
    };
  } catch (e) {
    return { ok: false, active: false, error: "Falha ao consultar a Receita" };
  }
}
