"use client";

import { useFormStatus } from "react-dom";
import {
  addBirdToLifeList,
  removeBirdFromLifeList,
} from "@/app/life-list/actions";

type Bird = {
  species_code: string;
  common_name: string;
  scientific_name: string;
};

function SubmitButton({ isAdded }: { isAdded: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        isAdded
          ? "bg-danger/10 text-danger hover:bg-danger/20"
          : "bg-forest-green/10 text-forest-green hover:bg-forest-green/20"
      } disabled:opacity-50`}
    >
      {pending ? "..." : isAdded ? "Remove" : "Add"}
    </button>
  );
}

export function BirdAddButton({
  bird,
  isAdded,
}: {
  bird: Bird;
  isAdded: boolean;
}) {
  const action = isAdded ? removeBirdFromLifeList : addBirdToLifeList;

  return (
    <form action={action}>
      <input type="hidden" name="species_code" value={bird.species_code} />
      <input type="hidden" name="common_name" value={bird.common_name} />
      <input
        type="hidden"
        name="scientific_name"
        value={bird.scientific_name}
      />
      <SubmitButton isAdded={isAdded} />
    </form>
  );
}
