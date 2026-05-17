import { createFileRoute } from "@tanstack/react-router";
import { BusinessForm } from "@/components/merchant/BusinessForm";

export const Route = createFileRoute("/_authenticated/minha-empresa")({
  component: () => (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Comerciante</p>
      <h1 className="font-display font-extrabold text-2xl text-brand">Cadastrar minha empresa</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Preencha os dados abaixo. Todo cadastro passa por aprovação manual.
      </p>
      <BusinessForm />
    </div>
  ),
});
