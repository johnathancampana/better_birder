"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  // formData contains multiple entries with name "bird" as JSON strings
  const birds = formData.getAll("bird").map((b) => JSON.parse(b as string)) as {
    species_code: string;
    common_name: string;
    scientific_name: string;
  }[];

  if (birds.length === 0) redirect("/onboarding");

  await supabase.from("life_list_entries").upsert(
    birds.map((b) => ({
      user_id: user.id,
      species_code: b.species_code,
      common_name: b.common_name,
      scientific_name: b.scientific_name,
    })),
    { onConflict: "user_id,species_code" }
  );

  revalidatePath("/dashboard");
  redirect("/dashboard?onboarded=1");
}
