"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const RIDS = ["A", "B"];
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const CITY_SHORT = { fukuoka: "Fukuoka", yufuin: "Yufuin", hiroshima: "Hiroshima", okayama: "Okayama", nagoya: "Nagoya", shuzenji: "Shuzenji", tokyo: "Tokyo" };
  const MODE_ICON = { plane: "✈", train: "🚄", local: "🚶", rest: "♨" };

  // ------------------------------------------------------------ state
  const params = new URLSearchParams(location.search);
  const state = {
    start: parseDate(params.get("start")) || Date.UTC(2027, 9, 1),
    show: ["A", "B"].includes(params.get("show")) ? params.get("show") : "both",
    day: 1,
  };
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
  }
  const dateOf = (day) => new Date(state.start + (day - 1) * 864e5);
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const fmtShort = (d) => `${DOW[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const isShared = (day) => DAYS.A[day] === DAYS.B[day];
  const visibleRoutes = () => (state.show === "both" ? RIDS : [state.show]);
  function saveParams() {
    const p = new URLSearchParams(location.search);
    p.set("start", iso(state.start));
    state.show === "both" ? p.delete("show") : p.set("show", state.show);
    history.replaceState(null, "", `${location.pathname}?${p}${location.hash}`);
  }

  // Japanese public holidays around autumn (enough for Sep–Nov trips).
  function nthMonday(y, m, n) {
    const first = new Date(Date.UTC(y, m, 1)).getUTCDay();
    return 1 + ((8 - first) % 7) + (n - 1) * 7;
  }
  function holidayName(d) {
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), dt = d.getUTCDate();
    if (m === 8 && dt === nthMonday(y, 8, 3)) return "Respect for the Aged Day";
    if (m === 8 && dt === 23) return "Autumn Equinox Day";
    if (m === 9 && dt === nthMonday(y, 9, 2)) return "Sports Day";
    if (m === 10 && dt === 3) return "Culture Day";
    if (m === 10 && dt === 23) return "Labour Thanksgiving Day";
    return null;
  }
  function warningsFor(day) {
    if (day < 1) return [];
    const d = dateOf(day), dow = d.getUTCDay(), out = [];
    const h = holidayName(d);
    for (const r of RIDS) for (const c of DAYS[r][day].closed || []) if (c.dow === dow && !out.includes(c.text)) out.push(c.text);
    if (h) out.push(`${h}: national holiday, expect crowds`);
    return out;
  }
  const routeWarnings = (r, day) => {
    if (day < 1) return [];
    const d = dateOf(day), h = holidayName(d);
    const w = (DAYS[r][day].closed || []).filter((c) => c.dow === d.getUTCDay()).map((c) => c.text);
    if (h) w.push(`${h}: national holiday, expect crowds`);
    return w;
  };

  // ------------------------------------------------------------ route strips + compare
  function renderStrips() {
    $("#strips").innerHTML = RIDS.map((r) => {
      const segs = [{ city: "plane", n: 1, label: "✈" }];
      for (let d = 1; d <= 20; d++) {
        const c = DAYS[r][d].city, last = segs[segs.length - 1];
        if (last.city === c) last.n++; else segs.push({ city: c, n: 1, onsen: DAYS[r][d].onsen });
      }
      segs.push({ city: "plane", n: 1, label: "✈" });
      return `<div class="strip-row only-${r}">
        <div class="strip-label ${r}">Route ${r}<small>${ROUTES[r].short}</small></div>
        <div class="strip">${segs.map((s) => s.city === "plane"
          ? `<div class="seg-city fly" style="flex:${s.n}" title="Flight">✈</div>`
          : `<div class="seg-city${s.onsen ? " onsen" : ""}" style="flex:${s.n};background:${CITY_COLORS[s.city]}" title="${CITY_SHORT[s.city]}: ${s.n} nights"><span>${s.onsen ? "♨ " : ""}${CITY_SHORT[s.city]}</span><small>${s.n}n</small></div>`).join("")}
        </div></div>`;
    }).join("");

    $("#compareTable").innerHTML = `<thead><tr><th></th><th class="A">A · Shuzenji route</th><th class="B">B · Yufuin route</th></tr></thead><tbody>${
      COMPARE.map(([k, a, b]) => b === null
        ? `<tr><th>${esc(k)}</th><td colspan="2">${esc(a)}</td></tr>`
        : `<tr><th>${esc(k)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody>`;
  }

  // ------------------------------------------------------------ calendars
  function renderCalendars() {
    const used = ["fukuoka", "yufuin", "hiroshima", "okayama", "nagoya", "shuzenji", "tokyo"];
    $("#calLegend").innerHTML = used.map((c) => `<span><i style="background:${CITY_COLORS[c]}"></i>${CITY_SHORT[c]}</span>`).join("")
      + `<span><i style="background:${CITY_COLORS.plane}"></i>Flying</span><span>✈ flight · 🚄 travel day · ♨ onsen · ⚠ check</span>`;

    const first = dateOf(0), last = dateOf(21);
    const gridStart = first.getTime() - first.getUTCDay() * 864e5;
    const gridEnd = last.getTime() + (6 - last.getUTCDay()) * 864e5;
    const months = [...new Set([first, last].map((d) => MON[d.getUTCMonth()]))].join(" – ");

    $("#cals").innerHTML = RIDS.map((r) => {
      let cells = DOW.map((d) => `<div class="cal-dow">${d.slice(0, 2)}</div>`).join("");
      for (let t = gridStart; t <= gridEnd; t += 864e5) {
        const day = Math.round((t - state.start) / 864e5) + 1;
        const d = new Date(t);
        if (day < 0 || day > 21) {
          cells += `<div class="cday empty" style="color:var(--muted)"><span></span><span class="dd" style="opacity:.35">${d.getUTCDate()}</span><span></span></div>`;
          continue;
        }
        const p = DAYS[r][day];
        const prev = day > 0 ? DAYS[r][day - 1].city : null;
        const warns = routeWarnings(r, day);
        const icon = warns.length ? "⚠" : p.mode === "plane" ? "✈" : p.onsen ? "♨" : (p.city !== prev && day > 1) ? "🚄" : "";
        const bg = p.city ? CITY_COLORS[p.city] : CITY_COLORS.plane;
        const dateLbl = d.getUTCDate() === 1 || day === 0 ? `${MON[d.getUTCMonth()]} ${d.getUTCDate()}` : d.getUTCDate();
        const tip = `Day ${day} · ${fmtShort(d)} · ${p.title}${warns.length ? " · ⚠ " + warns.join("; ") : ""}`;
        cells += `<button class="cday${isShared(day) ? "" : " diff"}${warns.length ? " warn" : ""}" data-day="${day}" style="background:${bg}" title="${esc(tip)}" aria-label="${esc(tip)}">
          <span class="dn">D${day}</span><span class="dd">${dateLbl}</span><span class="dc">${p.city ? CITY_SHORT[p.city] : "Flight"}</span><span class="ic">${icon}</span></button>`;
      }
      return `<div class="cal ${r} only-${r}"><h3>Route ${r} · ${ROUTES[r].short} <small style="color:var(--muted);font-weight:500">${months} ${first.getUTCFullYear()}</small></h3><div class="cal-grid">${cells}</div></div>`;
    }).join("");
    markSelected();
  }

  // ------------------------------------------------------------ day by day
  function dayCard(r, p, day) {
    const shared = r === "both";
    const warns = shared ? warningsFor(day) : routeWarnings(r, day);
    const tag = shared ? "Both routes" : `Route ${r} · ${ROUTES[r].short}`;
    const sleep = p.city ? `<span class="sleep" style="background:${CITY_COLORS[p.city]}">sleep: ${CITY_SHORT[p.city]}</span>` : "";
    return `<article class="dcard ${shared ? "both" : r + " only-" + r}">
      <img src="${p.img}" alt="" loading="lazy" decoding="async" width="96" height="120">
      <div class="dbody">
        <div class="dtag ${shared ? "both" : r}">${tag}${sleep}</div>
        <h4>${MODE_ICON[p.mode] || ""} ${esc(p.title)}</h4>
        <div class="dmove">${esc(p.move)}</div>
        <ul>${p.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        <div class="taste"><b>TASTE</b> ${esc(p.taste)}</div>
        ${warns.map((w) => `<div class="warnline">⚠ ${esc(w)}</div>`).join("")}
      </div></article>`;
  }
  function renderDays() {
    let html = "";
    for (let day = 0; day <= 21; day++) {
      const d = dateOf(day), shared = isShared(day);
      html += `<div class="drow ${shared ? "same" : "differ"}" id="day-${day}" data-day="${day}">
        <div class="dnum"><small>Day</small><b>${day}</b><small>${fmtShort(d)}</small></div>
        ${shared ? dayCard("both", DAYS.A[day], day) : dayCard("A", DAYS.A[day], day) + dayCard("B", DAYS.B[day], day)}
      </div>`;
    }
    $("#dayList").innerHTML = html;
    markSelected();
  }

  // ------------------------------------------------------------ cities
  const CITY_ORDER = ["fukuoka", "kumamoto", "yufuin", "hiroshima", "okayama", "himeji", "nagoya", "shuzenji", "tokyo", "kamakura"];
  let currentCity = "fukuoka";
  function renderCityTabs() {
    $("#cityTabs").innerHTML = CITY_ORDER.map((k) => {
      const c = CITIES[k];
      const cls = c.routes.length === 1 ? ` only-${c.routes[0]}` : "";
      const dot = c.routes.length === 1 ? ` <span style="color:var(--${c.routes[0]})">●</span>` : "";
      return `<button role="tab" data-city="${k}" class="${k === currentCity ? "on" : ""}${cls}">${esc(c.name.split(" (")[0])}${dot}</button>`;
    }).join("");
    renderCity(currentCity);
  }
  function renderCity(k) {
    currentCity = k;
    const c = CITIES[k];
    $$("#cityTabs button").forEach((b) => b.classList.toggle("on", b.dataset.city === k));
    $("#cityPanel").innerHTML = `<img src="${c.img}" alt="" loading="lazy" decoding="async">
      <div class="city-body">
        <h3 style="margin-top:0">${esc(c.name)}<span class="jp">${c.jp}</span></h3>
        <div class="badges">${c.routes.map((r) => `<span class="badge ${r}">Route ${r} · ${ROUTES[r].short}</span>`).join("")}</div>
        <p class="lede" style="margin:0">${esc(c.blurb)}</p>
        <div class="fh">
          <div class="food"><h4>🍜 Eat</h4><dl>${c.food.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl></div>
          <div class="hist"><h4>🏯 History</h4><dl>${c.history.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl></div>
        </div>
      </div>`;
  }

  // ------------------------------------------------------------ static pairs
  function renderPairs() {
    $("#onsenPair").innerHTML = RIDS.map((r) => {
      const o = ONSEN[r];
      const days = r === "A" ? "Days 13–14" : "Days 5–6";
      return `<div class="pcard ${r} only-${r}"><img src="${o.img}" alt="" loading="lazy" decoding="async">
        <div class="pb"><h3>${ROUTES[r].short} · ${o.name}</h3>
        <div class="dmove">${days} · Room priority: ${esc(o.room)}</div>
        <ul>${o.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div class="price">Illustrative solo price: ${o.price}</div>
        <a class="btn ghost" href="${o.link}" target="_blank" rel="noopener">Room details ↗</a></div></div>`;
    }).join("");

    $("#transferPair").innerHTML = RIDS.map((r) => `<div class="pcard ${r} only-${r}"><div class="pb">
      <h3>Route ${r} · transfer days</h3>
      <table class="ttable">${TRANSFERS[r].map(([leg, how, time, note]) =>
        `<tr><td>${esc(leg)}<small>${esc(note)}</small></td><td>${esc(how)}</td><td>${esc(time)}</td></tr>`).join("")}</table>
      </div></div>`).join("");

    $("#booking").innerHTML = BOOKING.map(([t, d]) => `<li><b>${esc(t)}.</b> ${esc(d)}</li>`).join("");
    $("#sources").innerHTML = SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("");
    $("#deckPair").innerHTML = RIDS.map((r) => `<div class="pcard ${r}"><img src="${ROUTES[r].side}" alt="" loading="lazy" decoding="async">
      <div class="pb"><h3>Route ${r} · ${ROUTES[r].name}</h3><p class="lede">${esc(ROUTES[r].tagline)}</p>
      <a class="btn" href="${ROUTES[r].deck}" download>Download .pptx</a>
      <a class="btn ghost" href="${ROUTES[r].slides}" target="_blank" rel="noopener">Google Slides ↗</a></div></div>`).join("");
  }

  // ------------------------------------------------------------ map
  const mapState = { map: null, layers: { A: null, B: null, shared: null }, here: {}, ready: false };
  const JAPAN = [[32.6, 130.1], [36.0, 140.0]];
  const LOOP = [[30, 124], [50, 240]];
  const ll = (k) => PLACES[k].ll;

  function arc(a, b, bend) {
    // quadratic curve between two lat/lngs, bent sideways by `bend` (fraction of length)
    const [y1, x1] = a, [y2, x2] = b;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    const cx = mx - dy * bend, cy = my + dx * bend;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, u = 1 - t;
      pts.push([u * u * y1 + 2 * u * t * cy + t * t * y2, u * u * x1 + 2 * u * t * cx + t * t * x2]);
    }
    return pts;
  }
  function placeRoutes(k) { return RIDS.filter((r) => LOOPS[r].rail.includes(k) || LOOPS[r].trips.some((t) => t.includes(k)) || LOOPS[r].flyIn.includes(k)); }
  function placeDays(r, k) {
    const p = PLACES[k];
    return DAYS[r].filter((d) => d.place === k || (p.kind === "base" && d.city === p.city)).map((d) => d.day);
  }
  const rangeTxt = (a) => {
    if (!a.length) return "";
    const out = []; let s = a[0], prev = a[0];
    for (const x of a.slice(1).concat(null)) { if (x !== prev + 1) { out.push(s === prev ? `${s}` : `${s}–${prev}`); s = x; } prev = x; }
    return "Day " + out.join(", ");
  };
  function popupHtml(k) {
    const p = PLACES[k], rs = placeRoutes(k);
    const badges = rs.map((r) => `<span class="rt ${r}">${r}</span>`).join("");
    let html = `<div class="pop"><h4>${esc(p.name)}</h4>${badges}`;
    if (p.kind === "air") {
      html += `<div style="margin-top:6px">${k === "sea" ? "Start and end of both loops." : k === "hnd" ? "Connection on the way in (or via ICN); nonstop home to SEA on Day 21." : k === "icn" ? "Alternative connection on the way in." : "Arrival airport, Day 1."}</div>`;
    } else if (p.kind === "rail") {
      html += `<div style="margin-top:6px">🚄 Train stop / transfer on the way through.</div>`;
    } else {
      html += RIDS.filter((r) => rs.includes(r)).map((r) => {
        const ds = placeDays(r, k);
        return ds.length ? `<div style="margin-top:4px"><b style="color:var(--${r})">${r}:</b> ${rangeTxt(ds)}</div>` : "";
      }).join("");
      const c = p.city && CITIES[p.city];
      if (c) {
        html += `<ul>${c.food.slice(0, 2).map(([t]) => `<li>🍜 ${esc(t)}</li>`).join("")}${c.history.slice(0, 2).map(([t]) => `<li>🏯 ${esc(t)}</li>`).join("")}</ul>
          <a href="#cities" data-open-city="${p.city}">Food &amp; history →</a>`;
      }
    }
    return html + "</div>";
  }

  function initMap() {
    if (mapState.ready || !window.L) return;
    mapState.ready = true;
    const map = L.map("leaflet", { zoomControl: true, scrollWheelZoom: false, zoomSnap: 0.25, worldCopyJump: false });
    mapState.map = map;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 13, className: "osm-tiles",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.fitBounds(JAPAN);

    // shared flights (both routes fly the same way)
    const shared = L.layerGroup().addTo(map);
    const fly = { color: "#6f7782", weight: 2.5, dashArray: "2 7", lineCap: "round" };
    L.polyline(arc(ll("sea"), ll("hnd"), 0.12), fly).bindTooltip("✈ Seattle → Tokyo Haneda (connection)").addTo(shared);
    L.polyline(arc(ll("sea"), ll("icn"), 0.14), { ...fly, opacity: .45 }).bindTooltip("✈ or via Seoul Incheon").addTo(shared);
    L.polyline(arc(ll("icn"), ll("fuk"), 0.2), { ...fly, opacity: .45 }).addTo(shared);
    L.polyline(arc(ll("hnd"), ll("fuk"), -0.12), fly).bindTooltip("✈ Haneda → Fukuoka").addTo(shared);
    L.polyline(arc(ll("hnd"), ll("sea"), 0.12), { ...fly, color: "#3d434b" }).bindTooltip("✈ Day 21: Haneda → Seattle nonstop").addTo(shared);
    L.polyline([ll("fuk"), ll("hakata")], { ...fly, dashArray: null, weight: 2 }).addTo(shared);
    mapState.layers.shared = shared;

    for (const r of RIDS) {
      const g = L.layerGroup();
      const line = L.polyline(LOOPS[r].rail.map(ll), { color: ROUTES[r].color, weight: 5, opacity: .9, lineJoin: "round" })
        .bindTooltip(`🚄 Route ${r} · ${ROUTES[r].name}`, { sticky: true });
      line.addTo(g);
      g._main = line;
      for (const [a, b] of LOOPS[r].trips) {
        L.polyline([ll(a), ll(b)], { color: ROUTES[r].color, weight: 2.5, dashArray: "5 6", opacity: .85 }).addTo(g);
      }
      mapState.layers[r] = g;
    }

    // markers
    const keys = Object.keys(PLACES);
    for (const k of keys) {
      const p = PLACES[k], rs = placeRoutes(k);
      if (!rs.length && !p.alt && k !== "sea") continue;
      let html, size;
      if (p.kind === "air") { html = `<div class="mk mk-air${p.alt ? " alt" : ""}">✈</div>`; size = 26; }
      else if (p.kind === "base") { html = `<div class="mk mk-base ${rs.length === 1 ? rs[0] : ""}">${rs.length === 1 ? rs[0] : ""}</div>`; size = 26; }
      else if (p.kind === "trip") { html = `<div class="mk mk-trip"></div>`; size = 14; }
      else { html = `<div class="mk mk-rail"></div>`; size = 11; }
      const m = L.marker(p.ll, {
        icon: L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        zIndexOffset: p.kind === "base" ? 500 : p.kind === "air" ? 400 : 0,
        keyboard: true, title: p.name,
      }).bindPopup(() => popupHtml(k), { maxWidth: 260, autoPanPadding: [20, 60] });
      if (p.kind === "base" || (p.kind === "air" && !p.alt && k !== "fuk")) {
        m.bindTooltip(p.name.split(" · ")[0].replace(" Onsen", ""), { permanent: true, direction: k === "hnd" ? "bottom" : "top", offset: [0, k === "hnd" ? 10 : -12], className: "mk-lbl" });
      }
      m._routes = rs;
      m.addTo(rs.length === 1 ? mapState.layers[rs[0]] : shared);
    }

    // "you are here" markers per route
    for (const r of RIDS) {
      mapState.here[r] = L.marker(ll("sea"), {
        icon: L.divIcon({ html: `<div class="mk mk-here ${r}">✈</div>`, className: "", iconSize: [36, 36], iconAnchor: [18, 18] }),
        zIndexOffset: 2000, interactive: false,
      });
    }

    map.on("popupopen", (e) => {
      const a = e.popup.getElement().querySelector("[data-open-city]");
      if (a) a.addEventListener("click", () => { const c = a.dataset.openCity; if (CITIES[c]) renderCity(c); });
    });
    // Let one-finger page scroll work on touch; enable wheel zoom only after a click on desktop.
    map.on("click", () => map.scrollWheelZoom.enable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());

    applyShow();
    updateMapDay(false);
  }

  function applyShowMap() {
    if (!mapState.ready) return;
    const map = mapState.map;
    for (const r of RIDS) {
      const g = mapState.layers[r], on = state.show === "both" || state.show === r;
      if (on && !map.hasLayer(g)) g.addTo(map);
      if (!on && map.hasLayer(g)) map.removeLayer(g);
    }
    // both shown: draw B wide & soft underneath, A narrow on top, so shared track reads as two-tone
    if (state.show === "both") {
      mapState.layers.B._main.setStyle({ weight: 10, opacity: .55 });
      mapState.layers.A._main.setStyle({ weight: 4, opacity: .95 });
      mapState.layers.A._main.bringToFront();
    } else {
      mapState.layers[state.show]._main.setStyle({ weight: 5, opacity: .9 });
    }
  }

  let lastFrame = null;
  function updateMapDay(move = true) {
    const day = state.day;
    // mini cards below the map
    $("#mapDay").innerHTML = (isShared(day) ? ["both"] : visibleRoutes()).map((r) => {
      const p = DAYS[r === "both" ? "A" : r][day];
      return `<div class="mini ${r === "both" ? "A" : r}" ${r === "both" ? 'style="border-left-color:var(--ink);grid-column:1/-1"' : ""}>
        <b>${r === "both" ? "Both routes" : "Route " + r}: ${MODE_ICON[p.mode] || ""} ${esc(p.title)}</b><span>${esc(p.move)}</span></div>`;
    }).join("");
    $("#dayLabel").textContent = `Day ${day}`;
    $("#dayRange").value = day;
    if (!mapState.ready) return;
    const map = mapState.map, pts = [];
    for (const r of RIDS) {
      const m = mapState.here[r];
      const on = state.show === "both" || state.show === r;
      const p = DAYS[r][day];
      const k = day === 21 ? "hnd" : p.place;
      // offset A/B slightly when they're at the same spot
      const same = state.show === "both" && DAYS.A[day].place === DAYS.B[day].place;
      const [la, lo] = ll(k);
      m.setLatLng([la + (same ? (r === "A" ? 0.08 : -0.08) : 0), lo]);
      m.setIcon(L.divIcon({ html: `<div class="mk mk-here ${r}">${MODE_ICON[p.mode] || "📍"}</div>`, className: "", iconSize: [36, 36], iconAnchor: [18, 18] }));
      if (on) { m.addTo(map); pts.push(ll(k)); } else map.removeLayer(m);
    }
    if (!move) return;
    const frame = day === 0 || day === 21 ? "loop" : "japan";
    if (frame === "loop") { if (lastFrame !== "loop") fitView("loop"); }
    else if (lastFrame === "loop" || lastFrame === null) fitView("japan");
    else {
      const b = L.latLngBounds(pts).pad(0.6);
      if (!map.getBounds().contains(b)) map.panTo(b.getCenter(), { animate: true, duration: 0.5 });
    }
    lastFrame = frame;
  }
  function fitView(v) {
    if (!mapState.ready) return;
    mapState.map.flyToBounds(v === "loop" ? LOOP : JAPAN, { duration: 0.6, padding: [10, 10] });
    $$("#mapView button").forEach((b) => b.classList.toggle("on", b.dataset.view === v));
    lastFrame = v;
  }

  // ------------------------------------------------------------ selection
  function markSelected() {
    $$(".cday.sel, .drow.sel").forEach((e) => e.classList.remove("sel"));
    $$(`.cday[data-day="${state.day}"]`).forEach((e) => e.classList.add("sel"));
    const row = $(`#day-${state.day}`);
    if (row) row.classList.add("sel");
  }
  function select(day, { scrollTo = null, move = true } = {}) {
    state.day = Math.max(0, Math.min(21, day));
    markSelected();
    updateMapDay(move);
    if (scrollTo === "day") {
      if ($("#diffOnly").checked && isShared(state.day)) { $("#diffOnly").checked = false; document.body.classList.remove("diff-only"); }
      $(`#day-${state.day}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // play
  let timer = null;
  function stop() { clearInterval(timer); timer = null; $("#playBtn").textContent = "▶ Play trip"; }
  function play() {
    if (timer) return stop();
    if (state.day >= 21) select(0);
    $("#playBtn").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (state.day >= 21) return stop(); select(state.day + 1); }, 1500);
  }

  // ------------------------------------------------------------ show toggle
  function applyShow() {
    document.body.classList.remove("show-both", "show-A", "show-B");
    document.body.classList.add(`show-${state.show}`);
    $$("#routeSeg button").forEach((b) => b.classList.toggle("on", b.dataset.show === state.show));
    applyShowMap();
    updateMapDay(false);
  }

  // ------------------------------------------------------------ votes
  const VKEY = "jp27-votes";
  const loadVotes = () => { try { return JSON.parse(localStorage.getItem(VKEY)) || []; } catch { return []; } };
  const saveVotes = (v) => { try { localStorage.setItem(VKEY, JSON.stringify(v)); } catch {} };
  let votes = loadVotes();
  function renderVotes() {
    const total = votes.length || 1;
    $("#tally").innerHTML = RIDS.map((r) => {
      const vs = votes.filter((v) => v.pick === r);
      return `<div class="tcol ${r}"><div class="dtag ${r}">Route ${r} · ${ROUTES[r].short}</div>
        <div class="count">${vs.length}</div>
        <div class="tbar"><i style="width:${(vs.length / total) * 100}%"></i></div>
        <div class="chips">${vs.map((v) => `<span class="chip">${esc(v.name)}<button data-remove="${esc(v.name)}" aria-label="Remove ${esc(v.name)}">×</button></span>`).join("") || '<span class="fine">No votes yet</span>'}</div></div>`;
    }).join("");
  }
  function voteSummary() {
    return "Japan 2027 route vote\n" + RIDS.map((r) => {
      const vs = votes.filter((v) => v.pick === r);
      return `${r} · ${ROUTES[r].name}: ${vs.length}${vs.length ? " (" + vs.map((v) => v.name).join(", ") + ")" : ""}`;
    }).join("\n");
  }
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 1800); }

  // ------------------------------------------------------------ wire up
  function renderDateDependent() { renderCalendars(); renderDays(); updateMapDay(false); }

  function init() {
    $("#startDate").value = iso(state.start);
    renderStrips();
    renderDateDependent();
    renderCityTabs();
    renderPairs();
    renderVotes();
    applyShow();

    $("#startDate").addEventListener("change", (e) => {
      const t = parseDate(e.target.value);
      if (!t) return;
      state.start = t; saveParams(); renderDateDependent();
      const w = []; for (let d = 1; d <= 21; d++) if (warningsFor(d).length) w.push(d);
      toast(w.length ? `⚠ ${w.length} day(s) need a closer look` : "No closure clashes found");
    });
    $("#routeSeg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.show = b.dataset.show; saveParams(); applyShow();
    });
    $("#cals").addEventListener("click", (e) => {
      const c = e.target.closest(".cday[data-day]"); if (!c) return;
      select(+c.dataset.day, { scrollTo: "day" });
    });
    $("#dayList").addEventListener("click", (e) => {
      const row = e.target.closest(".drow"); if (row) select(+row.dataset.day);
    });
    $("#diffOnly").addEventListener("change", (e) => document.body.classList.toggle("diff-only", e.target.checked));
    $("#cityTabs").addEventListener("click", (e) => { const b = e.target.closest("button[data-city]"); if (b) renderCity(b.dataset.city); });
    $("#mapView").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) fitView(b.dataset.view); });
    $("#playBtn").addEventListener("click", play);
    $("#dayRange").addEventListener("input", (e) => { stop(); select(+e.target.value); });

    let pick = "A";
    $$(".vbtn").forEach((b) => b.addEventListener("click", () => { pick = b.dataset.pick; }));
    $("#voteForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#voterName").value.trim(); if (!name) return;
      votes = votes.filter((v) => v.name.toLowerCase() !== name.toLowerCase()).concat({ name, pick });
      saveVotes(votes); renderVotes(); $("#voterName").value = ""; $("#voterName").focus();
    });
    $("#tally").addEventListener("click", (e) => {
      const b = e.target.closest("[data-remove]"); if (!b) return;
      votes = votes.filter((v) => v.name !== b.dataset.remove); saveVotes(votes); renderVotes();
    });
    $("#copyVotes").addEventListener("click", async () => {
      const txt = voteSummary();
      try { await navigator.clipboard.writeText(txt); toast("Result copied"); }
      catch { prompt("Copy the result:", txt); }
    });
    $("#clearVotes").addEventListener("click", () => { if (confirm("Clear all votes in this browser?")) { votes = []; saveVotes(votes); renderVotes(); } });

    // Initialise the map only when it's about to scroll into view (keeps first load light on phones).
    const mapEl = $("#leaflet");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); initMap(); } }, { rootMargin: "400px" });
      io.observe(mapEl);
    } else initMap();

    // highlight current nav section
    const links = $$("#topnav a");
    const io2 = new IntersectionObserver((es) => {
      for (const x of es) if (x.isIntersecting) {
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + x.target.id));
        const a = links.find((l) => l.classList.contains("active")), nav = $("#topnav");
        if (a) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => io2.observe(s));
  }
  init();
})();
