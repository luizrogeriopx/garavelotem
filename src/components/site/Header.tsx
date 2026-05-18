import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Menu, Store, MapPin, User as UserIcon, Shield, LogOut, Heart, LayoutGrid, Tag } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";

export function Header() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate({ to: "/buscar", search: { q: term } });
  };

  return (
    <header className="sticky top-0 z-40 bg-brand text-brand-foreground shadow-soft">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-9 rounded-xl bg-highlight grid place-items-center font-extrabold text-highlight-foreground">
            G
          </div>
          <div className="leading-none">
            <div className="font-display font-extrabold text-base tracking-tight">
              GARAVELO <span className="text-highlight">TEM</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] opacity-70 mt-0.5">
              <MapPin className="size-3" /> Setor Garavelo • GO
            </div>
          </div>
        </Link>

        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md">
          <label className="w-full flex items-center gap-2 bg-white/10 border border-white/15 focus-within:bg-white focus-within:text-foreground rounded-full px-4 py-2 transition-colors">
            <Search className="size-4 opacity-70" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar pizzaria, salão, oficina..."
              className="bg-transparent w-full text-sm outline-none placeholder:opacity-60"
            />
          </label>
        </form>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild size="sm" variant="ghost" className="text-brand-foreground hover:bg-white/10 hidden sm:inline-flex">
              <Link to="/admin/empresas"><Shield className="size-4" /> Admin</Link>
            </Button>
          )}
          <Button asChild size="sm" className="bg-highlight hover:bg-highlight/90 text-highlight-foreground rounded-full font-semibold hidden sm:inline-flex">
            <Link to="/divulgar">
              <Store className="size-4" />
              Divulgar empresa
            </Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" size="sm" className="text-brand-foreground hover:bg-white/10 hidden sm:inline-flex">
              <Link to="/conta"><UserIcon className="size-4" /> Minha conta</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="text-brand-foreground hover:bg-white/10 hidden sm:inline-flex">
              <Link to="/login" search={{ redirect: "/conta", mode: "signin" }}>Entrar</Link>
            </Button>
          )}
          <button className="sm:hidden size-9 rounded-full bg-white/10 grid place-items-center" aria-label="Menu">
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      <form onSubmit={onSearch} className="md:hidden px-4 pb-3">
        <label className="w-full flex items-center gap-2 bg-white text-foreground rounded-xl px-4 py-2.5 shadow-soft">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="O que você procura hoje?"
            className="bg-transparent w-full text-sm outline-none"
          />
        </label>
      </form>
    </header>
  );
}
