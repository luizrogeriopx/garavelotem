import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand text-brand-foreground mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="font-display font-extrabold text-lg">
            GARAVELO <span className="text-highlight">TEM</span>
          </div>
          <p className="text-sm opacity-80 mt-3 max-w-sm">
            A vitrine viva do Setor Garavelo. Encontre tudo perto de você e fortaleça o comércio local.
          </p>
          <div className="flex gap-2 mt-5">
            <a href="#" aria-label="Instagram" className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <Instagram className="size-4" />
            </a>
            <a href="#" aria-label="Facebook" className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <Facebook className="size-4" />
            </a>
            <a href="#" aria-label="WhatsApp" className="size-9 grid place-items-center rounded-full bg-whatsapp">
              <MessageCircle className="size-4" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-3">Plataforma</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/categorias" className="opacity-80 hover:opacity-100">Categorias</Link></li>
            <li><Link to="/promocoes" className="opacity-80 hover:opacity-100">Promoções</Link></li>
            <li><Link to="/planos" className="opacity-80 hover:opacity-100">Planos Pro</Link></li>
            <li><Link to="/divulgar" className="opacity-80 hover:opacity-100">Divulgar empresa</Link></li>
            <li><Link to="/reivindicar" className="opacity-80 hover:opacity-100">Reivindicar empresa</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/politicas/$slug" params={{ slug: "termos-de-uso" }} className="opacity-80 hover:opacity-100">Termos de uso</Link></li>
            <li><Link to="/politicas/$slug" params={{ slug: "politica-de-privacidade" }} className="opacity-80 hover:opacity-100">Política de privacidade</Link></li>
            <li><Link to="/politicas/$slug" params={{ slug: "termos-do-comerciante" }} className="opacity-80 hover:opacity-100">Termos do comerciante</Link></li>
            <li><Link to="/politicas/$slug" params={{ slug: "politica-lgpd" }} className="opacity-80 hover:opacity-100">Política LGPD</Link></li>
            <li><Link to="/politicas/$slug" params={{ slug: "aviso-legal" }} className="opacity-80 hover:opacity-100">Aviso legal</Link></li>
            <li><Link to="/politicas/$slug" params={{ slug: "anuncios-proibidos" }} className="opacity-80 hover:opacity-100">Anúncios proibidos</Link></li>
            <li><Link to="/politicas/$slug" params={{ slug: "selo-verificado" }} className="opacity-80 hover:opacity-100">Selo verificado</Link></li>
            <li><Link to="/politicas/$slug" params={{ slug: "anti-golpe" }} className="opacity-80 hover:opacity-100">Política anti-golpe</Link></li>
            <li><Link to="/politicas" className="opacity-80 hover:opacity-100 font-medium">Ver todas as políticas</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs opacity-70 flex justify-between">
          <span>© {new Date().getFullYear()} Garavelo Tem</span>
          <span>Feito com carinho no Garavelo</span>
        </div>
      </div>
    </footer>
  );
}
