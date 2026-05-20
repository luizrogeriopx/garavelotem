import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { BottomNav } from "@/components/site/BottomNav";
import { Footer } from "@/components/site/Footer";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-brand">404</h1>
        <p className="mt-3 text-muted-foreground">Página não encontrada.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-brand text-brand-foreground px-4 py-2 text-sm font-medium">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-brand text-brand-foreground px-4 py-2 text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Garavelo Tem — O comércio do Setor Garavelo num só lugar" },
      { name: "description", content: "Descubra empresas, promoções e serviços do Setor Garavelo. Pizzarias, salões, oficinas e muito mais — com WhatsApp direto." },
      { name: "theme-color", content: "#0B2545" },
      { property: "og:title", content: "Garavelo Tem — O comércio do Setor Garavelo num só lugar" },
      { property: "og:description", content: "Descubra empresas, promoções e serviços do Setor Garavelo. Pizzarias, salões, oficinas e muito mais — com WhatsApp direto." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Garavelo Tem — O comércio do Setor Garavelo num só lugar" },
      { name: "twitter:description", content: "Descubra empresas, promoções e serviços do Setor Garavelo. Pizzarias, salões, oficinas e muito mais — com WhatsApp direto." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/680fa4cf-cb95-416c-8f69-2ed500c45153/id-preview-1d3445ca--51a9a3b4-67ba-4af7-a2dc-904b06772fac.lovable.app-1779062112250.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/680fa4cf-cb95-416c-8f69-2ed500c45153/id-preview-1d3445ca--51a9a3b4-67ba-4af7-a2dc-904b06772fac.lovable.app-1779062112250.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Garavelo Tem" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col pb-20 md:pb-0">
          <Header />
          <main className="flex-1"><Outlet /></main>
          <Footer />
          <BottomNav />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
