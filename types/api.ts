import type { PlantCandidate, PlantPart } from "./plant";

export interface IdentifyRequest {
  image: string;
  part?: PlantPart;
}

export interface IdentifyResponse {
  candidates: PlantCandidate[];
  success: boolean;
}

// 모든 API 응답의 공통 포장입니다. 서버는 lib/server/http.ts에서 이 모양을 만듭니다.
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type HealthResponse = {
  status: "ok";
  checkedAt: string;
  services: {
    supabase: boolean;
    plantNet: boolean;
    iNaturalist: boolean;
  };
};
