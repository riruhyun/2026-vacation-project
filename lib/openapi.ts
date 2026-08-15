const jsonContent = (schema: object) => ({
  "application/json": { schema },
});

const successResponse = (description: string, schema: string) => ({
  description,
  content: jsonContent({ $ref: `#/components/schemas/${schema}` }),
});

const errorResponse = (description: string) => ({
  description,
  content: jsonContent({ $ref: "#/components/schemas/ApiFailure" }),
});

const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }] as const;

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "초록도감 API",
    version: "1.0.0",
    description:
      "초록도감 애플리케이션의 식물 판별, 관찰 기록, 수집 현황 및 프로필 API입니다.",
  },
  servers: [{ url: "/", description: "현재 애플리케이션" }],
  tags: [
    {
      name: "Auth",
      description:
        "Google is the only sign-up path. Email/password is an optional extra key added after signing in.",
    },
    { name: "System", description: "서버 상태 확인" },
    { name: "Plants", description: "식물 판별 및 상세 정보" },
    { name: "Collection", description: "사용자 관찰 기록과 수집 현황" },
    { name: "Profile", description: "사용자 프로필과 진행도" },
  ],
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Closed: sign up with Google instead",
        description:
          "Always refuses. Creating an account from an email and a password alone would let anyone claim an address they cannot read; Supabase merges accounts that share an email, so the claimer would join the owner's account once the owner signs in with Google. Sign in with Google, then add a password through POST /api/auth/password.",
        operationId: "signupWithEmail",
        deprecated: true,
        responses: {
          "403": errorResponse("Email signup is closed (reason: signup_closed)"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email",
        description:
          "Sets an HttpOnly session cookie. In Swagger, run this once and protected endpoints will automatically receive the cookie; no token copy is required.",
        operationId: "loginWithEmail",
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/LoginInput" }),
        },
        responses: {
          "200": successResponse("Login completed", "AuthResponse"),
          "400": errorResponse("Invalid input"),
          "401": errorResponse(
            "error.details.reason is not_registered or invalid_password",
          ),
          "403": errorResponse("Email confirmation required"),
          "409": errorResponse(
            "Google-only account. A site password must be set first (reason: google_only)",
          ),
          "429": errorResponse("Too many requests"),
          "500": errorResponse("Login processing failed"),
        },
      },
    },
    "/api/auth/password": {
      post: {
        tags: ["Auth"],
        summary: "Set a site-only password",
        description:
          "Adds an email/password key to the signed-in account. Sign-up happens through Google only, so this is the single way to enable email login. Requires an existing session on purpose: allowing it beforehand would let anyone claim someone else's address.",
        operationId: "setSitePassword",
        security: userSecurity,
        requestBody: {
          required: true,
          content: jsonContent({
            $ref: "#/components/schemas/SitePasswordInput",
          }),
        },
        responses: {
          "200": successResponse("Password set", "SitePasswordResponse"),
          "400": errorResponse("Invalid input"),
          "401": errorResponse("Sign-in required"),
          "500": errorResponse("Password update failed"),
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        description:
          "Revokes the current Supabase refresh session when possible and always removes the local session cookie.",
        operationId: "logout",
        security: [{}, ...userSecurity],
        responses: {
          "200": successResponse("Logout completed", "LogoutResponse"),
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "서버 상태 확인",
        description:
          "필수 외부 서비스 환경 변수의 설정 여부를 확인합니다. 외부 API를 실제로 호출하지는 않습니다.",
        operationId: "getHealth",
        responses: {
          "200": successResponse("서버 상태", "HealthResponse"),
        },
      },
    },
    "/api/profile": {
      patch: {
        tags: ["Profile"],
        summary: "Update nickname and featured plants",
        operationId: "updateProfile",
        security: userSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/UpdateProfileInput" }),
        },
        responses: {
          "200": successResponse("Updated profile", "ProfileResponse"),
          "400": errorResponse("Invalid nickname or featured plant selection"),
          "401": errorResponse("Login required"),
          "500": errorResponse("Profile update failed"),
        },
      },
      get: {
        tags: ["Profile"],
        summary: "프로필과 진행도 조회",
        operationId: "getProfile",
        security: userSecurity,
        responses: {
          "200": successResponse("프로필과 수집 통계", "ProfileResponse"),
          "401": errorResponse("유효한 사용자 ID가 없음"),
          "500": errorResponse("프로필 조회 실패"),
        },
      },
    },
    "/api/collection": {
      get: {
        tags: ["Collection"],
        summary: "식물 수집 현황 조회",
        operationId: "getCollection",
        security: userSecurity,
        responses: {
          "200": successResponse("수집 현황", "CollectionResponse"),
          "401": errorResponse("유효한 사용자 ID가 없음"),
          "500": errorResponse("수집 현황 조회 실패"),
        },
      },
    },
    "/api/plants/{id}": {
      get: {
        tags: ["Plants"],
        summary: "공식 식물 상세 조회",
        description:
          "사용자 ID를 함께 보내면 해당 사용자의 관찰 기록도 반환합니다.",
        operationId: "getPlant",
        security: [{}, ...userSecurity],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "공식 식물 ID",
            schema: { type: "integer", minimum: 1 },
            example: 1,
          },
        ],
        responses: {
          "200": successResponse("식물 상세와 사용자 관찰 기록", "PlantDetailResponse"),
          "400": errorResponse("잘못된 식물 ID"),
          "404": errorResponse("공식 식물을 찾을 수 없음"),
          "500": errorResponse("식물 상세 조회 실패"),
        },
      },
    },
    "/api/identify": {
      post: {
        tags: ["Plants"],
        summary: "사진으로 식물 판별",
        description:
          "JPG 또는 PNG 사진을 Pl@ntNet으로 판별하고 최대 3개의 후보를 반환합니다. 파일 크기는 최대 6MB입니다.",
        operationId: "identifyPlant",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "6MB 이하 JPG 또는 PNG 이미지",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": successResponse("식물 판별 후보", "IdentifyResponse"),
          "400": errorResponse("잘못된 이미지"),
          "422": errorResponse("사진에서 식물을 판별하지 못함"),
          "500": errorResponse("서버 설정 오류 또는 판별 처리 실패"),
          "502": errorResponse("Pl@ntNet 요청 실패"),
        },
      },
    },
    "/api/observations": {
      post: {
        tags: ["Collection"],
        summary: "관찰 기록 저장",
        description:
          "식물 사진을 저장하고 발견 횟수, 경험치 및 레벨을 갱신합니다. 파일 크기는 최대 6MB입니다.",
        operationId: "createObservation",
        security: userSecurity,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                oneOf: [
                  { required: ["plantId"] },
                  { required: ["scientificName", "displayName"] },
                ],
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "6MB 이하 JPG 또는 PNG 이미지",
                  },
                  plantId: {
                    type: "integer",
                    minimum: 1,
                    description: "공식 식물인 경우 사용하는 ID",
                  },
                  scientificName: {
                    type: "string",
                    description: "기타 식물인 경우 필요한 학명",
                  },
                  displayName: {
                    type: "string",
                    description: "기타 식물인 경우 필요한 표시 이름",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": successResponse("저장된 관찰 기록과 보상", "ObservationResponse"),
          "400": errorResponse("잘못된 이미지 또는 식물 정보"),
          "401": errorResponse("유효한 사용자 ID가 없음"),
          "404": errorResponse("공식 식물을 찾을 수 없음"),
          "500": errorResponse("관찰 기록 저장 실패"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Supabase access token",
      },
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "plant-access-token",
        description: "HttpOnly session cookie set by POST /api/auth/login",
      },
    },
    schemas: {
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", format: "password", minLength: 6 },
        },
      },
      SitePasswordInput: {
        type: "object",
        required: ["password"],
        properties: {
          password: { type: "string", format: "password", minLength: 6 },
        },
      },
      SitePasswordResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["hasSitePassword"],
            properties: { hasSitePassword: { type: "boolean", enum: [true] } },
          },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: [
              "user",
              "authenticated",
              "emailConfirmationRequired",
              "accessToken",
              "expiresAt",
            ],
            properties: {
              user: {
                type: "object",
                required: ["id", "email"],
                properties: {
                  id: { type: "string", format: "uuid" },
                  email: { type: "string", format: "email" },
                },
              },
              authenticated: { type: "boolean" },
              emailConfirmationRequired: { type: "boolean" },
              accessToken: { type: "string", nullable: true },
              expiresAt: { type: "integer", nullable: true },
            },
          },
        },
      },
      LogoutResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["authenticated"],
            properties: { authenticated: { type: "boolean", enum: [false] } },
          },
        },
      },
      UpdateProfileInput: {
        type: "object",
        minProperties: 1,
        properties: {
          nickname: { type: "string", minLength: 1, maxLength: 20 },
          featuredPlantIds: {
            type: "array",
            maxItems: 3,
            uniqueItems: true,
            items: { type: "integer", minimum: 1 },
          },
        },
      },
      ApiFailure: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", enum: [false] },
          error: {
            type: "object",
            required: ["message"],
            properties: {
              message: { type: "string", example: "요청을 처리하지 못했습니다." },
              details: {},
            },
          },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["status", "checkedAt", "services"],
            properties: {
              status: { type: "string", enum: ["ok"] },
              checkedAt: { type: "string", format: "date-time" },
              services: {
                type: "object",
                required: ["supabase", "plantNet", "forest"],
                properties: {
                  supabase: { type: "boolean" },
                  plantNet: { type: "boolean" },
                  forest: { type: "boolean" },
                },
              },
            },
          },
        },
      },
      ProfileResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["profile", "stats", "recentActivities"],
            properties: {
              profile: { $ref: "#/components/schemas/Profile" },
              stats: { $ref: "#/components/schemas/ProfileStats" },
              recentActivities: {
                type: "array",
                items: { $ref: "#/components/schemas/ActivityLog" },
              },
            },
          },
        },
      },
      Profile: {
        type: "object",
        required: ["nickname", "xp", "level", "currentLevelXp", "xpToNextLevel"],
        properties: {
          nickname: { type: "string", nullable: true, example: "초록탐험가" },
          xp: { type: "integer", minimum: 0, example: 425 },
          level: { type: "integer", minimum: 1, example: 2 },
          currentLevelXp: { type: "integer", minimum: 0, example: 25 },
          xpToNextLevel: { type: "integer", minimum: 0, example: 425 },
        },
      },
      ProfileStats: {
        type: "object",
        required: [
          "totalObservations",
          "officialPlants",
          "otherPlants",
          "completionRate",
          "lastObservedAt",
        ],
        properties: {
          totalObservations: { type: "integer", minimum: 0, example: 7 },
          officialPlants: { type: "integer", minimum: 0, example: 4 },
          otherPlants: { type: "integer", minimum: 0, example: 1 },
          completionRate: { type: "integer", minimum: 0, maximum: 100, example: 8 },
          lastObservedAt: { type: "string", nullable: true, format: "date-time" },
        },
      },
      ActivityLog: {
        type: "object",
        required: [
          "id",
          "type",
          "scientificName",
          "displayName",
          "level",
          "levelTitle",
          "createdAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["new_plant", "level_up"] },
          scientificName: { type: "string", nullable: true },
          displayName: { type: "string", nullable: true },
          level: { type: "integer", nullable: true },
          levelTitle: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CollectionResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["summary", "officialPlants", "otherFindings"],
            properties: {
              summary: { $ref: "#/components/schemas/CollectionSummary" },
              officialPlants: {
                type: "array",
                items: { $ref: "#/components/schemas/CollectionPlant" },
              },
              otherFindings: {
                type: "array",
                items: { $ref: "#/components/schemas/OtherFinding" },
              },
            },
          },
        },
      },
      CollectionSummary: {
        type: "object",
        required: ["total", "collected", "totalObservations", "completionRate"],
        properties: {
          total: { type: "integer", minimum: 0, example: 50 },
          collected: { type: "integer", minimum: 0, example: 4 },
          totalObservations: { type: "integer", minimum: 0, example: 7 },
          completionRate: { type: "integer", minimum: 0, maximum: 100, example: 8 },
        },
      },
      CollectionPlant: {
        type: "object",
        required: [
          "id",
          "koreanName",
          "scientificName",
          "stage",
          "rarity",
          "collected",
          "observationCount",
          "representativeImageUrl",
          "firstObservedAt",
          "lastObservedAt",
        ],
        properties: {
          id: { type: "integer", minimum: 1, example: 1 },
          koreanName: { type: "string", example: "질경이" },
          scientificName: { type: "string", example: "Plantago asiatica" },
          stage: { $ref: "#/components/schemas/PlantStage" },
          rarity: { $ref: "#/components/schemas/Rarity" },
          collected: { type: "boolean" },
          observationCount: { type: "integer", minimum: 0 },
          representativeImageUrl: { type: "string", nullable: true, format: "uri" },
          firstObservedAt: { type: "string", nullable: true, format: "date-time" },
          lastObservedAt: { type: "string", nullable: true, format: "date-time" },
        },
      },
      OtherFinding: {
        type: "object",
        required: [
          "scientificName",
          "displayName",
          "observationCount",
          "representativeImageUrl",
          "lastObservedAt",
        ],
        properties: {
          scientificName: { type: "string" },
          displayName: { type: "string" },
          observationCount: { type: "integer", minimum: 1 },
          representativeImageUrl: { type: "string", format: "uri" },
          lastObservedAt: { type: "string", format: "date-time" },
        },
      },
      PlantDetailResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["plant", "userCollection"],
            properties: {
              plant: { $ref: "#/components/schemas/PlantDetail" },
              userCollection: { $ref: "#/components/schemas/UserPlantCollection" },
            },
          },
        },
      },
      PlantDetail: {
        type: "object",
        required: [
          "id",
          "official",
          "koreanName",
          "scientificName",
          "stage",
          "rarity",
          "description",
          "informationSource",
          "informationSourceUrl",
        ],
        properties: {
          id: { type: "integer", minimum: 1 },
          official: { type: "boolean", enum: [true] },
          koreanName: { type: "string", example: "질경이" },
          scientificName: { type: "string", example: "Plantago asiatica" },
          stage: { $ref: "#/components/schemas/PlantStage" },
          rarity: { $ref: "#/components/schemas/Rarity" },
          description: { type: "string", nullable: true },
          informationSource: { type: "string", example: "산림청 국가생물종지식정보시스템" },
          informationSourceUrl: {
            type: "string",
            format: "uri",
            example: "https://www.data.go.kr/data/15143513/openapi.do",
          },
        },
      },
      UserPlantCollection: {
        type: "object",
        required: ["collected", "observationCount", "observations"],
        properties: {
          collected: { type: "boolean" },
          observationCount: { type: "integer", minimum: 0 },
          observations: {
            type: "array",
            items: { $ref: "#/components/schemas/PlantObservationSummary" },
          },
        },
      },
      PlantObservationSummary: {
        type: "object",
        required: ["id", "imageUrl", "observedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          imageUrl: { type: "string", format: "uri" },
          observedAt: { type: "string", format: "date-time" },
        },
      },
      IdentifyResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["candidates", "remainingRequests"],
            properties: {
              candidates: {
                type: "array",
                maxItems: 3,
                items: { $ref: "#/components/schemas/IdentifyCandidate" },
              },
              remainingRequests: { type: "integer", nullable: true, minimum: 0 },
            },
          },
        },
      },
      IdentifyCandidate: {
        type: "object",
        required: [
          "plantId",
          "official",
          "matchType",
          "koreanName",
          "description",
          "scientificName",
          "scientificNameWithAuthor",
          "family",
          "score",
          "stage",
          "rarity",
          "imageUrl",
          "imageAttribution",
        ],
        properties: {
          plantId: { type: "integer", nullable: true, minimum: 1 },
          official: { type: "boolean" },
          matchType: { type: "string", nullable: true, enum: ["exact"] },
          koreanName: { type: "string" },
          description: { type: "string", nullable: true },
          scientificName: { type: "string" },
          scientificNameWithAuthor: { type: "string" },
          family: { type: "string", nullable: true },
          score: { type: "number", minimum: 0, maximum: 1 },
          stage: { type: "integer", nullable: true, enum: [1, 2, 3] },
          rarity: {
            type: "string",
            nullable: true,
            enum: ["common", "uncommon", "rare"],
          },
          imageUrl: { type: "string", nullable: true, format: "uri" },
          imageAttribution: { type: "string", nullable: true },
        },
      },
      ObservationResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["result", "observation", "reward"],
            properties: {
              result: { type: "string", enum: ["new", "duplicate"] },
              observation: { $ref: "#/components/schemas/Observation" },
              reward: { $ref: "#/components/schemas/ObservationReward" },
            },
          },
        },
      },
      Observation: {
        type: "object",
        required: [
          "id",
          "plantId",
          "scientificName",
          "displayName",
          "imagePath",
          "observedAt",
          "imageUrl",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          plantId: { type: "integer", nullable: true, minimum: 1 },
          scientificName: { type: "string" },
          displayName: { type: "string" },
          imagePath: { type: "string" },
          observedAt: { type: "string", format: "date-time" },
          imageUrl: { type: "string", format: "uri" },
        },
      },
      ObservationReward: {
        type: "object",
        required: ["xp", "totalXp", "level", "leveledUp", "plantCount"],
        properties: {
          xp: { type: "integer", minimum: 0 },
          totalXp: { type: "integer", minimum: 0 },
          level: { type: "integer", minimum: 1 },
          leveledUp: { type: "boolean" },
          plantCount: { type: "integer", minimum: 1 },
        },
      },
      PlantStage: { type: "integer", enum: [1, 2, 3] },
      Rarity: { type: "string", enum: ["common", "uncommon", "rare"] },
    },
  },
} as const;
