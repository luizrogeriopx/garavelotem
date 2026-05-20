import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Menu, Store, MapPin, User as UserIcon, Shield, LogOut, Heart, LayoutGrid, Tag, Sparkles, Bell } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  neighborhood: string | null;
  logo_url: string | null;
  is_pro: boolean;
};

function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const term = `%${query.trim()}%`;
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, neighborhood, logo_url, plans(slug)")
        .eq("status", "approved")
        .or(`name.ilike.${term},short_description.ilike.${term},neighborhood.ilike.${term}`)
        .limit(20);
      if (error) throw error;
      const rows: Suggestion[] = (data ?? []).map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        neighborhood: b.neighborhood,
        logo_url: b.logo_url,
        is_pro: b.plans?.slug === "pro",
      }));
      // Prioridade: Pro primeiro, depois alfabético
      rows.sort((a, b) => {
        if (a.is_pro !== b.is_pro) return a.is_pro ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      return rows.slice(0, 8);
    },
    staleTime: 30_000,
  });
}

function SuggestionsList({
  query,
  onPick,
  variant,
}: {
  query: string;
  onPick: () => void;
  variant: "desktop" | "mobile";
}) {
  const { data, isFetching } = useSearchSuggestions(query);
  const show = query.trim().length >= 2;
  if (!show) return null;

  return (
    <div
      className={
        variant === "desktop"
          ? "absolute top-full mt-2 left-0 right-0 bg-popover text-popover-foreground rounded-xl shadow-lg border z-50 overflow-hidden"
          : "absolute top-full mt-1 left-4 right-4 bg-popover text-popover-foreground rounded-xl shadow-lg border z-50 overflow-hidden"
      }
    >
      {isFetching && !data && (
        <div className="px-4 py-3 text-sm text-muted-foreground">Buscando…</div>
      )}
      {data && data.length === 0 && (
        <div className="px-4 py-3 text-sm text-muted-foreground">Nenhuma empresa encontrada.</div>
      )}
      {data?.map((s) => (
        <Link
          key={s.id}
          to="/empresa/$slug"
          params={{ slug: s.slug }}
          onClick={onPick}
          className="flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
        >
          <div className="size-8 rounded-lg bg-muted overflow-hidden grid place-items-center shrink-0">
            {s.logo_url ? (
              <img src={s.logo_url} alt="" className="size-full object-cover" />
            ) : (
              <Store className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{s.name}</p>
              {s.is_pro && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase bg-brand text-brand-foreground rounded px-1 py-0.5">
                  <Sparkles className="size-2.5" /> Pro
                </span>
              )}
            </div>
            {s.neighborhood && (
              <p className="text-xs text-muted-foreground truncate">{s.neighborhood}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState<"desktop" | "mobile" | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !desktopRef.current?.contains(t) &&
        !mobileRef.current?.contains(t)
      ) {
        setFocused(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setFocused(null);
    navigate({ to: "/buscar", search: { q: term } });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const closeSuggestions = () => {
    setFocused(null);
    setQ("");
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

        <div ref={desktopRef} className="hidden md:flex flex-1 max-w-md relative">
          <form onSubmit={onSearch} className="w-full">
            <label className="w-full flex items-center gap-2 bg-white/10 border border-white/15 focus-within:bg-white focus-within:text-foreground rounded-full px-4 py-2 transition-colors">
              <Search className="size-4 opacity-70" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setFocused("desktop")}
                placeholder="Buscar pizzaria, salão, oficina..."
                className="bg-transparent w-full text-sm outline-none placeholder:opacity-60"
              />
            </label>
          </form>
          {focused === "desktop" && (
            <SuggestionsList query={q} onPick={closeSuggestions} variant="desktop" />
          )}
        </div>

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="sm:hidden size-9 rounded-full bg-white/10 grid place-items-center hover:bg-white/20 transition-colors"
                aria-label="Menu"
              >
                <Menu className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/categorias"><LayoutGrid className="size-4" /> Categorias</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/promocoes"><Tag className="size-4" /> Promoções</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/favoritos"><Heart className="size-4" /> Favoritos</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/divulgar"><Store className="size-4" /> Divulgar empresa</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin/empresas"><Shield className="size-4" /> Admin</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/conta"><UserIcon className="size-4" /> Minha conta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut className="size-4" /> Sair
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/login" search={{ redirect: "/conta", mode: "signin" }}>
                    <UserIcon className="size-4" /> Entrar
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={mobileRef} className="md:hidden px-4 pb-3 relative">
        <form onSubmit={onSearch}>
          <label className="w-full flex items-center gap-2 bg-white text-foreground rounded-xl px-4 py-2.5 shadow-soft">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused("mobile")}
              placeholder="O que você procura hoje?"
              className="bg-transparent w-full text-sm outline-none"
            />
          </label>
        </form>
        {focused === "mobile" && (
          <SuggestionsList query={q} onPick={closeSuggestions} variant="mobile" />
        )}
      </div>
    </header>
  );
}
