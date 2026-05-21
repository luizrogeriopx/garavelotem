import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { SelfieCaptureLocal } from "@/components/SelfieCaptureLocal";
import {
  PolicyAcceptanceList,
  usePoliciesForContext,
  recordAcceptances,
  allAccepted,
} from "@/components/site/PolicyAcceptance";
import {
  formatCPF, formatPhoneBR, isValidCPF, onlyDigits,
} from "@/lib/br-validation";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: (s.redirect as string) || "/conta",
    mode: (s.mode as "signin" | "signup") || "signin",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, mode: initialMode } = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  // Campos de cadastro completo
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [phone, setPhone] = useState("");
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const { data: requiredPolicies } = usePoliciesForContext("signup");

  useEffect(() => {
    if (user) navigate({ to: redirect });
  }, [user, redirect, navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirect,
    });
    if (res.error) {
      toast.error("Erro ao entrar com Google");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link de recuperação para seu e-mail.");
        setForgot(false);
      } else if (mode === "signup") {
        // Validações do cadastro completo
        const cpfDigits = onlyDigits(cpf);
        if (!fullName.trim() || !birthDate || !rg.trim() || !phone.trim()) {
          toast.error("Preencha todos os campos.");
          return;
        }
        if (!isValidCPF(cpfDigits)) {
          toast.error("CPF inválido. Verifique os dígitos.");
          return;
        }
        const birth = new Date(birthDate);
        const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (isNaN(age) || age < 16) {
          toast.error("Idade mínima de 16 anos.");
          return;
        }
        if (!selfieBlob) {
          toast.error("Tire uma foto pela câmera para concluir.");
          return;
        }
        if (!allAccepted(requiredPolicies, accepted)) {
          toast.error("Aceite todas as políticas obrigatórias.");
          return;
        }

        // 1) Criar a conta
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (signUpError) throw signUpError;

        // 2) Garantir sessão (auto-confirm está ativo)
        let userId = signUpData.user?.id;
        if (!signUpData.session) {
          const { data: signIn, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          userId = signIn.user?.id;
        }
        if (!userId) throw new Error("Não foi possível iniciar sua sessão.");

        // 3) Upload da selfie
        const path = `${userId}/selfie-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("user-selfies")
          .upload(path, selfieBlob, { contentType: "image/jpeg", upsert: true });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from("user-selfies")
          .createSignedUrl(path, 60 * 60 * 24 * 365);

        // 4) Completar profile
        const { error: profErr } = await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            birth_date: birthDate,
            cpf: cpfDigits,
            rg: rg.trim(),
            email: email.trim(),
            phone: onlyDigits(phone),
            selfie_url: signed?.signedUrl ?? path,
            profile_completed: true,
          })
          .eq("id", userId);
        if (profErr) throw profErr;

        // 5) Registrar aceites
        if (requiredPolicies) {
          await recordAcceptances({
            userId,
            policies: requiredPolicies,
            context: "signup",
          });
        }

        toast.success("Cadastro concluído!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      if (msg.includes("profiles_cpf_key") || msg.toLowerCase().includes("duplicate")) {
        toast.error("Esse CPF já está cadastrado em outra conta.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const showSignupExtras = mode === "signup" && !forgot;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center">
        <h1 className="font-display font-extrabold text-3xl text-brand">
          {forgot ? "Recuperar senha" : mode === "signup" ? "Criar conta" : "Entrar"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {forgot
            ? "Informe seu e-mail para receber o link de recuperação."
            : "Bem-vindo ao Garavelo Tem"}
        </p>
      </div>

      {!forgot && (
        <Button
          type="button"
          variant="outline"
          className="w-full mt-6 rounded-full font-semibold"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continuar com Google
        </Button>
      )}

      {!forgot && (
        <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {showSignupExtras && (
          <div className="space-y-1">
            <Label>Foto (tirada na hora) *</Label>
            <SelfieCaptureLocal
              previewUrl={selfiePreview}
              onCaptured={(blob, url) => {
                setSelfieBlob(blob);
                setSelfiePreview(url);
              }}
            />
          </div>
        )}

        {showSignupExtras && (
          <div>
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        )}

        <div>
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        {!forgot && (
          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
        )}

        {showSignupExtras && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bd">Data de nascimento *</Label>
                <Input id="bd" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="rg">RG *</Label>
                <Input id="rg" required value={rg} onChange={(e) => setRg(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" required inputMode="numeric" placeholder="000.000.000-00"
                  value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="ph">Telefone *</Label>
                <Input id="ph" required placeholder="(62) 99999-9999"
                  value={phone} onChange={(e) => setPhone(formatPhoneBR(e.target.value))} />
              </div>
            </div>

            <PolicyAcceptanceList
              context="signup"
              accepted={accepted}
              onToggle={(slug, v) => setAccepted((s) => ({ ...s, [slug]: v }))}
            />
          </>
        )}

        <Button type="submit" className="w-full bg-brand hover:bg-brand/90 text-brand-foreground rounded-full font-semibold" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {forgot ? <><Mail className="size-4" /> Enviar link</> : mode === "signup" ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm space-y-2">
        {forgot ? (
          <button type="button" className="text-highlight font-semibold" onClick={() => setForgot(false)}>
            Voltar ao login
          </button>
        ) : (
          <>
            {mode === "signin" && (
              <button type="button" className="text-muted-foreground hover:text-foreground block mx-auto" onClick={() => setForgot(true)}>
                Esqueci minha senha
              </button>
            )}
            <button
              type="button"
              className="text-highlight font-semibold"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
            </button>
          </>
        )}
        <div>
          <Link to="/" className="text-xs text-muted-foreground">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
