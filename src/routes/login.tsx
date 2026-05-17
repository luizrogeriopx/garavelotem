import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: () => (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-display font-extrabold text-2xl text-brand">Entrar ou cadastrar</h1>
      <p className="text-muted-foreground text-sm mt-2">
        O sistema de login será implementado na próxima etapa. Você poderá entrar com e-mail ou Google.
      </p>
      <Link to="/" className="mt-6 inline-block text-highlight font-semibold">Voltar ao início</Link>
    </div>
  ),
});
