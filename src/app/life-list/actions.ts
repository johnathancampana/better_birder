"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addBirdToLifeList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const species_code = formData.get("species_code") as string;
  const common_name = formData.get("common_name") as string;
  const scientific_name = formData.get("scientific_name") as string;

  const { error } = await supabase.from("life_list_entries").upsert(
    {
      user_id: user.id,
      species_code,
      common_name,
      scientific_name,
      date_first_seen: new Date().toISOString().split("T")[0],
    },
    { onConflict: "user_id,species_code" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/life-list");
}

export async function removeBirdFromLifeList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const species_code = formData.get("species_code") as string;

  const { error } = await supabase
    .from("life_list_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("species_code", species_code);

  if (error) throw new Error(error.message);

  revalidatePath("/life-list");
}

export async function searchEbirdSpecies(query: string) {
  if (!query || query.length < 2) return [];

  const apiKey = process.env.EBIRD_API_KEY;

  // If no eBird API key, fall back to searching the suggested birds list
  if (!apiKey || apiKey === "your-ebird-api-key") {
    const { SUGGESTED_BIRDS } = await import("@/lib/suggested-birds");
    const lower = query.toLowerCase();
    return SUGGESTED_BIRDS.filter(
      (b) =>
        b.common_name.toLowerCase().includes(lower) ||
        b.scientific_name.toLowerCase().includes(lower) ||
        b.species_code.toLowerCase().includes(lower)
    ).slice(0, 10);
  }

  const res = await fetch(
    `https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&cat=species&locale=en`,
    { headers: { "X-eBirdApiToken": apiKey }, next: { revalidate: 86400 } }
  );

  if (!res.ok) return [];

  const taxonomy: Array<{
    speciesCode: string;
    comName: string;
    sciName: string;
    familyComName: string;
  }> = await res.json();

  const lower = query.toLowerCase();
  return taxonomy
    .filter(
      (t) =>
        t.comName.toLowerCase().includes(lower) ||
        t.sciName.toLowerCase().includes(lower) ||
        t.speciesCode.toLowerCase().includes(lower)
    )
    .slice(0, 10)
    .map((t) => ({
      species_code: t.speciesCode,
      common_name: t.comName,
      scientific_name: t.sciName,
      family: t.familyComName,
    }));
}
