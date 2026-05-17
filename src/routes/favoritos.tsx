import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/favoritos")({
  component: () => (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <h1 className="font-display font-extrabold text-2xl text-brand">Seus favoritos</h1>
      <p className="text-muted-foreground text-sm mt-2">
        Faça login para salvar empresas e acessá-las rapidamente.
      </p>
    </div>
  ),
});
