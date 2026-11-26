# Ses Ver — SpeechGenAI reklamı (DALGA maskotu)

1080x1920, 30 fps, 23 s. Three.js 0.160.0, `3d/index.html` içindeki `renderAt(t)` tam t anını çizer; rastgelelik seed'li.

## Maskot: DALGA (18x16 piksel, her piksel 1 voxel, derinlik 6)
- gövde (2,3) 14x10 `0AA759`, dört köşe boş
- anten sapı (8,2) 2x1, anten ucu (8,0) 2x2 `FFD84D`
- kollar (0,6) ve (16,6) 2x2; bacaklar x=6 ve 10, 13. satırda 2x3
- konuşma balonu kuyruğu (2,13) 2x1 + (1,14) 1x1
- gözler (5,5) ve (11,5) `0F0F0F` 2x2
- ağız: x=6..11, 9. satır merkezli 6 çubuk `F4F5EE`; Enter'dan önce düz çizgi, sonra seslendirmenin genliğiyle 1–4 voxel
- yanak (4,8) ve (13,8) `FF8FA3`

## Seslendirme
Burcu (SpeechGenAI, quality), "SpeechGenAI" İngilizce okunuş (/ˈspiːtʃ dʒɛn eɪ aɪ/). Zamanlar `zamanlama.json`.

| sn | görüntü | ses |
|---|---|---|
| 0–3.0 | monitörde metin yazılıp siliniyor, DALGA tuştan tuşa zıplıyor | Yazdın. Sildin. Yeniden yazdın. |
| 3.5–4.7 | boşluk tuşuna iniyor, kollar havada, monitörde ✓ | Sonunda mükemmel oldu. |
| 5.2–7.0 | konuşmaya çalışıyor, ağız düz çizgi, "…" balonu, omuzlar düşüyor | Ama bir şey eksik... Sesi. |
| 7.05–10.9 | anten parlıyor (fikir), tuşlarda zıplıyor, monitörde ses seçici, Enter'a büyük atlayış | SpeechGenAI ile metnini yaz, sesini seç, Enter'a bas. |
| 10.95 | Enter vuruşu: klavyede yeşil dalga, ağız canlanıyor | |
| 11.8–15.4 | ağız sese senkron, ağızdan voxel halkalar, yanaklar kızarıyor | Doğal Türkçe sesler, saniyeler içinde. |
| 15.7–23 | kapanış kartı, el sallama, küçük zıplama, göz kırpma | İçeriğine ses ver. Starter ile ilk ay sadece bir dolar. SpeechGenAI nokta kom. |

## Üretim
```
python3 genlik.py                       # seslendirme -> 3d/genlik.json (ağız senkronu)
cd 3d && npm i && node render.mjs --start 0 --end 23 --fps 30 --out ../cikti/ses_ver_sessiz.mp4
cd .. && python3 montaj.py              # efekt + ses miksi -> cikti/ses_ver.mp4
```
