import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBirdPhotoUrls } from "@/lib/macaulay";
import { SUGGESTED_BIRDS } from "@/lib/suggested-birds";
import { OnboardingFlow } from "./OnboardingFlow";

export default async function Onboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: existing } = await supabase
    .from("life_list_entries")
    .select("species_code")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) redirect("/dashboard");

  const codes = SUGGESTED_BIRDS.map((b) => b.species_code);
  const photoUrls = await getBirdPhotoUrls(codes);
  const photoMap = Object.fromEntries(photoUrls);

  return <OnboardingFlow birds={SUGGESTED_BIRDS} photoUrls={photoMap} />;
}
