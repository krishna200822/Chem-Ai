/* ChemAI frontend controller
 * Gemini API key: set it in the backend environment, not in this browser file.
 * For local/demo-only testing you may use window.CHEMAI_CONFIG, but never commit a real key.
 */
(() => {
  "use strict";

  const API_BASE_URL = "https://chem-ai-abne.onrender.com";
  const PREDICT_PATH = "/predict";
  const STORAGE_KEY = "chemai_saved_results_v1";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const state = {
    lastResult: null,
    busy: false,
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function textOf(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value, null, 2);
  }

  function first(obj, keys, fallback = "") {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return fallback;
  }

  function getSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function setSaved(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function notify(message, type = "info") {
    let n = $("#chemai-notification");

    if (!n) {
      n = document.createElement("div");
      n.id = "chemai-notification";
      n.style.cssText =
        "position:fixed;right:20px;bottom:20px;z-index:9999;max-width:360px;padding:12px 16px;border:1px solid rgba(70,200,255,.35);border-radius:10px;background:#0a1422;color:#eaf8ff;box-shadow:0 10px 30px rgba(0,0,0,.35);font:500 14px/1.4 system-ui";
      document.body.appendChild(n);
    }

    n.textContent = message;
    n.dataset.type = type;

    clearTimeout(n._t);
    n._t = setTimeout(() => n.remove(), 3200);
  }

  function findInput() {
    return $$("textarea, input").find(el => {
      const t = `${el.name || ""} ${el.id || ""} ${el.placeholder || ""}`.toLowerCase();

      return (
        t.includes("react") ||
        t.includes("compound") ||
        t.includes("chemical")
      );
    });
  }

  function findConditions() {
    return $$("textarea, input").find(el => {
      if (el === findInput()) return false;

      const t = `${el.name || ""} ${el.id || ""} ${el.placeholder || ""}`.toLowerCase();

      return (
        t.includes("condition") ||
        t.includes("solvent") ||
        t.includes("catalyst") ||
        t.includes("temperature")
      );
    });
  }

  function findButton(labels) {
    return $$("button").find(b =>
      labels.some(x =>
        b.textContent.trim().toLowerCase().includes(x)
      )
    );
  }

  function resultHost() {
    return (
      $("#results, #result, [data-results], .results, .results-container") ||
      document.body
    );
  }

  function renderValue(value) {
    if (Array.isArray(value)) {
      return `<ul>${value
        .map(v =>
          `<li>${escapeHtml(
            typeof v === "object" ? textOf(v) : v
          )}</li>`
        )
        .join("")}</ul>`;
    }

    if (typeof value === "object" && value !== null) {
      return `<pre>${escapeHtml(
        JSON.stringify(value, null, 2)
      )}</pre>`;
    }

    return `<p>${escapeHtml(value)}</p>`;
  }

  function renderResult(result) {
    state.lastResult = result;

    const r =
      result?.prediction ||
      result?.result ||
      result ||
      {};

    const reaction = r.reaction || {};

    const products = first(
      r,
      ["products", "product"],
      []
    );

    const pathways = first(
      r,
      ["pathways", "possible_pathways"],
      []
    );

    const mechanism = first(
      r,
      ["mechanism", "mechanism_explanation"],
      ""
    );

    const conditions = first(
      r,
      ["conditions", "recommended_conditions"],
      {}
    );

    const thermo = first(
      r,
      ["thermodynamics", "thermodynamic_analysis"],
      {}
    );

    const kinetics = first(
      r,
      ["kinetics", "kinetic_analysis"],
      {}
    );

    const observations = first(
      r,
      ["observations", "expected_observations"],
      []
    );

    const safety = first(
      r,
      ["safety", "safety_considerations", "warnings"],
      []
    );

    const limitations = first(
      r,
      ["limitations", "caveats"],
      []
    );

    const confidence = first(
      r,
      ["confidence", "confidence_score"],
      "N/A"
    );

    const summary = first(
      r,
      ["summary", "explanation", "analysis"],
      ""
    );

    const host = resultHost();

    let panel = $("#chemai-result-panel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "chemai-result-panel";

      panel.style.cssText =
        "margin:28px auto;max-width:1100px;padding:22px;border:1px solid rgba(76,210,255,.22);border-radius:16px;background:rgba(7,17,29,.92);color:#eaf8ff";

      host.appendChild(panel);
    }

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
        <div>
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.65">
            ChemAI analysis
          </div>

          <h2 style="margin:4px 0">
            Prediction Result
          </h2>
        </div>

        <div style="padding:8px 12px;border:1px solid rgba(90,220,255,.3);border-radius:999px">
          Confidence: ${escapeHtml(confidence)}
        </div>
      </div>

      <div style="margin-top:18px;display:grid;gap:14px">

        <article>
          <b>Reaction type</b>
          ${renderValue(
            first(
              reaction,
              ["type", "reaction_type"],
              first(
                r,
                ["reaction_type", "type"],
                "Unknown"
              )
            )
          )}
        </article>

        <article>
          <b>Equation</b>

          <pre>${escapeHtml(
            first(
              reaction,
              ["equation", "balanced_equation"],
              first(
                r,
                ["equation", "reaction_equation"],
                "Not provided"
              )
            )
          )}</pre>

          <button data-copy="equation">
            Copy equation
          </button>
        </article>

        <article>
          <b>Products</b>
          ${renderValue(products)}
        </article>

        <article>
          <b>Possible pathways</b>
          ${renderValue(pathways)}
        </article>

        <article>
          <b>Mechanism</b>
          ${renderValue(mechanism)}
        </article>

        <article>
          <b>Conditions</b>
          ${renderValue(conditions)}
        </article>

        <article>
          <b>Thermodynamics</b>
          ${renderValue(thermo)}
        </article>

        <article>
          <b>Kinetics</b>
          ${renderValue(kinetics)}
        </article>

        <article>
          <b>Observations</b>
          ${renderValue(observations)}
        </article>

        <article>
          <b>Safety</b>
          ${renderValue(safety)}
        </article>

        <article>
          <b>Limitations</b>
          ${renderValue(limitations)}
        </article>

        <article>
          <b>Summary</b>
          ${renderValue(summary)}
        </article>

      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">

        <button data-action="save-result">
          Save result
        </button>

        <button data-action="copy-analysis">
          Copy analysis
        </button>

        <button data-action="new-analysis">
          New analysis
        </button>

      </div>
    `;

    panel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function setBusy(busy) {
    state.busy = busy;

    const btn = findButton(["predict", "analy"]);

    if (btn) {
      btn.disabled = busy;
      btn.dataset.originalText ||= btn.textContent;
      btn.textContent = busy
        ? "Analyzing…"
        : btn.dataset.originalText;
    }

    const input = findInput();
    if (input) input.disabled = busy;

    const c = findConditions();
    if (c) c.disabled = busy;
  }

  async function predict() {
    if (state.busy) return;

    const input = findInput();
    const conditionsInput = findConditions();

    const reactants =
      input?.value?.trim() || "";

    const conditions =
      conditionsInput?.value?.trim() || "";

    if (!reactants) {
      notify(
        "Enter at least one reactant or chemical equation.",
        "error"
      );

      input?.focus();
      return;
    }

    setBusy(true);

    notify("Sending reaction to ChemAI…");

    try {
      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        45000
      );

      const response = await fetch(
        `${API_BASE_URL}${PREDICT_PATH}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            reactants,
            conditions
          }),

          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      let data = null;

      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        const msg =
          data?.error ||
          data?.message ||
          `Prediction failed (${response.status})`;

        throw new Error(msg);
      }

      renderResult(data);

      notify("Prediction completed.");

    } catch (err) {

      const message =
        err.name === "AbortError"
          ? "The prediction timed out. The AI service may be waking up or unavailable."
          : (
              err.message ||
              "Network error while contacting ChemAI."
            );

      notify(message, "error");

      let panel =
        $("#chemai-result-panel");

      if (!panel) {
        panel = document.createElement("section");
        panel.id = "chemai-result-panel";

        resultHost().appendChild(panel);
      }

      panel.innerHTML = `
        <div style="padding:18px;border:1px solid rgba(255,100,100,.3);border-radius:12px">

          <b>Prediction unavailable</b>

          <p>${escapeHtml(message)}</p>

          <small>
            Check the backend URL, Gemini configuration,
            and network connection.
          </small>

        </div>
      `;

    } finally {
      setBusy(false);
    }
  }

  function saveResult() {
    if (!state.lastResult) {
      return notify(
        "Run a prediction before saving it."
      );
    }

    const input =
      findInput()?.value || "";

    const conditions =
      findConditions()?.value || "";

    const items = getSaved();

    items.unshift({
      id:
        crypto.randomUUID?.() ||
        String(Date.now()),

      createdAt:
        new Date().toISOString(),

      reactants: input,

      conditions,

      result:
        state.lastResult
    });

    setSaved(items.slice(0, 50));

    notify("Prediction saved locally.");
  }

  function copyAnalysis() {
    if (!state.lastResult) return;

    navigator.clipboard
      ?.writeText(
        JSON.stringify(
          state.lastResult,
          null,
          2
        )
      )

      .then(() =>
        notify("Analysis copied.")
      )

      .catch(() =>
        notify("Copy failed.", "error")
      );
  }

  function clearAnalysis() {
    const i = findInput();
    const c = findConditions();

    if (i) i.value = "";
    if (c) c.value = "";

    $("#chemai-result-panel")?.remove();

    notify("Analysis cleared.");
  }

  function wire() {
    const predictButton =
      findButton(["predict", "analy"]);

    if (
      predictButton &&
      !predictButton.dataset.chemaiWired
    ) {
      predictButton.dataset.chemaiWired = "1";

      predictButton.addEventListener(
        "click",
        e => {
          e.preventDefault();
          predict();
        }
      );
    }

    document.addEventListener(
      "click",
      e => {
        const target =
          e.target.closest?.(
            "[data-action],[data-copy]"
          );

        if (!target) return;

        if (
          target.dataset.action ===
          "save-result"
        ) {
          saveResult();
        }

        if (
          target.dataset.action ===
          "copy-analysis"
        ) {
          copyAnalysis();
        }

        if (
          target.dataset.action ===
          "new-analysis"
        ) {
          clearAnalysis();
        }

        if (
          target.dataset.copy ===
          "equation"
        ) {
          const eq =
            state.lastResult?.reaction?.equation ||
            state.lastResult?.prediction?.reaction?.equation ||
            "";

          navigator.clipboard
            ?.writeText(eq)
            .then(() =>
              notify("Equation copied.")
            );
        }
      },
      { once: false }
    );

    // Make example/demo buttons work
    // when their labels contain a chemical example.
    $$("button").forEach(b => {
      const t =
        b.textContent.trim();

      if (
        /example|ethanol|sodium|hcl|naoh|ethene|brom/i.test(t) &&
        !b.dataset.chemaiExample
      ) {
        b.dataset.chemaiExample = "1";

        b.addEventListener(
          "click",
          () => {
            const i = findInput();

            if (!i) return;

            if (
              /ethanol.*sodium/i.test(t)
            ) {
              i.value =
                "Ethanol + sodium";

            } else if (
              /hcl.*naoh/i.test(t)
            ) {
              i.value =
                "HCl + NaOH";

            } else if (
              /ethene.*br/i.test(t)
            ) {
              i.value =
                "Ethene + Br2";

            } else if (
              /acetic.*ethanol/i.test(t)
            ) {
              i.value =
                "Acetic acid + ethanol";
            }

            i.dispatchEvent(
              new Event("input", {
                bubbles: true
              })
            );
          }
        );
      }
    });
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      wire
    );
  } else {
    wire();
  }

  new MutationObserver(wire).observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );

})();