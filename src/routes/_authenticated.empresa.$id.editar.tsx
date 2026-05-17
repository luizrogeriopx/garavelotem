import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BusinessForm } from "@/components/merchant/BusinessForm";

export const Route = createFileRoute("/_authenticated/empresa/$id/editar")({
  component: EditBusinessPage,
});

function EditBusinessPage() {
  const { id } = Route.useParams();
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/conta" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Comerciante</p>
      <h1 className="font-display font-extrabold text-2xl text-brand">Editar empresa</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Após salvar, a empresa volta para análise da nossa equipe.
      </p>
      <BusinessForm businessId={id} />
    </div>
  );
}
