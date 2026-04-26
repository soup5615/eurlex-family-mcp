// Schema-driven form renderer for the eurlex-family web UI.
//
// A `schema` is a tree of fields. The renderer turns it into DOM
// inputs and a parser walks the same DOM to reconstruct the typed
// payload. We keep things in a single module — vanilla DOM, no
// framework, no build step. The same schema language is used for
// every case kind (succession, matrimonial, partnership, divorce,
// bii-matrimonial, bii-parental, combined, crisis, maintenance).
//
// Field kinds:
//   string, text, number, date, boolean
//   country         — ISO 3166 alpha-2, autocomplete with names
//   country-list    — chips with add/remove
//   select          — fixed list of options
//   object          — nested {fields}, optionally collapsible/optional
//   list            — repeatable item

const REGION = (() => {
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" });
  } catch {
    return null;
  }
})();

const ISO_COUNTRIES = [
  "AT","BE","BG","HR","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HU",
  "IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK",
  "GB","CH","NO","IS","LI",
  "US","CA","BR","MX","AR",
  "MA","DZ","TN","SN","CI","CM","ML","CG","CD","NG","ZA","EG",
  "RU","UA","BY","RS","BA","AL","MK","ME","XK","TR",
  "CN","JP","KR","IN","ID","TH","VN","SG","HK","TW","PH","MY",
  "AU","NZ",
  "IL","LB","SY","JO","SA","AE","QA","KW","BH","OM","IR","IQ",
  "PK","BD","LK","NP",
];

function countryName(code) {
  if (!code) return "";
  if (REGION) {
    try {
      return REGION.of(code) || code;
    } catch {
      return code;
    }
  }
  return code;
}

// ---------- Schema → DOM ----------

let _datalistInjected = false;
function ensureCountryDatalist() {
  if (_datalistInjected) return;
  _datalistInjected = true;
  const dl = document.createElement("datalist");
  dl.id = "country-options";
  for (const c of ISO_COUNTRIES) {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = `${c} — ${countryName(c)}`;
    dl.appendChild(o);
  }
  document.body.appendChild(dl);
}

// Render a schema into a container, populated with `value`.
export function renderSchema(container, schema, value, path = "") {
  container.innerHTML = "";
  ensureCountryDatalist();
  container.appendChild(renderField(schema, value, path));
}

function renderField(schema, value, path) {
  switch (schema.kind) {
    case "object":
      return renderObject(schema, value, path);
    case "list":
      return renderList(schema, value, path);
    case "string":
    case "text":
      return renderString(schema, value, path);
    case "number":
      return renderNumber(schema, value, path);
    case "date":
      return renderDate(schema, value, path);
    case "boolean":
      return renderBoolean(schema, value, path);
    case "country":
      return renderCountry(schema, value, path);
    case "country-list":
      return renderCountryList(schema, value, path);
    case "select":
      return renderSelect(schema, value, path);
    default:
      throw new Error(`unknown field kind: ${schema.kind}`);
  }
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") {
      e.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      e.setAttribute(k, v);
    }
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

function renderObject(schema, value, path) {
  const fs = el("fieldset", { class: "form-object" });
  fs.dataset.kind = "object";
  fs.dataset.path = path;
  const legend = el("legend", {}, schema.label ?? "");
  fs.appendChild(legend);

  // Optional objects: a checkbox enables/disables the whole sub-form.
  let enabled = true;
  if (schema.optional) {
    enabled = value != null;
    const toggle = el("label", { class: "form-toggle" });
    const cb = el("input", { type: "checkbox" });
    cb.checked = enabled;
    toggle.appendChild(cb);
    toggle.appendChild(document.createTextNode(" inclure"));
    legend.appendChild(toggle);
    cb.addEventListener("change", () => {
      enabled = cb.checked;
      fs.dataset.optionalEnabled = enabled ? "1" : "0";
      body.style.display = enabled ? "" : "none";
    });
    fs.dataset.optional = "1";
    fs.dataset.optionalEnabled = enabled ? "1" : "0";
  }

  const body = el("div", { class: "form-grid" });
  const v = (value && typeof value === "object") ? value : {};
  for (const [name, fSchema] of Object.entries(schema.fields)) {
    const childPath = path ? `${path}.${name}` : name;
    body.appendChild(renderField(fSchema, v[name], childPath));
  }
  if (schema.optional && !enabled) body.style.display = "none";
  fs.appendChild(body);
  return fs;
}

function renderList(schema, value, path) {
  const wrap = el("fieldset", { class: "form-list" });
  wrap.dataset.kind = "list";
  wrap.dataset.path = path;
  wrap.appendChild(el("legend", {}, schema.label ?? ""));

  const items = el("div", { class: "form-list-items" });
  wrap.appendChild(items);

  const addItem = (val) => {
    const idx = items.children.length;
    const itemPath = `${path}[${idx}]`;
    const card = el("div", { class: "form-list-item" });
    card.dataset.kind = "list-item";
    card.appendChild(renderField(schema.itemSchema, val, itemPath));
    const rm = el(
      "button",
      {
        type: "button",
        class: "btn",
        title: "Supprimer",
        onclick: () => {
          card.remove();
          renumber(items, path);
        },
      },
      "Supprimer",
    );
    card.appendChild(rm);
    items.appendChild(card);
  };

  for (const v of Array.isArray(value) ? value : []) addItem(v);

  const add = el(
    "button",
    {
      type: "button",
      class: "btn",
      onclick: () => addItem(undefined),
    },
    schema.addLabel ?? "Ajouter",
  );
  wrap.appendChild(add);
  return wrap;
}

function renumber(items, basePath) {
  // Recompute the data-path on every descendant so paths stay aligned
  // with array indices after a removal.
  Array.from(items.children).forEach((child, i) => {
    const itemBase = `${basePath}[${i}]`;
    const inner = child.firstElementChild;
    if (!inner) return;
    rewritePaths(inner, basePath, itemBase);
  });
}

function rewritePaths(root, oldPrefix, newPrefix) {
  const re = new RegExp(
    "^" + oldPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\[\\d+\\]",
  );
  if (root.dataset && root.dataset.path) {
    root.dataset.path = root.dataset.path.replace(re, newPrefix);
  }
  for (const c of root.querySelectorAll("[data-path]")) {
    c.dataset.path = c.dataset.path.replace(re, newPrefix);
  }
}

function renderString(schema, value, path) {
  const lab = el("label", {});
  lab.appendChild(document.createTextNode((schema.label ?? "") + " "));
  const input =
    schema.kind === "text"
      ? el("textarea", { rows: schema.rows ?? 3 })
      : el("input", { type: "text" });
  input.dataset.path = path;
  input.dataset.kind = "string";
  if (schema.placeholder) input.setAttribute("placeholder", schema.placeholder);
  if (value != null) input.value = String(value);
  lab.appendChild(input);
  return lab;
}

function renderNumber(schema, value, path) {
  const lab = el("label", {});
  lab.appendChild(document.createTextNode((schema.label ?? "") + " "));
  const input = el("input", { type: "number" });
  if (schema.min != null) input.setAttribute("min", schema.min);
  if (schema.max != null) input.setAttribute("max", schema.max);
  if (schema.step != null) input.setAttribute("step", schema.step);
  input.dataset.path = path;
  input.dataset.kind = "number";
  if (value != null && Number.isFinite(value)) input.value = String(value);
  lab.appendChild(input);
  return lab;
}

function renderDate(schema, value, path) {
  const lab = el("label", {});
  lab.appendChild(document.createTextNode((schema.label ?? "") + " "));
  const input = el("input", { type: "date" });
  input.dataset.path = path;
  input.dataset.kind = "date";
  if (value) input.value = value;
  lab.appendChild(input);
  return lab;
}

function renderBoolean(schema, value, path) {
  const lab = el("label", { class: "form-checkbox" });
  const input = el("input", { type: "checkbox" });
  input.dataset.path = path;
  input.dataset.kind = "boolean";
  if (value) input.checked = true;
  lab.appendChild(input);
  lab.appendChild(document.createTextNode(" " + (schema.label ?? "")));
  return lab;
}

function renderCountry(schema, value, path) {
  const lab = el("label", {});
  lab.appendChild(document.createTextNode((schema.label ?? "") + " "));
  const input = el("input", {
    type: "text",
    list: "country-options",
    autocomplete: "off",
    placeholder: "FR, DE, IT…",
  });
  input.dataset.path = path;
  input.dataset.kind = "country";
  if (value) input.value = String(value).toUpperCase();
  // Show country name as helper text under the input.
  const hint = el("span", { class: "form-hint" });
  const updateHint = () => {
    hint.textContent = input.value ? countryName(input.value.toUpperCase()) : "";
  };
  input.addEventListener("input", updateHint);
  input.addEventListener("change", () => {
    input.value = input.value.toUpperCase();
    updateHint();
  });
  updateHint();
  lab.appendChild(input);
  lab.appendChild(hint);
  return lab;
}

function renderCountryList(schema, value, path) {
  const wrap = el("div", { class: "form-country-list" });
  wrap.dataset.kind = "country-list";
  wrap.dataset.path = path;
  const lbl = el("label", {}, (schema.label ?? "") + " ");
  wrap.appendChild(lbl);
  const chips = el("div", { class: "chip-list" });
  wrap.appendChild(chips);

  const addChip = (code) => {
    const c = String(code).toUpperCase();
    if (!c) return;
    if (Array.from(chips.children).some((ch) => ch.dataset.code === c)) return;
    const chip = el("span", { class: "chip" });
    chip.dataset.code = c;
    chip.appendChild(document.createTextNode(`${c} (${countryName(c)})`));
    const rm = el(
      "button",
      {
        type: "button",
        title: "retirer",
        onclick: () => chip.remove(),
      },
      "×",
    );
    chip.appendChild(rm);
    chips.appendChild(chip);
  };

  const inputRow = el("div", { class: "chip-add" });
  const input = el("input", {
    type: "text",
    list: "country-options",
    autocomplete: "off",
    placeholder: "Ajouter…",
  });
  const addBtn = el(
    "button",
    {
      type: "button",
      class: "btn",
      onclick: () => {
        if (input.value.trim()) {
          addChip(input.value.trim());
          input.value = "";
        }
      },
    },
    "+",
  );
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      addBtn.click();
    }
  });
  inputRow.appendChild(input);
  inputRow.appendChild(addBtn);
  wrap.appendChild(inputRow);

  for (const c of Array.isArray(value) ? value : []) addChip(c);
  return wrap;
}

function renderSelect(schema, value, path) {
  const lab = el("label", {});
  lab.appendChild(document.createTextNode((schema.label ?? "") + " "));
  const select = el("select", {});
  select.dataset.path = path;
  select.dataset.kind = "select";
  for (const opt of schema.options) {
    const o = el("option", { value: opt.value }, opt.label);
    select.appendChild(o);
  }
  if (value != null) select.value = String(value);
  lab.appendChild(select);
  return lab;
}

// ---------- DOM → value ----------

export function gatherForm(container) {
  const root = container.firstElementChild;
  if (!root) return undefined;
  return gather(root);
}

function gather(node) {
  const kind = node.dataset.kind;
  switch (kind) {
    case "object": {
      if (node.dataset.optional === "1" && node.dataset.optionalEnabled !== "1") {
        return undefined;
      }
      const obj = {};
      const body = node.querySelector(":scope > .form-grid");
      if (!body) return obj;
      for (const child of body.children) {
        const childKey = lastSegment(child.dataset.path);
        if (childKey == null) continue;
        const v = gather(child);
        if (v !== undefined) obj[childKey] = v;
      }
      return Object.keys(obj).length === 0 ? undefined : obj;
    }
    case "list": {
      const items = node.querySelector(":scope > .form-list-items");
      const arr = [];
      if (!items) return arr.length ? arr : undefined;
      for (const card of items.children) {
        const inner = card.firstElementChild;
        if (!inner) continue;
        const v = gather(inner);
        if (v !== undefined) arr.push(v);
      }
      return arr.length ? arr : undefined;
    }
    case "string": {
      const input = node.querySelector("[data-path]");
      const v = input?.value?.trim();
      return v ? v : undefined;
    }
    case "number": {
      const input = node.querySelector("[data-path]");
      const v = input?.value?.trim();
      if (!v) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    case "date": {
      const input = node.querySelector("[data-path]");
      const v = input?.value?.trim();
      return v ? v : undefined;
    }
    case "boolean": {
      const input = node.querySelector("[data-path]");
      return input?.checked ? true : undefined;
    }
    case "country": {
      const input = node.querySelector("[data-path]");
      const v = input?.value?.trim()?.toUpperCase();
      return v ? v : undefined;
    }
    case "country-list": {
      const chips = node.querySelectorAll(".chip");
      const arr = Array.from(chips).map((c) => c.dataset.code);
      return arr.length ? arr : undefined;
    }
    case "select": {
      const input = node.querySelector("[data-path]");
      return input?.value || undefined;
    }
    default: {
      // Wrappers (e.g. <label> for primitives) — descend.
      const child = node.querySelector(":scope > [data-kind]") ||
        node.querySelector("[data-kind]");
      return child ? gather(child) : undefined;
    }
  }
}

function lastSegment(p) {
  if (!p) return null;
  const m = p.match(/(?:^|\.)([^.\[\]]+)$/);
  return m ? m[1] : null;
}

// ---------- Schemas (one per case kind) ----------

const SPOUSE = {
  kind: "object",
  label: "Époux",
  fields: {
    id: { kind: "string", label: "Identifiant" },
    nationalities: { kind: "country-list", label: "Nationalité(s)" },
    habitualResidence: { kind: "country", label: "Résidence habituelle" },
    residenceHistory: {
      kind: "list",
      label: "Historique de résidence (optionnel)",
      addLabel: "+ Ajouter",
      itemSchema: {
        kind: "object",
        label: "Période",
        fields: {
          country: { kind: "country", label: "Pays" },
          years: {
            kind: "number",
            label: "Années depuis la sortie",
            min: 0,
          },
        },
      },
    },
  },
};

const PARTNER = { ...SPOUSE, label: "Partenaire" };

const ASSET = {
  kind: "object",
  label: "Bien",
  fields: {
    kind: {
      kind: "select",
      label: "Type",
      options: [
        { value: "movable", label: "Meuble" },
        { value: "immovable", label: "Immeuble" },
      ],
    },
    locatedIn: { kind: "country", label: "Situé dans" },
    estimatedValueEUR: {
      kind: "number",
      label: "Valeur estimée (EUR, optionnel)",
      min: 0,
    },
  },
};

const DISPOSITION = {
  kind: "object",
  label: "Disposition à cause de mort",
  fields: {
    type: {
      kind: "select",
      label: "Type",
      options: [
        { value: "will", label: "Testament" },
        { value: "joint-will", label: "Testament conjoint" },
        { value: "succession-pact", label: "Pacte successoral" },
      ],
    },
    dateExecuted: { kind: "date", label: "Date" },
    lawChosenForAdmissibilityAndValidity: {
      kind: "country",
      label: "Loi choisie (art. 24/25, optionnel)",
    },
    form: {
      kind: "object",
      label: "Données de forme (art. 27)",
      optional: true,
      fields: {
        written: { kind: "boolean", label: "Écrite" },
        holograph: { kind: "boolean", label: "Olographe" },
        joint: { kind: "boolean", label: "Acte conjonctif" },
        placeOfMaking: { kind: "country", label: "Lieu d'établissement" },
        nationalitiesAtMaking: {
          kind: "country-list",
          label: "Nationalités à la disposition",
        },
        habitualResidenceAtMaking: {
          kind: "country",
          label: "RH à la disposition",
        },
      },
    },
  },
};

const SUCCESSION_SCHEMA = {
  kind: "object",
  label: "Cas successoral",
  fields: {
    deceased: {
      kind: "object",
      label: "Défunt",
      fields: {
        nationalities: { kind: "country-list", label: "Nationalité(s)" },
        lastHabitualResidence: { kind: "country", label: "Dernière RH" },
        dateOfDeath: { kind: "date", label: "Date du décès" },
        residenceHistory: {
          kind: "list",
          label: "Historique de résidence",
          addLabel: "+ Ajouter",
          itemSchema: {
            kind: "object",
            label: "Période",
            fields: {
              country: { kind: "country", label: "Pays" },
              years: { kind: "number", label: "Années depuis la sortie", min: 0 },
            },
          },
        },
      },
    },
    professioJuris: {
      kind: "object",
      label: "Choix de loi (art. 22)",
      optional: true,
      fields: {
        chosenLaw: { kind: "country", label: "Loi choisie" },
        form: {
          kind: "select",
          label: "Forme",
          options: [
            { value: "express", label: "Expresse" },
            { value: "implicit-from-disposition", label: "Implicite (issue d'une disposition)" },
          ],
        },
        dateOfChoice: { kind: "date", label: "Date du choix (optionnel)" },
      },
    },
    dispositions: {
      kind: "list",
      label: "Dispositions à cause de mort",
      addLabel: "+ Ajouter une disposition",
      itemSchema: DISPOSITION,
    },
    assets: {
      kind: "list",
      label: "Biens",
      addLabel: "+ Ajouter un bien",
      itemSchema: ASSET,
    },
    forumState: { kind: "country", label: "For envisagé" },
    manifestlyCloserConnectionWith: {
      kind: "country",
      label: "Liens manifestement plus étroits avec (art. 21(2))",
    },
  },
};

const MATRIMONIAL_SCHEMA = {
  kind: "object",
  label: "Cas régime matrimonial",
  fields: {
    spouses: {
      kind: "list",
      label: "Époux (2)",
      addLabel: "+ Ajouter",
      itemSchema: SPOUSE,
    },
    marriage: {
      kind: "object",
      label: "Mariage",
      fields: {
        dateOfMarriage: { kind: "date", label: "Date du mariage" },
        placeOfMarriage: { kind: "country", label: "Lieu du mariage" },
      },
    },
    choiceOfLaw: {
      kind: "object",
      label: "Choix de loi (art. 22)",
      optional: true,
      fields: {
        chosenLaw: { kind: "country", label: "Loi choisie" },
        form: {
          kind: "select",
          label: "Forme",
          options: [
            { value: "express-writing", label: "Acte écrit" },
            { value: "implicit-from-mpa", label: "Implicite via MPA" },
          ],
        },
        dateOfChoice: { kind: "date", label: "Date du choix" },
        inWritingDatedSigned: { kind: "boolean", label: "Écrit, daté, signé" },
      },
    },
    mpa: {
      kind: "object",
      label: "Convention matrimoniale (MPA)",
      optional: true,
      fields: {
        dateExecuted: { kind: "date", label: "Date" },
        kind: {
          kind: "select",
          label: "Type de régime",
          options: [
            { value: "separation-of-property", label: "Séparation de biens" },
            { value: "community-of-property", label: "Communauté" },
            { value: "participation-in-acquisitions", label: "Participation aux acquêts" },
            { value: "other", label: "Autre" },
            { value: "none", label: "Aucun (régime légal)" },
          ],
        },
        placeOfExecution: { kind: "country", label: "Lieu de signature" },
        inWritingDatedSigned: { kind: "boolean", label: "Écrit, daté, signé" },
      },
    },
    context: {
      kind: "object",
      label: "Contexte procédural",
      fields: {
        forumState: { kind: "country", label: "For envisagé" },
      },
    },
  },
};

const PARTNERSHIP_SCHEMA = {
  kind: "object",
  label: "Cas partenariat",
  fields: {
    partners: {
      kind: "list",
      label: "Partenaires (2)",
      addLabel: "+ Ajouter",
      itemSchema: PARTNER,
    },
    partnership: {
      kind: "object",
      label: "Partenariat",
      fields: {
        dateOfRegistration: { kind: "date", label: "Date d'enregistrement" },
        stateOfCreation: { kind: "country", label: "État sous la loi duquel le partenariat a été créé" },
        placeOfRegistration: { kind: "country", label: "Lieu d'enregistrement" },
      },
    },
    choiceOfLaw: {
      kind: "object",
      label: "Choix de loi (art. 22)",
      optional: true,
      fields: {
        chosenLaw: { kind: "country", label: "Loi choisie" },
        form: {
          kind: "select",
          label: "Forme",
          options: [
            { value: "express-writing", label: "Acte écrit" },
            { value: "implicit-from-agreement", label: "Implicite" },
          ],
        },
        dateOfChoice: { kind: "date", label: "Date du choix" },
        inWritingDatedSigned: { kind: "boolean", label: "Écrit, daté, signé" },
      },
    },
    context: {
      kind: "object",
      label: "Contexte",
      fields: {
        forumState: { kind: "country", label: "For envisagé" },
      },
    },
  },
};

const DIVORCE_SCHEMA = {
  kind: "object",
  label: "Cas divorce (Rome III)",
  fields: {
    spouses: {
      kind: "list",
      label: "Époux (2)",
      addLabel: "+ Ajouter",
      itemSchema: {
        kind: "object",
        label: "Époux",
        fields: {
          id: { kind: "string", label: "Identifiant" },
          nationalities: { kind: "country-list", label: "Nationalité(s)" },
          habitualResidence: { kind: "country", label: "Résidence habituelle" },
        },
      },
    },
    proceeding: {
      kind: "select",
      label: "Procédure",
      options: [
        { value: "divorce", label: "Divorce" },
        { value: "legal-separation", label: "Séparation de corps" },
      ],
    },
    forumState: { kind: "country", label: "For saisi" },
    dateCourtSeised: { kind: "date", label: "Date de saisine" },
    choiceOfLaw: {
      kind: "object",
      label: "Choix de loi (art. 5)",
      optional: true,
      fields: {
        chosenLaw: { kind: "country", label: "Loi choisie" },
        dateOfChoice: { kind: "date", label: "Date du choix" },
        inWritingDatedSigned: { kind: "boolean", label: "Écrit, daté, signé" },
      },
    },
    lastCommonHR: {
      kind: "object",
      label: "Dernière RH commune (art. 8(b))",
      optional: true,
      fields: {
        country: { kind: "country", label: "Pays" },
        yearsSinceLeft: {
          kind: "number",
          label: "Années depuis la cessation",
          min: 0,
        },
      },
    },
    designatedLawDoesNotAllowDivorce: {
      kind: "boolean",
      label: "La loi désignée ne permet pas le divorce (art. 10)",
    },
  },
};

const BII_PERSON = {
  kind: "object",
  label: "Époux",
  fields: {
    id: { kind: "string", label: "Identifiant" },
    nationalities: { kind: "country-list", label: "Nationalité(s)" },
    habitualResidence: { kind: "country", label: "Résidence habituelle" },
    monthsInHabitualResidence: {
      kind: "number",
      label: "Mois dans cette RH (au moment de la saisine)",
      min: 0,
    },
  },
};

const BII_MATRIMONIAL_SCHEMA = {
  kind: "object",
  label: "Compétence matrimoniale (B IIter)",
  fields: {
    spouses: {
      kind: "list",
      label: "Époux (2)",
      addLabel: "+ Ajouter",
      itemSchema: BII_PERSON,
    },
    proceeding: {
      kind: "select",
      label: "Procédure",
      options: [
        { value: "divorce", label: "Divorce" },
        { value: "legal-separation", label: "Séparation" },
        { value: "annulment", label: "Annulation" },
      ],
    },
    dateCourtSeised: { kind: "date", label: "Date de saisine" },
    forumState: { kind: "country", label: "For testé" },
    jointApplication: { kind: "boolean", label: "Demande conjointe" },
    applicantId: { kind: "string", label: "Identifiant du demandeur" },
  },
};

const BII_PARENTAL_SCHEMA = {
  kind: "object",
  label: "Compétence parentale (B IIter)",
  fields: {
    child: {
      kind: "object",
      label: "Enfant",
      fields: {
        id: { kind: "string", label: "Identifiant" },
        habitualResidence: { kind: "country", label: "Résidence habituelle" },
        monthsInHabitualResidence: { kind: "number", label: "Mois dans cette RH", min: 0 },
      },
    },
    forumState: { kind: "country", label: "For testé" },
    dateCourtSeised: { kind: "date", label: "Date de saisine" },
    formerHabitualResidence: {
      kind: "country",
      label: "Ancienne RH (art. 8 — 3 mois après déménagement)",
    },
    monthsSinceMoveFromFormer: {
      kind: "number",
      label: "Mois depuis le déménagement",
      min: 0,
    },
    prorogation: {
      kind: "object",
      label: "Prorogation art. 10",
      optional: true,
      fields: {
        chosenForum: { kind: "country", label: "For choisi" },
        allPartiesAccepted: { kind: "boolean", label: "Toutes parties ont accepté" },
        substantialConnection: { kind: "boolean", label: "Lien étroit avec l'enfant" },
      },
    },
    unlawfulRemoval: {
      kind: "object",
      label: "Enlèvement illicite (art. 9)",
      optional: true,
      fields: {
        fromState: { kind: "country", label: "État d'origine" },
        toState: { kind: "country", label: "État de destination" },
        dateOfRemoval: { kind: "date", label: "Date du déplacement" },
      },
    },
  },
};

const COMBINED_SCHEMA = {
  kind: "object",
  label: "Décès d'un conjoint — analyse combinée",
  fields: {
    succession: {
      kind: "object",
      label: "Volet successoral",
      fields: {
        deceased: {
          kind: "object",
          label: "Défunt",
          fields: {
            nationalities: { kind: "country-list", label: "Nationalité(s)" },
            lastHabitualResidence: { kind: "country", label: "Dernière RH" },
            dateOfDeath: { kind: "date", label: "Date du décès" },
          },
        },
        assets: {
          kind: "list",
          label: "Biens",
          addLabel: "+ Ajouter",
          itemSchema: ASSET,
        },
      },
    },
    marriage: {
      kind: "object",
      label: "Mariage",
      fields: {
        dateOfMarriage: { kind: "date", label: "Date du mariage" },
        placeOfMarriage: { kind: "country", label: "Lieu du mariage" },
      },
    },
    survivingSpouse: {
      kind: "object",
      label: "Conjoint survivant",
      fields: {
        id: { kind: "string", label: "Identifiant" },
        nationalities: { kind: "country-list", label: "Nationalité(s)" },
        habitualResidence: { kind: "country", label: "Résidence habituelle" },
      },
    },
  },
};

const CRISIS_SCHEMA = {
  kind: "object",
  label: "Crise conjugale — analyse combinée",
  fields: {
    divorce: DIVORCE_SCHEMA,
    matrimonial: {
      kind: "object",
      label: "Régime matrimonial (sous-cas)",
      fields: {
        spouses: {
          kind: "list",
          label: "Époux (2)",
          itemSchema: SPOUSE,
        },
        marriage: {
          kind: "object",
          label: "Mariage",
          fields: {
            dateOfMarriage: { kind: "date", label: "Date du mariage" },
            placeOfMarriage: { kind: "country", label: "Lieu du mariage" },
          },
        },
      },
    },
  },
};

const MAINTENANCE_PERSON = {
  kind: "object",
  label: "Personne",
  fields: {
    id: { kind: "string", label: "Identifiant" },
    habitualResidence: { kind: "country", label: "Résidence habituelle" },
    nationalities: { kind: "country-list", label: "Nationalité(s)" },
    isMinor: { kind: "boolean", label: "Mineur (< 18 ans)" },
  },
};

const MAINTENANCE_SCHEMA = {
  kind: "object",
  label: "Cas aliments (Règl. 4/2009)",
  fields: {
    creditor: { ...MAINTENANCE_PERSON, label: "Créancier" },
    debtor: { ...MAINTENANCE_PERSON, label: "Débiteur" },
    relation: {
      kind: "select",
      label: "Relation",
      options: [
        { value: "child", label: "Enfant → parent" },
        { value: "spouse", label: "Époux → époux" },
        { value: "former-spouse", label: "Ex-époux" },
        { value: "ascendant", label: "Ascendant" },
        { value: "other-family", label: "Autre famille" },
      ],
    },
    forumState: { kind: "country", label: "For saisi" },
    dateCourtSeised: { kind: "date", label: "Date de saisine" },
    spouseObjection: {
      kind: "object",
      label: "Opposition art. 5 du Protocole",
      optional: true,
      fields: {
        closerConnectionWith: { kind: "country", label: "Liens plus étroits avec" },
      },
    },
    hrCreditorLawAllowsMaintenance: {
      kind: "boolean",
      label: "La loi de la RH du créancier permet l'obligation",
    },
    forumLawAllowsMaintenance: {
      kind: "boolean",
      label: "La loi du for permet l'obligation",
    },
  },
};

const RECOGNITION_SCHEMA = {
  kind: "object",
  label: "Reconnaissance / exécution d'une décision",
  fields: {
    instrument: {
      kind: "object",
      label: "Décision / acte invoqué",
      fields: {
        regulation: {
          kind: "select",
          label: "Règlement source",
          options: [
            { value: "650-2012", label: "Règl. 650/2012 (Successions)" },
            { value: "2016-1103", label: "Règl. 2016/1103 (Régimes matrimoniaux)" },
            { value: "2016-1104", label: "Règl. 2016/1104 (Partenariats)" },
            { value: "4-2009", label: "Règl. 4/2009 (Aliments)" },
            { value: "2019-1111", label: "Règl. 2019/1111 (Bruxelles II ter)" },
          ],
        },
        kind: {
          kind: "select",
          label: "Type d'acte",
          options: [
            { value: "judgment", label: "Décision juridictionnelle" },
            { value: "authentic-instrument", label: "Acte authentique" },
            { value: "court-settlement", label: "Transaction judiciaire" },
            { value: "european-succession-certificate", label: "CSE (R 650 uniquement)" },
          ],
        },
        originState: { kind: "country", label: "État d'origine" },
        issuedOn: { kind: "date", label: "Date de la décision/acte" },
      },
    },
    forumState: { kind: "country", label: "État requis (où invocation/exécution)" },
    refusalHints: {
      kind: "object",
      label: "Indices pour les motifs de refus",
      optional: true,
      fields: {
        defendantDulyServed: { kind: "boolean", label: "Défendeur régulièrement informé" },
        defaultJudgment: { kind: "boolean", label: "Décision par défaut" },
        publicPolicyConcern: { kind: "boolean", label: "Préoccupation d'ordre public manifeste" },
        irreconcilableWithEarlierDecision: {
          kind: "boolean",
          label: "Inconciliable avec une décision antérieure reconnue",
        },
      },
    },
    originBoundByHagueProtocol: {
      kind: "boolean",
      label: "Origine liée par le Protocole de La Haye 2007 (R 4/2009 uniquement)",
    },
  },
};

const HAGUE_1980_SCHEMA = {
  kind: "object",
  label: "Enlèvement international d'enfant (La Haye 1980)",
  fields: {
    child: {
      kind: "object",
      label: "Enfant",
      fields: {
        id: { kind: "string", label: "Identifiant" },
        ageAtRemoval: { kind: "number", label: "Âge au moment du déplacement", min: 0, max: 17 },
        habitualResidenceBeforeRemoval: {
          kind: "country",
          label: "Résidence habituelle avant le déplacement",
        },
      },
    },
    removal: {
      kind: "object",
      label: "Déplacement / non-retour",
      fields: {
        fromState: { kind: "country", label: "État d'origine" },
        toState: { kind: "country", label: "État de refuge" },
        dateOfRemovalOrRetention: { kind: "date", label: "Date" },
        breachOfCustodyRights: { kind: "boolean", label: "Violation du droit de garde" },
        custodyRightsActuallyExercised: {
          kind: "boolean",
          label: "Garde effectivement exercée au moment du déplacement",
        },
      },
    },
    application: {
      kind: "object",
      label: "Demande de retour",
      fields: {
        dateOfApplication: { kind: "date", label: "Date de la demande" },
        requestingState: { kind: "country", label: "État requérant" },
      },
    },
    defenses: {
      kind: "object",
      label: "Exceptions invoquées (art. 12 § 2, 13, 20)",
      optional: true,
      fields: {
        childSettledMoreThanOneYear: {
          kind: "boolean",
          label: "Enfant intégré dans son nouvel environnement (art. 12 § 2)",
        },
        consentOrAcquiescence: {
          kind: "boolean",
          label: "Consentement ou acquiescement (art. 13 § 1 a)",
        },
        graveRiskOfHarm: {
          kind: "boolean",
          label: "Risque grave de danger (art. 13 § 1 b)",
        },
        objectionByMatureChild: {
          kind: "boolean",
          label: "Opposition de l'enfant mature (art. 13 § 2)",
        },
        fundamentalPublicPolicy: {
          kind: "boolean",
          label: "Principes fondamentaux du for (art. 20)",
        },
      },
    },
  },
};

export const SCHEMAS = {
  succession: SUCCESSION_SCHEMA,
  matrimonial: MATRIMONIAL_SCHEMA,
  partnership: PARTNERSHIP_SCHEMA,
  divorce: DIVORCE_SCHEMA,
  "bii-matrimonial": BII_MATRIMONIAL_SCHEMA,
  "bii-parental": BII_PARENTAL_SCHEMA,
  combined: COMBINED_SCHEMA,
  crisis: CRISIS_SCHEMA,
  maintenance: MAINTENANCE_SCHEMA,
  recognition: RECOGNITION_SCHEMA,
  "hague-1980": HAGUE_1980_SCHEMA,
};
