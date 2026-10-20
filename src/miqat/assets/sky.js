// Miqat's live sky: the sky over Makkah right now, drawn the way the app draws
// it. The colours are the app's (SkyPalette.swift: by the sun's altitude, mixed
// in OKLab, the S-curve just past sunset), the sun path is its 24-hour graph
// (SunPath.swift, SunPathView.swift), and the times come from adhan-js, the
// JavaScript sibling of the adhan-swift library Miqat uses, with the Umm
// al-Qura method Miqat picks for Saudi Arabia (Isha 30 minutes later in
// Ramadan, as ServicesPrayerTimeCalculator.swift adds).
(function () {
  "use strict";

  var hero = document.querySelector("[data-sky]");
  if (!hero || !window.adhan || !window.Intl) return;
  var adhan = window.adhan;
  var PLACE = { name: "Makkah", lat: 21.4225, lon: 39.8262, tz: "Asia/Riyadh" };
  var PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  var NAMES = { fajr: "Fajr", sunrise: "Sunrise", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" };
  var MONTHS = ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Awwal", "Jumada al-Thani",
    "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"];
  var HOUR = 3600 * 1000;
  var rad = function (d) { return d * Math.PI / 180; };
  var deg = function (r) { return r * 180 / Math.PI; };

  // ---------- The sky's colours (SkyPalette.swift) ----------
  var ANCHORS = [
    [90, "84B4E3", "A7CBEB", "E2EFFA"],
    [20, "84B4E3", "A7CBEB", "E2EFFA"],
    [5, "90B3D8", "C3D4E4", "EDD9BA"],
    [0, "A8B8D6", "E8D0C2", "F0B386"],
    [-6, "33406E", "6E5A86", "CF7A5F"],
    [-12, "1B2550", "2B3262", "46466F"],
    [-18, "131B3F", "1D2450", "2A315D"],
    [-24, "060A18", "0B1224", "111A30"],
    [-90, "060A18", "0B1224", "111A30"]
  ];

  function toLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toSRGB(c) { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
  function hexToOklab(hex) {
    var n = parseInt(hex, 16);
    var r = toLinear((n >> 16 & 255) / 255), g = toLinear((n >> 8 & 255) / 255), b = toLinear((n & 255) / 255);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function oklabToRGB(c) {
    var l = Math.pow(c[0] + 0.3963377774 * c[1] + 0.2158037573 * c[2], 3);
    var m = Math.pow(c[0] - 0.1055613458 * c[1] - 0.0638541728 * c[2], 3);
    var s = Math.pow(c[0] - 0.0894841775 * c[1] - 1.2914855480 * c[2], 3);
    return [toSRGB(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      toSRGB(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      toSRGB(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(rgb) { return "rgb(" + rgb.map(function (v) { return Math.round(v * 255); }).join(" ") + ")"; }
  function luminance(rgb) {
    var lin = rgb.map(toLinear);
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }
  function sunsetEase(t) {
    var s = function (x) { return 1 / (1 + Math.exp(-18 * (x - 0.45))); };
    return (s(t) - s(0)) / (s(1) - s(0));
  }
  function palette(altitude) {
    var alt = Math.max(-90, Math.min(90, altitude));
    for (var i = 0; i < ANCHORS.length - 1; i++) {
      var up = ANCHORS[i], lo = ANCHORS[i + 1];
      if (alt <= up[0] && alt >= lo[0]) {
        var t = (up[0] - alt) / (up[0] - lo[0]);
        if (up[0] === 0 && lo[0] === -6) t = sunsetEase(t);
        return [1, 2, 3].map(function (k) { return oklabToRGB(mix(hexToOklab(up[k]), hexToOklab(lo[k]), t)); });
      }
    }
    return [1, 2, 3].map(function (k) { return oklabToRGB(hexToOklab(ANCHORS[ANCHORS.length - 1][k])); });
  }

  // ---------- The sun's altitude (NOAA's equations) ----------
  function sunAltitude(date) {
    var jd = date.getTime() / 86400000 + 2440587.5;
    var T = (jd - 2451545) / 36525;
    var L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    var M = 357.52911 + T * (35999.05029 - 0.0001537 * T), Mr = rad(M);
    var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    var C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mr) * 0.000289;
    var omega = 125.04 - 1934.136 * T;
    var lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
    var eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(rad(omega));
    var decl = Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda)));
    var y = Math.pow(Math.tan(rad(eps) / 2), 2), L0r = rad(L0);
    var eqTime = 4 * deg(y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r)
      - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
    var minutes = ((date.getTime() / 60000) % 1440 + 1440) % 1440;
    var hourAngle = ((minutes + eqTime + 4 * PLACE.lon) % 1440) / 4 - 180;
    var zenith = Math.acos(Math.sin(rad(PLACE.lat)) * Math.sin(decl) + Math.cos(rad(PLACE.lat)) * Math.cos(decl) * Math.cos(rad(hourAngle)));
    return 90 - deg(zenith);
  }

  // ---------- Prayer times in Makkah ----------
  var partsFormat = new Intl.DateTimeFormat("en-US", { timeZone: PLACE.tz, year: "numeric", month: "numeric", day: "numeric" });
  var hijriFormat = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: PLACE.tz, year: "numeric", month: "numeric", day: "numeric" });
  var timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: PLACE.tz, hour: "numeric", minute: "2-digit" });
  function parts(format, date) {
    var out = {};
    format.formatToParts(date).forEach(function (p) { out[p.type] = parseInt(p.value, 10); });
    return out;
  }
  function times(y, m, d) {
    // adhan-js reads the calendar day from a local Date; its times are true instants.
    var day = new Date(y, m - 1, d, 12);
    var t = new adhan.PrayerTimes(new adhan.Coordinates(PLACE.lat, PLACE.lon), day, adhan.CalculationMethod.UmmAlQura());
    var out = {};
    PRAYERS.forEach(function (p) { out[p] = new Date(t[p].getTime()); });
    if (parts(hijriFormat, out.dhuhr).month === 9) out.isha = new Date(out.isha.getTime() + 30 * 60000);
    return out;
  }

  // ---------- Drawing ----------
  var svg = hero.querySelector("[data-sky-path]");
  var list = hero.querySelector("[data-sky-list]");
  var stars = document.querySelector("[data-sky-stars]");
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  if (stars) {
    // Fixed positions, so the stars don't jump between updates.
    var seed = 7;
    var random = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < 70; i++) {
      var star = document.createElement("i");
      star.style.left = (random() * 100).toFixed(2) + "%";
      star.style.top = (random() * 62).toFixed(2) + "%";
      star.style.setProperty("--size", (random() < 0.15 ? 2.2 : 1.3).toFixed(1) + "px");
      star.style.animationDelay = (random() * -6).toFixed(2) + "s";
      stars.appendChild(star);
    }
  }

  function drawPath(now, start, marks, light) {
    var W = Math.max(320, Math.round(svg.getBoundingClientRect().width));
    var H = W < 640 ? 170 : 230, depth = 46, top = 22, horizon = H - depth;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("height", H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var x0 = -10, x1 = W + 10, span = 24 * HOUR;
    var x = function (date) { return x0 + (date - start) / span * (x1 - x0); };
    var noonAlt = Math.max(10, sunAltitude(new Date(start.getTime() + 12 * HOUR)), sunAltitude(start));
    var k = (horizon - top) / noonAlt;
    var y = function (a) { return a >= 0 ? horizon - Math.min(a * k, horizon - top + 8) : horizon + depth * Math.tanh(-a / 20); };

    var past = [], future = [];
    for (var i = 0; i <= 288; i++) {
      var t = new Date(start.getTime() + i * span / 288);
      var point = [x(t), y(sunAltitude(t))];
      (t <= now ? past : future).push(point);
    }
    var sunAlt = sunAltitude(now), sun = [x(now), y(sunAlt)];
    past.push(sun); future.unshift(sun);
    var line = function (pts) { return "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L"); };

    var defs = el("defs", {}, svg);
    var clip = el("clipPath", { id: "above" }, defs);
    el("rect", { x: -20, y: -20, width: W + 40, height: horizon + 20.5 }, clip);
    var fade = el("linearGradient", { id: "past", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: Math.max(1, sun[0]), y2: 0 }, defs);
    el("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0.15" }, fade);
    el("stop", { offset: "0.45", "stop-color": "#fff", "stop-opacity": "0.68" }, fade);
    el("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "1" }, fade);
    var glow = el("filter", { id: "glow", x: "-20%", y: "-50%", width: "140%", height: "200%" }, defs);
    el("feGaussianBlur", { stdDeviation: "3.2" }, glow);
    var halo = el("radialGradient", { id: "halo" }, defs);
    el("stop", { offset: "0", "stop-color": "rgb(255 230 176)", "stop-opacity": "0.85" }, halo);
    el("stop", { offset: "0.35", "stop-color": "rgb(255 212 138)", "stop-opacity": "0.32" }, halo);
    el("stop", { offset: "1", "stop-color": "rgb(255 212 138)", "stop-opacity": "0" }, halo);
    var under = el("radialGradient", { id: "under" }, defs);
    el("stop", { offset: "0", "stop-color": "rgb(255 158 110)", "stop-opacity": "0.95" }, under);
    el("stop", { offset: "0.4", "stop-color": "rgb(245 138 114)", "stop-opacity": "0.4" }, under);
    el("stop", { offset: "1", "stop-color": "rgb(245 138 114)", "stop-opacity": "0" }, under);

    // Below the horizon the path dips under the glass, faintly.
    el("path", { d: line(future), fill: "none", stroke: "#fff", "stroke-opacity": "0.28", "stroke-width": "1.2", "stroke-linecap": "round" }, svg);
    el("path", { d: line(past), fill: "none", stroke: "#fff", "stroke-opacity": "0.4", "stroke-width": "2", "stroke-linecap": "round" }, svg);

    // The sun under the horizon: a warm glow the glass blurs, until −18°.
    if (sunAlt <= -0.8) {
      var warm = Math.max(0, Math.min(1, 1 + sunAlt / 18));
      if (warm > 0.01) el("circle", { cx: sun[0], cy: horizon + 6, r: 70, fill: "url(#under)", opacity: warm.toFixed(2) }, svg);
    }

    // Above the horizon: on a light sky a navy edge under the white lines.
    var arc = el("g", { "clip-path": "url(#above)" }, svg);
    if (light) {
      el("path", { d: line(future), fill: "none", stroke: "rgb(14 34 56)", "stroke-opacity": "0.24", "stroke-width": "3.4", "stroke-linecap": "round" }, arc);
      el("path", { d: line(past), fill: "none", stroke: "rgb(14 34 56)", "stroke-opacity": "0.3", "stroke-width": "5.2", "stroke-linecap": "round" }, arc);
    }
    el("path", { d: line(future), fill: "none", stroke: "#fff", "stroke-opacity": light ? "0.9" : "0.55", "stroke-width": "1.3", "stroke-linecap": "round" }, arc);
    el("path", { d: line(past), fill: "none", stroke: "url(#past)", "stroke-width": "7", "stroke-linecap": "round", filter: "url(#glow)", opacity: "0.55" }, arc);
    el("path", { d: line(past), fill: "none", stroke: "url(#past)", "stroke-width": "2.8", "stroke-linecap": "round" }, arc);

    // The prayers: Dhuhr and Asr on the curve, the rest on the horizon.
    marks.forEach(function (mark) {
      var alt = sunAltitude(mark.time);
      var p = [x(mark.time), alt > 1 ? y(alt) : horizon];
      if (mark.state === "next") {
        el("circle", { cx: p[0], cy: p[1], r: 7, fill: "none", stroke: "#fff", "stroke-width": "2" }, svg);
      } else {
        el("circle", { cx: p[0], cy: p[1], r: 3, fill: "#fff", "fill-opacity": mark.state === "passed" ? "0.55" : "0.85" }, svg);
      }
    });

    // The sun above the horizon: a warm halo and a white disc.
    if (sunAlt > -0.8) {
      el("circle", { cx: sun[0], cy: sun[1], r: 30, fill: "url(#halo)" }, svg);
      el("circle", { cx: sun[0], cy: sun[1], r: 8, fill: "rgb(255 250 235)", stroke: "#fff", "stroke-width": "1" }, svg);
    }
    el("line", { x1: 0, y1: horizon + 0.5, x2: W, y2: horizon + 0.5, stroke: "#fff", "stroke-opacity": light ? "0.7" : "0.35", "stroke-width": "1" }, svg);
  }

  function countdown(ms) {
    var minutes = Math.max(1, Math.ceil(ms / 60000));
    if (minutes < 60) return minutes + "<small>min</small>";
    return Math.floor(minutes / 60) + "<small>h</small> " + (minutes % 60) + "<small>m</small>";
  }

  // ?at=2026-10-20T09:00:00Z shows the sky at that moment (for checking the
  // day, sunset and night looks).
  var at = /[?&]at=([^&]+)/.exec(location.search);
  var fixed = at ? new Date(decodeURIComponent(at[1])) : null;
  if (fixed && isNaN(fixed)) fixed = null;

  function update() {
    var now = fixed || new Date();
    var d = parts(partsFormat, now);
    var today = times(d.year, d.month, d.day);
    var yesterday = times(d.year, d.month, d.day - 1);
    var tomorrow = times(d.year, d.month, d.day + 1);

    // The window (SunPath.make): centred on solar noon from Fajr until Isha,
    // on the night after it.
    var start;
    if (now >= today.isha) start = today.dhuhr;
    else if (now < today.fajr) start = yesterday.dhuhr;
    else start = new Date(today.dhuhr.getTime() - 12 * HOUR);
    var end = new Date(start.getTime() + 24 * HOUR);

    var events = [];
    [yesterday, today, tomorrow].forEach(function (day) {
      PRAYERS.forEach(function (p) { events.push({ prayer: p, time: day[p] }); });
    });
    events.sort(function (a, b) { return a.time - b.time; });
    var next = events.filter(function (e) { return e.time > now; })[0];
    var passed = events.filter(function (e) { return e.time <= now; });
    var last = passed[passed.length - 1];
    var current = last && last.prayer !== "sunrise" ? last : null;

    var marks = events.filter(function (e) { return e.time >= start && e.time <= end; }).map(function (e) {
      return { time: e.time, state: e === next ? "next" : e.time <= now ? "passed" : "upcoming" };
    });

    // Colours and ink.
    var alt = sunAltitude(now);
    var sky = palette(alt);
    var light = luminance(sky[1]) > 0.3;
    var rootStyle = document.documentElement.style;
    rootStyle.setProperty("--sky-top", css(sky[0]));
    rootStyle.setProperty("--sky-mid", css(sky[1]));
    rootStyle.setProperty("--sky-horizon", css(sky[2]));
    rootStyle.setProperty("--stars", Math.max(0, Math.min(1, (-alt - 6) / 10)).toFixed(2));
    document.documentElement.dataset.light = light ? "true" : "false";

    // Words. The Hijri day turns at Maghrib, as in the app.
    var hijri = parts(hijriFormat, now >= today.maghrib ? new Date(now.getTime() + 24 * HOUR) : now);
    hero.querySelector("[data-sky-date]").textContent = hijri.day + " " + MONTHS[hijri.month - 1] + " " + hijri.year;
    hero.querySelector("[data-sky-next]").textContent = NAMES[next.prayer] + " in";
    hero.querySelector("[data-sky-count]").innerHTML = countdown(next.time - now);

    // The list: today's prayers; after Isha, tomorrow's Fajr.
    var shown = {};
    PRAYERS.forEach(function (p) { shown[p] = today[p]; });
    if (now >= today.isha) shown.fajr = tomorrow.fajr;
    Array.prototype.forEach.call(list.querySelectorAll("[data-prayer]"), function (row) {
      var p = row.dataset.prayer, time = shown[p];
      var text = timeFormat.format(time).split(" ");
      row.querySelector("[data-time]").innerHTML = text[0] + "<small>" + (text[1] || "") + "</small>";
      row.classList.toggle("is-current", !!current && current.prayer === p && current.time.getTime() === time.getTime());
      row.classList.toggle("is-next", next.prayer === p && next.time.getTime() === time.getTime());
      row.classList.toggle("is-past", time <= now && !(current && current.prayer === p && current.time.getTime() === time.getTime()));
      row.querySelector("[data-tomorrow]").hidden = !(p === "fajr" && now >= today.isha);
    });

    drawPath(now, start, marks, light);
    hero.classList.add("is-live");
  }

  update();
  setInterval(update, 20000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) update(); });
  var resizeTimer;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(update, 150); });
})();
