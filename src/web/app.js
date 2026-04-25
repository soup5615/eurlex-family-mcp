// Client-side logic for the eurlex-family web UI.
// Vanilla ESM — no build step. Fetches the REST API exposed by
// src/server/server.ts.

const TABS = [
  {
    key: "succession",
    label: "Succession",
    analyzeUrl: "/api/succession/analyze",
    consultUrl: "/api/succession/consultation",
    pdfUrl: "/api/succession/pdf",
    consultWrap: (c) => ({ case: c }),
    example: {
      deceased: {
        nationalities: ["FR"],
        lastHabitualResidence: "DE",
        dateOfDeath: "2023-05-10",
      },
      professioJuris: { chosenLaw: "FR", form: "express" },
      dispositions: [
        {
          type: "will",
          dateExecuted: "2018-01-12",
          lawChosenForAdmissibilityAndValidity: "FR",
          form: {
            written: true,
            placeOfMaking: "FR",
            nationalitiesAtMaking: ["FR"],
            habitualResidenceAtMaking: "FR",
          },
        },
      ],
      assets: [
        { kind: "immovable", locatedIn: "FR" },
        { kind: "movable", locatedIn: "DE" },
      ],
    },
  },
  {
    key: "matrimonial",
    label: "Régime matrimonial",
    analyzeUrl: "/api/matrimonial/analyze",
    consultUrl: "/api/matrimonial/consultation",
    pdfUrl: "/api/matrimonial/pdf",
    consultWrap: (c) => ({ case: c }),
    example: {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["DE"], habitualResidence: "FR" },
      ],
      marriage: { dateOfMarriage: "2020-06-10", placeOfMarriage: "FR" },
      choiceOfLaw: {
        chosenLaw: "DE",
        form: "express-writing",
        dateOfChoice: "2021-02-15",
        inWritingDatedSigned: true,
      },
      mpa: {
        dateExecuted: "2021-02-15",
        kind: "separation-of-property",
        inWritingDatedSigned: true,
      },
      context: { forumState: "FR" },
    },
  },
  {
    key: "partnership",
    label: "Partenariat",
    analyzeUrl: "/api/partnership/analyze",
    example: {
      partners: [
        { id: "A", nationalities: ["FR"], habitualResidence: "DE" },
        { id: "B", nationalities: ["DE"], habitualResidence: "DE" },
      ],
      partnership: { dateOfRegistration: "2020-06-01", stateOfCreation: "FR" },
      context: {},
    },
  },
  {
    key: "divorce",
    label: "Divorce (Rome III)",
    analyzeUrl: "/api/divorce/analyze",
    example: {
      spouses: [
        { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
        { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
      ],
      proceeding: "divorce",
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
    },
  },
  {
    key: "bii-matrimonial",
    label: "B IIter — matrimonial",
    analyzeUrl: "/api/bii/matrimonial",
    example: {
      spouses: [
        {
          id: "A",
          nationalities: ["FR"],
          habitualResidence: "FR",
          monthsInHabitualResidence: 18,
        },
        { id: "B", nationalities: ["IT"], habitualResidence: "IT" },
      ],
      proceeding: "divorce",
      dateCourtSeised: "2024-03-01",
      forumState: "FR",
      applicantId: "A",
    },
  },
  {
    key: "bii-parental",
    label: "B IIter — parental",
    analyzeUrl: "/api/bii/parental",
    example: {
      child: { id: "C", habitualResidence: "FR" },
      forumState: "FR",
      dateCourtSeised: "2024-03-01",
    },
  },
  {
    key: "combined",
    label: "Décès d'un conjoint",
    analyzeUrl: "/api/combined/analyze",
    consultUrl: "/api/combined/consultation",
    pdfUrl: "/api/combined/pdf",
    consultWrap: (c) => c,
    example: {
      succession: {
        deceased: {
          nationalities: ["DE"],
          lastHabitualResidence: "FR",
          dateOfDeath: "2023-03-10",
        },
        assets: [
          { kind: "immovable", locatedIn: "DE" },
          { kind: "movable", locatedIn: "FR" },
        ],
      },
      marriage: { dateOfMarriage: "2020-09-12", placeOfMarriage: "DE" },
      survivingSpouse: {
        id: "veuve",
        nationalities: ["DE"],
        habitualResidence: "FR",
      },
    },
  },
  {
    key: "crisis",
    label: "Crise conjugale",
    analyzeUrl: "/api/crisis/analyze",
    example: {
      divorce: {
        spouses: [
          { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
          { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
        ],
        proceeding: "divorce",
        forumState: "FR",
        dateCourtSeised: "2024-03-01",
      },
      matrimonial: {
        spouses: [
          { id: "A", nationalities: ["FR"], habitualResidence: "FR" },
          { id: "B", nationalities: ["IT"], habitualResidence: "FR" },
        ],
        marriage: { dateOfMarriage: "2020-06-01" },
      },
    },
  },
];

const state = {
  activeTab: "succession",
  loadedCaseId: null,
  lastAnalysis: null,
  lastPayload: null,
};

function findTab(key) {
  return TABS.find((t) => t.key === key);
}

function renderTabs() {
  const el = document.getElementById("tabs");
  el.innerHTML = "";
  for (const t of TABS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (t.key === state.activeTab ? " active" : "");
    b.textContent = t.label;
    b.addEventListener("click", () => selectTab(t.key));
    el.appendChild(b);
  }
}

function selectTab(key) {
  state.activeTab = key;
  state.loadedCaseId = null;
  state.lastAnalysis = null;
  state.lastPayload = null;
  document.getElementById("input-title").textContent =
    `Saisie du cas — ${findTab(key).label}`;
  renderTabs();
  renderForm();
  renderResult(null);
  refreshLibrary();
}

function renderForm() {
  const tab = findTab(state.activeTab);
  const form = document.getElementById("case-form");
  form.innerHTML = "";

  const help = document.createElement("p");
  help.className = "muted";
  help.style.fontSize = ".8rem";
  help.textContent =
    "Éditez le JSON ci-dessous (conforme au schéma interne). Un exemple typique est préchargé.";
  form.appendChild(help);

  const ta = document.createElement("textarea");
  ta.id = "json-editor";
  ta.rows = 22;
  ta.style.fontFamily = "ui-monospace,SFMono-Regular,Menlo,monospace";
  ta.style.fontSize = ".8rem";
  ta.style.width = "100%";
  ta.value = JSON.stringify(tab.example, null, 2);
  form.appendChild(ta);

  const err = document.createElement("div");
  err.id = "json-error";
  err.style.color = "#c33";
  err.style.fontSize = ".8rem";
  err.style.marginTop = ".3rem";
  form.appendChild(err);

  // Keep in sync when loading a case.
  if (state.loadedCaseId) {
    fetch(`/api/cases/${state.loadedCaseId}`)
      .then((r) => r.json())
      .then((c) => {
        ta.value = JSON.stringify(c.payload, null, 2);
      })
      .catch(() => {});
  }

  document.getElementById("btn-consult").disabled = true;
  document.getElementById("btn-pdf").disabled = true;
  document.getElementById("btn-save").disabled = true;
}

function readPayload() {
  const ta = document.getElementById("json-editor");
  const errEl = document.getElementById("json-error");
  errEl.textContent = "";
  try {
    return JSON.parse(ta.value);
  } catch (e) {
    errEl.textContent = `JSON invalide : ${e.message}`;
    return null;
  }
}

async function analyze() {
  const tab = findTab(state.activeTab);
  const payload = readPayload();
  if (!payload) return;
  const res = await fetch(tab.analyzeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    renderResult({ error: err.error || "erreur" });
    return;
  }
  const data = await res.json();
  state.lastAnalysis = data;
  state.lastPayload = payload;
  document.getElementById("btn-save").disabled = false;
  document.getElementById("btn-consult").disabled = !tab.consultUrl;
  document.getElementById("btn-pdf").disabled = !tab.pdfUrl;
  renderResult(data);
}

function renderResult(data) {
  const el = document.getElementById("result");
  el.innerHTML = "";
  if (!data) {
    el.innerHTML =
      '<p class="muted">Renseignez un cas puis cliquez sur « Analyser ».</p>';
    return;
  }
  if (data.error) {
    const box = document.createElement("div");
    box.className = "flag-box";
    box.textContent = `Erreur : ${data.error}`;
    el.appendChild(box);
    return;
  }

  // Heuristic rendering adapted to each analysis shape.
  if (data.jurisdiction || data.applicableLaw) {
    // Single-regulation shape.
    renderRegulationAnalysis(el, data);
  }
  if (data.succession && data.matrimonial && data.orchestration) {
    renderSection(el, "Volet successoral", () =>
      renderRegulationAnalysis(el, data.succession, { minimal: true }),
    );
    renderSection(el, "Volet régime matrimonial", () =>
      renderRegulationAnalysis(el, data.matrimonial, { minimal: true }),
    );
    renderOrchestration(el, data.orchestration);
  }
  if (data.bii && data.rome3 && data.matrimonial && data.orchestration) {
    renderSection(el, "Compétence (Bruxelles II ter)", () =>
      renderRegulationAnalysis(el, {
        jurisdiction: data.bii.jurisdiction,
        flags: data.bii.flags,
      }, { minimal: true }),
    );
    renderSection(el, "Loi du divorce (Rome III)", () =>
      renderRegulationAnalysis(el, data.rome3, { minimal: true }),
    );
    renderSection(el, "Régime matrimonial (2016/1103)", () =>
      renderRegulationAnalysis(el, data.matrimonial, { minimal: true }),
    );
    if (data.parental) {
      renderSection(el, "Responsabilité parentale", () =>
        renderRegulationAnalysis(el, {
          jurisdiction: data.parental.jurisdiction,
          flags: data.parental.flags,
        }, { minimal: true }),
      );
    }
    renderOrchestration(el, data.orchestration);
  }
  if (data.scope && data.jurisdiction && !data.applicableLaw) {
    // BII parental / matrimonial.
    renderRegulationAnalysis(el, data);
  }

  // Raw JSON fallback
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Réponse brute (JSON)";
  summary.style.cursor = "pointer";
  summary.style.margin = "1rem 0 .3rem";
  details.appendChild(summary);
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(data, null, 2);
  details.appendChild(pre);
  el.appendChild(details);
}

function renderSection(parent, title, fn) {
  const h = document.createElement("h3");
  h.textContent = title;
  parent.appendChild(h);
  fn();
}

function renderRegulationAnalysis(parent, data, opts = {}) {
  const minimal = opts.minimal;
  const kv = document.createElement("dl");
  kv.className = "kv";
  if (data.temporalScope) {
    kv.appendChild(dt("Champ temporel"));
    kv.appendChild(
      dd(
        `${data.temporalScope.applicable ? "OUI" : "NON"} — ${data.temporalScope.reason}`,
      ),
    );
  }
  if (data.jurisdiction) {
    kv.appendChild(dt("For compétent"));
    kv.appendChild(
      dd(
        `${data.jurisdiction.competentForum ?? "—"} (${data.jurisdiction.basis})`,
      ),
    );
  }
  if (data.applicableLaw) {
    kv.appendChild(dt("Loi applicable"));
    kv.appendChild(
      dd(
        `${data.applicableLaw.applicableLaw ?? "—"} (${data.applicableLaw.basis})`,
      ),
    );
  }
  if (data.esc) {
    kv.appendChild(dt("CSE recommandé"));
    kv.appendChild(dd(data.esc.recommended ? "oui" : "non"));
  }
  parent.appendChild(kv);

  const addSteps = (title, steps) => {
    if (!steps || steps.length === 0) return;
    const h4 = document.createElement("h4");
    h4.textContent = title;
    h4.style.margin = ".6rem 0 .2rem";
    h4.style.fontSize = ".85rem";
    parent.appendChild(h4);
    for (const s of steps) {
      const box = document.createElement("div");
      box.className = "reasoning-step";
      box.innerHTML = `<div class="art">${escape(s.article)}</div>
        <div><em>Règle :</em> ${escape(s.rule)}</div>
        <div><em>Application :</em> ${escape(s.appliedTo)}</div>
        <div><em>Conclusion :</em> ${escape(s.conclusion)}</div>`;
      parent.appendChild(box);
    }
  };
  if (!minimal) {
    addSteps("Raisonnement — compétence", data.jurisdiction?.reasoning);
    addSteps("Raisonnement — loi applicable", data.applicableLaw?.reasoning);
  }

  const addWarns = (ws) => {
    if (!ws) return;
    for (const w of ws) {
      const box = document.createElement("div");
      box.className = "warning-box";
      box.textContent = w;
      parent.appendChild(box);
    }
  };
  addWarns(data.jurisdiction?.warnings);
  addWarns(data.applicableLaw?.warnings);

  if (data.flags && data.flags.length) {
    const h4 = document.createElement("h4");
    h4.textContent = "Points de vigilance";
    parent.appendChild(h4);
    for (const f of data.flags) {
      const box = document.createElement("div");
      box.className = "flag-box";
      box.textContent = f;
      parent.appendChild(box);
    }
  }
}

function renderOrchestration(parent, orch) {
  const h = document.createElement("h3");
  h.textContent = "Orchestration";
  parent.appendChild(h);
  if (orch.orderOfOperations) {
    const ol = document.createElement("ol");
    for (const s of orch.orderOfOperations) {
      const li = document.createElement("li");
      li.textContent = s;
      ol.appendChild(li);
    }
    parent.appendChild(ol);
  }
  if (orch.notes?.length) {
    for (const n of orch.notes) {
      const box = document.createElement("div");
      box.className = "warning-box";
      box.textContent = n;
      parent.appendChild(box);
    }
  }
}

function dt(s) {
  const e = document.createElement("dt");
  e.textContent = s;
  return e;
}
function dd(s) {
  const e = document.createElement("dd");
  e.textContent = s;
  return e;
}
function escape(s) {
  return (s ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function downloadConsultation() {
  const tab = findTab(state.activeTab);
  if (!tab.consultUrl || !state.lastPayload) return;
  const body = JSON.stringify(tab.consultWrap(state.lastPayload));
  const res = await fetch(tab.consultUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  if (!res.ok) return;
  const html = await res.text();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consultation-${tab.key}-${new Date()
    .toISOString()
    .slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPdf() {
  const tab = findTab(state.activeTab);
  if (!tab.pdfUrl || !state.lastPayload) return;
  const body = JSON.stringify(tab.consultWrap(state.lastPayload));
  const res = await fetch(tab.pdfUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    alert(
      `PDF impossible : ${err.error}${err.hint ? "\n\nIndice : " + err.hint : ""}`,
    );
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consultation-${tab.key}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Library ----------

async function refreshLibrary() {
  const q = document.getElementById("library-search").value.trim();
  const url = new URL("/api/cases", location.origin);
  url.searchParams.set("kind", state.activeTab);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url);
  const list = await res.json();
  const ul = document.getElementById("library");
  ul.innerHTML = "";
  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "Aucun cas enregistré.";
    ul.appendChild(li);
    return;
  }
  for (const c of list) {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="delete" title="Supprimer" data-id="${c.id}">×</button>
      <div class="title">${escape(c.title)}</div>
      <div class="meta">${c.kind} · ${new Date(c.updatedAt).toLocaleString()}</div>
      ${c.tags?.length ? `<div class="tags">${c.tags.map((t) => `#${escape(t)}`).join(" ")}</div>` : ""}
    `;
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete")) return;
      loadCase(c.id);
    });
    li.querySelector(".delete").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`Supprimer « ${c.title} » ?`)) return;
      await fetch(`/api/cases/${c.id}`, { method: "DELETE" });
      refreshLibrary();
    });
    ul.appendChild(li);
  }
}

async function loadCase(id) {
  const res = await fetch(`/api/cases/${id}`);
  if (!res.ok) return;
  const c = await res.json();
  state.loadedCaseId = id;
  state.activeTab = c.kind;
  renderTabs();
  renderForm();
  document.getElementById("input-title").textContent =
    `Cas chargé — ${c.title}`;
  document.getElementById("json-editor").value = JSON.stringify(c.payload, null, 2);
}

function openSaveDialog() {
  const dlg = document.getElementById("save-dialog");
  const form = dlg.querySelector("form");
  form.reset();
  if (state.loadedCaseId) {
    // When updating, prefill title/notes/tags from existing case.
    fetch(`/api/cases/${state.loadedCaseId}`)
      .then((r) => r.json())
      .then((c) => {
        form.title.value = c.title;
        form.notes.value = c.notes || "";
        form.tags.value = (c.tags || []).join(", ");
      });
  } else {
    form.title.value = `Cas ${findTab(state.activeTab).label} — ${new Date()
      .toISOString()
      .slice(0, 10)}`;
  }
  dlg.showModal();
}

async function handleSaveSubmit(ev) {
  const form = ev.target;
  if (form.returnValue === "cancel") return;
  ev.preventDefault();
  const payload = readPayload();
  if (!payload) return;
  const fd = new FormData(form);
  const body = {
    title: fd.get("title")?.toString() || "Sans titre",
    kind: state.activeTab,
    payload,
    notes: fd.get("notes")?.toString() || undefined,
    tags: fd
      .get("tags")
      ?.toString()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
  if (state.loadedCaseId) {
    await fetch(`/api/cases/${state.loadedCaseId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } else {
    const r = await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const c = await r.json();
    state.loadedCaseId = c.id;
  }
  document.getElementById("save-dialog").close();
  refreshLibrary();
}

// ---------- Auth ----------

let authMode = "login"; // "login" | "register"

async function fetchMe() {
  const r = await fetch("/api/auth/me");
  if (!r.ok) return null;
  return r.json();
}

function showAuthDialog(message) {
  const dlg = document.getElementById("auth-dialog");
  const err = document.getElementById("auth-error");
  if (message) {
    err.textContent = message;
    err.hidden = false;
  } else {
    err.hidden = true;
  }
  document.getElementById("auth-form").reset();
  if (!dlg.open) dlg.showModal();
}

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById("auth-title").textContent =
    mode === "login" ? "Connexion" : "Créer un compte";
  document.getElementById("auth-toggle").textContent =
    mode === "login" ? "Créer un compte" : "J'ai déjà un compte";
  document.getElementById("auth-submit").textContent =
    mode === "login" ? "Se connecter" : "Créer le compte";
}

async function handleAuthSubmit(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const body = {
    email: fd.get("email")?.toString() || "",
    password: fd.get("password")?.toString() || "",
  };
  const url = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const errEl = document.getElementById("auth-error");
    errEl.textContent = err.error || "erreur";
    errEl.hidden = false;
    return;
  }
  const user = await res.json();
  document.getElementById("auth-dialog").close();
  showSignedIn(user);
  refreshLibrary();
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  showSignedOut();
}

function showSignedIn(user) {
  const banner = document.getElementById("user-banner");
  banner.hidden = false;
  document.getElementById("user-email").textContent = user.email;
}

function showSignedOut() {
  document.getElementById("user-banner").hidden = true;
  document.getElementById("library").innerHTML = "";
  setAuthMode("login");
  showAuthDialog("");
}

// Wrap fetch to redirect to login on 401.
const _fetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const res = await _fetch(input, init);
  if (res.status === 401) {
    const url = typeof input === "string" ? input : input.url;
    if (!url.includes("/api/auth/")) showSignedOut();
  }
  return res;
};

// ---------- Boot ----------

async function init() {
  renderTabs();
  renderForm();
  document.getElementById("btn-analyze").addEventListener("click", analyze);
  document.getElementById("btn-reset").addEventListener("click", () => {
    state.loadedCaseId = null;
    renderForm();
    document.getElementById("input-title").textContent =
      `Saisie du cas — ${findTab(state.activeTab).label}`;
  });
  document
    .getElementById("btn-consult")
    .addEventListener("click", downloadConsultation);
  document.getElementById("btn-pdf").addEventListener("click", downloadPdf);
  document.getElementById("btn-save").addEventListener("click", openSaveDialog);
  document
    .getElementById("save-cancel")
    .addEventListener("click", () =>
      document.getElementById("save-dialog").close("cancel"),
    );
  document
    .getElementById("save-form")
    .addEventListener("submit", handleSaveSubmit);
  document
    .getElementById("library-search")
    .addEventListener("input", () => refreshLibrary());
  document
    .getElementById("auth-form")
    .addEventListener("submit", handleAuthSubmit);
  document
    .getElementById("auth-toggle")
    .addEventListener("click", () =>
      setAuthMode(authMode === "login" ? "register" : "login"),
    );
  document.getElementById("btn-logout").addEventListener("click", logout);

  const me = await fetchMe();
  if (me) {
    showSignedIn(me);
    refreshLibrary();
  } else {
    setAuthMode("login");
    showAuthDialog();
  }
}

init();
