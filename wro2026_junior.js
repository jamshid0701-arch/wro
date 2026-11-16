// =====================================================================
//  WRO 2026 RoboMission Junior — "Heritage Heroes"
//  TRIK Studio 2026.2 | LEGO EV3 | JavaScript
// =====================================================================
//
//  KOORDINATALAR TIZIMI (rasmiy qoidalar, 7-betdagi maydon xaritasi):
//    Maydon 2362 x 1143 mm. (0,0) — chap YUQORI burchak.
//    X o'ngga o'sadi, Y pastga o'sadi.
//    Yo'nalish (gradus): 0 = o'ngga (sharq), 90 = pastga (janub),
//                        180 = chapga (g'arb), -90 = yuqoriga (shimol).
//    Start: start maydoni (WRO logotipli ko'k ramka) markazi,
//           robot o'ngga qaragan holda turadi.
//
//  ROBOT TUZILISHI (TRIK Studio -> Sozlamalar -> Robot modeli: EV3):
//    Motor B — chap g'ildirak         Motor C — o'ng g'ildirak
//    Motor A — qisqich (ochish/yopish) Motor D — ko'targich (yuqori/past)
//    Sensor 1 — chap rang sensori, pastga qaragan (aks etish rejimi)
//    Sensor 2 — o'ng rang sensori, pastga qaragan (aks etish rejimi)
//    Sensor 3 — qisqich ichidagi rang sensori (rang rejimi)
//    Sensor 4 — giroskop (burchak rejimi)
//
//  MISSIYALAR VA BALLAR (maks. 230):
//    Mehmonlar 4x10 | Qizil minoralar 2x15 | Sariq minoralar 2x25
//    Artefaktlar 4x15 | Axlat 10x2 | Bonus: to'siqlar 2x10, to'tiqush 10
//
//  SOZLASH TARTIBI:
//    1) ROBOT bo'limidagi o'lchamlarni o'z robotingizdan o'lchang.
//    2) RUN_ONLY bilan har bir missiyani alohida sinang.
//    3) Kerak bo'lsa MAP bo'limidagi nuqtalarni ±10-20 mm ga to'g'rilang.
// =====================================================================

// ======================= 1. ROBOT O'LCHAMLARI =======================
var WHEEL_D     = 56;    // g'ildirak diametri, mm
var GRIP_OFFSET = 130;   // g'ildirak o'qidan ushlangan obyekt markazigacha, mm
var SENS_OFFSET = 70;    // g'ildirak o'qidan chiziq sensorlarigacha, mm
var APPROACH    = 60;    // obyektga ochiq qisqich bilan yaqinlashish masofasi, mm
var L_SIGN = 1, R_SIGN = 1;   // motor teskari o'rnatilgan bo'lsa -1
var GYRO_SIGN = 1;            // o'ngga burilganda burchak kamaysa -1

var LINE_HALF   = 9;     // qora chiziq kengligining yarmi, mm
var BLACK = 8, WHITE = 65;    // chiziq sensorlari: qora va oq qiymati
var GREY  = (BLACK + WHITE) / 2;

var SPEED      = 80;     // asosiy tezlik, %
var SLOW       = 35;     // obyekt yonida sekin tezlik, %
var KP_GYRO    = 2.5;    // to'g'ri yurishda yo'nalishni ushlab turish
var KP_TURN    = 1.5;    // burilish P-koeffitsiyenti
var KP_LINE    = 0.5, KD_LINE = 3.0;

// EV3 rang kodlari
var C_NONE = 0, C_BLACK = 1, C_BLUE = 2, C_GREEN = 3,
    C_YELLOW = 4, C_RED = 5, C_WHITE = 6, C_BROWN = 7;

// 0 = hamma missiyalar (vaqt yetganicha); 1..7 = faqat MISSIONS ro'yxatidagi bitta missiya
var RUN_ONLY = 0;

// ============================ 2. XARITA =============================
var START = [490, 571];             // start maydoni markazi

var VISITOR = {                      // ko'chadagi mehmonlar
    red:   [319, 1057], green: [432, 1057],
    blue:  [546, 1057], black: [660, 1057]
};
var VISITOR_TARGET = {               // mehmonni qo'yish nuqtalari
    green: [1267, 1060],             // qazishma markazi (artefaktlar olib ketilgandan keyin)
    red:   [1074, 150],              // muzey ichida, qizil va yashil ko'rgazma joylari orasida-pastida
    black: [2160, 316],              // qora maydon
    blue:  [2160, 848]               // ko'k maydon
};

var ART_SLOTS = [1069, 1201, 1333, 1465];   // artefaktlar X, Y = 1068 (tasodifiy ranglar)
var ART_Y = 1068;
var MUSEUM_Y = 80;                           // ko'rgazma joylari Y
var MUSEUM_X = {};                           // rang -> ko'rgazma joyi X
MUSEUM_X[C_RED] = 1009; MUSEUM_X[C_GREEN] = 1138; MUSEUM_X[C_BLACK] = 1269;
MUSEUM_X[C_BLUE] = 1398; MUSEUM_X[C_YELLOW] = 1528;

var YELLOW_TOP  = [[236, 72], [378, 72]];    // sariq minora tepalari (chap yuqori)
var YELLOW_BASE = [[1797, 236], [1797, 905]];// sariq minora asoslari (o'ng tomon)
var RED_TOWER   = [[90, 214], [90, 356]];    // qizil minoralar (chap yuqori)
var RED_TARGET  = [[1625, 406], [1625, 741]];// qizil minoralar maqsadi (to'q sariq ramka)

var TRUNK_X   = 1274;   // muzey-qazishma vertikal qora chizig'i
var HIGHWAY_Y = 569;    // startdan toshyo'lgacha gorizontal qora chiziq
var HUB       = [1797, 571];   // o'ng tomondagi barcha missiyalar uchun tugun nuqta

// Toshyo'l (cobblestone): x 1900..2268, y 426..714. Qizil to'siq x ~2298 — tegmang!
// To'tiqush (1941, 898) — tegmang!
var SWEEP_X = [1995, 2170];   // axlatni tozalash ustunlari
var SWEEP_Y_FROM = 276, SWEEP_Y_TO = 640;

// ====================== 3. QURILMALAR VA HOLAT ======================
var mL = brick.motor("B"), mR = brick.motor("C");
var mGrip = brick.motor("A"), mLift = brick.motor("D");
var encL = brick.encoder("B"), encR = brick.encoder("C");
var sL = brick.sensor("1"), sR = brick.sensor("2");
var sCol = brick.sensor("3"), gyro = brick.sensor("4");

var X = START[0], Y = START[1];   // robot o'qi markazi (mm)
var yellowDone = false;           // sariq minora tepalari olib ketildimi
var gyro0 = 0, H0 = 0;            // giroskop nol nuqtasi

// ======================= 4. ASOSIY FUNKSIYALAR ======================
function rad(d) { return d * Math.PI / 180; }
function deg(r) { return r * 180 / Math.PI; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function norm(a) { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; }
function deg2mm(d) { return d / 360 * Math.PI * WHEEL_D; }

function show(t) {
    brick.display().clear();
    brick.display().addLabel(t, 1, 1);
    brick.display().addLabel("X" + Math.round(X) + " Y" + Math.round(Y) +
                             " H" + Math.round(heading()), 1, 20);
    brick.display().redraw();
}

function setMotors(l, r) {
    mL.setPower(L_SIGN * clamp(l, -100, 100));
    mR.setPower(R_SIGN * clamp(r, -100, 100));
}
function stop() { setMotors(0, 0); script.wait(60); }

function heading() { return norm(GYRO_SIGN * (gyro.read() - gyro0) + H0); }
function setHeading(h) { gyro0 = gyro.read(); H0 = h; }   // yo'nalishni qayta belgilash

function encMm() {
    return (deg2mm(L_SIGN * encL.read()) + deg2mm(R_SIGN * encR.read())) / 2;
}

// Joyida burilish — giroskop bo'yicha absolyut yo'nalishga
function turnTo(h) {
    var t = 0;
    while (t < 400) {                          // maks. ~2 s
        var e = norm(h - heading());
        if (Math.abs(e) < 1) break;
        var p = clamp(KP_TURN * e, -60, 60);
        if (Math.abs(p) < 14) p = p < 0 ? -14 : 14;
        setMotors(p, -p);
        script.wait(5); t++;
    }
    stop();
}

// To'g'ri yurish (mm), + oldinga, - orqaga. Yo'nalish giroskop bilan ushlanadi,
// X,Y koordinatalar har qadamda hisoblanadi (odometriya).
// (tx, ty) berilsa — yurish davomida yo'nalish shu nuqtaga qarab tuzatiladi.
function straight(mm, speed, tx, ty) {
    speed = speed || SPEED;
    var dir = mm < 0 ? -1 : 1, target = Math.abs(mm);
    var hold = heading(), aim = tx !== undefined;
    encL.reset(); encR.reset();
    var last = 0;
    while (true) {
        var d = Math.abs(encMm()), remain = target - d;
        if (aim) {
            var dx = tx - X, dy = ty - Y, hv = rad(heading() + (dir < 0 ? 180 : 0));
            remain = dx * Math.cos(hv) + dy * Math.sin(hv);       // qolgan masofa
            if (remain > 40) hold = norm(deg(Math.atan2(dy, dx)) + (dir < 0 ? 180 : 0));
        }
        if (remain <= 0) break;
        var ramp = Math.min(1, (Math.min(d, remain) + 40) / 150);
        var p = Math.max(20, speed * ramp);
        var c = KP_GYRO * norm(hold - heading());
        setMotors(dir * p + c, dir * p - c);
        var step = d - last; last = d;
        X += dir * step * Math.cos(rad(heading()));
        Y += dir * step * Math.sin(rad(heading()));
        script.wait(5);
    }
    stop();
}

// Nuqtaga borish: avval burilish, keyin nuqtaga qarab yurish.
// back = true bo'lsa, orqasi bilan boradi.
function goTo(x, y, speed, back) {
    var dx = x - X, dy = y - Y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;
    var a = deg(Math.atan2(dy, dx));
    if (back) { turnTo(norm(a + 180)); straight(-dist, speed, x, y); }
    else      { turnTo(a);             straight(dist, speed, x, y); }
}

// Bir nechta oraliq nuqtalar orqali borish
function path(points, speed) {
    for (var i = 0; i < points.length; i++) goTo(points[i][0], points[i][1], speed);
}

function alignPass(power, done) {
    var t = 0, l = false, r = false;
    while (!(l && r) && t < 400) {
        l = l || done(sL.read());
        r = r || done(sR.read());
        setMotors(l ? 0 : power, r ? 0 : power);
        script.wait(3); t++;
    }
    setMotors(0, 0);
}

// h yo'nalishida qora chiziqqa yetguncha yurib, ikkala sensor bilan tekislanish.
// Keyin koordinatani chiziqqa qarab tuzatish: axis = "x" yoki "y", value = chiziq koordinatasi.
function squareOnLine(h, axis, value, maxMm) {
    turnTo(h);
    maxMm = maxMm || 300;
    encL.reset(); encR.reset();
    setMotors(SLOW, SLOW);
    while (sL.read() > GREY && sR.read() > GREY) {
        if (Math.abs(encMm()) > maxMm) { stop(); return false; }   // chiziq topilmadi
        script.wait(3);
    }
    // tekislanish: har bir g'ildirak o'z sensori chiziqqa tushguncha yuradi,
    // keyin sekin orqaga — sensor chiziqning old chetiga chiqguncha
    alignPass(14, function (v) { return v < GREY; });
    alignPass(-8, function (v) { return v > GREY; });
    stop();
    setHeading(h);                            // yo'nalish aniq h
    var c = Math.cos(rad(h)), s = Math.sin(rad(h));
    // sensorlar chiziqning yaqin chetida turibdi
    if (axis === "x") { X = value - (SENS_OFFSET + LINE_HALF) * c; }
    else              { Y = value - (SENS_OFFSET + LINE_HALF) * s; }
    return true;
}

// ========================== 5. MEXANIZMLAR ==========================
// Vaqt bo'yicha boshqariladi — o'z mexanizmingizga qarab sozlang.
function gripOpen()  { mGrip.setPower(-60); script.wait(450); mGrip.setPower(0); }
function gripClose() { mGrip.setPower(60);  script.wait(550); mGrip.setPower(12); }
var liftState = 0;   // 0 - pastda, 1 - biroz ko'tarilgan, 2 - baland
function liftDown()  { if (liftState === 0) return;
                       mLift.setPower(-40); script.wait(liftState === 2 ? 600 : 250); mLift.setPower(0); liftState = 0; }
function liftCarry() { mLift.setPower(40);  script.wait(250); mLift.setPower(8); liftState = 1; }   // biroz ko'tarish
function liftHigh()  { mLift.setPower(60);  script.wait(liftState === 1 ? 450 : 700); mLift.setPower(10); liftState = 2; } // sariq asos ustidan

function readColor() {
    var cnt = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 7; i++) {
        var c = sCol.read();
        if (c >= 0 && c <= 7) cnt[c]++;
        script.wait(30);
    }
    var best = 0;
    for (var j = 1; j < 8; j++) if (cnt[j] > cnt[best]) best = j;
    return best;
}

// Obyektni olish: obyekt (ox,oy), robot h yo'nalishida yaqinlashadi
function pickAt(ox, oy, h) {
    var c = Math.cos(rad(h)), s = Math.sin(rad(h));
    var pre = GRIP_OFFSET + APPROACH;
    goTo(ox - pre * c, oy - pre * s);
    turnTo(h);
    liftDown(); gripOpen();
    straight(APPROACH, SLOW);
    gripClose(); liftCarry();
}

// Obyektni qo'yish: maqsad (tx,ty), robot h yo'nalishida keladi.
// high = true — sariq minora tepasini asos ustiga qo'yish.
function placeAt(tx, ty, h, high) {
    var c = Math.cos(rad(h)), s = Math.sin(rad(h));
    var pre = GRIP_OFFSET + APPROACH;
    goTo(tx - pre * c, ty - pre * s);
    turnTo(h);
    if (high) liftHigh();
    straight(APPROACH, SLOW);
    if (!high) liftDown();
    gripOpen();
    straight(-APPROACH - 20, SLOW);
    gripClose();
    if (high) liftDown();
}

// ============================ 6. MISSIYALAR ==========================

// Robot o'ng tomonda bo'lsa, avval gorizontal chiziq bo'ylab chapga qaytish
// (o'ng tomondagi qurilgan minoralarga tegmaslik uchun)
function leaveRightSide() {
    if (X > 1500) goTo(1500, HIGHWAY_Y);
}

// M1. Yashil mehmon -> qazishma (artefaktlardan keyin bajariladi) — 10 ball
function missionVisitorGreen() {
    show("M1 yashil mehmon");
    leaveRightSide();
    goTo(700, 760);
    pickAt(VISITOR.green[0], VISITOR.green[1], 90);
    straight(-120);
    placeAt(VISITOR_TARGET.green[0], VISITOR_TARGET.green[1], 90);
}

// M7. Qizil mehmon -> muzey — 10 ball
function missionVisitorRed() {
    show("M7 qizil mehmon");
    leaveRightSide();
    goTo(700, 760);
    pickAt(VISITOR.red[0], VISITOR.red[1], 90);
    straight(-120);
    path([[1000, 700], [1150, 330]]);                  // yuqoriga, muzey tomon
    squareOnLine(0, "x", TRUNK_X);                     // vertikal chiziqda X ni tuzatish
    placeAt(VISITOR_TARGET.red[0], VISITOR_TARGET.red[1], -90);
}

// M2. Artefaktlar: qazishmadan muzeyga, rangiga qarab — 4 x 15 ball
function missionArtefacts() {
    for (var i = 0; i < ART_SLOTS.length; i++) {
        show("M2 artefakt " + (i + 1));
        if (i % 2 === 0) {                             // har 2 safarda koordinatani tuzatish
            goTo(800, 470);
            squareOnLine(90, "y", HIGHWAY_Y);          // gorizontal chiziq -> Y
        }
        goTo(1150, 840);
        squareOnLine(0, "x", TRUNK_X);                 // pastki vertikal chiziq -> X
        pickAt(ART_SLOTS[i], ART_Y, 90);
        var col = readColor();
        show("Rang: " + col);
        straight(-60);
        var mx = MUSEUM_X[col];
        if (mx === undefined) {                        // rang aniqlanmadi — joyida qoldirish
            liftDown(); gripOpen(); straight(-60); gripClose();
            continue;
        }
        placeAt(mx, MUSEUM_Y, -90);
    }
}

// M3. Sariq minoralar: tepasini asos ustiga qo'yish — 2 x 25 ball
function missionYellowTowers() {
    for (var i = 0; i < 2; i++) {
        show("M3 sariq " + (i + 1));
        if (X > 1500) path([[1500, HIGHWAY_Y], [700, 420]]);  // qurilgan minoralarni aylanib o'tish
        // qizil minoralar yonida burilmaslik uchun pastroqda burilib, to'g'ri yuqoriga boramiz
        goTo(YELLOW_TOP[i][0], 450);
        pickAt(YELLOW_TOP[i][0], YELLOW_TOP[i][1], -90);
        straight(-100);
        path([[900, 571], [1500, HIGHWAY_Y]]);
        goTo(HUB[0], HUB[1]);
        var b = YELLOW_BASE[i];
        placeAt(b[0], b[1], i === 0 ? -90 : 90, true); // 1-asos shimolda, 2-asos janubda
        goTo(HUB[0], HUB[1], SPEED, true);
    }
    yellowDone = true;
}

// M4. Qizil minoralar: chap yuqoridan to'q sariq ramkali kvadratlarga — 2 x 15 ball
// Sariq minora tepalari joyida tursa, qizil minoralar yonida burilish ularga tegadi,
// shuning uchun bu missiya faqat M3 dan keyin bajariladi.
// (Alohida sinashda — RUN_ONLY = 4 — sariq tepalarni maydondan olib qo'ying.)
function missionRedTowers() {
    if (!yellowDone && RUN_ONLY !== 4) { show("M4 o'tkazildi: avval M3"); return; }
    for (var i = 0; i < 2; i++) {
        show("M4 qizil " + (i + 1));
        path([[1500, HIGHWAY_Y], [700, 420]]);
        pickAt(RED_TOWER[i][0], RED_TOWER[i][1], 180);
        straight(-100, SLOW);
        path([[700, 480], [1500, HIGHWAY_Y]], 45);     // baland minora — sekinroq
        var t = RED_TARGET[i];
        placeAt(t[0], t[1], 0);                        // g'arbdan, sharqqa qarab qo'yish
        goTo(1435, HIGHWAY_Y);
    }
}

// M5. Toshyo'lni axlatdan tozalash — 10 x 2 ball
// Qisqich keng ochiq "kurak" bo'lib, axlatni janubga (toshyo'ldan tashqariga) suradi.
function missionDirt() {
    show("M5 axlat");
    goTo(HUB[0], HUB[1]);
    for (var i = 0; i < SWEEP_X.length; i++) {
        gripClose();                                   // burilishda qisqich yopiq — hech narsaga tegmaydi
        goTo(SWEEP_X[i], SWEEP_Y_FROM);
        turnTo(90);                                    // sharq orqali buriladi (sariq minoradan uzoq)
        gripOpen();
        straight(SWEEP_Y_TO - SWEEP_Y_FROM, 40);       // pastga surish
        straight(-(SWEEP_Y_TO - SWEEP_Y_FROM), SPEED); // ortga, yuqoriga qaytish
    }
    gripClose();
    goTo(SWEEP_X[1], 520, SPEED, true);
}

// M6. Qora va ko'k mehmon — toshyo'l yonidagi maydonlarga — 2 x 10 ball
function missionVisitorsBlackBlue() {
    var list = [["black", -90], ["blue", 90]];
    for (var i = 0; i < 2; i++) {
        var name = list[i][0];
        show("M6 " + name + " mehmon");
        path([[1500, HIGHWAY_Y], [800, 760]]);
        pickAt(VISITOR[name][0], VISITOR[name][1], 90);
        straight(-120);
        path([[900, HIGHWAY_Y], [HUB[0], HIGHWAY_Y], [VISITOR_TARGET[name][0], HIGHWAY_Y]]);
        placeAt(VISITOR_TARGET[name][0], VISITOR_TARGET[name][1], list[i][1]);
        goTo(VISITOR_TARGET[name][0], HIGHWAY_Y, SPEED, true);
    }
}

// =========================== 7. ASOSIY DASTUR ========================
// Missiyalar tartibi. est — taxminiy vaqt (soniya, simulyatsiya + zaxira).
// Haqiqiy robotda har birini o'lchab, est ni yangilang!
// Vaqt yetmasa, missiya o'tkazib yuboriladi (robot to'xtab qolmaydi).
var MISSIONS = [
    { f: missionArtefacts,         est: 60, name: "Artefaktlar (60)" },
    { f: missionVisitorGreen,      est: 15, name: "Yashil mehmon (10)" },
    { f: missionYellowTowers,      est: 44, name: "Sariq minoralar (50)" },
    { f: missionRedTowers,         est: 48, name: "Qizil minoralar (30)" },
    { f: missionDirt,              est: 20, name: "Axlat (20)" },
    { f: missionVisitorsBlackBlue, est: 43, name: "Qora+ko'k mehmon (20)" },
    { f: missionVisitorRed,        est: 22, name: "Qizil mehmon (10)" }
];
var TIME_LIMIT = 120;   // soniya

var main = function () {
    show("WRO 2026 Junior");
    liftState = 2; liftDown();        // ko'targichni pastga
    script.wait(500);                 // giroskop tinchlanishi uchun
    setHeading(0);
    X = START[0]; Y = START[1];
    gripClose();

    var t0 = Date.now();
    for (var i = 0; i < MISSIONS.length; i++) {
        if (RUN_ONLY !== 0 && RUN_ONLY !== i + 1) continue;
        var used = (Date.now() - t0) / 1000;
        if (RUN_ONLY === 0 && used + MISSIONS[i].est > TIME_LIMIT) continue;  // vaqt yetmaydi
        MISSIONS[i].f();
    }
    setMotors(0, 0); mGrip.setPower(0); mLift.setPower(0);
    show("Tugadi " + Math.round((Date.now() - t0) / 1000) + " s");
    script.wait(3000);
    return;
};
