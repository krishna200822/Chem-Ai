/* =========================================================
   ChemAI - Reaction Prediction Frontend
   Backend: https://chem-ai-abne.onrender.com
   ========================================================= */

(() => {
  "use strict";

  const API_BASE_URL = "https://chem-ai-abne.onrender.com";
  const PREDICT_URL = `${API_BASE_URL}/predict`;
  const STORAGE_KEY = "chemai_saved_results_v2";

  const state = {
    busy: false,
    lastResult: null,
    lastReactants: "",
    lastConditions: ""
  };

  /* =========================================================
     DOM
     ========================================================= */

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const el = {
    sidebar: $("#sidebar"),
    scrim: $("#sidebar-scrim"),
    mobileMenu: $("#mobile-menu"),

    navItems: $$(".nav-item"),
    pages: $$(".app-page"),
    goButtons: $$("[data-go]"),

    breadcrumb: $("#breadcrumb-current"),

    form: $("#prediction-form"),
    reactants: $("#reactants-input"),
    conditions: $("#conditions-input"),

    predictButton: $("#predict-button"),
    clearInput: $("#clear-input"),

    charCount: $("#char-count"),
    conditionCount: $("#condition-count"),

    inputStatus: $("#input-status"),

    loading: $("#loading-state"),
    loadingTitle: $("#loading-title"),
    loadingDetail: $("#loading-detail"),

    error: $("#error-panel"),
    errorTitle: $("#error-title"),
    errorMessage: $("#error-message"),
    retryButton: $("#retry-button"),

    results: $("#results-area"),
    resultType: $("#res-type"),
    equation: $("#res-equation"),
    summary: $("#res-summary"),
    sections: $("#result-sections"),

    copyAnalysis: $("#copy-analysis"),
    saveResult: $("#save-result"),
    newAnalysis: $("#new-analysis"),
    copyEquation: $("#copy-equation"),

    libraryGrid: $("#library-grid"),
    learningGrid: $("#learning-grid"),
    savedGrid: $("#saved-grid"),
    savedCount: $("#saved-count"),

    toastRegion: $("#toast-region")
  };

  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanText(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function getFirst(object, keys, fallback = "") {
    if (!object || typeof object !== "object") {
      return fallback;
    }

    for (const key of keys) {
      if (
        object[key] !== undefined &&
        object[key] !== null &&
        object[key] !== ""
      ) {
        return object[key];
      }
    }

    return fallback;
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  }

  function objectToText(value) {
    if (typeof value === "string") return value;

    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  function formatContent(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return `<p>Not provided.</p>`;
    }

    if (Array.isArray(value)) {
      return `
        <ul class="content-list">
          ${value
            .map(item => {
              const content =
                typeof item === "object"
                  ? objectToText(item)
                  : item;

              return `<li>${escapeHTML(content)}</li>`;
            })
            .join("")}
        </ul>
      `;
    }

    if (typeof value === "object") {
      return `
        <pre class="result-pre">${escapeHTML(
          objectToText(value)
        )}</pre>
      `;
    }

    return `<p>${escapeHTML(value)}</p>`;
  }

  function formatDate(date) {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(date));
    } catch {
      return new Date(date).toLocaleString();
    }
  }

  /* =========================================================
     TOAST
     ========================================================= */

  function showToast(message, type = "info") {
    if (!el.toastRegion) return;

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.textContent = message;

    el.toastRegion.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";

      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function openPage(pageName) {
    if (!pageName) return;

    const target = document.getElementById(
      `${pageName}-page`
    );

    if (!target) return;

    el.pages.forEach(page => {
      page.classList.toggle(
        "active",
        page === target
      );
    });

    el.navItems.forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.page === pageName
      );
    });

    const title =
      target.dataset.title ||
      pageName.charAt(0).toUpperCase() +
        pageName.slice(1);

    if (el.breadcrumb) {
      el.breadcrumb.textContent = title;
    }

    closeMobileMenu();

    if (pageName === "saved") {
      renderSavedResults();
    }

    if (pageName === "library") {
      renderLibrary();
    }

    if (pageName === "learning") {
      renderLearning();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function closeMobileMenu() {
    el.sidebar?.classList.remove("open");
    el.scrim?.classList.remove("open");

    el.mobileMenu?.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  function toggleMobileMenu() {
    if (!el.sidebar) return;

    const open =
      el.sidebar.classList.toggle("open");

    el.scrim?.classList.toggle(
      "open",
      open
    );

    el.mobileMenu?.setAttribute(
      "aria-expanded",
      String(open)
    );
  }

  /* =========================================================
     INPUT
     ========================================================= */

  function updateCounters() {
    if (el.charCount && el.reactants) {
      el.charCount.textContent =
        `${el.reactants.value.length}/500`;
    }

    if (el.conditionCount && el.conditions) {
      el.conditionCount.textContent =
        `${el.conditions.value.length}/300`;
    }
  }

  function updateInputStatus() {
    if (!el.inputStatus || !el.reactants) return;

    const value = el.reactants.value.trim();

    if (!value) {
      el.inputStatus.textContent =
        "Awaiting reactants";
      return;
    }

    if (value.length > 500) {
      el.inputStatus.textContent =
        "Input exceeds limit";
      return;
    }

    el.inputStatus.textContent =
      "Reactants ready";
  }

  function clearInput() {
    if (el.reactants) {
      el.reactants.value = "";
    }

    if (el.conditions) {
      el.conditions.value = "";
    }

    updateCounters();
    updateInputStatus();

    el.reactants?.focus();

    showToast(
      "Input cleared.",
      "success"
    );
  }

  function useExample(value) {
    if (!el.reactants) return;

    el.reactants.value = value;

    updateCounters();
    updateInputStatus();

    el.reactants.focus();

    showToast(
      "Example loaded.",
      "success"
    );
  }

  /* =========================================================
     LOADING / ERROR
     ========================================================= */

  function showLoading() {
    if (!el.loading) return;

    el.loading.hidden = false;

    if (el.error) {
      el.error.hidden = true;
    }

    if (el.results) {
      el.results.hidden = true;
    }

    if (el.loadingTitle) {
      el.loadingTitle.textContent =
        "Analyzing reaction";
    }

    if (el.loadingDetail) {
      el.loadingDetail.textContent =
        "ChemAI is evaluating the reactants and generating possible reaction pathways.";
    }
  }

  function hideLoading() {
    if (el.loading) {
      el.loading.hidden = true;
    }
  }

  function showError(title, message) {
    hideLoading();

    if (el.results) {
      el.results.hidden = true;
    }

    if (el.error) {
      el.error.hidden = false;
    }

    if (el.errorTitle) {
      el.errorTitle.textContent =
        title || "Prediction failed";
    }

    if (el.errorMessage) {
      el.errorMessage.textContent =
        message ||
        "The prediction service could not complete the analysis.";
    }
  }

  function hideError() {
    if (el.error) {
      el.error.hidden = true;
    }
  }

  /* =========================================================
     RESULT NORMALIZATION
     ========================================================= */

  function normalizeResult(payload) {
    if (!payload) return {};

    /*
      Backend may return:

      {
        result: {...}
      }

      or

      {
        prediction: {...}
      }

      or directly:

      {...}
    */

    if (
      payload.result &&
      typeof payload.result === "object"
    ) {
      return payload.result;
    }

    if (
      payload.prediction &&
      typeof payload.prediction === "object"
    ) {
      return payload.prediction;
    }

    return payload;
  }

  function getReactionType(data) {
    return getFirst(
      data,
      [
        "reaction_type",
        "reactionType",
        "type",
        "reaction_class",
        "reactionClass"
      ],
      "Reaction analysis"
    );
  }

  function getEquation(data) {
    return getFirst(
      data,
      [
        "equation",
        "reaction_equation",
        "reactionEquation",
        "reaction",
        "overall_equation"
      ],
      ""
    );
  }

  function getSummary(data) {
    return getFirst(
      data,
      [
        "summary",
        "overview",
        "explanation",
        "description"
      ],
      ""
    );
  }

  /* =========================================================
     RESULT SECTION HELPERS
     ========================================================= */

  function createSection(number, title, subtitle, content) {
    return `
      <article class="result-card">
        <div class="section-heading">
          <span>${escapeHTML(number)}</span>
          <div>
            <h3>${escapeHTML(title)}</h3>
            ${
              subtitle
                ? `<p>${escapeHTML(subtitle)}</p>`
                : ""
            }
          </div>
        </div>

        ${content}
      </article>
    `;
  }

  function renderReactants(data) {
    const reactants = getFirst(
      data,
      [
        "reactants",
        "reactant_details",
        "reactantDetails",
        "starting_materials",
        "startingMaterials"
      ],
      []
    );

    const list = toArray(reactants);

    if (!list.length) return "";

    const cards = list.map(item => {
      if (typeof item === "string") {
        return `
          <div class="chemical-card">
            <div class="molecule-thumb">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <h4>${escapeHTML(item)}</h4>
          </div>
        `;
      }

      const name = getFirst(
        item,
        ["name", "compound", "compound_name"],
        "Reactant"
      );

      const formula = getFirst(
        item,
        ["formula", "molecular_formula"],
        ""
      );

      const state = getFirst(
        item,
        ["state", "physical_state"],
        ""
      );

      const description = getFirst(
        item,
        ["description", "role", "function"],
        ""
      );

      return `
        <div class="chemical-card">
          <div class="molecule-thumb">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h4>${escapeHTML(name)}</h4>

          ${
            formula
              ? `<div class="chem-formula">${escapeHTML(
                  formula
                )}</div>`
              : ""
          }

          ${
            state
              ? `<span class="state-badge">${escapeHTML(
                  state
                )}</span>`
              : ""
          }

          ${
            description
              ? `<p>${escapeHTML(
                  description
                )}</p>`
              : ""
          }
        </div>
      `;
    });

    return createSection(
      "01",
      "Reactants",
      "Starting materials identified by ChemAI",
      `<div class="reactant-grid">${cards.join("")}</div>`
    );
  }

  function renderProducts(data) {
    const products = getFirst(
      data,
      [
        "products",
        "product_details",
        "productDetails",
        "predicted_products",
        "predictedProducts"
      ],
      []
    );

    const list = toArray(products);

    if (!list.length) return "";

    const cards = list.map(item => {
      if (typeof item === "string") {
        return `
          <div class="chemical-card">
            <div class="molecule-thumb">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <h4>${escapeHTML(item)}</h4>
          </div>
        `;
      }

      const name = getFirst(
        item,
        ["name", "compound", "compound_name"],
        "Predicted product"
      );

      const formula = getFirst(
        item,
        ["formula", "molecular_formula"],
        ""
      );

      const state = getFirst(
        item,
        ["state", "physical_state"],
        ""
      );

      const description = getFirst(
        item,
        ["description", "properties", "property"],
        ""
      );

      return `
        <div class="chemical-card">
          <div class="molecule-thumb">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h4>${escapeHTML(name)}</h4>

          ${
            formula
              ? `<div class="chem-formula">${escapeHTML(
                  formula
                )}</div>`
              : ""
          }

          ${
            state
              ? `<span class="state-badge">${escapeHTML(
                  state
                )}</span>`
              : ""
          }

          ${
            description
              ? `<p>${escapeHTML(
                  description
                )}</p>`
              : ""
          }
        </div>
      `;
    });

    return createSection(
      "02",
      "Predicted Products",
      "Likely products generated from the reaction analysis",
      `<div class="product-grid">${cards.join("")}</div>`
    );
  }

  function renderPathways(data) {
    const pathways = getFirst(
      data,
      [
        "pathways",
        "reaction_pathways",
        "reactionPathways",
        "possible_pathways",
        "possiblePathways"
      ],
      []
    );

    const list = toArray(pathways);

    if (!list.length) return "";

    const html = list.map((path, index) => {
      if (typeof path === "string") {
        return `
          <details class="pathway" ${
            index === 0 ? "open" : ""
          }>
            <summary>
              <div class="pathway-title">
                <div class="pathway-number">
                  ${index + 1}
                </div>

                <div>
                  <strong>
                    Pathway ${index + 1}
                  </strong>

                  <span>
                    Possible reaction route
                  </span>
                </div>
              </div>

              <span>›</span>
            </summary>

            <div class="pathway-content">
              <p class="pathway-description">
                ${escapeHTML(path)}
              </p>
            </div>
          </details>
        `;
      }

      const name = getFirst(
        path,
        ["name", "title", "pathway"],
        `Pathway ${index + 1}`
      );

      const description = getFirst(
        path,
        ["description", "explanation", "details"],
        ""
      );

      const steps = getFirst(
        path,
        ["steps", "mechanism_steps", "mechanismSteps"],
        []
      );

      const conditions = getFirst(
        path,
        ["conditions", "condition"],
        ""
      );

      const flow = getFirst(
        path,
        ["flow", "sequence"],
        ""
      );

      return `
        <details class="pathway" ${
          index === 0 ? "open" : ""
        }>
          <summary>
            <div class="pathway-title">
              <div class="pathway-number">
                ${index + 1}
              </div>

              <div>
                <strong>
                  ${escapeHTML(name)}
                </strong>

                <span>
                  Alternative reaction pathway
                </span>
              </div>
            </div>

            <span>›</span>
          </summary>

          <div class="pathway-content">

            ${
              flow
                ? `
                  <div class="pathway-flow">
                    <span>Reactants</span>
                    <i></i>
                    <span>Intermediate</span>
                    <i></i>
                    <span>Products</span>
                  </div>
                `
                : ""
            }

            ${
              description
                ? `
                  <p class="pathway-description">
                    ${escapeHTML(description)}
                  </p>
                `
                : ""
            }

            ${
              steps.length
                ? `
                  <div class="data-grid">
                    ${steps
                      .map(
                        (step, i) => `
                          <div class="data-tile">
                            <dt>Step ${i + 1}</dt>
                            <dd>
                              ${escapeHTML(
                                objectToText(step)
                              )}
                            </dd>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : ""
            }

            ${
              conditions
                ? `
                  <div class="data-tile" style="margin-top:10px;">
                    <dt>Conditions</dt>
                    <dd>
                      ${escapeHTML(
                        objectToText(conditions)
                      )}
                    </dd>
                  </div>
                `
                : ""
            }

          </div>
        </details>
      `;
    });

    return createSection(
      "03",
      "Reaction Pathways",
      "Possible routes considered by the model",
      `<div class="pathways">${html.join("")}</div>`
    );
  }

  function renderMechanism(data) {
    const mechanism = getFirst(
      data,
      [
        "mechanism",
        "reaction_mechanism",
        "reactionMechanism",
        "mechanism_steps",
        "mechanismSteps"
      ],
      []
    );

    const list = toArray(mechanism);

    if (!list.length) return "";

    const html = list.map((step, index) => {
      if (typeof step === "string") {
        return `
          <div class="mechanism-step">
            <span>${index + 1}</span>

            <div>
              <h4>Step ${index + 1}</h4>
              <p>${escapeHTML(step)}</p>
            </div>
          </div>
        `;
      }

      const title = getFirst(
        step,
        ["title", "name", "step"],
        `Step ${index + 1}`
      );

      const description = getFirst(
        step,
        ["description", "explanation", "details"],
        ""
      );

      return `
        <div class="mechanism-step">
          <span>${index + 1}</span>

          <div>
            <h4>${escapeHTML(title)}</h4>

            ${
              description
                ? `<p>${escapeHTML(
                    description
                  )}</p>`
                : ""
            }
          </div>
        </div>
      `;
    });

    return createSection(
      "04",
      "Reaction Mechanism",
      "Step-by-step interpretation of the transformation",
      `<div class="mechanism-flow">${html.join("")}</div>`
    );
  }

  function renderConditions(data) {
    const conditions = getFirst(
      data,
      [
        "conditions",
        "reaction_conditions",
        "reactionConditions"
      ],
      null
    );

    if (!conditions) return "";

    let content = "";

    if (typeof conditions === "object") {
      content = `
        <div class="data-grid">
          ${Object.entries(conditions)
            .map(([key, value]) => `
              <div class="data-tile">
                <dt>${escapeHTML(
                  key.replaceAll("_", " ")
                )}</dt>

                <dd>
                  ${escapeHTML(
                    objectToText(value)
                  )}
                </dd>
              </div>
            `)
            .join("")}
        </div>
      `;
    } else {
      content = formatContent(conditions);
    }

    return createSection(
      "05",
      "Reaction Conditions",
      "Solvent, catalyst, temperature and related parameters",
      content
    );
  }

  function renderThermodynamics(data) {
    const thermo = getFirst(
      data,
      [
        "thermodynamics",
        "thermodynamic_analysis",
        "thermodynamicAnalysis"
      ],
      null
    );

    if (!thermo) return "";

    return createSection(
      "06",
      "Thermodynamics",
      "Energy-related interpretation",
      formatObjectGrid(thermo)
    );
  }

  function renderKinetics(data) {
    const kinetics = getFirst(
      data,
      [
        "kinetics",
        "kinetic_analysis",
        "kineticAnalysis"
      ],
      null
    );

    if (!kinetics) return "";

    return createSection(
      "07",
      "Kinetics",
      "Reaction-rate considerations",
      formatObjectGrid(kinetics)
    );
  }

  function formatObjectGrid(value) {
    if (!value) return "";

    if (typeof value !== "object") {
      return formatContent(value);
    }

    return `
      <div class="data-grid">
        ${Object.entries(value)
          .map(([key, val]) => `
            <div class="data-tile">
              <dt>
                ${escapeHTML(
                  key.replaceAll("_", " ")
                )}
              </dt>

              <dd>
                ${escapeHTML(
                  objectToText(val)
                )}
              </dd>
            </div>
          `)
          .join("")}
      </div>
    `;
  }

  function renderObservations(data) {
    const observations = getFirst(
      data,
      [
        "observations",
        "notes",
        "important_observations"
      ],
      []
    );

    if (!observations) return "";

    return createSection(
      "08",
      "Observations",
      "Important notes from the prediction",
      formatContent(observations)
    );
  }

  function renderSafety(data) {
    const safety = getFirst(
      data,
      [
        "safety",
        "safety_notes",
        "safetyNotes",
        "hazards"
      ],
      null
    );

    if (!safety) return "";

    return createSection(
      "09",
      "Safety",
      "Important laboratory safety considerations",
      `
        <div class="safety-notice">
          <div>
            <strong>Safety notice</strong>
            ${formatContent(safety)}
          </div>
        </div>
      `
    );
  }

  function renderLimitations(data) {
    const limitations = getFirst(
      data,
      [
        "limitations",
        "limitations_and_uncertainty",
        "uncertainty"
      ],
      []
    );

    if (!limitations) return "";

    return createSection(
      "10",
      "Limitations",
      "Model uncertainty and prediction constraints",
      formatContent(limitations)
    );
  }

  function renderConfidence(data) {
    let confidence = getFirst(
      data,
      [
        "confidence",
        "confidence_score",
        "confidenceScore"
      ],
      null
    );

    if (confidence === null) return "";

    let numeric = Number(confidence);

    if (Number.isNaN(numeric)) {
      const match =
        String(confidence).match(
          /(\d+(?:\.\d+)?)/
        );

      numeric = match
        ? Number(match[1])
        : 50;
    }

    if (numeric <= 1) {
      numeric *= 100;
    }

    numeric = Math.max(
      0,
      Math.min(100, numeric)
    );

    let label = "Moderate confidence";

    if (numeric >= 80) {
      label = "High confidence";
    } else if (numeric < 50) {
      label = "Low confidence";
    }

    return createSection(
      "11",
      "Prediction Confidence",
      "Estimated reliability of the generated analysis",
      `
        <div class="confidence-wrap">

          <div
            class="confidence-ring"
            style="--score:${numeric}"
          >
            <div>
              <strong>
                ${Math.round(numeric)}%
              </strong>

              <span>
                CONFIDENCE
              </span>
            </div>
          </div>

          <div class="confidence-copy">
            <h4>${escapeHTML(label)}</h4>

            <p>
              Confidence reflects the model's assessment
              of the available chemical information. It is
              not experimental verification.
            </p>

            <div class="confidence-scale"></div>

            <div class="confidence-labels">
              <span>LOW</span>
              <span>MODERATE</span>
              <span>HIGH</span>
            </div>
          </div>

        </div>
      `
    );
  }

  /* =========================================================
     RENDER COMPLETE RESULT
     ========================================================= */

  function renderResult(payload) {
    const data = normalizeResult(payload);

    state.lastResult = data;

    const reactionType =
      getReactionType(data);

    const equation =
      getEquation(data);

    const summary =
      getSummary(data);

    if (el.resultType) {
      el.resultType.textContent =
        reactionType;
    }

    if (el.equation) {
      el.equation.textContent =
        equation ||
        "Reaction equation unavailable";
    }

    if (el.summary) {
      el.summary.textContent =
        summary ||
        "ChemAI generated a reaction analysis from the supplied reactants.";
    }

    const sections = [
      renderReactants(data),
      renderProducts(data),
      renderPathways(data),
      renderMechanism(data),
      renderConditions(data),
      renderThermodynamics(data),
      renderKinetics(data),
      renderObservations(data),
      renderSafety(data),
      renderLimitations(data),
      renderConfidence(data)
    ].filter(Boolean);

    if (el.sections) {
      el.sections.innerHTML =
        sections.length
          ? sections.join("")
          : `
            <article class="result-card">
              <div class="section-heading">
                <span>01</span>
                <div>
                  <h3>Analysis</h3>
                  <p>Generated reaction information</p>
                </div>
              </div>

              ${formatContent(data)}
            </article>
          `;
    }

    hideLoading();
    hideError();

    if (el.results) {
      el.results.hidden = false;

      setTimeout(() => {
        el.results.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    }

    showToast(
      "Reaction analysis completed.",
      "success"
    );
  }

  /* =========================================================
     API
     ========================================================= */

  async function predict() {
    if (state.busy) return;

    if (!el.reactants) {
      showError(
        "Interface error",
        "The reactant input field could not be found."
      );
      return;
    }

    const reactants =
      el.reactants.value.trim();

    const conditions =
      el.conditions?.value.trim() || "";

    if (!reactants) {
      showError(
        "Reactants required",
        "Enter one or more reactants before running the prediction."
      );

      el.reactants.focus();

      return;
    }

    if (reactants.length > 500) {
      showError(
        "Input too long",
        "Reactant input must be 500 characters or fewer."
      );

      return;
    }

    state.busy = true;
    state.lastReactants = reactants;
    state.lastConditions = conditions;

    if (el.predictButton) {
      el.predictButton.disabled = true;

      const original =
        el.predictButton.dataset.originalText ||
        el.predictButton.textContent;

      el.predictButton.dataset.originalText =
        original;

      el.predictButton.textContent =
        "ANALYZING...";
    }

    showLoading();

    try {
      const controller =
        new AbortController();

      const timeout =
        setTimeout(
          () => controller.abort(),
          60000
        );

      let response;

      try {
        response = await fetch(
          PREDICT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              reactants,
              conditions
            }),

            signal: controller.signal
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const message =
          data.error ||
          data.message ||
          `Server returned HTTP ${response.status}.`;

        throw new Error(message);
      }

      renderResult(data);

    } catch (error) {
      console.error(
        "ChemAI prediction error:",
        error
      );

      if (error.name === "AbortError") {
        showError(
          "Request timed out",
          "The prediction took too long to complete. The backend may be waking up or the model may be processing a complex request."
        );
      } else {
        showError(
          "Prediction failed",
          error.message ||
            "Unable to connect to the ChemAI prediction service."
        );
      }

    } finally {
      state.busy = false;

      if (el.predictButton) {
        el.predictButton.disabled = false;

        el.predictButton.textContent =
          el.predictButton.dataset.originalText ||
          "PREDICT REACTION";
      }
    }
  }

  /* =========================================================
     COPY
     ========================================================= */

  async function copyText(value) {
    if (!value) {
      showToast(
        "Nothing to copy.",
        "error"
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value
      );

      showToast(
        "Copied to clipboard.",
        "success"
      );
    } catch {
      const textarea =
        document.createElement("textarea");

      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.select();

      try {
        document.execCommand("copy");

        showToast(
          "Copied to clipboard.",
          "success"
        );
      } catch {
        showToast(
          "Clipboard access failed.",
          "error"
        );
      }

      textarea.remove();
    }
  }

  function buildAnalysisText() {
    if (!state.lastResult) {
      return "";
    }

    const data =
      state.lastResult;

    const lines = [];

    lines.push(
      "ChemAI Reaction Analysis"
    );

    lines.push("");

    lines.push(
      `Reactants: ${state.lastReactants}`
    );

    if (state.lastConditions) {
      lines.push(
        `Conditions: ${state.lastConditions}`
      );
    }

    lines.push(
      `Reaction Type: ${getReactionType(data)}`
    );

    const equation =
      getEquation(data);

    if (equation) {
      lines.push(
        `Equation: ${equation}`
      );
    }

    const summary =
      getSummary(data);

    if (summary) {
      lines.push(
        `Summary: ${summary}`
      );
    }

    lines.push("");
    lines.push(
      "Generated by ChemAI."
    );

    return lines.join("\n");
  }

  function copyAnalysis() {
    copyText(
      buildAnalysisText()
    );
  }

  function copyEquation() {
    copyText(
      getEquation(
        state.lastResult
      )
    );
  }

  /* =========================================================
     SAVED RESULTS
     ========================================================= */

  function getSavedResults() {
    try {
      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!stored) return [];

      const parsed =
        JSON.parse(stored);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  function setSavedResults(results) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(results)
      );
    } catch {
      showToast(
        "Could not save result.",
        "error"
      );
    }
  }

  function saveCurrentResult() {
    if (!state.lastResult) {
      showToast(
        "No analysis to save.",
        "error"
      );

      return;
    }

    const saved =
      getSavedResults();

    const item = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

      createdAt:
        new Date().toISOString(),

      reactants:
        state.lastReactants,

      conditions:
        state.lastConditions,

      result:
        state.lastResult
    };

    saved.unshift(item);

    setSavedResults(
      saved.slice(0, 50)
    );

    updateSavedCount();

    showToast(
      "Analysis saved to your library.",
      "success"
    );
  }

  function deleteSavedResult(id) {
    const results =
      getSavedResults();

    const filtered =
      results.filter(
        item => item.id !== id
      );

    setSavedResults(filtered);

    renderSavedResults();
    updateSavedCount();

    showToast(
      "Saved analysis deleted.",
      "success"
    );
  }

  function loadSavedResult(id) {
    const results =
      getSavedResults();

    const item =
      results.find(
        saved => saved.id === id
      );

    if (!item) return;

    state.lastReactants =
      item.reactants || "";

    state.lastConditions =
      item.conditions || "";

    state.lastResult =
      item.result || null;

    renderResult(
      item.result
    );

    openPage("predict");
  }

  function updateSavedCount() {
    if (!el.savedCount) return;

    const count =
      getSavedResults().length;

    el.savedCount.textContent =
      count;
  }

  function renderSavedResults() {
    if (!el.savedGrid) return;

    const results =
      getSavedResults();

    updateSavedCount();

    if (!results.length) {
      el.savedGrid.innerHTML = `
        <div class="empty-state">
          <div>
            <h3>No saved analyses</h3>

            <p>
              Your saved reaction predictions
              will appear here.
            </p>
          </div>
        </div>
      `;

      return;
    }

    el.savedGrid.innerHTML =
      results.map(item => {
        const data =
          item.result || {};

        const type =
          getReactionType(data);

        const equation =
          getEquation(data);

        return `
          <article class="saved-card">

            <time>
              ${escapeHTML(
                formatDate(
                  item.createdAt
                )
              )}
            </time>

            <h3>
              ${escapeHTML(
                item.reactants
              )}
            </h3>

            <p>
              ${escapeHTML(type)}
            </p>

            ${
              equation
                ? `
                  <div class="chem-formula">
                    ${escapeHTML(
                      equation
                    )}
                  </div>
                `
                : ""
            }

            <div class="saved-actions">

              <button
                class="button button-secondary"
                type="button"
                data-load-saved="${escapeHTML(
                  item.id
                )}"
              >
                OPEN
              </button>

              <button
                class="delete-button"
                type="button"
                aria-label="Delete saved analysis"
                data-delete-saved="${escapeHTML(
                  item.id
                )}"
              >
                ×
              </button>

            </div>

          </article>
        `;
      }).join("");
  }

  /* =========================================================
     LIBRARY
     ========================================================= */

  const LIBRARY = [
    {
      category: "ACID-BASE",
      title: "Neutralization",
      equation: "HA + BOH → BA + H₂O",
      tags: ["Acid", "Base"]
    },

    {
      category: "REDOX",
      title: "Oxidation-Reduction",
      equation: "Ox + Red → Red + Ox",
      tags: ["Electron transfer", "Redox"]
    },

    {
      category: "ORGANIC",
      title: "Substitution",
      equation: "R–X + Nu⁻ → R–Nu + X⁻",
      tags: ["Organic", "SN"]
    },

    {
      category: "ORGANIC",
      title: "Elimination",
      equation: "R–CH₂–CHX–R → Alkene + HX",
      tags: ["Organic", "E2"]
    },

    {
      category: "ORGANIC",
      title: "Addition",
      equation: "C=C + A–B → A–C–C–B",
      tags: ["Organic", "Addition"]
    },

    {
      category: "INORGANIC",
      title: "Precipitation",
      equation: "AB + CD → AD↓ + CB",
      tags: ["Ionic", "Precipitate"]
    }
  ];

  function renderLibrary() {
    if (!el.libraryGrid) return;

    el.libraryGrid.innerHTML =
      LIBRARY.map((item, index) => `
        <article class="library-card">

          <div class="hex-visual">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <span class="category">
            ${escapeHTML(
              item.category
            )}
          </span>

          <h3>
            ${escapeHTML(
              item.title
            )}
          </h3>

          <div class="library-equation">
            ${escapeHTML(
              item.equation
            )}
          </div>

          <div class="library-meta">
            ${item.tags
              .map(
                tag =>
                  `<span>${escapeHTML(
                    tag
                  )}</span>`
              )
              .join("")}
          </div>

          <button
            class="button button-secondary"
            type="button"
            data-library-equation="${escapeHTML(
              item.equation
            )}"
          >
            USE PATTERN
          </button>

        </article>
      `).join("");
  }

  /* =========================================================
     LEARNING
     ========================================================= */

  const LEARNING = [
    {
      title: "Reaction Types",
      category: "FOUNDATIONS",
      description:
        "Understand how synthesis, decomposition, substitution, addition, elimination, acid-base and redox reactions are classified."
    },

    {
      title: "Mechanisms",
      category: "MOLECULAR",
      description:
        "Learn how reactants transform into products through elementary molecular steps."
    },

    {
      title: "Thermodynamics",
      category: "ENERGY",
      description:
        "Explore enthalpy, entropy and Gibbs free energy as tools for understanding reaction feasibility."
    },

    {
      title: "Kinetics",
      category: "RATE",
      description:
        "Understand activation energy, catalysts and the factors controlling reaction rates."
    },

    {
      title: "Reaction Conditions",
      category: "LAB",
      description:
        "See how solvents, catalysts, temperature and concentration influence chemical transformations."
    },

    {
      title: "Model Limitations",
      category: "AI",
      description:
        "Learn why AI predictions should be treated as hypotheses rather than experimental confirmation."
    }
  ];

  function renderLearning() {
    if (!el.learningGrid) return;

    el.learningGrid.innerHTML =
      LEARNING.map(item => `
        <article class="learning-card">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="8"
            ></circle>

            <path
              d="M12 8v4l3 2"
            ></path>
          </svg>

          <span class="category">
            ${escapeHTML(
              item.category
            )}
          </span>

          <h3>
            ${escapeHTML(
              item.title
            )}
          </h3>

          <p>
            ${escapeHTML(
              item.description
            )}
          </p>

        </article>
      `).join("");
  }

  /* =========================================================
     NEW ANALYSIS
     ========================================================= */

  function newAnalysis() {
    if (el.results) {
      el.results.hidden = true;
    }

    hideError();
    hideLoading();

    if (el.reactants) {
      el.reactants.value = "";
    }

    if (el.conditions) {
      el.conditions.value = "";
    }

    state.lastResult = null;
    state.lastReactants = "";
    state.lastConditions = "";

    updateCounters();
    updateInputStatus();

    openPage("predict");

    setTimeout(() => {
      el.reactants?.focus();
    }, 250);
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function setupEvents() {
    /* Navigation */
    el.navItems.forEach(item => {
      item.addEventListener(
        "click",
        () => {
          const page =
            item.dataset.page;

          if (page) {
            openPage(page);
          }
        }
      );
    });

    el.goButtons.forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const page =
            button.dataset.go;

          if (page) {
            openPage(page);
          }
        }
      );
    });

    /* Mobile menu */
    el.mobileMenu?.addEventListener(
      "click",
      toggleMobileMenu
    );

    el.scrim?.addEventListener(
      "click",
      closeMobileMenu
    );

    /* Form */
    el.form?.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        predict();
      }
    );

    el.predictButton?.addEventListener(
      "click",
      event => {
        event.preventDefault();
        predict();
      }
    );

    /* Inputs */
    el.reactants?.addEventListener(
      "input",
      () => {
        updateCounters();
        updateInputStatus();
      }
    );

    el.conditions?.addEventListener(
      "input",
      updateCounters
    );

    el.clearInput?.addEventListener(
      "click",
      clearInput
    );

    /* Result actions */
    el.copyAnalysis?.addEventListener(
      "click",
      copyAnalysis
    );

    el.copyEquation?.addEventListener(
      "click",
      copyEquation
    );

    el.saveResult?.addEventListener(
      "click",
      saveCurrentResult
    );

    el.newAnalysis?.addEventListener(
      "click",
      newAnalysis
    );

    el.retryButton?.addEventListener(
      "click",
      predict
    );

    /* Dynamic content */
    document.addEventListener(
      "click",
      event => {
        const example =
          event.target.closest(
            "[data-example]"
          );

        if (example) {
          useExample(
            example.dataset.example
          );

          return;
        }

        const saved =
          event.target.closest(
            "[data-load-saved]"
          );

        if (saved) {
          loadSavedResult(
            saved.dataset.loadSaved
          );

          return;
        }

        const deleted =
          event.target.closest(
            "[data-delete-saved]"
          );

        if (deleted) {
          deleteSavedResult(
            deleted.dataset.deleteSaved
          );

          return;
        }

        const library =
          event.target.closest(
            "[data-library-equation]"
          );

        if (library) {
          openPage("predict");

          if (el.conditions) {
            el.conditions.value =
              library.dataset.libraryEquation;
          }

          updateCounters();

          return;
        }
      }
    );

    /* Keyboard shortcut */
    document.addEventListener(
      "keydown",
      event => {
        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key === "Enter"
        ) {
          event.preventDefault();

          predict();
        }

        if (
          event.key === "Escape"
        ) {
          closeMobileMenu();
        }
      }
    );
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {
    updateCounters();
    updateInputStatus();
    updateSavedCount();

    renderLibrary();
    renderLearning();
    renderSavedResults();

    setupEvents();

    /*
      Keep the current visual page as the
      default Predict page.
    */
    const activePage =
      $(".app-page.active");

    if (activePage) {
      const id =
        activePage.id.replace(
          "-page",
          ""
        );

      if (el.breadcrumb) {
        el.breadcrumb.textContent =
          activePage.dataset.title ||
          id.charAt(0).toUpperCase() +
            id.slice(1);
      }
    }

    console.log(
      "ChemAI frontend initialized."
    );
  }

  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();