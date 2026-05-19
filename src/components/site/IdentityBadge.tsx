import { Link } from "@tanstack/react-router";

type BusinessIdentity = {
  id: string;
  name: string;
  slug: string;
  username: string | null;
  logo_url: string | null;
};

type Props = {
  business: BusinessIdentity | null;
  userName: string | null;
  userAvatarUrl: string | null;
  size?: "sm" | "md";
};

/**
 * Renderiza identidade do autor de uma interação (comentário, avaliação, like).
 * - Quando há `business`: link clicável para a página da empresa.
 * - Caso contrário: nome do usuário, NÃO clicável.
 */
export function IdentityBadge({ business, userName, userAvatarUrl, size = "sm" }: Props) {
  const avatarSize = size === "sm" ? "size-7" : "size-9";
  const nameClass = size === "sm" ? "text-xs" : "text-sm";

  if (business) {
    const avatar = (
      <div className={`${avatarSize} rounded-full bg-muted overflow-hidden shrink-0`}>
        {business.logo_url && (
          <img src={business.logo_url} alt="" className="size-full object-cover" />
        )}
      </div>
    );
    const inner = (
      <>
        {avatar}
        <span className={`font-semibold ${nameClass}`}>{business.name}</span>
      </>
    );
    if (business.username) {
      return (
        <Link
          to="/$username"
          params={{ username: business.username }}
          className="flex items-center gap-2 hover:underline"
        >
          {inner}
        </Link>
      );
    }
    return (
      <Link
        to="/empresa/$slug"
        params={{ slug: business.slug }}
        className="flex items-center gap-2 hover:underline"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`${avatarSize} rounded-full bg-muted overflow-hidden shrink-0`}>
        {userAvatarUrl && <img src={userAvatarUrl} alt="" className="size-full object-cover" />}
      </div>
      <span className={`font-semibold ${nameClass}`}>{userName ?? "Usuário"}</span>
    </div>
  );
}
