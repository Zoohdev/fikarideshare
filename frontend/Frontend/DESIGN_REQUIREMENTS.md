# FIKA — Premium Redesign: Design Requirements (Hi-Fi)

## 1. Purpose

This document briefs a Hi-Fi visual redesign of FIKA's map-centric screens (rider home, driver home, available rides, ride tracking) and a pass to eliminate remaining hardcoded/placeholder data across those screens. It assumes the design-system foundation already shipped in Phase 1 (`constants/styles.js`, `components/Button.js`, `TextField.js`, `Card.js`, `StatusBadge.js`) and extends it toward a **premium** visual language, plus a **colorful, characterful** map in place of the current monochrome theme.

Out of scope: backend logic changes (the map/ride-booking data flow already works end-to-end — see Phase 1 notes), KYC/vehicles/support/notifications screens (covered in Phase 2), Stripe/payments flows.

## 2. Current State (baseline, for context)

- **Map theme** (`constants/mapTheme.js`): a deliberately monochrome Uber-style theme — neutral gray geometry (`#ebebeb`), white roads with gray hairlines, muted sage parks (`#d2e8d4`), grayish-blue water (`#a9cdd9`), all POI icons hidden. This is the thing to move away from.
- **Markers**: driver shown via `AnimatedDriverMarker.js` rendering a generic `car-marker.png` (52×52, rotates with heading). Rider/pickup shown as a plain green circle (`#22C55E`) with a person icon. Dropoff shown as a flat `destination.png` image. No elevation, glow, or brand character.
- **Design tokens**: FIKA teal `#083328` (primary) and orange `#FF8C00` (secondary), Montserrat Medium/SemiBold/Bold, flat `Card`/`Button` components with thin borders (Phase 1's "Uber-structural, FIKA-colored" direction).
- **Target screens for this redesign**: `app/(tabs)/home/homeScreen.js`, `app/(driverTabs)/home/homeScreen.js`, `app/availableRides/availableRidesScreen.js`, `app/rideTracking/rideTrackingScreen.js`, `app/rideTracking/riderInTripScreen.js`, and their marker components in `app/rideTracking/components/`.

## 3. Visual Language: "Premium Feel"

### 3.1 Color palette (evolves FIKA's existing colors, doesn't replace them)

| Token | Old value | New premium value | Use |
|---|---|---|---|
| `primaryColor` | `#083328` | `#0A2E24` (deepened, slightly richer near-black teal) | Headers, primary surfaces, driver markers |
| `secondaryColor` | `#FF8C00` | `#E8A33D` (warm gold-amber, less "traffic-cone," more "metallic") | Primary CTAs, highlights, accent icons |
| *(new)* `goldAccent` | — | `#D4AF37` (true metallic gold) | Premium badges, rating stars, dividers, subtle borders on elevated cards |
| *(new)* `creamBackground` | — | `#FAF7F2` (warm ivory, replaces stark white/`#F4F4F4` body background) | Screen backgrounds, bottom sheets — warmer than the current flat gray |
| `blackColor` | `#0f1111` | `#1C1C1E` (warm charcoal, not pure black) | Primary text |
| *(new)* `platinumGray` | — | `#C9C9C9` | Dividers, inactive states, map road fills |
| `redColor` | `#D24036` | keep as-is | Errors, SOS, destructive actions |
| `greenColor` | `#033024` | keep as-is | Success states |

Keep all existing Fonts/Sizes naming conventions in `constants/styles.js` — add new tokens (`goldAccent`, `creamBackground`, `platinumGray`) rather than renaming existing ones, so screens not in this redesign's scope keep working unchanged.

### 3.2 Typography

- Keep Montserrat (already loaded: Medium/SemiBold/Bold) — no new font family needed.
- Lean harder into the **display sizes** added in Phase 1 (`blackColor32Bold`, `blackColor40Bold`) for fare amounts, ETA countdowns, and balance figures — premium apps use oversized, confident numerals.
- Add slightly more letter-spacing on uppercase labels (status badges, section headers) — a cheap, high-impact premium signal.

### 3.3 Materials / elevation

- Replace flat thin-border cards with **layered soft shadows** for anything "floating" over the map (the bottom sheet, the ride-option cards, the driver-info card) — e.g. `shadowOpacity: 0.12-0.18`, `shadowRadius: 16-24`, larger `shadowOffset.height` (8-12) than Phase 1's flat `CommonStyles.card`. Flat borders stay for in-page list rows (vehicle docs, settings) — reserve the heavier elevation for things genuinely floating above the map.
- Bottom sheets (vehicle-type picker, ride-confirmation, SOS modal) get a **frosted/blurred backdrop** behind them (`expo-blur`'s `BlurView`, already installable, no new native module needed beyond `expo-blur`) instead of a flat `rgba(0,0,0,0.5)` scrim — reads as more premium and lets map color show through softly.
- Subtle gradient accents are fine (e.g. a thin teal-to-transparent gradient at the top of a card), but avoid heavy/loud gradients — premium leans toward restraint, not maximalism.

### 3.4 Iconography

- Replace generic vector-icon-library glyphs for primary actions (confirm pickup, vehicle type selector, SOS) with a slightly heavier/rounder icon weight where available (e.g. Ionicons' filled variants over outline, for primary actions only — secondary/utility icons can stay outline for hierarchy).
- Vehicle-type icons (economy/comfort/premium/xl) should be distinct illustrated car silhouettes, not the same car glyph recolored — this is a cheap, high-value premium touch since users compare them side-by-side in the vehicle picker.

## 4. Map Redesign

### 4.1 New map theme (replaces the monochrome `MAP_THEME`)

Goal: colorful and characterful, while staying legible (this is still a navigation surface, not decoration). Concretely:

- **Water**: richer, more saturated blue (e.g. `#5DA9C7` family) instead of the current grayish-blue — water should read as water at a glance.
- **Parks/green space**: a real, confident green (e.g. `#9BC99A`–`#7FB87C` family) instead of the muted sage — should feel alive, not desaturated.
- **Roads**: warm off-white/cream fill (ties to `creamBackground`) with a soft gold-tinted hairline stroke instead of flat gray — arterial/highway tiers can pick up a subtle warm-amber tint on stroke width to differentiate hierarchy by *both* width and a touch of color, not width alone.
- **Land/geometry base**: warm light neutral (e.g. `#F5F0E8`) rather than cool gray (`#ebebeb`) — keeps the cream/gold premium feeling even in the base layer.
- **POI/landmark labels**: keep icons mostly hidden for cleanliness (don't reintroduce visual noise), but labels can use the deepened primary teal instead of flat gray, so landmark names feel branded.
- **Route line** (`ROUTE_LINE_COLOR`): switch from flat `Colors.primaryColor` to the gold accent (`#E8A33D`/`#D4AF37`) with a subtle outer glow/casing (react-native-maps `Polyline` supports `strokeColors`/multiple overlapping polylines for a glow effect — a wider, lower-opacity teal polyline underneath a thinner solid gold one reads as "premium route highlight").

Implementation note: this is still a single Google Maps JSON style array (same shape as today's `MAP_THEME`), so the change is contained to `constants/mapTheme.js` — no per-screen changes needed for the base map style itself.

### 4.2 Custom marker icons

Replace today's generic shapes with purpose-built markers:

| Marker | Current | Target |
|---|---|---|
| **Driver (car)** | Generic `car-marker.png`, flat top-down car clipart | A custom-illustrated car icon with subtle drop shadow baked into the asset (or a `View`-based shadow wrapper), tinted in the deep teal primary, still rotates to heading. Consider a small "pulse" ring under it while location updates are live (subtle scale/opacity animation) so it doesn't look static between GPS pings. |
| **Pickup (rider's location)** | Plain green circle + person icon | A teal pin/droplet shape with a white inner dot, or the rider's actual profile photo in a circular frame with a thin gold ring border (more personal, more premium than a generic person icon) |
| **Dropoff** | Flat `destination.png` image | A gold/amber flag or pin-drop icon with a subtle shadow, visually paired with the pickup marker (same pin family, different color/icon) so the two read as a deliberate set, not two unrelated assets |
| **Searching for driver** (rider home, while `status=searching`) | None specifically — static pickup marker | Add a soft pulsing radar/ripple animation around the pickup marker while waiting, communicating "actively searching" — currently there's no visual feedback distinguishing "searching" from "idle" on the map itself |
| **Available nearby drivers** (if/when shown on rider home before booking) | Not currently rendered | If added: small car icons at reduced opacity, no rotation/animation (ambient, not the active-trip driver) |

All new marker assets should be SVGs (the project already has `react-native-svg`/`react-native-svg-transformer` installed) so they scale cleanly across device sizes instead of relying on fixed-resolution PNGs like today's `car-marker.png`.

## 5. Screen-by-screen scope

- **Rider home** (`app/(tabs)/home/homeScreen.js`): full-bleed colorful map, floating frosted bottom sheet for pickup/dropoff input and vehicle-type selection (replace flat sheet), premium vehicle-type cards with distinct icons, real user greeting/photo (see §6).
- **Driver home** (`app/(driverTabs)/home/homeScreen.js`): online/offline toggle gets a more premium materials treatment (glow when online), incoming-request card uses the new elevation/shadow language.
- **Available rides** (`app/availableRides/availableRidesScreen.js`): vehicle-option carousel redesigned with the new per-type icons, fare numerals in the new display type sizes, map behind the sheet uses the new theme/markers.
- **Ride tracking — both phases** (`rideTrackingScreen.js`, `riderInTripScreen.js`): live map with the new driver/pickup/dropoff markers and glowing route line, trip-status card and verification-code card get the new elevation treatment, SOS button/modal restyled consistently (functionally unchanged — see the SOS work already shipped).

## 6. Replace hardcoded values with real backend data

Audited and confirmed still present — fix as part of this redesign pass (not a separate task, since most of these are in the exact files being touched anyway):

| Location | Hardcoded today | Replace with |
|---|---|---|
| `app/(tabs)/home/homeScreen.js` (~line 1751, 1756) | `"John Doe"` greeting name + `require(".../user1.jpeg")` placeholder photo | Real `profileData.first_name` / `profileData.profile_photo` from `ProfileContext` (already available app-wide, just not wired on this screen) |
| `app/(tabs)/home/homeScreen.js` (~line 1587) | Vehicle type list hardcoded as `['economy', 'comfort', 'premium', 'xl']` | Fine to keep as a constant *if* it's extracted to one shared `constants/vehicleTypes.js` (single source of truth, matching backend's `Vehicle.VehicleType` choices) rather than re-typed per screen — currently duplicated across home and availableRides with different display names attached |
| `app/availableRides/availableRidesScreen.js` (~line 172-176) | Vehicle type display names/seat counts hardcoded inline (`'Fika go'`/`'Fika comfort'`/`'Fika luxury'`, seats `2/3/3`) | Move to the same shared `constants/vehicleTypes.js`, with seat counts sourced from the vehicle's actual `seats` field where a specific vehicle is already matched, falling back to the constant only for the pre-match estimate display |
| `app/availableRides/availableRidesScreen.js` (~line 186) | `"5 mins"` fallback ETA string | Should never display without a real backend-provided ETA — show a loading skeleton instead of a fake number while the estimate call is in flight |
| `app/availableRides/availableRidesScreen.js` (~line 51-55) | Payment methods hardcoded as `["Cash", "Fika Account", "Credit/Debit Card"]` | Fetch from `GET /payments/methods/` (already built, used elsewhere in the app) instead of a static list — "Cash" should only appear if that's actually a supported `PaymentMethod.MethodType` |
| `app/availableRides/availableRidesScreen.js` (~line 35-43) | `CANCELLATION_REASONS` hardcoded 7-item array | Acceptable to keep as a frontend constant *if* confirmed there's no backend-side reason taxonomy already (none found in this audit) — flag to confirm before redesign starts, don't silently assume |

This list is deliberately scoped to the map/booking screens covered by this redesign — Phase 2's screens were already audited and fixed separately.

## 7. Component reuse

Reuse, don't reinvent: `components/Button.js` (extend with a "glass"/frosted variant for over-map placement if needed, rather than a new component), `TextField.js`, `Card.js` (the new elevated-shadow variant should be an additional style option on this component, not a parallel `PremiumCard`), `StatusBadge.js` (extend the gold/metallic tone for premium-tier indicators if needed). Avoid introducing a second, parallel design system alongside Phase 1's — this redesign is an evolution of those tokens/components, not a replacement.

## 8. Acceptance criteria

- [ ] `constants/mapTheme.js` updated to the colorful palette in §4.1; still a single source of truth (no per-screen style duplication reintroduced).
- [ ] Driver, pickup, and dropoff markers replaced with the custom SVG icons in §4.2; all rotate/animate as specified.
- [ ] Route polyline uses the new gold/glow treatment.
- [ ] `constants/styles.js` gains the new tokens in §3.1 without renaming/removing existing ones (no breaking changes to untouched screens).
- [ ] Every item in §6's table is resolved (either wired to real data, or explicitly confirmed-and-documented as an acceptable frontend constant).
- [ ] All five screens in §5 visually reviewed on-device (Android, per current test setup) for legibility — colorful map must not reduce contrast/readability of pickup/dropoff/route information.
- [ ] No new screens, abstractions, or component libraries introduced beyond what's described here.
