#!/bin/bash
# Generates demo furniture photography for the seed catalogue.
# Output: $PWD/uploads/seed-src/*.png (staging — the seed
# script runs these through the real upload/optimise pipeline afterwards).

set -u
OUT="$PWD/uploads/seed-src"
mkdir -p "$OUT"

gen() {
  local name="$1"; local size="$2"; local prompt="$3"; local file="$OUT/$name.png"
  if [ -s "$file" ]; then echo "skip $name (exists)"; return 0; fi
  for attempt in 1 2 3; do
    if z-ai image -p "$prompt" -o "$file" -s "$size" >/dev/null 2>&1 && [ -s "$file" ]; then
      echo "ok   $name"; return 0
    fi
    echo "retry($attempt) $name"; sleep 3
  done
  echo "FAIL $name"; return 1
}

STYLE="professional furniture product photography, warm natural lighting, soft shadows, premium showroom aesthetic, warm ivory background, high quality, detailed"

gen hero-living 1440x736 "spacious premium living room interior with solid wood sofa set, teak furniture, warm ivory walls, wooden accents, indoor plants, golden hour sunlight through large windows, interior design photography, high quality, detailed"

gen sofa-3seater 864x1152 "modern three seater fabric sofa in warm grey, wooden legs, $STYLE"
gen bed-queen 864x1152 "queen size solid sheesham wood bed with tall headboard, crisp white bedding, $STYLE"
gen wardrobe-3door 864x1152 "three door sliding wardrobe in teak wood finish with mirror panel, $STYLE"
gen dining-6seater 864x1152 "six seater solid wood dining table set with cushioned chairs, $STYLE"
gen sofa-lshaped 864x1152 "L shaped sectional sofa in beige fabric with wooden base, living room setting, $STYLE"
gen coffee-table 864x1152 "solid wood coffee table with lower storage shelf, walnutfinish, styled with books, $STYLE"
gen tv-unit 864x1152 "engineered wood TV entertainment unit in walnut finish, television on top, warm styling, $STYLE"
gen office-chair 864x1152 "ergonomic high back office chair in charcoal fabric, wooden armrests, $STYLE"
gen study-desk 864x1152 "wooden study desk with drawers and open shelves, minimal styling, $STYLE"
gen bookshelf 864x1152 "tall five shelf wooden bookshelf with books and decor pieces, sheesham wood, $STYLE"
gen bed-single 864x1152 "single bed with storage drawers underneath, solid mango wood, pastel bedding, $STYLE"
gen modular-kitchen 864x1152 "modular kitchen cabinets in warm wood and ivory laminate finish, premium Indian kitchen interior, $STYLE"

gen showroom-1 1152x864 "furniture showroom interior with rows of sofas and wooden display furniture, warm lighting, Indian furniture store, wide angle, high quality"
gen showroom-2 1152x864 "carpenter workshop crafting solid wood furniture, artisan hands sanding wooden chair, warm workshop lighting, craftsmanship, high quality"
gen about-storefront 1152x864 "elegant furniture store storefront at dusk, warm glowing windows displaying sofas and beds, premium retail exterior, high quality"

echo "DONE"
