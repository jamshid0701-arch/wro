# WRO 2026 RoboMission Junior — "Heritage Heroes"

TRIK Studio 2026.2 uchun LEGO EV3 robot dasturi (JavaScript): `wro2026_junior.js`.
Dastur rasmiy qoidalar asosida tuzilgan (Version: January 15th 2026). Koordinatalar qoidalarning 7-betidagi maydon xaritasidan olingan.

## Robot qanday bo'lishi kerak

| Port | Qurilma | Vazifasi |
|---|---|---|
| B | katta motor | chap g'ildirak |
| C | katta motor | o'ng g'ildirak |
| A | o'rta motor | qisqich (ochish/yopish) |
| D | motor | ko'targich (pastda / biroz / baland) |
| 1 | rang sensori | chap, pastga qaragan (aks etish rejimi) |
| 2 | rang sensori | o'ng, pastga qaragan (aks etish rejimi) |
| 3 | rang sensori | qisqich ichida, obyektga qaragan (rang rejimi) |
| 4 | giroskop | burchak rejimi |

- 1 va 2-sensorlar orasidagi masofa taxminan 50 mm bo'lishi kerak. Ular g'ildirak o'qidan ~70 mm oldinda turadi.
- Qisqich bitta obyektni ushlaydi: mehmon, artefakt, minora yoki minora tepasi. Ko'targich sariq minora tepasini asos ustiga qo'yish uchun yetarlicha baland ko'tarishi kerak.
- Robot kengligi ~180 mm dan oshmasin. Dastur shunday kenglikni hisobga olib, obyektlar orasidan o'tadi.

## Maydon koordinatalari

(0,0) — maydonning chap yuqori burchagi. X o'ngga, Y pastga o'sadi, o'lchov millimetrda (maydon 2362 × 1143). Robot start maydonining markaziga (490, 571) o'ngga qaratib qo'yiladi.

## Missiyalar tartibi va vaqt

Dastur missiyalarni quyidagi tartibda bajaradi. Har bir missiyadan oldin 120 soniyaga sig'ishini tekshiradi. Sig'masa, keyingisiga o'tadi.

| # | Missiya | Ball | Taxminiy vaqt* |
|---|---|---|---|
| 1 | Artefaktlar → muzey (rangiga qarab) | 60 | 60 s |
| 2 | Yashil mehmon → qazishma | 10 | 15 s |
| 3 | Sariq minora tepalari → asoslar ustiga | 50 | 44 s |
| 4 | Qizil minoralar → to'q sariq ramkali kvadratlar | 30 | 48 s |
| 5 | Toshyo'lni axlatdan tozalash | 20 | 20 s |
| 6 | Qora va ko'k mehmon | 20 | 43 s |
| 7 | Qizil mehmon → muzey | 10 | 22 s |
| | Bonus: to'siqlar va to'tiqushga tegmaslik | 30 | — |

\* Vaqtlar kompyuter simulyatsiyasida o'lchangan (g'ildirak tezligi ~400 mm/s, 80% quvvatda). Simulyatsiyada 1–3 missiyalar 2 daqiqaga sig'di: 120 ball va 30 bonus, jami 150. Hammasi 230 ball uchun ~250 s kerak bo'ldi. Haqiqiy robotda har bir missiya vaqtini o'lchab, `MISSIONS` ro'yxatidagi `est` qiymatlarini yangilang.

## Sozlash tartibi

1. **O'lchamlar** (1-bo'lim): `WHEEL_D`, `GRIP_OFFSET` (g'ildirak o'qidan ushlangan obyekt markazigacha) va `SENS_OFFSET`.
2. **Sensorlar:** qora chiziq va oq maydon ustida qiymatni o'qib, `BLACK` va `WHITE` ga yozing.
3. **Yo'nalish:** robot 1 m yursin. Ortga yursa, `L_SIGN`/`R_SIGN` ni o'zgartiring. O'ngga burilganda giroskop qiymati kamaysa, `GYRO_SIGN = -1` qiling.
4. **Mexanizmlar** (5-bo'lim): `gripOpen`, `gripClose`, `liftHigh` funksiyalaridagi vaqt va quvvatni o'z qisqich va ko'targichingizga moslang.
5. **Missiyalarni bittalab sinang:** `RUN_ONLY = 1` … `7` qo'yib ko'ring. Obyekt joyiga tushmasa, 2-bo'limdagi (XARITA) nuqtalarni ±10–20 mm ga to'g'rilang.
6. **Rang sensori:** artefaktlarni qisqichda ushlab, `readColor()` to'g'ri rang kodini qaytarishini tekshiring (2-ko'k, 3-yashil, 4-sariq, 5-qizil, 1-qora).

## Aniqlik qanday ta'minlanadi

- Burilishlar va to'g'ri yurish giroskop bo'yicha bajariladi. Robot koordinatasini (X, Y) enkoderlar orqali o'zi hisoblab boradi.
- Har bir artefakt safarida robot qora chiziqlarga tekislanadi va koordinatasini tuzatadi: gorizontal chiziq (y = 569, x ≈ 800) Y ni, vertikal chiziq (x = 1274) X ni beradi.
- Yo'llar shunday tanlanganki, robot qurilgan minoralar, to'tiqush va to'siqlar yonida burilmaydi. Barcha o'ng tomondagi ishlar gorizontal chiziq orqali bajariladi.

## Eslatma

- Missiya 4 (qizil minoralar) faqat missiya 3 dan keyin bajariladi. Sariq tepalar joyida tursa, robot ularga tegib ketadi. Missiya 4 ni alohida sinashda sariq tepalarni maydondan olib qo'ying.
- Agar TRIK Studio'da EV3 portlari boshqacha nomlansa, dasturning 3-bo'limidagi port nomlarini o'zgartiring.
