"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ------------------------------------------------------------ data
  // Basic 46 in a-i-u-e-o columns; null = empty slot in the chart.
  const BASIC = [
    ["ア", "a"], ["イ", "i"], ["ウ", "u"], ["エ", "e"], ["オ", "o"],
    ["カ", "ka"], ["キ", "ki"], ["ク", "ku"], ["ケ", "ke"], ["コ", "ko"],
    ["サ", "sa"], ["シ", "shi"], ["ス", "su"], ["セ", "se"], ["ソ", "so"],
    ["タ", "ta"], ["チ", "chi"], ["ツ", "tsu"], ["テ", "te"], ["ト", "to"],
    ["ナ", "na"], ["ニ", "ni"], ["ヌ", "nu"], ["ネ", "ne"], ["ノ", "no"],
    ["ハ", "ha"], ["ヒ", "hi"], ["フ", "fu"], ["ヘ", "he"], ["ホ", "ho"],
    ["マ", "ma"], ["ミ", "mi"], ["ム", "mu"], ["メ", "me"], ["モ", "mo"],
    ["ヤ", "ya"], null, ["ユ", "yu"], null, ["ヨ", "yo"],
    ["ラ", "ra"], ["リ", "ri"], ["ル", "ru"], ["レ", "re"], ["ロ", "ro"],
    ["ワ", "wa"], null, null, null, ["ヲ", "wo"],
    ["ン", "n"], null, null, null, null,
  ];
  const DAKUTEN = [
    ["ガ", "ga"], ["ギ", "gi"], ["グ", "gu"], ["ゲ", "ge"], ["ゴ", "go"],
    ["ザ", "za"], ["ジ", "ji"], ["ズ", "zu"], ["ゼ", "ze"], ["ゾ", "zo"],
    ["ダ", "da"], ["ヂ", "ji"], ["ヅ", "zu"], ["デ", "de"], ["ド", "do"],
    ["バ", "ba"], ["ビ", "bi"], ["ブ", "bu"], ["ベ", "be"], ["ボ", "bo"],
    ["パ", "pa"], ["ピ", "pi"], ["プ", "pu"], ["ペ", "pe"], ["ポ", "po"],
  ];
  const COMBO = [
    ["キャ", "kya"], ["キュ", "kyu"], ["キョ", "kyo"],
    ["シャ", "sha"], ["シュ", "shu"], ["ショ", "sho"],
    ["チャ", "cha"], ["チュ", "chu"], ["チョ", "cho"],
    ["ニャ", "nya"], ["ニュ", "nyu"], ["ニョ", "nyo"],
    ["ジャ", "ja"], ["ジュ", "ju"], ["ジョ", "jo"],
    ["ティ", "ti"], ["ファ", "fa"], ["ウィ", "wi"],
  ];
  const ROW_COLORS = ["#24598a", "#c0492b", "#e0a03c", "#5a9e6f", "#8c6bb1", "#3f8fb5", "#d35f5f", "#b5762f", "#6b7a8f"];

  // Notes for words whose meaning surprises English speakers (shown on the card and in quiz answers).
  const WORD_NOTES = {
    "アイス": "Short for アイスクリーム. Ice in a drink is 氷 kōri.",
    "パン": "From Portuguese pão, not English.",
    "ジュース": "Can mean any soft drink, not just fruit juice.",
    "レシート": "From 'receipt'. Japanese has no 'th' or 'ee' endings, so English words get extra vowels.",
  };

  // Travel words: katakana, romaji, English
  const WORDS = [
    ["ラーメン", "rāmen", "ramen"], ["コーヒー", "kōhī", "coffee"], ["ビール", "bīru", "beer"],
    ["ホテル", "hoteru", "hotel"], ["タクシー", "takushī", "taxi"], ["トイレ", "toire", "toilet"],
    ["コンビニ", "konbini", "convenience store"], ["メニュー", "menyū", "menu"], ["チケット", "chiketto", "ticket"],
    ["バス", "basu", "bus"], ["ロッカー", "rokkā", "locker"], ["エレベーター", "erebētā", "elevator"],
    ["カード", "kādo", "card"], ["カレー", "karē", "curry"], ["アイス", "aisu", "ice cream"],
    ["ジュース", "jūsu", "juice"], ["ケーキ", "kēki", "cake"], ["パン", "pan", "bread"],
    ["ポケモン", "pokemon", "Pokémon"], ["ジブリ", "jiburi", "Ghibli"], ["ゲーム", "gēmu", "games"],
    ["スーツケース", "sūtsukēsu", "suitcase"], ["レシート", "reshīto", "receipt"], ["ワイファイ", "waifai", "Wi-Fi"],
  ];

  // Phrase builders: tap an item, get "<item> + tail". Item rows: [japanese, romaji, say-it phonetics, english]
  const BUILDERS = {
    please: {
      tail: ["をください", "o kudasai", "oh koo-dah-sai"], en: (x) => `${x}, please.`,
      items: [
        ["コーヒー", "kōhī", "KOH-hee", "Coffee"], ["紅茶", "kōcha", "KOH-chah", "Black tea"],
        ["お茶", "ocha", "OH-chah", "Green tea"], ["お水", "omizu", "oh-MEE-zoo", "Water"],
        ["ビール", "bīru", "BEE-roo", "Beer"], ["メニュー", "menyū", "MEN-yoo", "The menu"],
        ["これ", "kore", "KOH-reh", "This one (point at it)"], ["二つ", "futatsu", "foo-TAH-tsoo", "Two of these"],
      ],
    },
    where: {
      tail: ["はどこですか", "wa doko desu ka", "wah DOH-koh dess-kah"], en: (x) => `Where is ${x}?`,
      items: [
        ["トイレ", "toire", "TOY-reh", "the toilet"], ["駅", "eki", "EH-kee", "the station"],
        ["出口", "deguchi", "deh-GOO-chee", "the exit"], ["コンビニ", "konbini", "KOHN-bee-nee", "a convenience store"],
        ["ロッカー", "rokkā", "ROCK-kah", "the lockers"], ["タクシー乗り場", "takushī noriba", "TAHK-shee noh-ree-bah", "the taxi stand"],
      ],
    },
  };

  // Canned phrases: [japanese, romaji, say-it phonetics, english]
  const PHRASES = [
    ["Basics", [
      ["すみません", "sumimasen", "soo-mee-mah-sen", "Excuse me · Sorry · (to call staff over)"],
      ["ありがとうございます", "arigatō gozaimasu", "ah-ree-GAH-toh go-zai-mass", "Thank you"],
      ["はい ／ いいえ", "hai / iie", "HIGH / ee-EH", "Yes / No"],
      ["わかりません", "wakarimasen", "wah-kah-ree-mah-sen", "I don't understand"],
      ["英語は話せますか", "eigo wa hanasemasu ka", "AY-go wah hah-nah-seh-mass-kah", "Do you speak English?"],
    ]],
    ["Eating out", [
      ["一人です", "hitori desu", "hee-TOH-ree dess", "Just one (table for one)"],
      ["二人です", "futari desu", "foo-TAH-ree dess", "Two of us"],
      ["英語のメニューはありますか", "eigo no menyū wa arimasu ka", "AY-go noh MEN-yoo wah ah-ree-mass-kah", "Do you have an English menu?"],
      ["おすすめは何ですか", "osusume wa nan desu ka", "oh-soo-soo-meh wah NAHN dess-kah", "What do you recommend?"],
      ["いただきます", "itadakimasu", "ee-tah-dah-kee-mass", "Said before you eat"],
      ["ごちそうさまでした", "gochisōsama deshita", "go-chee-SOH-sah-mah desh-tah", "Thanks for the meal (say it on the way out)"],
      ["お会計お願いします", "okaikei onegaishimasu", "oh-kai-KAY oh-neh-gai-shee-mass", "The bill, please"],
    ]],
    ["Shopping & konbini", [
      ["いくらですか", "ikura desu ka", "ee-KOO-rah dess-kah", "How much is it?"],
      ["カードで払えますか", "kādo de haraemasu ka", "KAH-doh deh hah-rah-eh-mass-kah", "Can I pay by card?"],
      ["袋はいりません", "fukuro wa irimasen", "foo-KOO-roh wah ee-ree-mah-sen", "I don't need a bag"],
      ["温めてください", "atatamete kudasai", "ah-tah-tah-meh-teh koo-dah-sai", "Please heat it up (konbini meals)"],
      ["大丈夫です", "daijōbu desu", "dai-JOH-boo dess", "I'm fine · No thanks"],
    ]],
    ["Getting around", [
      ["この電車は東京に行きますか", "kono densha wa Tōkyō ni ikimasu ka", "koh-noh DEN-shah wah TOH-kyoh nee ee-kee-mass-kah", "Does this train go to Tokyo? (swap in any city)"],
      ["ここに行きたいです", "koko ni ikitai desu", "KOH-koh nee ee-kee-TAI dess", "I want to go here (show your map)"],
      ["荷物を預けられますか", "nimotsu o azukeraremasu ka", "nee-MOH-tsoo oh ah-zoo-keh-rah-reh-mass-kah", "Can I leave my luggage here?"],
      ["助けてください", "tasukete kudasai", "tah-SOO-keh-teh koo-dah-sai", "Please help me!"],
    ]],
  ];

  // g: move (getting around) | bath (toilets & baths) | shop (shops & signs)
  const KANJI = [
    { k: "入", en: "enter", r: "iri / nyū", ex: ["入口", "iriguchi", "entrance"], where: "Doors, ticket gates and car parks.", g: "move" },
    { k: "出", en: "exit", r: "de / shutsu", ex: ["出口", "deguchi", "exit"], where: "The yellow station signs. Follow 出口 to get out.", g: "move" },
    { k: "口", en: "opening", r: "kuchi / guchi", ex: ["非常口", "hijōguchi", "emergency exit"], where: "Every station exit: 東口 east exit, 西口 west exit.", g: "move" },
    { k: "駅", en: "station", r: "eki", ex: ["博多駅", "Hakata-eki", "Hakata Station"], where: "Station names, maps and bus stops.", g: "move" },
    { k: "東", en: "east", r: "higashi / tō", ex: ["東京", "Tōkyō", "Tokyo, 'eastern capital'"], where: "Exits and street signs. Also in 東京!", g: "move" },
    { k: "西", en: "west", r: "nishi / sei", ex: ["西口", "nishiguchi", "west exit"], where: "Station exits, e.g. Ikebukuro 西口.", g: "move" },
    { k: "南", en: "south", r: "minami / nan", ex: ["南口", "minamiguchi", "south exit"], where: "Station exits and neighbourhood names.", g: "move" },
    { k: "北", en: "north", r: "kita / hoku", ex: ["北口", "kitaguchi", "north exit"], where: "Station exits. Arrange to meet at one exit, not just 'the station'.", g: "move" },
    { k: "番", en: "number", r: "ban", ex: ["3番線", "sanbansen", "platform 3"], where: "Platform numbers and queue numbers.", g: "move" },
    { k: "線", en: "line / track", r: "sen", ex: ["山手線", "Yamanote-sen", "Yamanote Line"], where: "Train line names and platforms.", g: "move" },
    { k: "席", en: "seat", r: "seki", ex: ["指定席", "shiteiseki", "reserved seat"], where: "Shinkansen cars: 指定席 reserved, 自由席 unreserved.", g: "move" },
    { k: "男", en: "man", r: "otoko / dan", ex: ["男湯", "otokoyu", "men's bath"], where: "Toilets and onsen curtains.", g: "bath" },
    { k: "女", en: "woman", r: "onna / jo", ex: ["女湯", "onnayu", "women's bath"], where: "Toilets, onsen curtains, women-only train cars.", g: "bath" },
    { k: "湯", en: "hot water / bath", r: "yu", ex: ["ゆ", "yu", "bath (written in hiragana)"], where: "Curtains hung over onsen and bathhouse doors.", g: "bath" },
    { k: "円", en: "yen", r: "en", ex: ["1,000円", "sen-en", "¥1,000"], where: "Every price tag and menu.", g: "shop" },
    { k: "押", en: "push", r: "osu", ex: ["押す", "osu", "push"], where: "Doors, plus the buttons on toilets and ticket machines.", g: "shop" },
    { k: "引", en: "pull", r: "hiku", ex: ["引く", "hiku", "pull"], where: "Doors. Paired with 押 on glass doors.", g: "shop" },
    { k: "禁", en: "forbidden", r: "kin", ex: ["禁煙", "kin'en", "no smoking"], where: "Rules: 撮影禁止 no photos, 立入禁止 keep out.", g: "shop" },
    { k: "中", en: "in / during", r: "naka / chū", ex: ["営業中", "eigyōchū", "open now"], where: "Hung on shop doors when they're open. 準備中 means 'getting ready'.", g: "shop" },
    { k: "休", en: "rest / closed", r: "yasumi / kyū", ex: ["定休日", "teikyūbi", "regular closing day"], where: "Shop hours and museum notices. 本日休業 means 'closed today'.", g: "shop" },
  ];

  // Real-world photos of kanji, all public domain or CC0 from Wikimedia Commons (cropped).
  // kanji: [file in img/kanji, caption, photographer, licence, source page]
  const C = "https://commons.wikimedia.org/wiki/File:";
  const PHOTOS = {
    "出": ["deguchi", "出口 4: exit 4 at a Kyoto subway station", "HAGAT hOMSZE", "CC0", C + "JP_Japan_Kyoto_Karasuma_Marutamachi_South_West_exit_4_sign_June_2026_N13P_01.jpg"],
    "口": ["renrakuguchi", "連絡口: the transfer gate to the subway, JR and Kintetsu at Tennoji, Osaka", "Ogiyoshisan", "Public domain", C + "Tennoji_Station_exit_sign_DSCN0556_20050927.JPG"],
    "入": ["iriguchi", "専用入口: an IC-card-only entrance at Shukugawa Station", "小田急4000系ファン", "CC0", C + "%E5%A4%99%E5%B7%9D%E9%A7%85%E5%8C%97%E5%8F%A3.jpg"],
    "駅": ["eki", "千住大橋駅: Senju-Ōhashi Station, Tokyo", "まも (Mamo)", "Public domain", C + "Senju%C5%8Dhashi_Station.JPG"],
    "東": ["higashi", "高速神戸駅 (東口): Kōsoku Kōbe Station, east exit", "Ogiyoshisan", "Public domain", C + "Kosoku_Kobe_Entrance_sign_DSCN6255_20090123.JPG"],
    "線": ["sen", "東武野田線: the Tōbu Noda Line", "Akitoishii", "Public domain", C + "Kashiwa.JPG"],
    "席": ["seki", "自由席特急券: an unreserved-seat express ticket", "Gamy-Gamy-Gamy", "Public domain", C + "JR%E7%89%B9%E6%80%A5%E5%88%B8%EF%BC%88%E3%82%BF%E3%83%B3%E3%82%B4%E3%83%87%E3%82%A3%E3%82%B9%E3%82%AB%E3%83%90%E3%83%AA%E3%83%BC2%E5%8F%B7%E4%BA%AC%E9%83%BD%E8%A1%8C_%E8%87%AA%E7%94%B1%E5%B8%AD%EF%BC%89.JPG"],
    "男": ["otoko", "男湯 on the left edge of an onsen curtain at Lake Suwa", "Wikimedia Commons", "Public domain", C + "SuwakoNoren.jpg"],
    "女": ["onna", "女湯 on the right edge of the same curtain", "Wikimedia Commons", "Public domain", C + "SuwakoNoren.jpg"],
    "湯": ["yu", "A big ゆ curtain at a Tokyo bathhouse; the small tag says 男湯", "Taufik", "CC0", C + "Oshiage_Onsen_Daikokuyu_20250831_081545.jpg"],
    "円": ["en", "50円 drinks at a vending machine in Hakata, Fukuoka", "Khronos-dolls", "CC0", C + "50_yen_vending_machines_(52900737092).jpg"],
    "休": ["kyu", "休業させて頂きます: 'we will be closed' (from the 1st to the 19th)", "Nils R. Barth", "CC0", C + "%E4%BC%91%E6%A5%AD%E3%81%95%E3%81%9B%E3%81%A6%E9%A0%82%E3%81%8D%E3%81%BE%E3%81%99.jpg"],
  };

  // ------------------------------------------------------------ speech (tap to hear)
  let jaVoice = null;
  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  function pickVoice() { if (synth) jaVoice = synth.getVoices().find((v) => /^ja/i.test(v.lang)) || null; }
  if (synth) { pickVoice(); synth.addEventListener?.("voiceschanged", pickVoice); }
  function say(text) {
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 0.8;
    if (jaVoice) u.voice = jaVoice;
    synth.speak(u);
  }

  // ------------------------------------------------------------ katakana chart
  function renderKana(set) {
    const grid = $("#kanaGrid");
    grid.classList.toggle("combo", set === "combo");
    const list = set === "basic" ? BASIC : set === "dakuten" ? DAKUTEN : COMBO;
    // Each chart row gets its own colour (cycled from the trip's city palette).
    const perRow = set === "combo" ? 3 : 5;
    grid.innerHTML = list.map((c, i) => c
      ? `<button class="kana" style="--rc:${ROW_COLORS[Math.floor(i / perRow) % ROW_COLORS.length]}" data-say="${c[0]}" aria-label="${c[0]}, ${c[1]}"><b>${c[0]}</b><span>${c[1]}</span></button>`
      : `<div class="kana blank"></div>`).join("");
  }

  // ------------------------------------------------------------ words + kanji
  function renderWords() {
    $("#wordGrid").innerHTML = WORDS.map(([w, r, en]) =>
      `<button class="word" data-say="${w}"><span class="w">${w}</span><span class="a"><i>${esc(r)}</i> · ${esc(en)}${WORD_NOTES[w] ? `<small class="note">${esc(WORD_NOTES[w])}</small>` : ""}</span></button>`).join("");
  }
  function renderKanji(g = "all") {
    $("#kanjiGrid").innerHTML = KANJI.filter((k) => g === "all" || k.g === g).map((k) => `
      <article class="kanji-card ${k.g}">
        <div class="kj">${k.k}</div>
        <h4>${esc(k.en)}<small>${esc(k.r)}</small></h4>
        <div class="ex"><span class="k">${k.ex[0]}</span>${esc(k.ex[1])} · ${esc(k.ex[2])}</div>
        <div class="where">📍 ${esc(k.where)}</div>
        ${photoHtml(k.k)}
      </article>`).join("");
  }
  function photoHtml(kanji) {
    const p = PHOTOS[kanji];
    if (!p) return "";
    const [file, cap, by, lic, page] = p;
    return `<figure class="kphoto">
        <button class="kphoto-open" data-photo="${kanji}" aria-label="Enlarge photo: ${esc(cap)}">
          <span class="wild">📷 Spot it in the wild</span>
          <img src="img/kanji/${file}.jpg" alt="${esc(cap)}" loading="lazy" decoding="async">
        </button>
        <figcaption>${esc(cap)} <a href="${page}" target="_blank" rel="noopener">${esc(by)} · ${esc(lic)}</a></figcaption>
      </figure>`;
  }
  function openPhoto(kanji) {
    const [file, cap, by, lic, page] = PHOTOS[kanji];
    const d = $("#lightbox");
    $(".lb-img", d).src = `img/kanji/${file}.jpg`;
    $(".lb-img", d).alt = cap;
    $(".lb-k", d).textContent = kanji;
    $(".lb-cap", d).innerHTML = `${esc(cap)} <a href="${page}" target="_blank" rel="noopener">${esc(by)} · ${esc(lic)}</a>`;
    d.showModal();
  }

  // ------------------------------------------------------------ phrases
  function setBuilder(el, i) {
    const b = BUILDERS[el.dataset.builder], it = b.items[i];
    $$(".chips button", el).forEach((c, j) => c.classList.toggle("on", j === i));
    const jp = it[0] + b.tail[0];
    $(".b-jp", el).textContent = jp;
    $(".b-say", el).innerHTML = `<b>${esc(it[2])} ${esc(b.tail[2])}</b> <span>${esc(it[1])} ${esc(b.tail[1])}</span>`;
    $(".b-en", el).textContent = b.en(it[3]);
    $(".speak", el).dataset.say = jp;
  }
  function renderPhrases() {
    $$(".builder").forEach((el) => {
      const b = BUILDERS[el.dataset.builder];
      $(".chips", el).innerHTML = b.items.map((it, i) => `<button data-i="${i}">${it[0]} <small>${esc(it[1])}</small></button>`).join("");
      setBuilder(el, 0);
      $(".chips", el).addEventListener("click", (e) => {
        const c = e.target.closest("button"); if (!c) return;
        setBuilder(el, +c.dataset.i); say($(".speak", el).dataset.say);
      });
    });
    $("#phraseList").innerHTML = PHRASES.map(([group, list]) => `
      <div class="pgroup"><h3>${esc(group)}</h3><div class="plist">${list.map(([jp, ro, ph, en]) => `
        <button class="phrase" data-say="${esc(jp.replace(" ／ ", "、"))}">
          <span class="p-en">${esc(en)}</span>
          <span class="p-say">${esc(ph)}</span>
          <span class="p-jp">${esc(jp)} <i>${esc(ro)}</i></span>
          <span class="p-ic" aria-hidden="true">🔊</span>
        </button>`).join("")}</div></div>`).join("");
  }

  // ------------------------------------------------------------ quiz
  const POOLS = {
    kana: () => BASIC.filter(Boolean).concat(DAKUTEN).map(([q, a]) => ({ q, a, say: q })),
    words: () => WORDS.map(([q, r, a]) => ({ q, a, reveal: r + (WORD_NOTES[q] ? ` · ${WORD_NOTES[q]}` : ""), say: q })),
    kanji: () => KANJI.map((k) => ({ q: k.k, a: k.en, reveal: `${k.ex[0]} · ${k.ex[2]}` })),
    phrases: () => PHRASES.flatMap(([, list]) => list).filter((p) => !p[0].includes("／"))
      .map(([jp, ro, ph, en]) => ({ q: en.replace(/ \(.*\)$/, ""), a: ro, reveal: ph, say: jp })),
  };
  const quiz = { mode: "kana", pool: [], weights: new Map(), cur: null, last: null, right: 0, total: 0, streak: 0 };

  function startQuiz(mode) {
    quiz.mode = mode;
    quiz.pool = POOLS[mode]();
    quiz.weights = new Map(quiz.pool.map((p) => [p.q, 1]));
    quiz.right = quiz.total = quiz.streak = 0;
    $$("#quizModes button").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    nextQuestion();
  }
  function weightedPick() {
    const items = quiz.pool.filter((p) => p !== quiz.last);
    const sum = items.reduce((s, p) => s + quiz.weights.get(p.q), 0);
    let r = Math.random() * sum;
    for (const p of items) { r -= quiz.weights.get(p.q); if (r <= 0) return p; }
    return items[items.length - 1];
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function nextQuestion() {
    const cur = weightedPick();
    quiz.cur = cur; quiz.last = cur;
    const answers = [...new Set(quiz.pool.map((p) => p.a))].filter((a) => a !== cur.a);
    const choices = shuffle([cur.a, ...shuffle(answers).slice(0, 3)]);
    const prompt = $("#qPrompt");
    prompt.textContent = cur.q;
    prompt.classList.toggle("long", cur.q.length > 2);
    prompt.classList.toggle("is-phrase", quiz.mode === "phrases");
    $("#qHint").textContent = { kana: "How does this sound?", words: "What does this mean?", kanji: "What does this kanji mean?", phrases: "How do you say it?" }[quiz.mode];
    $("#qChoices").innerHTML = choices.map((c) => `<button data-a="${esc(c)}">${esc(c)}</button>`).join("");
    $("#qFeedback").textContent = "";
    $("#qNext").hidden = true;
    $("#qScore").textContent = `${quiz.right} / ${quiz.total}`;
    $("#qStreak").textContent = `🔥 ${quiz.streak}`;
  }
  function answer(btn) {
    const cur = quiz.cur, ok = btn.dataset.a === cur.a;
    quiz.total++;
    if (ok) { quiz.right++; quiz.streak++; quiz.weights.set(cur.q, Math.max(0.5, quiz.weights.get(cur.q) - 0.5)); }
    else { quiz.streak = 0; quiz.weights.set(cur.q, quiz.weights.get(cur.q) + 2); }
    $$("#qChoices button").forEach((b) => {
      b.disabled = true;
      if (b.dataset.a === cur.a) b.classList.add("right");
      else if (b === btn) b.classList.add("wrong");
    });
    $("#qFeedback").textContent = (ok ? "✓ Nice. " : `✗ It's “${cur.a}”. `) + (cur.reveal || "");
    $("#qScore").textContent = `${quiz.right} / ${quiz.total}`;
    $("#qStreak").textContent = `🔥 ${quiz.streak}`;
    if (cur.say) say(cur.say);
    $("#qNext").hidden = false;
    if (ok) setTimeout(() => { if (quiz.cur === cur) nextQuestion(); }, 900);
  }

  // ------------------------------------------------------------ wire up
  renderKana("basic");
  renderWords();
  renderPhrases();
  renderKanji();
  startQuiz("kana");

  $("#kanaTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#kanaTabs button").forEach((x) => x.classList.toggle("on", x === b));
    renderKana(b.dataset.set);
  });
  document.addEventListener("click", (e) => {
    const s = e.target.closest("[data-say]"); if (!s) return;
    say(s.dataset.say);
    if (s.classList.contains("word")) s.classList.add("open");
    if (s.classList.contains("kana")) { s.classList.add("said"); setTimeout(() => s.classList.remove("said"), 400); }
  });
  $("#kanjiGrid").addEventListener("click", (e) => { const b = e.target.closest("[data-photo]"); if (b) openPhoto(b.dataset.photo); });
  $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox" || e.target.closest(".lb-close")) $("#lightbox").close(); });
  $("#kanjiFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#kanjiFilter button").forEach((x) => x.classList.toggle("on", x === b));
    renderKanji(b.dataset.g);
  });
  $("#quizModes").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) startQuiz(b.dataset.mode); });
  $("#qChoices").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && !b.disabled) answer(b); });
  $("#qNext").addEventListener("click", nextQuestion);
})();
