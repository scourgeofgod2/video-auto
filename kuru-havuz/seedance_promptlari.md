# Seedance 2.0 promptları: Kuru Havuz (Dreamina / Jimeng web)

Seslendirme (`seslendirme_erdem.mp3`, 65,5 sn) cümle zamanlarına göre 8 üretim birimine bölündü.
Her birimi **9:16 dikey** üret. Süre olarak tablodaki "Üret" değerini seç. Klip biraz uzun gelirse montajda kırpılır.

| Birim | Ses aralığı | Gereken | Üret | Seslendirme |
|---|---|---|---|---|
| G1 | 0.0–9.6 | 9.6 s | 10 s | Denizin hemen yanına… temizleyemezsin. |
| G2 | 9.6–16.7 | 7.1 s | 8 s | O yüzden kıyıya… süzülerek girer. |
| G3 | 16.7–21.6 | 4.9 s | 5 s | Sonra kapıyı kapatır… yan yatar. |
| G4 | 21.6–26.8 | 5.2 s | 6 s | Bu yüzden gemi gelmeden önce… dizersin. |
| G5 | 26.8–38.9 | 12.1 s | 13 s | Gemi bunların üstüne… kenarlarından sızar. |
| G6 | 38.9–51.4 | 12.5 s | 13 s | Çözüm: yüzen bir kapı… sıkı kapanır. |
| G7 | 51.4–59.7 | 8.3 s | 9 s | Derken bir gün… yüzdürmek ister. |
| G8 | 59.7–66.5 | 6.8 s | 7 s | Sen de beş metreden… kuru havuzun var. |

## 0. Önce referans görsel (tutarlılık için önerilir)

Birimler arasında gemi ve liman aynı görünsün diye önce Dreamina'da bir görsel üret (Seedream). Sonra her Seedance üretiminde bunu **Görsel 1** olarak referans ver.

```text
Photorealistic miniature-diorama 3D render, vertical 9:16, bright sunny midday. A large cargo ship resting in an empty concrete dry dock cut into a grassy seashore: black upper hull with orange rust streaks and a big anchor, red antifouling paint below the waterline, rounded bulbous bow, white superstructure with a mast. Yellow gantry cranes on both dock walls, a red-brick pump house with a tall chimney, a steel gate at the seaward end, deep blue sea and sky with fluffy cumulus clouds. Clean, saturated colours, crisp detail, high-angle three-quarter view. No text, no logos, no watermark.
```

## Ortak kurallar (her promptun sonunda zaten var)

- Altyazıyı, yazıları ve logoları biz montajda ekleyeceğiz; modelden temiz görüntü istiyoruz.
- Ses: seslendirmeyi biz koyacağız. Dreamina "ses üret" seçeneği varsa **kapalı** tut.
- Promptlar İngilizce yazıldı, Seedance İngilizce/Çince'de daha iyi sonuç veriyor.

---

## G1 — Kanca (10 s)

```text
Ship 1 is the cargo ship in Image 1 (black rust-streaked hull, red bottom, bulbous bow). Photorealistic miniature-diorama 3D explainer style, bright sunny day, blue sky with cumulus clouds, saturated teal sea.
Shot 1: Fast whip pan lands on a yellow excavator digging a huge hole in a grassy lawn right next to the sea.
Shot 2: High aerial view: Ship 1 sails from the open sea into a long, freshly dug channel, white foam at its bow.
Shot 3: Split-level cutaway at the waterline, half above and half below water: slow push in on the bulbous bow of Ship 1, thickly crusted with green barnacles.
Vertical 9:16. Keep it free of any text, subtitles, logos or watermarks. Only one ship, no duplicates. No speech, no music.
```

## G2 — Kapı ve su (8 s)

```text
Ship 1 is the cargo ship in Image 1. Photorealistic miniature-diorama 3D explainer style, bright sunny day.
Shot 1: Aerial view of a giant rectangular dock basin dug into the shore, an empty concrete floor, a steel gate in the seaward wall.
Shot 2: The gate swings open and the sea pours in, white foam flooding across the concrete floor.
Shot 3: Low camera behind Ship 1 as it glides slowly into the flooded dock between the concrete walls.
Vertical 9:16. Keep it free of any text, subtitles, logos or watermarks. Only one ship, no duplicates. No speech, no music.
```

## G3 — Pompalama, yan yatma (5 s)

```text
Ship 1 is the cargo ship in Image 1. Photorealistic miniature-diorama 3D explainer style, bright sunny day.
Shot 1: High angle over a red-brick pump house with a tall chimney beside the dock; the gate is closed and the water level drops fast along the dock walls.
Shot 2: Front view of Ship 1 inside the draining dock: as the water falls, the ship slowly tilts and rolls onto its side.
Vertical 9:16. Keep it free of any text, subtitles, logos or watermarks. Only one ship, no duplicates. No speech, no music.
```

## G4 — Takozlar (6 s)

```text
Photorealistic miniature-diorama 3D explainer style, bright sunny day. An empty concrete dry dock floor with neat rows of keel blocks down the middle, their tops cut to the curve of a ship's bottom. Low fast tracking shot gliding forward just above the floor along the rows of blocks, then seawater rushes in over them.
Vertical 9:16. Keep it free of any text, subtitles, logos or watermarks. No speech, no music.
```

## G5 — Oturma, destekler, sızıntı (13 s)

```text
Ship 1 is the cargo ship in Image 1. Photorealistic miniature-diorama 3D explainer style, bright sunny day, yellow gantry cranes on the dock walls.
Shot 1: The water drains away and Ship 1 settles gently down onto the rows of keel blocks.
Shot 2: Low angle at floor level: long diagonal timber props are wedged between the dock wall and the red hull on both sides.
Shot 3: Slow low orbit around the bulbous bow: the ship rests on rows of small stacked blocks, props on its sides, cranes above.
Shot 4: Close-up of the closed dock gate: thin jets of seawater leak in through the seams around its edges.
Vertical 9:16. Keep it free of any text, subtitles, logos or watermarks. Only one ship, no duplicates. No speech, no music.
```

## G6 — Yüzen kapı (13 s)

```text
Photorealistic miniature-diorama 3D explainer style, bright sunny day, open blue sea behind.
Shot 1: A huge box-shaped steel floating gate (caisson) with a ribbed grey hull floats at the entrance of an empty dry dock.
Shot 2: Seawater flows into the gate's internal tanks and it slowly sinks straight down into a vertical slot in the concrete dock wall.
Shot 3: Side cutaway cross-section through the gate and the ground: the sea on one side is much higher than the empty dock floor on the other; the water presses the gate tight against its slot and the seams seal shut.
Vertical 9:16. Keep it free of any text, subtitles, logos, arrows or watermarks. No speech, no music.
```

## G7 — Çatlaklar, yeraltı suyu (9 s)

```text
Ship 1 is the cargo ship in Image 1. Photorealistic miniature-diorama 3D explainer style, bright sunny day.
Shot 1: Low angle across the empty dock floor, Ship 1 resting on its keel blocks in the background: cracks spread across the concrete and the floor begins to bulge upward.
Shot 2: Underground cutaway cross-section beneath the dock floor showing layers of soil and gravel: groundwater rises and pushes up against the underside of the concrete slab.
Vertical 9:16. Keep it free of any text, subtitles, logos or watermarks. Only one ship, no duplicates. No speech, no music.
```

## G8 — Kalın beton, final (7 s)

```text
Ship 1 is the cargo ship in Image 1. Photorealistic miniature-diorama 3D explainer style, bright sunny day.
Shot 1: Cutaway cross-section of the dock floor: a new, very thick concrete slab is poured over the old floor, filling the frame from below.
Shot 2: Final high wide shot of the finished dry dock: Ship 1 resting on rows of keel blocks with timber props, yellow gantry cranes, a red-brick pump house with a chimney, one tiny worker walking on the floor. Slow push in, then hold.
Vertical 9:16. Keep it free of any text, subtitles, logos or watermarks. Only one ship, no duplicates. No speech, no music.
```

---

## Klipler bitince

Klipleri `G1.mp4 … G8.mp4` adıyla bu sohbete yükle. Gerisini ben yapacağım: `montaj.py` klipleri ses aralıklarına oturtacak, seslendirmeyi ve Türkçe altyazıyı ekleyecek, `kuru_havuz_tr.mp4` çıkacak.
