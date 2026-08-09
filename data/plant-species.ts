import type { PlantSpecies } from "@/types/plant";

export const PLANT_SPECIES: PlantSpecies[] = [
  {
    id: "royal-azalea",
    name: "산철쭉",
    scientificName: "Rhododendron schlippenbachii",
    description: "꽃잎 5장 · 잎 가장자리에 잔털",
    imageUrl: "/plants/royal-azalea.svg",
  },
  {
    id: "korean-azalea",
    name: "영산홍",
    scientificName: "Rhododendron yeongsanense",
    description: "꽃 안쪽 반점 · 잎이 더 작음",
    imageUrl: "/plants/korean-azalea.svg",
  },
  {
    id: "azalea",
    name: "진달래",
    scientificName: "Rhododendron mucronulatum",
    description: "잎보다 꽃이 먼저 피는 편",
    imageUrl: "/plants/azalea.svg",
  },
];
