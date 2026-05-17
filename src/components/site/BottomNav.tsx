import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Tag, Heart, User } from "lucide-react";

const items = [
  { to: "/" as const, label: "Início", icon: Home },
  { to: "/categorias" as const, label: "Categorias", icon: LayoutGrid },
  { to: "/promocoes" as const, label: "Promoções", icon: Tag },
  { to: "/favoritos" as const, label: "Favoritos", icon: Heart },
  { to: "/login" as const, label: "Conta", icon: User },
];

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = path === it.to || (it.to !== "/" && path.startsWith(it.to));
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-highlight" : "text-muted-foreground"
                }`}
              >
                <Icon className={`size-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
