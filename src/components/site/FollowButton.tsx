import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMyBusinesses } from "@/hooks/use-my-businesses";
import { Heart, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type FollowRow = {
  id: string;
  follower_user_id: string | null;
  follower_business_id: string | null;
};

export function FollowButton({ businessId, compact = false }: { businessId: string; compact?: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: myBizs } = useMyBusinesses();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: followers } = useQuery({
    queryKey: ["business-followers", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_followers")
        .select("id,follower_user_id,follower_business_id")
        .eq("business_id", businessId);
      if (error) throw error;
      return (data ?? []) as FollowRow[];
    },
  });

  const count = followers?.length ?? 0;
  const myUserFollow = user ? followers?.find((f) => f.follower_user_id === user.id) : undefined;
  const myBizFollows = new Set(
    (followers ?? []).map((f) => f.follower_business_id).filter((v): v is string => !!v)
  );
  const eligibleBizs = (myBizs ?? []).filter((b) => b.id !== businessId);

  const follow = useMutation({
    mutationFn: async (asBizId: string | null) => {
      if (!user) throw new Error("Faça login para seguir.");
      const payload: {
        business_id: string;
        follower_user_id: string | null;
        follower_business_id: string | null;
      } = asBizId
        ? { business_id: businessId, follower_business_id: asBizId, follower_user_id: null }
        : { business_id: businessId, follower_user_id: user.id, follower_business_id: null };
      const { error } = await supabase.from("business_followers").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setPickerOpen(false);
      qc.invalidateQueries({ queryKey: ["business-followers", businessId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unfollow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_followers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setPickerOpen(false);
      qc.invalidateQueries({ queryKey: ["business-followers", businessId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Link
        to="/login"
        className="bg-card shadow-card font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <Heart className="size-4" /> Seguir
      </Link>
    );
  }

  const onlyUserOption = eligibleBizs.length === 0;
  if (onlyUserOption) {
    const isFollowing = !!myUserFollow;
    return (
      <button
        onClick={() =>
          isFollowing ? unfollow.mutate(myUserFollow!.id) : follow.mutate(null)
        }
        className={`shadow-card font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 ${
          isFollowing ? "bg-brand text-brand-foreground" : "bg-card"
        }`}
      >
        <Heart className={`size-4 ${isFollowing ? "fill-current" : ""}`} />
        {isFollowing ? "Seguindo" : "Seguir"}
        {count > 0 && <span className="opacity-70">· {count}</span>}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setPickerOpen((o) => !o)}
        className="w-full bg-card shadow-card font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <Heart className="size-4" />
        Seguir
        {count > 0 && <span className="opacity-70">· {count}</span>}
        <ChevronDown className="size-3" />
      </button>
      {pickerOpen && (
        <div className="absolute z-10 mt-1 right-0 left-0 bg-popover border border-border rounded-xl shadow-card p-1 text-sm">
          <button
            onClick={() =>
              myUserFollow ? unfollow.mutate(myUserFollow.id) : follow.mutate(null)
            }
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center justify-between"
          >
            <span>Como você mesmo</span>
            {myUserFollow && <span className="text-xs text-brand">Seguindo</span>}
          </button>
          {eligibleBizs.map((b) => {
            const followRow = (followers ?? []).find(
              (f) => f.follower_business_id === b.id
            );
            const following = myBizFollows.has(b.id);
            return (
              <button
                key={b.id}
                onClick={() =>
                  following && followRow ? unfollow.mutate(followRow.id) : follow.mutate(b.id)
                }
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center justify-between"
              >
                <span>Como {b.name}</span>
                {following && <span className="text-xs text-brand">Seguindo</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
