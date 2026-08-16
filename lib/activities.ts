import type { ActivityDto } from "@/types/activity";

export type ActivityRow = {
  id: string;
  type: "new_plant" | "level_up";
  collection_card_id: number | null;
  scientific_name: string | null;
  display_name: string | null;
  level: number | null;
  created_at: string;
};

export function parseActivityLimit(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 20 ? parsed : 3;
}

export function toActivityDto(row: ActivityRow): ActivityDto {
  return {
    id: row.id,
    type: row.type,
    collectionCardId: row.collection_card_id,
    scientificName: row.scientific_name,
    displayName: row.display_name,
    level: row.level,
    createdAt: row.created_at,
  };
}
