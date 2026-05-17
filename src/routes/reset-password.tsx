import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate({ to: "/conta" });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-display font-extrabold text-2xl text-brand">Definir nova senha</h1>
      <form onSubmit={handleSubmit} className="space-y-3 mt-6">
        <div>
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full rounded-full bg-brand text-brand-foreground" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} Salvar nova senha
        </Button>
      </form>
    </div>
  );
}
