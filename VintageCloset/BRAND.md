# Vintage Closet brand kit

Use this style for every new page, graphic and generated asset.

## Logo
- Website file: `public/brand/vintage-closet-logo.png` (transparent, 480 px wide), used by `src/components/ui/Logo.tsx`.
- Favicon: `src/app/icon.png` (same logo on a transparent square).
- Originals (do not copy them into the repo): `/Volumes/SSD1/Vintag/material/vintage brandkit/`
  - `Vintage_Logo_Transparet.Png`: main logo, teal letters with a plum outline, transparent background
  - `VINTAG_logo Collage.jpeg`: the four approved colourways (white on black, black on white, plum on bright teal, bright teal on plum)
  - `Vintage Closet Graphic.png`, `Vintage Closet Graphic (name).png`, `Vintage Concert Graphic.png`, `Concert Text Graphic.png`: event and campaign lettering

## Colours
| Token | Hex | Use |
|---|---|---|
| `--brand-teal` / `text-brand-teal` | `#4CC2BA` | logo letters, icons, highlights |
| `--brand-teal-bright` / `bg-brand-teal-bright` | `#01DBCA` | bright backgrounds (collage colourway) |
| `--brand-plum` / `text-brand-plum` | `#602140` | outlines, shadows, hover colour |

The site UI keeps its original neutral base (`--surface`, `--ink`) and the existing accent gradient; the brand colours are the accents.

## Lettering style
Hand-drawn, bold, slightly tilted capitals: teal fill, thick plum outline, plum drop shadow down-right (see the Concert graphic).
In code use the `sticker-text` class, e.g. `<h2 className="sticker-text text-5xl">Concert</h2>`.
Generated graphics follow the same recipe: teal `#4CC2BA` letters, plum `#602140` outline and offset shadow, transparent or plum/bright-teal background.

## Menu and layout
- Menu: frosted left drawer (`src/components/layout/MenuDrawer.tsx`), tabs Women / Men / Unisex, big links, category groups with teal icons, "Just in" strip.
- Keep pages minimal: lots of white space, black text, photos carry the colour.
