# Visual assets

## Brand hero (home page first screen)

The home hero no longer uses the featured event image. It cross-fades three brand scenes every 4 seconds (`components/HeroSlides.tsx`): `public/brand/hero-{rooftop,alley,beach}-portrait.webp` for phones and `hero-*-landscape.webp` from 700px up. Only the first scene loads before first paint; the others are fetched about a second later. Reduced-motion users get a single still image. Both were generated with AI (a women's night walk through an old Jerusalem alley under string lights), converted to WebP at quality 82. `hero-portrait-rooftop.webp` is an alternative portrait (rooftop dinner with city lights) kept for the client to choose from. Text is overlaid on the lower 45% of the portrait crop, so keep that area darker.

## Demo event images (temporary)

`public/demo/event-{torah,challah,empowerment}.webp` (4:5, phones) and `event-*-wide.webp` (16:9, desktop) back the three newer demo events: Torah class with a rabbanit, challah separation, women's empowerment evening. Generated with AI from the prompts the client received in chat. Each event has a required portrait image and an optional wide image; the public pages pick the wide one from 1000px up.

## Current night identity

Active assets: `public/demo/women-kotel-night.webp` and `public/demo/women-purim.webp`. The daytime Western Wall photograph is retained as an unused earlier variant. The night photograph was created with the built-in imagegen tool and optimized to WebP. Final prompt:

Use case: photorealistic-natural. Asset type: cinematic landscape hero photograph for Koral Events women-only night outings website. A beautiful authentic nighttime visit to the Western Wall in Jerusalem, unmistakable massive weathered limestone wall and small green plants illuminated by warm golden architectural floodlights against a deep midnight indigo sky. A small group of adult women wearing tasteful contemporary long-sleeved clothing seen mainly from behind in the women's section, quietly walking together towards the wall, sense of friendship and a memorable night outing. Wide environmental composition, strong sense of NIGHT, rich deep charcoal/plum shadows, warm champagne amber stone lights, photographic realism, 35mm editorial photography, no dominant closeup faces, no men, no nightclub props at the holy site, respectful natural atmosphere. Compose for a landscape 3:2 website hero and central vertical mobile crop; show some night sky in upper third, illuminated wall as main backdrop, visitors in lower-middle, lower third naturally dark for later website text. No lettering, no logos, no watermark. Illustrative demo photograph, not documentation of an actual gathering.

## Current women-only identity

The active demo images are `public/demo/women-kotel.webp` and `public/demo/women-purim.webp`. Both were generated with the built-in imagegen tool, then optimized to WebP. They illustrate fictional events, not real gatherings. The previous rooftop asset is retained but no longer used by the demo seed.

Final prompts:

### Women at the Western Wall

Use case: photorealistic-natural. Asset type: landscape editorial demo photograph for Koral Events, a Hebrew women-only community events website. A respectful candid gathering of adult women at the women's prayer section of the Western Wall in Jerusalem, beautiful massive weathered pale limestone blocks with small green plants in the stone gaps clearly recognizable as the Western Wall. Warm late afternoon golden light. A few adult women seen from behind and side at a comfortable respectful distance, wearing tasteful modest long-sleeved contemporary dresses or skirts in cream, olive and muted colors, standing thoughtfully near the wall; some gently touching the stones, others quietly together. Peaceful sense of connection, spirituality and togetherness. Cinematic premium natural photography, 35mm lens, authentic material texture, warm champagne highlights and soft charcoal shadows. Wide 3:2 landscape with main stone wall and a small group positioned so center crop works beautifully on vertical mobile. No men, no prominent close-up faces, no lettering, no text, no posters, no logo or watermark. This is an illustrative demo image and not documentation of a real event. Do not add party or bar imagery.

### Women's Purim costume party

Use case: photorealistic-natural. Asset type: landscape editorial demo photograph for Koral Events, a Hebrew women-only community events website. A joyful boutique Purim costume party exclusively for adult women. Small group of adult women in tasteful festive costumes: an elegant purple-and-gold masquerade outfit with a handheld mask, a colorful butterfly costume, a starry midnight-blue cape and a shimmering golden festive dress, mostly sleeves and comfortable elegant party clothing. Laughing and dancing together in an intimate beautifully decorated indoor event space with warm fairy lights, tasteful jewel-toned ribbons and restrained festive confetti. A few recognizable colorful masks and costume details foreground, no prominent close-up face. Clearly a costume celebration rather than an ordinary nightclub, warm authentic community feeling and polished editorial photography. Premium dark charcoal, warm champagne light, plum and teal jewel colors, realistic textures, cinematic 35mm lens, wide 3:2 composition whose center also works as a vertical mobile crop. No men, no children, no sexualized costumes, no words or lettering, no logos, no watermark. Illustrative demo event photograph, not an actual event.

## Earlier visual exploration

The primary demo photograph is `public/demo/rooftop-sunset.webp`, created with the built-in imagegen tool and optimized to WebP for the website. It illustrates a fictional event and does not document a real venue or gathering. The seed script copies it to persistent uploads for the demo event. The original generated PNG remains in the Codex generated-images folder.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: landscape hero photograph for Koral Events, an elegant Hebrew boutique community events website. Generate a high-end editorial photograph of a warm intimate rooftop evening gathering beside the Mediterranean in Jaffa at sunset. Wide cinematic 3:2 composition, ocean horizon and hazy warm peach sunset in upper middle, strands of warm festoon lights overhead, rustic refined terrace, small candlelit tables and glasses, relaxed adult women in tasteful evening casual outfits chatting in small groups in the midground, captured candidly from a little distance with no dominant close-up faces. Warm champagne, deep olive charcoal shadows, sea blue and amber golden hour palette; believable analog film grain, editorial lifestyle photography, 35mm lens, beautiful natural atmosphere, premium but approachable community event, no wedding or bridal props. The central 45 percent should also make a beautiful vertical mobile crop. Lower third softly dark with natural foreground shadows so white website title text added later will be legible. Absolutely no lettering, no logos, no text, no watermark. This is an illustrative demo event photo, not a photo of an actual venue.

Secondary demo images are downloaded from Unsplash by `scripts/seed.ts`:

- `photo-1514933651103-005eec06c04b` — bar interior.
- `photo-1514525253161-7a46d19cd819` — concert lights.

Heebo is self-hosted under the SIL Open Font License, included in `public/fonts/OFL.txt`. Interface icons use lucide-react. The wordmark and favicon are rendered in code.
