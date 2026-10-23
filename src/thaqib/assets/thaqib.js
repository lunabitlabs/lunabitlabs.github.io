// Thaqib's page: the app's night sky with its twinkling stars and shooting
// stars (OnboardingSky.swift's SkyDrawing, a little livelier here), its
// "next star" filling dot by dot (StarRules.swift, StarProgress.swift), and
// sections that rise in as they scroll into view. With Reduce Motion nothing
// moves: the sky is still and the star shows full. The same script runs
// /thaqib/ and /ar/thaqib/: on a page with <html lang="ar"> its words are Arabic.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var still = reduce.matches;
  document.documentElement.classList.add("js");

  // ---------- A number in 0..1 that's always the same for the same seed ----------
  function random(seed) {
    var t = (seed * 2654435761 + 0x7f4a7c15) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- The sky ----------
  var canvas = document.querySelector("[data-sky]");
  var starPath = window.Path2D && document.querySelector("#star path") ? new Path2D(document.querySelector("#star path").getAttribute("d")) : null;
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var width = 0, height = 0, ratio = 1;
    var resize = function () {
      ratio = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    var twinkles = function (time) {
      var count = Math.round(Math.min(90, width * height / 14000));
      for (var i = 0; i < count; i++) {
        var x = random(i * 3) * width, y = random(i * 3 + 1) * height;
        var speed = 0.6 + random(i * 3 + 2) * 1.4;
        var glow = 0.5 + 0.5 * Math.sin(time * speed + i);
        var opacity = 0.55 * (0.35 + 0.65 * glow);
        if (i % 6 === 0 && starPath) {
          // A few of the app's own star, pale gold.
          var side = 7 + random(i * 7) * 6;
          ctx.save();
          ctx.translate(x - side / 2, y - side / 2);
          ctx.scale(side / 100, side / 100);
          ctx.fillStyle = "rgba(255, 242, 204, " + opacity.toFixed(3) + ")";
          ctx.fill(starPath);
          ctx.restore();
        } else {
          var dot = 1.2 + random(i * 5) * 1.6;
          ctx.beginPath();
          ctx.arc(x, y, dot / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, " + opacity.toFixed(3) + ")";
          ctx.fill();
        }
      }
    };
    // A short streak with a bright head, now and then, down at 15–26°.
    // Two of them on their own clocks, so the sky is never quiet for long.
    var shootingStar = function (time, period, salt) {
      var duration = 1.1;
      var cycle = Math.floor(time / period);
      var seed = cycle * 11 + salt;
      var delay = random(seed) * (period - duration - 0.3);
      var progress = (time - cycle * period - delay) / duration;
      if (progress < 0 || progress > 1) return;
      var leftToRight = random(seed + 1) < 0.5;
      var sx = width * (leftToRight ? 0.06 + 0.45 * random(seed + 2) : 0.49 + 0.45 * random(seed + 2));
      var sy = height * (0.03 + 0.4 * random(seed + 3));
      var angle = 0.26 + 0.2 * random(seed + 4);
      var travel = Math.min(width, height) * (0.35 + 0.25 * random(seed + 5));
      var ux = leftToRight ? Math.cos(angle) : -Math.cos(angle), uy = Math.sin(angle);
      var eased = 1 - Math.pow(1 - progress, 2);
      var hx = sx + ux * travel * eased, hy = sy + uy * travel * eased;
      var tail = 130 * (1 - 0.4 * progress);
      var tx = hx - ux * tail, ty = hy - uy * tail;
      var fade = Math.min(1, progress / 0.15) * Math.min(1, (1 - progress) / 0.3);
      var gold = random(seed + 6) < 0.3;
      var light = gold ? "255, 214, 120" : "255, 247, 219";
      var streak = ctx.createLinearGradient(tx, ty, hx, hy);
      streak.addColorStop(0, "rgba(" + light + ", 0)");
      streak.addColorStop(1, "rgba(" + light + ", " + (0.9 * fade).toFixed(3) + ")");
      ctx.strokeStyle = streak; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      var head = ctx.createRadialGradient(hx, hy, 0, hx, hy, 7);
      head.addColorStop(0, "rgba(" + light + ", " + (0.95 * fade).toFixed(3) + ")");
      head.addColorStop(1, "rgba(" + light + ", 0)");
      ctx.fillStyle = head; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
    };
    var last = 0;
    var frame = function (now) {
      if (!still) requestAnimationFrame(frame);
      if (now - last < 32 && !still) return;   // about 30 a second, as the app
      last = now;
      var time = still ? 0 : now / 1000;
      ctx.clearRect(0, 0, width, height);
      twinkles(time);
      if (!still) { shootingStar(time, 4.2, 0); shootingStar(time + 1.7, 5.9, 500); }
    };
    resize();
    window.addEventListener("resize", function () { resize(); if (still) frame(0); });
    requestAnimationFrame(frame);
  }

  // ---------- The next star (StarRules.swift) ----------
  var CORNERS = 10, INNER = 0.595, ROUNDING = 0.12, OUTER = 0.5;
  var centre = { x: 0.5, y: 0.5 + (OUTER - OUTER * Math.cos(Math.PI / 5)) / 2 };
  function vertex(k) {
    var angle = -Math.PI / 2 + k * 2 * Math.PI / CORNERS;
    var r = k % 2 === 0 ? OUTER : OUTER * INNER;
    return { x: centre.x + r * Math.cos(angle), y: centre.y + r * Math.sin(angle) };
  }
  function unit(p) { var l = Math.hypot(p.x, p.y); return l ? { x: p.x / l, y: p.y / l } : p; }
  function corner(k) {
    var v = vertex(k), prev = vertex((k + CORNERS - 1) % CORNERS), next = vertex((k + 1) % CORNERS);
    var a = unit({ x: prev.x - v.x, y: prev.y - v.y }), b = unit({ x: next.x - v.x, y: next.y - v.y });
    var half = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y))) / 2;
    return { v: v, a: a, b: b, half: half, prev: prev, next: next };
  }
  function dot(k) {
    var c = corner(k), r = ROUNDING * OUTER;
    var bis = unit({ x: c.a.x + c.b.x, y: c.a.y + c.b.y });
    var d = r / Math.sin(c.half) - r;
    return { x: c.v.x + bis.x * d, y: c.v.y + bis.y * d };
  }
  // The outline with every corner rounded (RoundedStar), in a 100-unit box.
  function roundedStar() {
    var r = ROUNDING * OUTER * 100, d = "";
    for (var k = 0; k < CORNERS; k++) {
      var c = corner(k), t = r / Math.tan(c.half) / 100;
      var p1 = { x: (c.v.x + c.a.x * t) * 100, y: (c.v.y + c.a.y * t) * 100 };
      var p2 = { x: (c.v.x + c.b.x * t) * 100, y: (c.v.y + c.b.y * t) * 100 };
      var cross = (c.v.x - c.prev.x) * (c.next.y - c.v.y) - (c.v.y - c.prev.y) * (c.next.x - c.v.x);
      d += (k === 0 ? "M" : "L") + p1.x.toFixed(2) + " " + p1.y.toFixed(2) +
        "A" + r.toFixed(2) + " " + r.toFixed(2) + " 0 0 " + (cross > 0 ? 1 : 0) + " " + p2.x.toFixed(2) + " " + p2.y.toFixed(2);
    }
    return d + "Z";
  }

  var demo = document.querySelector("[data-star-demo]");
  if (demo) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = demo.querySelector("svg");
    var el = function (name, attrs, parent) {
      var node = document.createElementNS(NS, name);
      for (var key in attrs) node.setAttribute(key, attrs[key]);
      (parent || svg).appendChild(node);
      return node;
    };
    var outline = roundedStar();
    var body = el("path", { d: outline, class: "star-body" });
    var lines = [], dots = [], rings = [];
    for (var i = 0; i < CORNERS; i++) {
      var p = dot(i), q = dot((i + 1) % CORNERS);
      el("line", { x1: p.x * 100, y1: p.y * 100, x2: q.x * 100, y2: q.y * 100, class: "star-dash" });
    }
    for (i = 0; i < CORNERS; i++) {
      p = dot(i); q = dot((i + 1) % CORNERS);
      var length = Math.hypot(q.x - p.x, q.y - p.y) * 100;
      lines.push(el("line", { x1: p.x * 100, y1: p.y * 100, x2: q.x * 100, y2: q.y * 100, class: "star-line",
        "stroke-dasharray": length.toFixed(2), "stroke-dashoffset": length.toFixed(2), style: "--len:" + length.toFixed(2) }));
    }
    for (i = 0; i < CORNERS; i++) {
      p = dot(i);
      rings.push(el("circle", { cx: p.x * 100, cy: p.y * 100, r: 10, class: "star-ring" }));
      dots.push(el("circle", { cx: p.x * 100, cy: p.y * 100, r: 5.25, class: "star-dot", style: "transform-origin:" + (p.x * 100).toFixed(2) + "px " + (p.y * 100).toFixed(2) + "px" }));
    }
    var gold = el("path", { d: outline, class: "star-gold", fill: "url(#starFill)" });
    var count = demo.querySelector("[data-star-count]");
    var label = demo.querySelector("[data-star-label]");
    var words = document.documentElement.lang === "ar" ? {
      full: "نجمة جديدة!", every: "كل 10 نقاط تصنع نجمة",
      of: function (n) { return n + " من 10"; },
      // Arabic counts 1, 2 and 3–10 differently.
      left: function (n) { return n === 1 ? "بقيت نقطة واحدة لتكتمل!" : n === 2 ? "بقيت نقطتان لتكتمل!" : "بقيت " + n + " نقاط لتكتمل!"; }
    } : {
      full: "New star!", every: "Every 10 points make a star",
      of: function (n) { return n + " of 10"; },
      left: function (n) { return n + " more " + (n === 1 ? "dot" : "dots") + " to finish!"; }
    };

    var show = function (filled) {
      var full = filled >= CORNERS;
      for (var k = 0; k < CORNERS; k++) {
        dots[k].classList.toggle("on", k < filled);
        rings[k].classList.toggle("on", k === filled && !full);
        lines[k].classList.toggle("on", full || k < filled - 1);
      }
      demo.classList.toggle("full", full);
      count.textContent = full ? words.full : words.of(filled);
      label.textContent = full ? words.every : words.left(10 - filled);
    };

    if (still) {
      show(CORNERS);
    } else {
      var filled = 3, timer = null;
      var tick = function () {
        filled = filled >= CORNERS ? 0 : filled + 1;
        show(filled);
        timer = setTimeout(tick, filled >= CORNERS ? 2600 : filled === 0 ? 900 : 650);
      };
      show(filled);
      // Only while it's on screen.
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { if (!timer) timer = setTimeout(tick, 650); }
          else { clearTimeout(timer); timer = null; }
        }, { threshold: 0.3 }).observe(demo);
      } else {
        timer = setTimeout(tick, 650);
      }
    }
  }

  // ---------- Sections rise in ----------
  var risers = document.querySelectorAll("[data-rise]");
  if (!still && "IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); seen.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(risers, function (node) { node.classList.add("rise"); seen.observe(node); });
  }
})();
