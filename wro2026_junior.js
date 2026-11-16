// =====================================================================
//  WRO 2026 RoboMission Junior (5-8 sinflar) — "Heritage Heroes"
//  TRIK Studio 2026.2 | LEGO EV3 | JavaScript
// =====================================================================
//  ROBOT SOZLAMASI (TRIK Studio -> Sozlamalar -> Robot):
//    Motor B  - chap g'ildirak      Motor C - o'ng g'ildirak
//    Motor A  - ushlagich (qisqich) Motor D - ko'targich
//    Sensor 1 - chap rang sensori  (yorug'lik/aks etish rejimi)
//    Sensor 2 - o'ng rang sensori  (yorug'lik/aks etish rejimi)
//    Sensor 3 - oldingi rang sensori (rang rejimi — obyekt rangini o'qish)
//
//  MUHIM: barcha masofa/burchaklar (pastdagi MAP bo'limi) haqiqiy
//  maydonda o'lchab, sozlanishi kerak. Avval har bir missiyani
//  alohida sinab ko'ring (RUN_ONLY o'zgaruvchisi orqali).
// =====================================================================

// ---------------- 1. ROBOT KONSTANTALARI ----------------
var WHEEL_D   = 5.6;    // g'ildirak diametri, sm (EV3 standart g'ildirak)
var TRACK     = 12.0;   // g'ildiraklar orasidagi masofa, sm (o'lchang!)
var BLACK     = 10;     // qora chiziqdagi sensor qiymati
var WHITE     = 60;     // oq maydondagi sensor qiymati
var GREY      = (BLACK + WHITE) / 2;
var KP = 0.6, KD = 4.0; // chiziq bo'ylab yurish (PD) koeffitsiyentlari
var BASE      = 50;     // odatiy tezlik, %

// Rang kodlari (EV3 rang sensori): 0-yo'q,1-qora,2-ko'k,3-yashil,
// 4-sariq,5-qizil,6-oq,7-jigarrang
var C_BLACK = 1, C_BLUE = 2, C_GREEN = 3, C_YELLOW = 4, C_RED = 5, C_WHITE = 6;

// 0 = hammasi; 1..5 = faqat bitta missiyani sinash
var RUN_ONLY = 0;

// ---------------- 2. QURILMALAR ----------------
var mL = brick.motor("B"), mR = brick.motor("C");
var mGrip = brick.motor("A"), mLift = brick.motor("D");
var encL = brick.encoder("B"), encR = brick.encoder("C");
var sL = brick.sensor("1"), sR = brick.sensor("2"), sCol = brick.sensor("3");

// ---------------- 3. YORDAMCHI FUNKSIYALAR ----------------
function cm2deg(cm) { return cm / (Math.PI * WHEEL_D) * 360; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function sign(v) { return v < 0 ? -1 : 1; }

function show(text) {
    brick.display().clear();
    brick.display().addLabel(text, 1, 1);
    brick.display().redraw();
}

function stop() { mL.setPower(0); mR.setPower(0); script.wait(80); }
function resetEnc() { encL.reset(); encR.reset(); }
function avgEnc() { return (Math.abs(encL.read()) + Math.abs(encR.read())) / 2; }

// To'g'ri yurish (enkoder bo'yicha, tekislash + sekin start/to'xtash)
function drive(cm, speed) {
    speed = speed || BASE;
    var dir = sign(cm), target = cm2deg(Math.abs(cm));
    resetEnc();
    while (avgEnc() < target) {
        var done = avgEnc();
        var k = Math.min(1, Math.min(done + 60, target - done + 60) / 250); // tezlanish/sekinlash
        var p = Math.max(20, speed * k);
        var corr = (Math.abs(encL.read()) - Math.abs(encR.read())) * 1.5;
        mL.setPower(dir * (p - corr));
        mR.setPower(dir * (p + corr));
        script.wait(5);
    }
    stop();
}

// Joyida burilish: + o'ngga, - chapga (gradusda)
function turn(deg, speed) {
    speed = speed || 35;
    var target = cm2deg(Math.PI * TRACK * Math.abs(deg) / 360);
    var d = sign(deg);
    resetEnc();
    while (avgEnc() < target) {
        var p = Math.max(15, speed * Math.min(1, (target - avgEnc() + 20) / 120));
        mL.setPower(d * p);
        mR.setPower(-d * p);
        script.wait(5);
    }
    stop();
}

// Bitta g'ildirakda burilish (yoy): + o'ngga, - chapga
function pivot(deg, speed) {
    speed = speed || 40;
    var target = cm2deg(2 * Math.PI * TRACK * Math.abs(deg) / 360);
    var m = deg > 0 ? mL : mR, e = deg > 0 ? encL : encR;
    resetEnc();
    while (Math.abs(e.read()) < target) { m.setPower(speed); script.wait(5); }
    stop();
}

// Ikki sensor bilan chiziq bo'ylab PD yurish, cm masofa
function lineCm(cm, speed) {
    speed = speed || BASE;
    var target = cm2deg(cm), last = 0;
    resetEnc();
    while (avgEnc() < target) {
        var e = sL.read() - sR.read();
        var u = KP * e + KD * (e - last);
        last = e;
        mL.setPower(clamp(speed + u, -100, 100));
        mR.setPower(clamp(speed - u, -100, 100));
        script.wait(5);
    }
    stop();
}

// Chiziq bo'ylab yurib, N ta perpendikulyar chiziq (chorraha)ni sanash
function lineCross(n, speed) {
    speed = speed || BASE;
    var last = 0, count = 0, onCross = false;
    while (count < n) {
        var a = sL.read(), b = sR.read();
        var both = a < GREY && b < GREY;
        if (both && !onCross) { count++; onCross = true; }
        if (!both && a > GREY - 5 && b > GREY - 5) onCross = false;
        var e = a - b, u = KP * e + KD * (e - last);
        last = e;
        mL.setPower(clamp(speed + u, -100, 100));
        mR.setPower(clamp(speed - u, -100, 100));
        script.wait(5);
    }
    stop();
}

// Qora chiziqqa yetguncha to'g'ri yurish, keyin ikkala sensor bilan tekislanish
function toLine(speed) {
    speed = speed || 35;
    var dir = sign(speed); speed = Math.abs(speed);
    mL.setPower(dir * speed); mR.setPower(dir * speed);
    while (sL.read() > GREY && sR.read() > GREY) script.wait(3);
    // tekislash (alignment)
    var t = 0;
    while (t < 150) {
        var eL = sL.read() - GREY, eR = sR.read() - GREY;
        mL.setPower(dir * clamp(eL * 0.8, -25, 25));
        mR.setPower(dir * clamp(eR * 0.8, -25, 25));
        if (Math.abs(eL) < 4 && Math.abs(eR) < 4) break;
        t++; script.wait(5);
    }
    stop();
}

// Mexanizmlar
function gripOpen()  { mGrip.setPower(-60); script.wait(500); mGrip.setPower(0); }
function gripClose() { mGrip.setPower(60);  script.wait(600); mGrip.setPower(15); } // ushlab turadi
function liftUp()    { mLift.setPower(50);  script.wait(700); mLift.setPower(8); }
function liftDown()  { mLift.setPower(-40); script.wait(700); mLift.setPower(0); }

// Obyekt rangini o'qish (5 marta o'qib, eng ko'p chiqqanini olish)
function readColor() {
    var cnt = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 5; i++) {
        var c = sCol.read();
        if (c >= 0 && c <= 7) cnt[c]++;
        script.wait(40);
    }
    var best = 0;
    for (var j = 1; j < 8; j++) if (cnt[j] > cnt[best]) best = j;
    return best;
}

// ---------------- 4. MISSIYALAR ----------------
// Maydon: start maydonidan chiqib, birinchi chiziqqa tekislanish — bazaviy nuqta.
// Har bir missiya oxirida robot ma'lum bazaviy chiziqqa qaytadi,
// shunda xatolar keyingi missiyaga o'tmaydi.

var visitorColors = [];   // tasodifiy joylashuvlarni saqlash

// M1. Mehmonlarni (visitors) mos rangli maydonga yo'naltirish
function missionVisitors() {
    show("M1: Visitors");
    for (var i = 0; i < 4; i++) {
        lineCross(1);           // keyingi mehmon pozitsiyasiga
        turn(90);
        drive(8, 30);           // mehmonga yaqinlashish
        var c = readColor();
        visitorColors.push(c);
        show("Visitor " + (i + 1) + ": " + c);
        gripOpen(); drive(4, 25); gripClose();
        // rangga qarab maqsad maydoniga olib borish (masofalarni sozlang!)
        if (c === C_RED)        drive(20);
        else if (c === C_BLUE)  drive(30);
        else if (c === C_GREEN) drive(40);
        else                    drive(50);
        gripOpen();              // tik qo'yib qoldirish
        drive(-12, 30);
        gripClose();
        toLine(-35);             // chiziqqa qaytish
        turn(-90);
    }
}

// M2. Buzilgan minoralarni tiklash (sariq minora tepasini asosga qo'yish)
function missionTowers() {
    show("M2: Towers");
    for (var i = 0; i < 2; i++) {
        lineCross(1);
        turn(90);
        liftDown(); gripOpen();
        drive(10, 30);
        gripClose(); liftUp();   // minora tepasini ko'tarish
        drive(-10, 30);
        turn(-90);
        lineCm(15);              // minora asosi tomonga
        turn(90);
        drive(10, 25);
        liftDown(); gripOpen();  // asos ustiga qo'yish
        drive(-10, 25);
        gripClose();
        turn(-90);
    }
}

// M3. Yo'llarni tozalash (10 ta qora "dirt" zarrachasini surib chiqarish)
function missionDirt() {
    show("M3: Dirt");
    liftDown(); gripOpen();      // qisqich keng ochiq — "kurak" sifatida
    toLine(40);
    lineCm(60, 45);              // 1-yo'lak
    turn(90);
    drive(25, 45);               // tozalash maydoniga surib chiqarish
    drive(-25, 45);
    turn(90);
    lineCm(60, 45);              // 2-yo'lak (qaytish)
    gripClose();
    turn(-180);
}

// M4. Artefaktlarni muzeyga olib borish
function missionArtefacts() {
    show("M4: Artefacts");
    for (var i = 0; i < 2; i++) {
        lineCross(1);
        turn(-90);
        gripOpen(); drive(10, 25); gripClose(); liftUp();
        drive(-10, 25);
        turn(90);
        lineCross(2);            // muzey tomonga
        turn(90);
        drive(12, 25);
        liftDown(); gripOpen();  // ehtiyotkorlik bilan qo'yish
        drive(-12, 25);
        gripClose();
        turn(-90);
        lineCross(2);            // qaytish (keyingi artefakt uchun)
    }
}

// M5. Marra: start/finish maydoniga qaytib, to'liq to'xtash
function missionFinish() {
    show("M5: Finish");
    turn(180);
    lineCross(2);
    drive(20, 40);               // butunlay start maydoni ichiga
    stop();
}

// ---------------- 5. ASOSIY DASTUR ----------------
var main = function () {
    show("WRO 2026 Junior\nStart...");
    gripClose(); liftDown();
    resetEnc();

    var t0 = Date.now();
    drive(10, 40);               // start maydonidan chiqish
    toLine(35);                  // birinchi chiziqqa tekislanish

    if (RUN_ONLY === 0 || RUN_ONLY === 1) missionVisitors();
    if (RUN_ONLY === 0 || RUN_ONLY === 2) missionTowers();
    if (RUN_ONLY === 0 || RUN_ONLY === 3) missionDirt();
    if (RUN_ONLY === 0 || RUN_ONLY === 4) missionArtefacts();
    if (RUN_ONLY === 0 || RUN_ONLY === 5) missionFinish();

    mL.setPower(0); mR.setPower(0); mGrip.setPower(0); mLift.setPower(0);
    show("Tugadi! " + Math.round((Date.now() - t0) / 1000) + " s");
    script.wait(5000);
    return;
}
