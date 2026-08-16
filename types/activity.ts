export type ActivityDto = {
  id: string;
  type: "new_plant" | "level_up";
  collectionCardId: number | null;
  scientificName: string | null;
  displayName: string | null;
  level: number | null;
  createdAt: string;
};

export type ActivitiesResponseDto = { activities: ActivityDto[] };
