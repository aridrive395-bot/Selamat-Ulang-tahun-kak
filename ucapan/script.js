/* ============================================================
   PENGATURAN: edit bagian ini (teks lain ada di index.html)
   ============================================================ */
const CONFIG = {
  lagu: { judul: "Hannah Montana", artis: "Req orange county" },
  mulai: "2022-03-12",        // tanggal mulai (untuk hitungan hari)
  selesai: "2023-09-30",      // tanggal selesai
  kuis: [                     // t = pertanyaan, o = pilihan, b = nomor jawaban benar (mulai dari 0)
    { t: "Snack alfa favorit kamu", o: ["Snack udang", "lays", "kinder joy"], b: 0 },
    { t: "Minuman apa yang selalu kamu pesan?", o: ["Kopi hitam", "coklat", "matchaa"], b: 2 },
    { t: "guru smancis yang cocok jadi wakil presiden", o: ["pa mujib", "pa edwin", "bu tini"], b: 1 },
  ],
  harapan: [                  // isi toples harapan
    "Semoga kamu selalu sehat dan tidur nyenyak.",
    "Semoga mimpimu satu per satu terwujud.",
    "Semoga hari ini ada yang membuatmu tertawa.",
    "Semoga kamu dikelilingi orang-orang baik.",
    "Semoga kamu selalu pulang dengan selamat.",
    "Semoga kamu bangga pada dirimu sendiri.",
  ],
};
/* ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lagu = $("#lagu"), stage = $("#stage"), pgs = $$(".pg");
let kini = -1, sibuk = false, tok = 0, zTop = 10, sfxAktif = true, ac;

/* ---------- Bunyi lembut saat pindah halaman (dibuat dengan WebAudio, tanpa file) ---------- */
function bunyiLembut() {
  if (!sfxAktif) return;
  try {
    ac = ac || new AudioContext(); if (ac.state === "suspended") ac.resume();
    const nada = [523.25, 587.33, 659.25, 783.99, 880], f = nada[Math.floor(Math.random() * nada.length)], t = ac.currentTime;
    const g = ac.createGain(), lp = ac.createBiquadFilter();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    lp.type = "lowpass"; lp.frequency.value = 1600;
    [[f, 1], [f * 2, 0.15]].forEach(([fr, v]) => {
      const o = ac.createOscillator(), gv = ac.createGain();
      o.type = "sine"; o.frequency.value = fr; gv.gain.value = v; o.connect(gv).connect(lp); o.start(t); o.stop(t + 1.1);
    });
    lp.connect(g).connect(ac.destination);
  } catch (e) {}
}

/* ---------- Konfeti & efek ---------- */
function konfeti(n = 40) {
  if (reduce) return;
  const em = ["🎉", "💙", "✨", "🦋", "⭐", "🎊"];
  for (let i = 0; i < n; i++) {
    const e = document.createElement("span");
    e.className = "konfeti"; e.textContent = em[i % em.length];
    e.style.left = Math.random() * 100 + "vw"; e.style.fontSize = 18 + Math.random() * 14 + "px";
    e.style.setProperty("--d", 2.4 + Math.random() * 2 + "s");
    e.style.setProperty("--x", Math.random() * 160 - 80 + "px");
    e.style.animationDelay = Math.random() * 0.8 + "s";
    document.body.appendChild(e); setTimeout(() => e.remove(), 5500);
  }
}
function kelopak() {
  const e = document.createElement("i");
  e.className = "kelopak"; e.style.left = Math.random() * 100 + "vw";
  e.style.setProperty("--d", 7 + Math.random() * 6 + "s"); e.style.setProperty("--x", Math.random() * 180 - 90 + "px");
  $("#kelopak").appendChild(e); setTimeout(() => e.remove(), 13500);
}
if (!reduce) { setInterval(kelopak, 1300); for (let i = 0; i < 4; i++) setTimeout(kelopak, i * 250); }
let tl = 0;
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || reduce || performance.now() - tl < 70) return;
  tl = performance.now();
  const s = document.createElement("i");
  s.className = "kil"; s.textContent = "✦"; s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
  document.body.appendChild(s); setTimeout(() => s.remove(), 900);
});

/* ---------- Musik & pemutar ---------- */
const fmt = (t) => Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
function setMain(v) {
  $("#musik").classList.toggle("jalan", v); $(".piringan").classList.toggle("jalan", v);
  $("#pp").textContent = v ? "❚❚" : "▶"; $("#musik").setAttribute("aria-label", v ? "Jeda musik" : "Putar musik");
}
const toggleLagu = () => (lagu.paused ? lagu.play().catch(() => {}) : lagu.pause());
lagu.addEventListener("play", () => setMain(true)); lagu.addEventListener("pause", () => setMain(false));
lagu.addEventListener("timeupdate", () => {
  if (lagu.duration) { $("#seek").value = (lagu.currentTime / lagu.duration) * 100; }
  $("#waktu").textContent = fmt(lagu.currentTime || 0);
});
$("#seek").addEventListener("input", (e) => { if (lagu.duration) lagu.currentTime = (e.target.value / 100) * lagu.duration; });
$("#musik").onclick = toggleLagu; $("#pp").onclick = toggleLagu;
$("#judulLagu").textContent = CONFIG.lagu.judul; $("#artisLagu").textContent = CONFIG.lagu.artis;
lagu.volume = 0.7;

/* ---------- Navigasi halaman ---------- */
const DUR = 1000, ATAS = ["flip", "peel", "tear", "zoom", "dream"];
function perbarui() {
  $("#nomor").textContent = `${kini + 1} / ${pgs.length}`;
  $("#barisi").style.width = ((kini + 1) / pgs.length) * 100 + "%";
  $("#prev").disabled = kini <= 0; $("#next").disabled = kini >= pgs.length - 1;
}
function selesaikanTeks(pg) { tok++; $$(".ketik", pg).forEach((e) => e.dataset.t && (e.textContent = e.dataset.t)); }
function pergi(n) {
  if (sibuk || n === kini || n < 0 || n >= pgs.length) return;
  const sp = $("#sampul"); if (sp && kini < 0 && !sp.classList.contains("buka")) return;   // tunggu sampul dibuka
  bunyiLembut();
  const dari = pgs[kini], ke = pgs[n];
  if (!dari) { ke.classList.add("vis"); kini = n; mulai(ke); perbarui(); return; }
  selesaikanTeks(dari);
  const maju = n > kini, rendah = maju ? dari : ke, tinggi = maju ? ke : dari, tipe = tinggi.dataset.t || "slide";
  sibuk = true; reset(ke); ke.classList.add("vis");
  stage.style.setProperty("--ta", `t-${tipe}-a`); stage.style.setProperty("--tb", `t-${tipe}-b`);
  stage.classList.toggle("rev", !maju);
  const rTop = ATAS.includes(tipe); rendah.style.zIndex = rTop ? 3 : 2; tinggi.style.zIndex = rTop ? 2 : 3;
  rendah.classList.add("ani-a"); tinggi.classList.add("ani-b");
  kini = n; perbarui(); mulai(ke);
  setTimeout(() => {
    dari.classList.remove("vis", "ani-a", "ani-b"); ke.classList.remove("ani-a", "ani-b");
    dari.style.zIndex = ke.style.zIndex = ""; stage.classList.remove("rev"); sibuk = false;
  }, DUR + 60);
}
$("#next").onclick = () => pergi(kini + 1); $("#prev").onclick = () => pergi(kini - 1);
addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") pergi(kini + 1);
  if (e.key === "ArrowLeft") pergi(kini - 1);
  if (e.key === "Escape") { tutupOverlay(); $("#lb").classList.remove("tampil"); }
});
let x0 = null, y0 = 0;
stage.addEventListener("touchstart", (e) => { x0 = e.target.closest("[data-noswipe]") ? null : e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
stage.addEventListener("touchend", (e) => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) pergi(kini + (dx < 0 ? 1 : -1));
  x0 = null;
});

/* ---------- Daftar isi, pengaturan, overlay ---------- */
function tutupOverlay() { $("#menuov").classList.remove("tampil"); $("#panel").classList.remove("tampil"); }
const isiToc = pgs.map((p, i) => `<li><button data-i="${i}"><span>${p.dataset.j}</span><i></i><b>${i + 1}</b></button></li>`).join("");
["#toc", "#toc2"].forEach((s) => {
  $(s).innerHTML = isiToc;
  $$("button", $(s)).forEach((b) => (b.onclick = () => { tutupOverlay(); pergi(+b.dataset.i); }));
});
$("#menu").onclick = () => { $("#panel").classList.remove("tampil"); $("#menuov").classList.toggle("tampil"); };
$("#menuov").onclick = (e) => { if (e.target.id === "menuov") tutupOverlay(); };
$("#atur").onclick = () => { $("#menuov").classList.remove("tampil"); $("#panel").classList.toggle("tampil"); };
$("#vol").oninput = (e) => (lagu.volume = +e.target.value);
$("#sfx").onchange = (e) => (sfxAktif = e.target.checked);
$("#penuh").onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
let timer;
$("#otomatis").onchange = (e) => {
  clearInterval(timer);
  if (e.target.checked) timer = setInterval(() => (kini < pgs.length - 1 ? pergi(kini + 1) : (e.target.checked = false, clearInterval(timer))), 9000);
};

/* ---------- Foto: lightbox, kartu balik, catatan ---------- */
function lightbox(el) {
  const img = $("img", el); if (!img) return;
  $("#lb img").src = img.src; $("#lb figcaption").textContent = ($("figcaption", el) || {}).textContent || "";
  $("#lb").classList.add("tampil");
}
$("#lb").onclick = () => $("#lb").classList.remove("tampil");
$$(".fc, .nota").forEach((el) => {
  const balik = () => el.classList.toggle(el.classList.contains("fc") ? "balik" : "buka");
  el.onclick = balik; el.onkeydown = (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), balik());
});
$$(".foto img").forEach((img) => {
  const kosong = () => { img.parentElement.classList.add("kosong"); img.remove(); };
  img.addEventListener("error", kosong); if (img.complete && img.naturalWidth === 0) kosong();
});
function seret() {
  $$(".meja .pl").forEach((el) => {
    let sx, sy, ox, oy, geser = false;
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop;
      geser = false; el.classList.add("angkat"); el.style.zIndex = ++zTop;
    });
    el.addEventListener("pointermove", (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - sx, dy = e.clientY - sy, m = el.parentElement;
      if (Math.abs(dx) + Math.abs(dy) > 5) geser = true;
      el.style.left = Math.min(Math.max(ox + dx, -20), m.clientWidth - el.offsetWidth + 20) + "px";
      el.style.top = Math.min(Math.max(oy + dy, -20), m.clientHeight - el.offsetHeight + 20) + "px";
    });
    el.addEventListener("pointerup", () => { el.classList.remove("angkat"); if (!geser) lightbox(el); });
  });
}
seret();

/* ---------- Efek mengetik ---------- */
async function ketik(pg) {
  const id = ++tok, els = $$(".ketik", pg);
  els.forEach((e) => { e.dataset.t = e.dataset.t || e.textContent.trim(); e.innerHTML = `<span style="visibility:hidden">${e.dataset.t}</span>`; });
  await tunggu(900);
  for (const e of els) {
    const t = e.dataset.t;
    for (let i = 1; i <= t.length; i++) {
      if (id !== tok) return;
      e.innerHTML = t.slice(0, i) + `<span style="visibility:hidden">${t.slice(i)}</span>`;
      await tunggu(/[.,]/.test(t[i - 1]) ? 170 : 28);
    }
    e.textContent = t; await tunggu(250);
  }
}

/* ---------- Angka menghitung naik ---------- */
function hitung(pg) {
  $$("[data-angka]", pg).forEach((el) => {
    const a = el.dataset.angka;
    const target = a === "auto" ? Math.max(0, Math.round((new Date(CONFIG.selesai) - new Date(CONFIG.mulai)) / 864e5)) : +a;
    el.textContent = 0;
    setTimeout(() => {
      const t0 = performance.now();
      const f = (n) => { const p = Math.min((n - t0) / 1600, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }, 900);
  });
}

/* ---------- Kartu gosok ---------- */
function gosok() {
  const c = $("#kanvas"), w = c.parentElement, r = devicePixelRatio || 1, W = w.clientWidth, H = w.clientHeight;
  c.width = W * r; c.height = H * r; const x = c.getContext("2d"); x.scale(r, r);
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#b9cee2"); g.addColorStop(0.5, "#e6f0f8"); g.addColorStop(1, "#a5bdd4");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = "#5b7fa6"; x.font = "700 28px Caveat, cursive"; x.textAlign = "center"; x.fillText("gosok di sini ✨", W / 2, H / 2 + 8);
  c.style.opacity = 1; c.style.pointerEvents = "auto";
  let turun = false, selesai = false, n = 0;
  const hapus = (e) => { const b = c.getBoundingClientRect(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(e.clientX - b.left, e.clientY - b.top, 24, 0, 7); x.fill(); };
  const cek = () => {
    if (selesai || ++n % 6) return;
    const d = x.getImageData(0, 0, c.width, c.height).data; let k = 0;
    for (let i = 3; i < d.length; i += 64) if (d[i] === 0) k++;
    if (k / (d.length / 64) > 0.5) { selesai = true; c.style.opacity = 0; c.style.pointerEvents = "none"; konfeti(30); }
  };
  c.onpointerdown = (e) => { turun = true; c.setPointerCapture(e.pointerId); hapus(e); };
  c.onpointermove = (e) => { if (turun) { hapus(e); cek(); } };
  c.onpointerup = () => (turun = false);
}

/* ---------- Kuis ---------- */
function kuis() {
  const box = $("#kuis"); let i = 0, skor = 0;
  const tanya = () => {
    const q = CONFIG.kuis[i];
    box.innerHTML = `<p class="kecil">pertanyaan ${i + 1} / ${CONFIG.kuis.length}</p><h3>${q.t}</h3><div class="opsi">${q.o.map((o, k) => `<button data-k="${k}">${o}</button>`).join("")}</div>`;
    const bt = $$("button", box);
    bt.forEach((b) => (b.onclick = () => {
      const ok = +b.dataset.k === q.b; if (ok) skor++;
      b.classList.add(ok ? "benar" : "salah"); bt[q.b].classList.add("benar"); bt.forEach((x) => (x.disabled = true));
      setTimeout(() => (++i < CONFIG.kuis.length ? tanya() : hasil()), 1100);
    }));
  };
  const hasil = () => {
    const p = skor === CONFIG.kuis.length ? "Kamu ingat semuanya ♡" : skor > 0 ? "Kamu masih ingat sebagian, dan itu sudah cukup manis." : "Tidak apa-apa. Biar aku saja yang mengingatnya.";
    box.innerHTML = `<p class="besar">${skor} / ${CONFIG.kuis.length}</p><p class="tulis">${p}</p><button class="tbl" id="ulangKuis" type="button">Main lagi</button>`;
    if (skor === CONFIG.kuis.length) konfeti(40);
    $("#ulangKuis").onclick = () => { i = 0; skor = 0; tanya(); };
  };
  tanya();
}

/* ---------- Toples harapan ---------- */
$("#ambil").onclick = () => {
  const s = $("#slip"), j = $("#jarg");
  s.classList.remove("muncul"); void s.offsetWidth;
  s.textContent = CONFIG.harapan[Math.floor(Math.random() * CONFIG.harapan.length)]; s.classList.add("muncul");
  j.classList.add("goncang"); setTimeout(() => j.classList.remove("goncang"), 600);
};

/* ---------- Amplop surat ---------- */
$("#amplop").onclick = async () => {
  const p = $("#isiSurat"); p.classList.add("flap-buka"); await tunggu(reduce ? 0 : 900);
  p.classList.add("terbuka"); $$(".par", p).forEach((e, i) => (e.style.animationDelay = 0.4 + i * 0.5 + "s"));
};
$("#tutupSurat").onclick = () => $("#isiSurat").classList.remove("terbuka", "flap-buka");

/* ---------- Awal & reset tiap halaman ---------- */
function reset(pg) {
  $$(".balik, .buka", pg).forEach((e) => e.classList.remove("balik", "buka"));
  $$(".meja .pl", pg).forEach((e) => { e.style.left = e.style.top = ""; });
  $$(".par", pg).forEach((e) => (e.style.animationDelay = ""));
  pg.id === "p-surat" && $("#isiSurat").classList.remove("terbuka", "flap-buka");
  pg.id === "p-toples" && ($("#slip").textContent = "", $("#slip").classList.remove("muncul"));
}
function mulai(pg) {
  const aksi = { "p-intro": ketik, "p-angka": hitung, "p-gosok": gosok, "p-kuis": kuis, "p-akhir": () => setTimeout(() => konfeti(60), 1300) };
  aksi[pg.id] && aksi[pg.id](pg);
}
$("#awal").onclick = () => pergi(0);

/* ---------- Buka sampul ---------- */
$("#bukaSurat").onclick = () => {
  $("#sampul").classList.add("buka");
  lagu.play().catch(() => {});               // musik mulai setelah tombol ditekan
  setTimeout(() => pergi(0), 1500);
  setTimeout(() => { $("#sampul").remove(); document.body.classList.remove("terkunci"); }, 2800);
};
perbarui();
