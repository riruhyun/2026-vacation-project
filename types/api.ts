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
    forest: boolean;
  };
};
