# Фотореалистичные сцены SuBulaq — версия 3

Созданы 23 сентября 2026 года встроенным image_gen. Это изображения концепции и анимация на их основе, не фотографии или видео испытаний действующего прототипа.

## Файлы, используемые сайтом

- `assets/subulaq-wide-v3.png` — 1536 × 1024, главный экран. Общий план с местом для заголовка.
- `assets/subulaq-field-v3.png` — 1536 × 1024, раздел измерений и контакты.
- `assets/subulaq-detail-v3.png` — 1536 × 1024, крупный план при прокрутке и раздел проб.
- `assets/subulaq-mobile-v3.png` — 1024 × 1536, мобильный первый экран; кадр рассчитан на обрезку по бокам.

Изображения скопированы в проект без обработки. Исходный референс: `assets/vessel-hero.png`. Неудачные промежуточные варианты кадрирования не используются.

## Основной кадр — полный промпт

Use case: photorealistic-natural.
Asset type: wide cinematic website background, 1536x1024 landscape.
Input image: the attached vessel is a design reference, not the composition to retain.
Create a convincingly photographed outdoor scene of this compact unmanned water-monitoring catamaran moving slowly on a large freshwater reservoir. Preserve its two white hulls, black waterline and central low deck, camera mast with actual optical lens, two thin antennas, understated navigation sensors. Replace the over-polished CGI look with an engineering prototype physically present in natural water: satin fiberglass paint, individual access-panel seams, small stainless fasteners, tiny rain droplets, rubber bumpers, subtle surface wear, sensible non-glowing hardware. No decorative green lights, no frontal trash-collection net.
Camera: documentary marine photograph, low three-quarter front-side perspective from another boat, natural 50mm lens, photographic dynamic range and realistic microcontrast, mildly overcast afternoon with a break of warm sunlight. Full vessel inside frame, spans 50% image width from x25 to x75, hull between y58% and y74%, tallest antenna ends near y35%. Waterline horizon at y43%, distant low muted Kazakh steppe shore, pale blue-gray cloudy sky occupies upper 40% with clean negative space for website headline. Real irregular short waves, a modest physically plausible wake streaming behind the boat, wet reflections broken by the waves, clear close foreground water. Restrained slate blue, steel gray, off-white palette; softly lit equipment, no dramatic sunset or teal-orange grading. Vessel sharp, far shore naturally hazy, foreground has slight lens softness. One single boat, no other vessels, no people, no lettering, no logos, no labels, no UI, no borders, no watermarks. Must feel like a real field-test photograph, NOT a 3D render or miniature toy.

## Общий план для заголовка — полный промпт

Референс: subulaq-field-v3.png.

Use case: precise-object-edit. Edit this landscape photograph only by changing camera framing/composition for a website headline. Keep EXACT same boat design, natural wet fiberglass, real wave texture, shore environment, daylight, and photographic realism. Zoom camera OUT significantly: the boat must become about 70% of its current size, centered and LOWER in frame. Canvas remains 1536x1024 landscape. Required layout: upper 42% completely free of boat and shore, only naturally cloudy blue-gray sky. Low distant steppe shore at y45%-51%. Full boat hull should occupy x28%-76%, y66%-82%; highest antenna begins at y44%. Boat stays crisp and detailed, short irregular waves, natural modest wake. Extend the same sky and reservoir plausibly to fill new composition. Do not add other boats, people, text, graphics or artificial effects. It must remain a natural documentary photograph, not CGI. This is a composition adjustment, preserve subject identity and material appearance.

## Крупный план — полный промпт

Референс: subulaq-field-v3.png.

Use case: photorealistic-natural. Asset: cinematic detail photograph for a website, 1536x1024 landscape.
Input: the attached image is the exact vessel, finish, landscape and photographic style reference. Create a second shot from the SAME documentary photography session, moving the camera closer to water level in front and slightly to the side of that same vessel. Preserve all vessel details and proportions: practical white satin double hull with black waterline, low center deck, exposed small silver fasteners and seams, tall white camera mast and two slim antennas. Boat occupies x12%-87%, y26%-76%, full antennas inside frame. Camera lower and closer, the near hull and tiny wet droplets in sharp focus, actual lens optical reflections, muted brushed metal, subtle use marks; irregular detailed water waves and gentle foam at waterline in foreground, shore with low hills and natural clouds in background. Same natural slate-gray water, white fiberglass, overcast daylight with soft directional sun, no fantasy green glowing lights, no net. Has to look like an actual field photograph with natural microtexture, never plastic CGI. Clean negative space in upper 20%. No text, graphics, logos, watermark or UI.

## Мобильная сцена — полный промпт

Референс: subulaq-field-v3.png.

Use case: photorealistic-natural. Create a VERTICAL 1024x1536 photograph for the mobile version of a website. Input is the EXACT vessel and photographic style reference, keep that identity. Reframe the reference wider around the subject to fit a portrait canvas. Show this same practical off-white uncrewed twin-hull catamaran in a natural slate-gray reservoir with low steppe hills and a cloudy sky. The complete boat including both hulls and antennas MUST fit inside the portrait frame: boat body x12%-88%, y58%-72%; highest antenna ends at y39%. Top 35% quiet cloudy sky, shore horizon y43%. Lower 28% filled with richly detailed irregular rippling water and broken reflections. Realistic subtle foam along hull, wet droplets, tiny steel fasteners, access panel seams, rubber dark waterline, understated non-glowing sensors. Camera at low three-quarter front side view, natural marine documentary photograph shot on 50mm lens, softly directional daylight, not dramatic advertising CGI, not plastic miniature. Maintain the reference color grade and actual photographic texture. No text, logos, UI, people, additional boats or watermarks.

## Уточнение мобильного кадра — полный промпт

Референс: первоначальная мобильная сцена.

Use case: precise-object-edit. Edit this portrait image for a very tall mobile website screen. Preserve exact natural photographic realism, vessel design, wet texture, lighting and environment. Zoom out around the vessel: reduce boat size to 62% of its present width while keeping the same center horizontal position. The complete boat including both hulls should fit in the CENTRAL 52% OF IMAGE WIDTH, x24% to x76%. This narrow safe zone is essential because mobile crops both sides. Hull y64%-76%, tallest antenna around y44%. Keep water foreground below, low steppe shore across y44%, naturally cloudy sky above. Plenty of water to left and right of boat. Canvas 1024x1536 portrait. No text, logos, people or other boats. Preserve the boat's engineering details, matteness, real small waves and real subdued reflections.

