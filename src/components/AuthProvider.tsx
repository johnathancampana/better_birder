import { createClient } from "@/lib/supabase/server";
import { NavBar } from "./NavBar";

export async function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, current_streak")
      .eq("id", user.id)
      .single();

    navUser = {
      displayName:
        profile?.display_name || user.user_metadata?.display_name || "Birder",
      streak: profile?.current_streak || 0,
    };
  }

  return (
    <>
      <NavBar user={navUser} />
      {children}
    </>
  );
}
