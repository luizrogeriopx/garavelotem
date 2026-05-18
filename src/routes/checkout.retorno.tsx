import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/retorno")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
  head: () => ({ meta: [{ title: "Pagamento — Garavelo Tem" }] }),
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {session_id ? (
        <>
          <CheckCircle2 className="size-16 text-whatsapp mx-auto" />
          <h1 className="font-display font-extrabold text-2xl text-brand mt-4">
            Pagamento confirmado!
          </h1>
          <p className="text-muted-foreground mt-2">
            Seu Plano Pro foi ativado. Em instantes sua empresa já será destacada.
          </p>
          <Link
            to="/minha-empresa"
            className="inline-block mt-6 bg-brand text-brand-foreground font-semibold px-6 py-3 rounded-xl"
          >
            Ir para minha empresa
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-display font-extrabold text-2xl text-brand">
            Nenhuma sessão encontrada
          </h1>
          <Link to="/planos" className="inline-block mt-4 text-highlight underline">
            Voltar para planos
          </Link>
        </>
      )}
    </div>
  );
}
