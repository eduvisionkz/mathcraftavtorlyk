(function () {
  const state = { curriculum: null, documents: null, docAvailability: {} };

  async function loadData() {
    const [curRes, docRes] = await Promise.all([
      fetch("data/curriculum.json"),
      fetch("data/documents.json"),
    ]);
    state.curriculum = await curRes.json();
    state.documents = await docRes.json();
  }

  // HEAD-check each document; missing files degrade gracefully to
  // "Құжат әзірленуде" instead of a dead button.
  async function checkAvailability() {
    const entries = Object.entries(state.documents);
    await Promise.all(
      entries.map(async ([key, doc]) => {
        state.docAvailability[key] = { docx: false, pdf: false };
        for (const fmt of ["docx", "pdf"]) {
          try {
            const res = await fetch(doc[fmt], { method: "HEAD" });
            state.docAvailability[key][fmt] = res.ok;
          } catch (e) {
            state.docAvailability[key][fmt] = false;
          }
        }
      })
    );
  }

  function docLink(key, fmt, label, extraClass) {
    const doc = state.documents[key];
    const available = state.docAvailability[key] && state.docAvailability[key][fmt];
    if (!doc) return "";
    if (available === false) {
      return `<span class="doc-unavailable">${label}: Құжат әзірленуде</span>`;
    }
    const cls = extraClass || "btn btn-secondary btn-sm";
    return `<a class="${cls}" href="${doc[fmt]}" ${fmt === "pdf" ? 'target="_blank" rel="noopener noreferrer"' : "download"}>${label}</a>`;
  }

  function renderHeroWorlds() {
    const wrap = document.getElementById("hero-worlds");
    if (!wrap) return;
    const colors = { "sandar-qalasy": "var(--blue)", "bolshekter-zertkhanasy": "var(--green)", "pishinder-sheberkhanasy": "var(--sand-dark)", "logika-ekspeditsiyasy": "var(--terracotta)" };
    wrap.innerHTML = state.curriculum.worlds.map((w) => `
      <div class="world-chip">
        <span class="world-dot" style="background:${colors[w.id] || "var(--green)"}"></span>
        <span class="world-name">${w.name}</span>
        <span class="world-hours">${w.hours} сағ</span>
      </div>
    `).join("");
  }

  function worldFilterOptions() {
    return state.curriculum.worlds.map((w) => `<option value="${w.name}">${w.name}</option>`).join("");
  }

  function renderKtzhTable(filterText = "", filterWorld = "") {
    const tbody = document.getElementById("ktzh-tbody");
    if (!tbody) return;
    const rows = state.curriculum.missions.filter((m) => {
      const text = (m.code + " " + m.topic).toLowerCase();
      const matchesText = !filterText || text.includes(filterText.toLowerCase());
      const matchesWorld = !filterWorld || m.world === filterWorld;
      return matchesText && matchesWorld;
    });
    tbody.innerHTML = rows.map((m) => `
      <tr>
        <td>${m.num}</td>
        <td class="mc-code">${m.code}</td>
        <td>${m.topic}</td>
        <td>${m.outcome}</td>
        <td>${m.world}</td>
        <td>${m.theory}</td>
        <td>${m.practice}</td>
        <td>${m.total}</td>
        <td>
          <div class="row-links">
            <a href="#kmz/${m.code}">ҚМЖ</a>
            <a href="#workbook/${m.code}">Дәптер</a>
            <a href="${state.curriculum.meta.gameUrl}" target="_blank" rel="noopener noreferrer">Ойын</a>
          </div>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="9" style="text-align:center;padding:24px;">Нәтиже табылмады</td></tr>`;
  }

  function renderKmzCards(filterText = "", filterWorld = "") {
    const grid = document.getElementById("kmz-grid");
    if (!grid) return;
    const items = state.curriculum.missions.filter((m) => {
      const text = (m.code + " " + m.topic).toLowerCase();
      const matchesText = !filterText || text.includes(filterText.toLowerCase());
      const matchesWorld = !filterWorld || m.world === filterWorld;
      return matchesText && matchesWorld;
    });
    grid.innerHTML = items.map((m) => `
      <article class="mission-card" id="kmz-${m.code}">
        <div class="mission-top">
          <span class="mc-badge">${m.code}</span>
          <span class="mc-world">${m.world}</span>
        </div>
        <h4>${m.topic}</h4>
        <p class="mc-outcome">${m.outcome}</p>
        <div class="mc-meta"><span>⏱ 45 мин</span><span>🎮 ${m.gameFormat}</span></div>
        <div class="mc-actions">
          ${docLink("kmz", "pdf", "ҚМЖ қарау")}
          ${docLink("kmz", "docx", "Word жүктеу")}
          <a class="btn btn-ghost btn-sm" href="#workbook/${m.code}">Дәптерге өту</a>
          <a class="btn btn-ghost btn-sm" href="${state.curriculum.meta.gameUrl}" target="_blank" rel="noopener noreferrer">Ойынға өту</a>
        </div>
      </article>
    `).join("") || `<p style="text-align:center;">Нәтиже табылмады</p>`;
  }

  function renderWorkbookNav() {
    const list = document.getElementById("workbook-mission-list");
    if (!list) return;
    list.innerHTML = state.curriculum.missions.map((m) => `
      <button type="button" data-code="${m.code}">${m.code} — ${m.topic}</button>
    `).join("");
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-code]");
      if (!btn) return;
      selectWorkbookMission(btn.getAttribute("data-code"));
    });
  }

  function selectWorkbookMission(code) {
    const mission = state.curriculum.missions.find((m) => m.code === code);
    const list = document.getElementById("workbook-mission-list");
    if (list) {
      list.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-code") === code));
    }
    const label = document.getElementById("workbook-current-mission");
    if (label && mission) {
      label.textContent = `${mission.code} — ${mission.topic} (${mission.world})`;
    }
    const kmzLink = document.getElementById("workbook-to-kmz");
    if (kmzLink) kmzLink.href = "#kmz/" + code;
  }

  function renderDocButtons() {
    const ktzhActions = document.getElementById("ktzh-doc-actions");
    if (ktzhActions) {
      ktzhActions.innerHTML = docLink("ktzh", "docx", "Word жүктеу") + docLink("ktzh", "pdf", "PDF ашу");
    }
    const kmzActions = document.getElementById("kmz-doc-actions");
    if (kmzActions) {
      kmzActions.innerHTML = docLink("kmz", "docx", "Word жүктеу") + docLink("kmz", "pdf", "PDF ашу");
    }
    const wbActions = document.getElementById("workbook-doc-actions");
    if (wbActions) {
      wbActions.innerHTML = docLink("workbook", "docx", "Word жүктеу", "btn btn-secondary") + docLink("workbook", "pdf", "PDF ашу", "btn btn-primary");
    }
    const wbFrame = document.getElementById("workbook-pdf-frame");
    if (wbFrame && state.documents.workbook) {
      if (state.docAvailability.workbook && state.docAvailability.workbook.pdf) {
        wbFrame.src = state.documents.workbook.pdf;
      } else {
        wbFrame.outerHTML = '<p class="doc-unavailable">Жұмыс дәптерінің PDF нұсқасы әзірленуде</p>';
      }
    }
  }

  function wireFilters(inputId, selectId, renderFn) {
    const input = document.getElementById(inputId);
    const select = document.getElementById(selectId);
    if (select) select.innerHTML = `<option value="">Барлық әлемдер</option>` + worldFilterOptions();
    function run() { renderFn(input ? input.value : "", select ? select.value : ""); }
    if (input) input.addEventListener("input", run);
    if (select) select.addEventListener("change", run);
  }

  function focusMission(pageId, code) {
    if (!code) return;
    if (pageId === "workbook") {
      selectWorkbookMission(code);
    } else if (pageId === "kmz") {
      setTimeout(() => {
        const el = document.getElementById("kmz-" + code);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    }
  }

  async function init() {
    await loadData();
    document.querySelectorAll("[data-hours]").forEach((el) => (el.textContent = state.curriculum.meta.hours));
    document.querySelectorAll("[data-game-url]").forEach((el) => el.setAttribute("href", state.curriculum.meta.gameUrl));
    renderHeroWorlds();
    renderKtzhTable();
    renderKmzCards();
    renderWorkbookNav();
    wireFilters("ktzh-search", "ktzh-world-filter", renderKtzhTable);
    wireFilters("kmz-search", "kmz-world-filter", renderKmzCards);
    if (state.curriculum.missions.length) selectWorkbookMission(state.curriculum.missions[0].code);

    await checkAvailability();
    renderDocButtons();
    renderKtzhTable(document.getElementById("ktzh-search")?.value, document.getElementById("ktzh-world-filter")?.value);
    renderKmzCards(document.getElementById("kmz-search")?.value, document.getElementById("kmz-world-filter")?.value);
  }

  window.MathCraftDocuments = { focusMission };
  document.addEventListener("DOMContentLoaded", init);
})();
