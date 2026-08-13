# Frontend Unification Design

## Goal

Unify the frontend architecture, mock data, domain identifiers, styling, and identify flow so the application is internally consistent now and can later switch to the existing Supabase-backed API with minimal screen changes.

This work covers the full frontend and the backend contracts directly shared with it. It does not connect authentication or replace mock reads with live API calls.

## Constraints

- Work on `develop/hyun` only after the implementation plan is approved.
- Do not use `localStorage` or introduce a global state library.
- Use `sessionStorage` only for the current identify session: draft image, selected organ, candidates, and observation result.
- Keep mock application data read-only. A completed mock identify flow does not mutate the collection, home, or profile fixtures.
- Keep the file count small. Do not add repository interfaces, factories, barrel files, or one-file-per-query data modules.
- Preserve existing Supabase schema and reward RPC behavior.
- Prefer removing obsolete code over retaining commented-out implementations.

## Architecture

### Source data

`data/plants.ts` is the only official plant catalog. It contains all 50 official plants and only stable identity and progression fields:

```ts
export type OfficialPlant = {
  id: number;
  stage: PlantStage;
  koreanName: string;
  scientificName: string;
  rarity: RarityCode;
};
```

It does not contain `slug`, `category`, `season`, description, or image URLs.

- Descriptions and enriched Korean names come from the normalized Korea Forest Service detail boundary.
- Images come from user observations.
- Observation time is stored only as the ISO `observedAt` timestamp.
- The selected image organ is an identify-request input, not a plant category.

`data/mock.ts` contains the minimum read-only fixtures needed to reproduce backend contracts:

- profile data;
- observations;
- normalized forest details;
- PlantNet identify candidates;
- new and duplicate observation response scenarios.

Mock objects use the same DTO field names and shapes returned by the application API. They do not introduce parallel screen-only entity models when the DTO already expresses the data.

### Data access

`lib/data.ts` is the only mock-data access point used by pages and client flows. Its functions are asynchronous even though fixtures are local:

```ts
getHomeData()
getCollectionData()
getProfileData()
getPlantDetail(id)
getFindingDetail(scientificName)
searchPlants(query)
getMockIdentifyResult(organ)
getMockObservationResult(candidate)
```

It combines the official catalog, observations, profile, and normalized external details. Collection summaries, recent activity, representative images, observation counts, and completion rates are derived instead of separately hard-coded.

When the backend is connected, `lib/data.ts` becomes the replacement boundary and can delegate to `lib/api.ts` while preserving page-to-screen props.

### Page and screen responsibilities

The default structure is:

```text
app/<route>/page.tsx
  -> parse params and query state
  -> await lib/data
  -> choose notFound/redirect/screen

components/<feature>/<Feature>Screen.tsx
  -> render passed data
  -> own local interaction state
```

Screens do not import `data/mock.ts` or `data/plants.ts`. One-line re-export files are removed. A subcomponent gets its own file only when it has meaningful independent responsibility or is reused. Small one-screen elements stay inside their screen file.

## Domain and API contracts

### Plant identity

Official plants use numeric IDs everywhere:

- `/plants/1`;
- collection cards;
- search results;
- identify candidates;
- observation requests.

`PlantSlug` and slug-based lookup are removed.

Unofficial findings currently have no database ID and are grouped by `user_id + scientific_name`. Their frontend route is:

```text
/findings/[scientificName]
```

The scientific name is URL-encoded. A future backend endpoint can use the same identity without creating a temporary slug.

### PlantNet organ

Rename `PlantPart` to `PlantOrgan` and retain the values supported by the current UI and PlantNet:

```ts
type PlantOrgan = "auto" | "flower" | "leaf" | "fruit";
```

The selected value is sent through `identifyPlant(image, organ)`, validated in `/api/identify`, and appended to PlantNet form data as `organs`. `bark` is not added because it is a new UI feature outside this scope.

### Type simplification

Keep types that constrain valid domain or API states:

- `IdentifyStep`;
- DTOs;
- `PlantStage`, `RarityCode`, `PlantOrgan`;
- identify response and observation response discriminants.

Remove types that duplicate those contracts or exist only for obsolete mock structures:

- `PlantSpecies`;
- `CollectedPlant`;
- `CollectionSummary`;
- `UserProgress`;
- `NewPlantRewardViewModel`;
- `DuplicateObservationViewModel`;
- duplicate result types;
- `PlantCategory` and `PlantSlug`.

Remove `CandidateCardViewModel` and render from `IdentifyCandidateDto`. Keep a small pure confidence formatter in the candidate screen only if the percentage calculation is used more than once.

## Collection and plant details

The collection has two top-level tabs only:

```text
Official catalog (50) | Other findings
```

No flower/grass/tree category and no collected/uncollected subfilter are added.

Official cards follow these rules:

- all 50 plants always appear in numeric ID order;
- collected plants show Korean name, user representative image, rarity, and observation count;
- uncollected plants show their Korean name and a locked question-mark image area;
- uncollected cards are not links and cannot open details;
- direct access to an uncollected official detail returns `notFound()`.

Other findings contain only observations whose scientific names are not in the official catalog. They show the user image, display name, scientific name, and observation count, and link to `/findings/[scientificName]`.

Official and unofficial detail screens use normalized forest details plus observation images. Missing optional descriptions display a concise fallback instead of exposing provider-specific null handling in the screen.

## Search

One screen supports two explicit URL modes:

```text
/search
/search?mode=identify
```

General search searches the official 50-plant catalog. Collected results link to official details. Uncollected results remain locked and cannot open details.

Identify-mode search is reached when none of the PlantNet candidates is suitable. It lets the user manually select an official plant, including an uncollected one, and continue to the mock observation result. It does not permit arbitrary unofficial-name entry.

Unofficial PlantNet candidates can still be selected from the candidate screen and saved using scientific name plus display name.

## Identify flow

The complete flow stays under `/identify`:

```ts
type IdentifyStep =
  | "confirm"
  | "analyzing"
  | "candidates"
  | "failed"
  | "result";
```

The separate `/identify/result/new` and `/identify/result/duplicate` routes are removed. `IdentifyResultScreen.tsx` receives `CreateObservationResponseDto` and branches on `result: "new" | "duplicate"`. New and duplicate content can be private functions in the same file; their duplicated view models, pages, shell, mocks, and CSS modules are removed.

Session lifetime:

1. Entering capture or starting a new capture clears stale candidates and result.
2. Capturing/selecting an image saves the draft and organ.
3. Analysis saves the identify response.
4. Candidate selection or identify-mode search creates and saves a mock `CreateObservationResponseDto`.
5. `/identify?step=result` renders the matching result content.
6. Continuing to collection clears the entire identify session.

If required draft, candidates, or result data is absent, redirect to `/capture` rather than rendering an impossible state.

## Styling and components

### Styling rules

- Use Tailwind for layout, spacing, typography, responsive behavior, and state styling.
- Define repeated design values in `app/globals.css` using semantic role names.
- Use inline styles only for runtime-calculated values such as progress width or SVG circumference.
- Remove screen-wide CSS modules from identify results; retain only a small global keyframe if a decoration truly requires it.
- Replace undefined legacy variables and repeated literal palette values with semantic tokens.

Core tokens include:

```text
--color-background
--color-surface
--color-primary
--color-primary-strong
--color-accent
--color-text
--color-text-muted
--color-border
--color-info-surface
--color-placeholder
--radius-card
--radius-control
--radius-pill
```

Color names describe roles rather than Figma swatch names such as `deep`, `lime`, or `sun`.

### Shared components

Retain only components with actual reuse or meaningful shared behavior:

- `Button` with primary, secondary, and ghost variants plus disabled/focus states;
- `PageHeader` with normal and identify-flow variants;
- `BottomNav`;
- `ProgressBar`;
- `PlantCard`;
- `RarityBadge`;
- `PlantPlaceholder`.

Remove thin wrappers such as separate primary/secondary button files. Remove unused common components when their replacement is clearer inside one screen. Merge duplicated progress, badge, header, button, and preview implementations into the selected shared component.

Use `@remixicon/react` imports and remove the Remix Icon CDN stylesheet and string-based icon class construction.

Static public images use `next/image`. User data URLs and external PlantNet images may use `<img>` with narrowly scoped lint exceptions.

## Incomplete features

- Email/password login remains a mock navigation.
- Google login and signup remain visible but use real disabled semantics and a clear "coming soon" label.
- The profile settings action is hidden and replaced with a concise auth-related TODO at the header call site.
- `/settings` remains reserved but redirects to `/profile` until the profile update and account contracts exist.
- No settings UI, authentication integration, profile mutation, notification preference, or account management is added.

## Cleanup scope

Remove or merge obsolete sources after consumers migrate:

- `data/official-plants.ts`;
- `data/plant-species.ts`;
- `data/mock-plants.ts`;
- `app/profile/ProfileScreen.tsx`;
- `app/identify/result/**`;
- unused UI component files;
- unused result-specific and starter public assets.

Public assets are removed only after a final reference search proves they are unused.

The cleanup criterion is not minimum file count by itself. Each surviving concept should have one source of truth, one representative type, and one representative component.

## Error and empty states

- Unknown official ID: `notFound()`.
- Unknown unofficial scientific name: `notFound()`.
- Uncollected official detail accessed directly: `notFound()`.
- Missing identify session data: redirect to `/capture`.
- Camera unavailable: disable capture and direct the user to gallery selection.
- Remove the existing full-page collection empty state. With no observations, the official tab still renders all 50 locked cards and the other-findings tab renders its own concise empty message.
- No route-specific loading/error files are added for immediate local mock reads.

## Testing and verification

Add Vitest with a single focused `lib/data.test.ts` file. It verifies:

- the official catalog contains exactly 50 unique numeric IDs and scientific names;
- official collection entries are always returned in ID order;
- collected state, representative image, and observation count are derived from observations;
- nonofficial observations are classified as other findings;
- home, collection, and profile totals agree because they use one source;
- official ID and unofficial scientific-name detail lookup;
- search behavior;
- new and duplicate mock observation results;
- the selected `PlantOrgan` is represented in mock identify behavior.

Do not add component-test or E2E frameworks in this pass. Final verification is:

```text
vitest
typecheck
lint
production build
manual route smoke test
```

Manual smoke-test paths cover home, collection tabs and card states, official and unofficial details, both search modes, the complete gallery identify flow through both result variants, disabled login actions, and settings redirect.

## Success criteria

- The official 50-plant catalog has one source file.
- Read-only mock fixtures have one source file.
- Screens do not import raw mock or catalog files.
- All screen data is obtained through async functions in `lib/data.ts`.
- Official relationships use numeric IDs; unofficial findings use scientific names.
- Home, collection, and profile are internally consistent.
- The complete new/duplicate result flow lives under `/identify`.
- The selected organ reaches PlantNet's `organs` request field.
- Styling is semantic-token and Tailwind based, with static inline styles and result CSS modules removed.
- Obsolete types, components, routes, and assets are removed only after consumers migrate.
- Core data tests, typecheck, lint, and production build pass.
