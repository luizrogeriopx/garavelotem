import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/divulgar")({
  component: () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Para comerciantes</p>
      <h1 className="font-display font-extrabold text-3xl text-brand mt-1">Divulgue sua empresa</h1>
      <p className="text-muted-foreground mt-3">
        Crie sua conta gratuita, envie as informações da sua empresa e aguarde a aprovação da nossa equipe.
        Todas as empresas passam por aprovação manual para garantir a qualidade do diretório.
      </p>
      <div className="flex gap-3 mt-6">
        <Link to="/login" className="bg-brand text-brand-foreground font-semibold px-5 py-2.5 rounded-full">Criar conta</Link>
        <Link to="/planos" className="bg-card shadow-card font-semibold px-5 py-2.5 rounded-full">Ver planos</Link>
      </div>
    </div>
  ),
});
