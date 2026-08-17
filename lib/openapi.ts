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

const sessionSecurity = [{ SessionCookie: [] }] as const;

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
    { name: "System", description: "서버 상태 확인" },
    { name: "Auth", description: "회원가입과 로그인" },
    { name: "Plants", description: "식물 판별 및 상세 정보" },
    { name: "Collection", description: "사용자 관찰 기록과 수집 현황" },
    { name: "Profile", description: "사용자 프로필과 진행도" },
  ],
  paths: {
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
    "/api/auth/sign-up": {
      post: {
        tags: ["Auth"],
        summary: "회원가입",
        description:
          "닉네임, 이메일, 비밀번호를 한 번에 받습니다. 닉네임은 대소문자를 무시하고 중복될 수 없습니다.",
        operationId: "signUp",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["nickname", "email", "password"],
            properties: {
              nickname: {
                type: "string",
                minLength: 2,
                maxLength: 16,
                example: "초록탐험가",
              },
              email: { type: "string", format: "email" },
              password: { type: "string", minLength: 6, format: "password" },
            },
          }),
        },
        responses: {
          "200": successResponse("가입 완료. 세션 쿠키가 설정됩니다.", "EmptyResponse"),
          "400": errorResponse("입력값이 올바르지 않음"),
          "409": errorResponse("닉네임 중복 또는 이메일 확인 설정 필요"),
        },
      },
    },
    "/api/auth/sign-in": {
      post: {
        tags: ["Auth"],
        summary: "로그인",
        operationId: "signIn",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password" },
            },
          }),
        },
        responses: {
          "200": successResponse("로그인 완료. 세션 쿠키가 설정됩니다.", "EmptyResponse"),
          "400": errorResponse("이메일 또는 비밀번호가 올바르지 않음"),
        },
      },
    },
    "/api/auth/sign-out": {
      post: {
        tags: ["Auth"],
        summary: "로그아웃",
        operationId: "signOut",
        security: sessionSecurity,
        responses: {
          "200": successResponse("로그아웃 완료. 세션 쿠키가 삭제됩니다.", "EmptyResponse"),
        },
      },
    },
    "/api/profile": {
      get: {
        tags: ["Profile"],
        summary: "프로필과 진행도 조회",
        operationId: "getProfile",
        security: sessionSecurity,
        responses: {
          "200": successResponse("프로필과 수집 통계", "ProfileResponse"),
          "401": errorResponse("로그인이 필요함"),
          "500": errorResponse("프로필 조회 실패"),
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "닉네임과 프로필 사진 수정",
        description:
          "두 항목 모두 선택입니다. 보낸 것만 반영하며, 아무것도 보내지 않으면 400을 돌려줍니다.",
        operationId: "updateProfile",
        security: sessionSecurity,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  nickname: {
                    type: "string",
                    minLength: 2,
                    maxLength: 16,
                    description: "앞뒤 공백은 제거되고 연속 공백은 하나로 줄어듭니다.",
                  },
                  avatar: {
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
          "200": successResponse("수정된 닉네임과 사진 주소", "UpdateProfileResponse"),
          "400": errorResponse("변경할 내용이 없거나 입력값이 올바르지 않음"),
          "401": errorResponse("로그인이 필요함"),
          "404": errorResponse("프로필을 찾을 수 없음"),
          "409": errorResponse("이미 사용 중인 닉네임"),
          "500": errorResponse("프로필 수정 실패"),
        },
      },
    },
    "/api/profile/avatar": {
      delete: {
        tags: ["Profile"],
        summary: "프로필 사진 삭제",
        description:
          "사진을 지우고 기본 사진으로 되돌립니다. 이미 기본 사진이어도 200을 돌려줍니다.",
        operationId: "deleteAvatar",
        security: sessionSecurity,
        responses: {
          "200": successResponse("사진이 지워진 프로필", "UpdateProfileResponse"),
          "401": errorResponse("로그인이 필요함"),
          "404": errorResponse("프로필을 찾을 수 없음"),
          "500": errorResponse("프로필 사진 삭제 실패"),
        },
      },
    },
    "/api/activities": {
      get: {
        tags: ["Profile"],
        summary: "최근 활동 조회",
        operationId: "getActivities",
        security: sessionSecurity,
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            description: "가져올 활동 개수",
            schema: { type: "integer", minimum: 1, default: 3 },
          },
        ],
        responses: {
          "200": successResponse("최근 활동 목록", "ActivitiesResponse"),
          "401": errorResponse("로그인이 필요함"),
          "500": errorResponse("활동 기록 조회 실패"),
        },
      },
    },
    "/api/collection": {
      get: {
        tags: ["Collection"],
        summary: "식물 수집 현황 조회",
        operationId: "getCollection",
        security: sessionSecurity,
        responses: {
          "200": successResponse("수집 현황", "CollectionResponse"),
          "401": errorResponse("로그인이 필요함"),
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
        security: [{}, { SessionCookie: [] }],
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
                  organ: {
                    type: "string",
                    enum: ["auto", "flower", "leaf", "fruit"],
                    default: "auto",
                    description: "판별할 식물 부위",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": successResponse("식물 판별 후보", "IdentifyResponse"),
          "400": errorResponse("잘못된 이미지 또는 식물 부위"),
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
        security: sessionSecurity,
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
          "401": errorResponse("로그인이 필요함"),
          "404": errorResponse("공식 식물을 찾을 수 없음"),
          "500": errorResponse("관찰 기록 저장 실패"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      SessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "sb-access-token",
        description:
          "로그인 시 설정되는 Supabase Auth 세션 쿠키입니다. 브라우저가 자동으로 함께 보냅니다.",
      },
    },
    schemas: {
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
            required: ["profile", "stats"],
            properties: {
              profile: { $ref: "#/components/schemas/Profile" },
              stats: { $ref: "#/components/schemas/ProfileStats" },
            },
          },
        },
      },
      EmptyResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: { type: "object" },
        },
      },
      UpdateProfileResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["profile"],
            properties: {
              profile: {
                type: "object",
                required: ["nickname", "avatarUrl"],
                properties: {
                  nickname: { type: "string", example: "초록탐험가" },
                  avatarUrl: { type: "string", nullable: true, format: "uri" },
                },
              },
            },
          },
        },
      },
      ActivitiesResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {
            type: "object",
            required: ["activities"],
            properties: {
              activities: {
                type: "array",
                items: { $ref: "#/components/schemas/Activity" },
              },
            },
          },
        },
      },
      Activity: {
        type: "object",
        required: [
          "id",
          "type",
          "collectionCardId",
          "scientificName",
          "displayName",
          "level",
          "createdAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["new_plant", "level_up"] },
          collectionCardId: { type: "integer", nullable: true, minimum: 1 },
          scientificName: { type: "string", nullable: true },
          displayName: { type: "string", nullable: true },
          level: { type: "integer", nullable: true, minimum: 1 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Profile: {
        type: "object",
        required: [
          "nickname",
          "avatarUrl",
          "xp",
          "level",
          "currentLevelXp",
          "xpToNextLevel",
        ],
        properties: {
          nickname: { type: "string", nullable: true, example: "초록탐험가" },
          avatarUrl: {
            type: "string",
            nullable: true,
            format: "uri",
            description: "설정 전이면 null입니다.",
          },
          xp: { type: "integer", minimum: 0, example: 425 },
          level: { type: "integer", minimum: 1, example: 3 },
          currentLevelXp: { type: "integer", minimum: 0, example: 175 },
          xpToNextLevel: { type: "integer", minimum: 0, example: 200 },
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
        required: [
          "xp",
          "breakdown",
          "totalXp",
          "level",
          "currentLevelXp",
          "xpToNextLevel",
          "leveledUp",
          "plantCount",
        ],
        properties: {
          xp: { type: "integer", minimum: 0, example: 125 },
          breakdown: {
            type: "array",
            description: "지급 사유별 내역. xp는 이 목록의 합과 같습니다.",
            items: { $ref: "#/components/schemas/XpEvent" },
          },
          totalXp: { type: "integer", minimum: 0, example: 345 },
          level: { type: "integer", minimum: 1, example: 3 },
          currentLevelXp: { type: "integer", minimum: 0, example: 95 },
          xpToNextLevel: { type: "integer", minimum: 0, example: 200 },
          leveledUp: { type: "boolean" },
          plantCount: { type: "integer", minimum: 1 },
        },
      },
      XpEvent: {
        type: "object",
        required: ["type", "label", "xp"],
        properties: {
          type: {
            type: "string",
            enum: [
              "observation",
              "first_discovery",
              "rarity_common",
              "rarity_uncommon",
              "rarity_rare",
            ],
            example: "first_discovery",
          },
          label: { type: "string", example: "첫 발견" },
          xp: { type: "integer", minimum: 0, example: 90 },
        },
      },
      PlantStage: { type: "integer", enum: [1, 2, 3] },
      Rarity: { type: "string", enum: ["common", "uncommon", "rare"] },
    },
  },
} as const;
