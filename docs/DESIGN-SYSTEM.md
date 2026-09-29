# Visual refinement — September 2026

This is a visual refinement of the existing application. Routes, page sequence, content records, APIs, validation, rental state and backend boundaries remain unchanged. The hero uses the same words in four deliberate lines.

## Color roles

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#080A0D` | Main canvas |
| `--surface` | `#0D1218` | Secondary surfaces and cards |
| `--navy` | `#08213A` | Corporate foundation |
| `--orange` | `#FF7300` | Quote, rental and contact actions |
| `--electric-blue` | `#009DFF` | Technical accents and interaction |
| `--blue-text` | `#65BFFF` | Readable blue labels on dark surfaces |
| `--blue-border` | `#315775` | Restrained technical borders |
| `--text` | `#F3F5F7` | Primary text |
| `--muted` | `#B0BAC5` | Body and secondary text |
| `--border` | `#303D4A` | Neutral dividers |

Electric blue appears in section rules, service icons, technical indices, process connectors, arrows, navigation underlines, rental categories, filter selections and focus states. The hero emphasizes only ENGINEERED in blue. Primary business actions remain orange. Existing photography is unchanged.

## Typography

Geist Sans is the primary variable face. Geist Mono is limited to technical labels, category metadata, section indices and signal details. Both are self-hosted Latin subsets with normal weights 100–900; the Sans face is preloaded and the Mono face is loaded when used. The font binaries are unchanged and their upstream SIL OFL license is included.

| Use | Desktop | Mobile | Weight |
| --- | --- | --- | --- |
| Hero / page titles | Fluid, up to 80px | Approximately 34–58px | 650 |
| Major section headings | Fluid, up to 56px | 32–44px | 600 |
| Secondary headings | 28–36px | 28px | 600 |
| Card titles | 20–24px | 22px | 600 |
| Main body | 18px | 17px | 400 |
| Hero / intro copy | 19px | 17px | 400 |
| Navigation | 16px | 17–18px | 500 |
| Buttons | 14–15px | 14px | 600 |
| Technical labels | 12–14px | 12–14px | 500 |

Sizes use rem and fluid clamps. Uppercase labels use restrained positive tracking; headings use slightly tighter spacing. Small form notes and secondary metadata remain subordinate to the main body.

## Components and spacing

- Buttons use 8px corners, 56–58px main control heights, generous horizontal padding and restrained border feedback.
- Cards use 8px corners and neutral 1px borders, shifting toward blue on interaction. Service card padding is centralized in `--card-padding`.
- Project image hover scale is 1.018; reduced-motion overrides remain in place.
- Main section spacing is 112px on desktop and 76px on phones.
- The navigation switches to its existing mobile disclosure before the enlarged desktop labels would crowd the header.
- Narrow-screen service, industry and equipment grids become one column to preserve readable copy and substantial controls.
- The rental request remains a sticky sidebar on large screens and an inline panel on smaller screens.

Edit the shared `:root` tokens and `@theme inline` mapping in `app/globals.css` when changing the brand. Font loading is in `lib/fonts.ts`; no new runtime packages were added for this refinement.
