import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: ChemAI,
});

type Page =
  | "overview"
  | "predict"
  | "library"
  | "saved"
  | "learning"
  | "about";

type Prediction = {
  reaction?: string;
  reaction_equation?: string;
  equation?: string;
  reaction_type?: string;
  reactionType?: string;
  summary?: string;
  pathways?: unknown;
  products?: unknown;
  reactants?: unknown;
  mechanism?: unknown;
  conditions?: unknown;
  kinetics?: unknown;
  thermodynamics?: unknown;
  safety?: unknown;
  confidence?: unknown;
  limitations?: unknown;
  [key: string]: unknown;
};

type SavedResult = {
  id: string;
  reactants: string;
  conditions: string;
  prediction: Prediction;
  savedAt: string;
};

type PredefinedReaction = {
  title: string;
  category: string;
  equation: string;
  reactants: string;
  conditions: string;
  tags: string[];
  prediction: Prediction;
};

const API_URL =
  import.meta.env.VITE_API_URL || "https://chem-ai-abne.onrender.com";

const examples = [
  {
    name: "Esterification",
    reactants: "CH₃COOH + C₂H₅OH",
    conditions: "H₂SO₄ catalyst, reflux",
  },
  {
    name: "Neutralization",
    reactants: "HCl + NaOH",
    conditions: "Aqueous, room temperature",
  },
  {
    name: "Substitution",
    reactants: "CH₄ + Cl₂",
    conditions: "UV light",
  },
  {
    name: "Decomposition",
    reactants: "CaCO₃",
    conditions: "Strong heating",
  },
];

const predefinedReactions: PredefinedReaction[] = [
  { title: "Esterification", category: "ORGANIC", equation: "CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O", reactants: "CH₃COOH + C₂H₅OH", conditions: "H₂SO₄ catalyst, reflux", tags: ["Ester", "Condensation"], prediction: { reaction: "Esterification", reaction_equation: "CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O", reaction_type: "Esterification", summary: "Acetic acid reacts with ethanol under acidic reflux conditions to form ethyl acetate and water.", products: ["Ethyl acetate (CH₃COOC₂H₅)", "Water (H₂O)"], mechanism: "Acid-catalyzed Fischer esterification.", conditions: "Concentrated H₂SO₄ catalyst; reflux.", kinetics: "Acid catalysis increases the reaction rate; equilibrium is established.", thermodynamics: "Equilibrium reaction; removal of water favors ester formation.", safety: "Corrosive acid and flammable alcohol. Use appropriate laboratory controls.", confidence: "High", limitations: "Predefined educational result; actual yield depends on experimental conditions." } },
  { title: "Neutralization", category: "ACID / BASE", equation: "HCl + NaOH → NaCl + H₂O", reactants: "HCl + NaOH", conditions: "Aqueous, room temperature", tags: ["Acid", "Base"], prediction: { reaction: "Neutralization", reaction_equation: "HCl + NaOH → NaCl + H₂O", reaction_type: "Acid-base neutralization", summary: "A strong acid reacts with a strong base to produce sodium chloride and water.", products: ["NaCl", "H₂O"], mechanism: "H⁺ + OH⁻ → H₂O.", conditions: "Aqueous solution; room temperature.", kinetics: "Rapid ionic reaction.", thermodynamics: "Exothermic neutralization.", safety: "Both concentrated acids and bases are corrosive.", confidence: "High", limitations: "Concentration and heat release depend on quantities used." } },
  { title: "Methane Chlorination", category: "ORGANIC", equation: "CH₄ + Cl₂ → CH₃Cl + HCl", reactants: "CH₄ + Cl₂", conditions: "UV light", tags: ["Substitution", "Alkane"], prediction: { reaction: "Methane chlorination", reaction_equation: "CH₄ + Cl₂ → CH₃Cl + HCl", reaction_type: "Free-radical substitution", summary: "Methane undergoes chlorination under UV light to form chloromethane and hydrogen chloride.", products: ["Chloromethane (CH₃Cl)", "HCl"], mechanism: "Free-radical chain substitution.", conditions: "UV light.", kinetics: "Radical initiation and propagation control the process.", safety: "Chlorine and chloromethane require appropriate ventilation and controls.", confidence: "High", limitations: "Further chlorination can produce additional chlorinated products." } },
  { title: "Calcium Carbonate Decomposition", category: "INORGANIC", equation: "CaCO₃ → CaO + CO₂", reactants: "CaCO₃", conditions: "Strong heating", tags: ["Decomposition", "Thermal"], prediction: { reaction: "Calcium carbonate decomposition", reaction_equation: "CaCO₃ → CaO + CO₂", reaction_type: "Thermal decomposition", summary: "Heating calcium carbonate produces calcium oxide and carbon dioxide.", products: ["Calcium oxide (CaO)", "Carbon dioxide (CO₂)"], mechanism: "Thermal decomposition of carbonate.", conditions: "Strong heating.", thermodynamics: "Requires heat input.", safety: "Hot solids and released CO₂ require suitable controls.", confidence: "High", limitations: "Temperature and conversion depend on the material and furnace conditions." } },
  { title: "Ethene Hydrogenation", category: "ORGANIC", equation: "C₂H₄ + H₂ → C₂H₆", reactants: "C₂H₄ + H₂", conditions: "Ni catalyst, heat", tags: ["Addition", "Alkene"], prediction: { reaction: "Ethene hydrogenation", reaction_equation: "C₂H₄ + H₂ → C₂H₆", reaction_type: "Catalytic addition", summary: "Hydrogen adds across the C=C bond of ethene to form ethane.", products: ["Ethane (C₂H₆)"], mechanism: "Catalytic hydrogenation on a metal surface.", conditions: "Ni catalyst; elevated temperature as required.", safety: "Hydrogen is highly flammable.", confidence: "High", limitations: "Industrial catalyst and pressure conditions vary." } },
  { title: "Ethene Bromination", category: "ORGANIC", equation: "C₂H₄ + Br₂ → C₂H₄Br₂", reactants: "C₂H₄ + Br₂", conditions: "Room temperature", tags: ["Addition", "Alkene"], prediction: { reaction: "Ethene bromination", reaction_equation: "C₂H₄ + Br₂ → C₂H₄Br₂", reaction_type: "Electrophilic addition", summary: "Bromine adds across the carbon-carbon double bond of ethene.", products: ["1,2-dibromoethane (C₂H₄Br₂)"], mechanism: "Electrophilic addition through a bromonium intermediate.", conditions: "Room temperature.", safety: "Bromine is corrosive and hazardous.", confidence: "High", limitations: "Product distribution can depend on substrate and medium." } },
  { title: "Methane Combustion", category: "COMBUSTION", equation: "CH₄ + 2O₂ → CO₂ + 2H₂O", reactants: "CH₄ + O₂", conditions: "Ignition", tags: ["Combustion", "Redox"], prediction: { reaction: "Methane combustion", reaction_equation: "CH₄ + 2O₂ → CO₂ + 2H₂O", reaction_type: "Combustion", summary: "Complete combustion of methane produces carbon dioxide and water.", products: ["CO₂", "H₂O"], conditions: "Ignition with sufficient oxygen.", thermodynamics: "Strongly exothermic.", safety: "Methane and hydrogen-containing fuels are flammable.", confidence: "High", limitations: "Incomplete combustion can occur when oxygen is limited." } },
  { title: "Ethanol Combustion", category: "COMBUSTION", equation: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O", reactants: "C₂H₅OH + O₂", conditions: "Ignition", tags: ["Combustion", "Alcohol"], prediction: { reaction: "Ethanol combustion", reaction_equation: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O", reaction_type: "Combustion", summary: "Complete combustion of ethanol forms carbon dioxide and water.", products: ["CO₂", "H₂O"], conditions: "Ignition with sufficient oxygen.", thermodynamics: "Strongly exothermic.", safety: "Ethanol is highly flammable.", confidence: "High", limitations: "Incomplete combustion products are possible under oxygen-limited conditions." } },
  { title: "Zinc + Hydrochloric Acid", category: "REDOX", equation: "Zn + 2HCl → ZnCl₂ + H₂", reactants: "Zn + HCl", conditions: "Aqueous, room temperature", tags: ["Metal", "Acid"], prediction: { reaction: "Zinc with hydrochloric acid", reaction_equation: "Zn + 2HCl → ZnCl₂ + H₂", reaction_type: "Single displacement / redox", summary: "Zinc displaces hydrogen from hydrochloric acid to form zinc chloride and hydrogen gas.", products: ["ZnCl₂", "H₂"], mechanism: "Zn is oxidized while H⁺ is reduced.", conditions: "Aqueous hydrochloric acid; room temperature.", safety: "Hydrogen is flammable; acid is corrosive.", confidence: "High", limitations: "Reaction rate depends on zinc surface and acid concentration." } },
  { title: "Iron Displacement", category: "REDOX", equation: "Fe + CuSO₄ → FeSO₄ + Cu", reactants: "Fe + CuSO₄", conditions: "Aqueous solution", tags: ["Displacement", "Redox"], prediction: { reaction: "Iron-copper displacement", reaction_equation: "Fe + CuSO₄ → FeSO₄ + Cu", reaction_type: "Single displacement / redox", summary: "Iron displaces copper from copper sulfate solution.", products: ["FeSO₄", "Cu"], mechanism: "Fe is oxidized and Cu²⁺ is reduced.", conditions: "Aqueous CuSO₄.", confidence: "High", limitations: "Surface condition and solution composition affect rate." } },
  { title: "Silver Nitrate Precipitation", category: "PRECIPITATION", equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃", reactants: "AgNO₃ + NaCl", conditions: "Aqueous solution", tags: ["Precipitation", "Ionic"], prediction: { reaction: "Silver chloride precipitation", reaction_equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃", reaction_type: "Precipitation", summary: "Mixing aqueous silver nitrate and sodium chloride produces insoluble silver chloride.", products: ["AgCl precipitate", "NaNO₃"], mechanism: "Ag⁺ + Cl⁻ → AgCl(s).", conditions: "Aqueous solution.", confidence: "High", limitations: "Solubility depends on solution conditions." } },
  { title: "Barium Sulfate Precipitation", category: "PRECIPITATION", equation: "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl", reactants: "BaCl₂ + Na₂SO₄", conditions: "Aqueous solution", tags: ["Precipitation", "Ionic"], prediction: { reaction: "Barium sulfate precipitation", reaction_equation: "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl", reaction_type: "Precipitation", summary: "Barium ions react with sulfate ions to form insoluble barium sulfate.", products: ["BaSO₄ precipitate", "NaCl"], mechanism: "Ba²⁺ + SO₄²⁻ → BaSO₄(s).", conditions: "Aqueous solution.", confidence: "High", limitations: "Precipitation completeness depends on concentrations." } },
  { title: "CO₂ + Limewater", category: "INORGANIC", equation: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O", reactants: "CO₂ + Ca(OH)₂", conditions: "Aqueous solution", tags: ["Carbonate", "Precipitation"], prediction: { reaction: "Carbon dioxide with limewater", reaction_equation: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O", reaction_type: "Precipitation", summary: "Carbon dioxide reacts with limewater to form a calcium carbonate precipitate.", products: ["CaCO₃ precipitate", "H₂O"], conditions: "Aqueous calcium hydroxide.", confidence: "High", limitations: "Excess CO₂ can subsequently dissolve the precipitate to form soluble bicarbonate." } },
  { title: "Ammonia + Hydrochloric Acid", category: "ACID / BASE", equation: "NH₃ + HCl → NH₄Cl", reactants: "NH₃ + HCl", conditions: "Room temperature", tags: ["Acid", "Base"], prediction: { reaction: "Ammonium chloride formation", reaction_equation: "NH₃ + HCl → NH₄Cl", reaction_type: "Acid-base reaction", summary: "Ammonia accepts a proton from hydrochloric acid to form ammonium chloride.", products: ["NH₄Cl"], mechanism: "NH₃ + H⁺ → NH₄⁺.", conditions: "Room temperature.", confidence: "High", limitations: "Physical appearance depends on how the reactants are supplied." } },
  { title: "Ethene Hydration", category: "ORGANIC", equation: "C₂H₄ + H₂O → C₂H₅OH", reactants: "C₂H₄ + H₂O", conditions: "H₃PO₄ catalyst, heat", tags: ["Addition", "Alcohol"], prediction: { reaction: "Ethene hydration", reaction_equation: "C₂H₄ + H₂O → C₂H₅OH", reaction_type: "Electrophilic addition", summary: "Water adds across ethene to form ethanol under acid-catalyzed conditions.", products: ["Ethanol (C₂H₅OH)"], conditions: "Phosphoric acid catalyst; elevated temperature and pressure in industrial practice.", confidence: "High", limitations: "Industrial conversion is equilibrium-limited." } },
  { title: "Ethanol Oxidation", category: "ORGANIC", equation: "C₂H₅OH + [O] → CH₃CHO + H₂O", reactants: "C₂H₅OH + [O]", conditions: "Acidified dichromate", tags: ["Oxidation", "Alcohol"], prediction: { reaction: "Ethanol oxidation", reaction_equation: "C₂H₅OH + [O] → CH₃CHO + H₂O", reaction_type: "Oxidation", summary: "Ethanol can be oxidized to ethanal under controlled oxidation conditions.", products: ["Ethanal (CH₃CHO)", "H₂O"], conditions: "Acidified dichromate under controlled conditions.", confidence: "High", limitations: "Further oxidation can produce ethanoic acid if conditions allow." } },
  { title: "Ethanoic Acid + Sodium Carbonate", category: "ACID / BASE", equation: "2CH₃COOH + Na₂CO₃ → 2CH₃COONa + H₂O + CO₂", reactants: "CH₃COOH + Na₂CO₃", conditions: "Aqueous", tags: ["Acid", "Carbonate"], prediction: { reaction: "Ethanoic acid with sodium carbonate", reaction_equation: "2CH₃COOH + Na₂CO₃ → 2CH₃COONa + H₂O + CO₂", reaction_type: "Acid-carbonate reaction", summary: "Ethanoic acid reacts with sodium carbonate with release of carbon dioxide.", products: ["Sodium acetate", "Water", "CO₂"], conditions: "Aqueous.", confidence: "High", limitations: "Gas evolution depends on reactant amounts and concentration." } },
  { title: "Sodium Bicarbonate Decomposition", category: "INORGANIC", equation: "2NaHCO₃ → Na₂CO₃ + CO₂ + H₂O", reactants: "NaHCO₃", conditions: "Heating", tags: ["Decomposition", "Thermal"], prediction: { reaction: "Sodium bicarbonate decomposition", reaction_equation: "2NaHCO₃ → Na₂CO₃ + CO₂ + H₂O", reaction_type: "Thermal decomposition", summary: "Heating sodium bicarbonate produces sodium carbonate, carbon dioxide, and water.", products: ["Na₂CO₃", "CO₂", "H₂O"], conditions: "Heating.", confidence: "High", limitations: "Extent of decomposition depends on temperature and time." } },
  { title: "Potassium Chlorate Decomposition", category: "INORGANIC", equation: "2KClO₃ → 2KCl + 3O₂", reactants: "KClO₃", conditions: "Heating, MnO₂ catalyst", tags: ["Decomposition", "Redox"], prediction: { reaction: "Potassium chlorate decomposition", reaction_equation: "2KClO₃ → 2KCl + 3O₂", reaction_type: "Thermal decomposition", summary: "Heating potassium chlorate releases oxygen and forms potassium chloride.", products: ["KCl", "O₂"], conditions: "Heating; MnO₂ catalyst can lower the required temperature.", safety: "Strong oxidizer; keep away from combustible materials.", confidence: "High", limitations: "Actual decomposition conditions depend on setup." } },
  { title: "Hydrogen Peroxide Decomposition", category: "REDOX", equation: "2H₂O₂ → 2H₂O + O₂", reactants: "H₂O₂", conditions: "MnO₂ catalyst", tags: ["Decomposition", "Redox"], prediction: { reaction: "Hydrogen peroxide decomposition", reaction_equation: "2H₂O₂ → 2H₂O + O₂", reaction_type: "Catalytic decomposition", summary: "Hydrogen peroxide decomposes into water and oxygen.", products: ["H₂O", "O₂"], conditions: "MnO₂ catalyst.", confidence: "High", limitations: "Decomposition rate depends strongly on catalyst, concentration, temperature, and impurities." } },
  { title: "Copper Oxide Reduction", category: "REDOX", equation: "CuO + H₂ → Cu + H₂O", reactants: "CuO + H₂", conditions: "Heating", tags: ["Reduction", "Metal oxide"], prediction: { reaction: "Copper oxide reduction", reaction_equation: "CuO + H₂ → Cu + H₂O", reaction_type: "Reduction-redox", summary: "Hydrogen reduces copper(II) oxide to copper while forming water.", products: ["Cu", "H₂O"], conditions: "Heating.", confidence: "High", limitations: "Reaction requires controlled conditions and proper gas handling." } },
  { title: "Sodium + Water", category: "REDOX", equation: "2Na + 2H₂O → 2NaOH + H₂", reactants: "Na + H₂O", conditions: "Room temperature", tags: ["Metal", "Redox"], prediction: { reaction: "Sodium with water", reaction_equation: "2Na + 2H₂O → 2NaOH + H₂", reaction_type: "Single displacement / redox", summary: "Sodium reacts vigorously with water to form sodium hydroxide and hydrogen gas.", products: ["NaOH", "H₂"], conditions: "Water at room temperature.", thermodynamics: "Strongly exothermic.", safety: "Highly reactive metal; hydrogen and heat create fire hazards.", confidence: "High", limitations: "Reaction vigor depends on sodium amount, surface area, and water temperature." } },
  { title: "Magnesium Combustion", category: "COMBUSTION", equation: "2Mg + O₂ → 2MgO", reactants: "Mg + O₂", conditions: "Ignition", tags: ["Combustion", "Redox"], prediction: { reaction: "Magnesium combustion", reaction_equation: "2Mg + O₂ → 2MgO", reaction_type: "Combustion / redox", summary: "Magnesium burns in oxygen to form magnesium oxide.", products: ["MgO"], conditions: "Ignition in oxygen or air.", thermodynamics: "Strongly exothermic.", safety: "Produces intense light and heat.", confidence: "High", limitations: "Product composition can depend on atmosphere." } },
  { title: "Ammonium Chloride + Sodium Hydroxide", category: "ACID / BASE", equation: "NH₄Cl + NaOH → NH₃ + NaCl + H₂O", reactants: "NH₄Cl + NaOH", conditions: "Aqueous, gentle heating", tags: ["Ammonia", "Base"], prediction: { reaction: "Ammonia liberation", reaction_equation: "NH₄Cl + NaOH → NH₃ + NaCl + H₂O", reaction_type: "Acid-base / gas liberation", summary: "Hydroxide converts ammonium ions into ammonia, releasing ammonia gas from the mixture.", products: ["NH₃", "NaCl", "H₂O"], conditions: "Aqueous mixture; gentle heating may be used.", safety: "Ammonia is irritating and should not be inhaled.", confidence: "High", limitations: "Gas release depends on temperature and reactant quantities." } },
  { title: "Permanganate Reduction", category: "REDOX", equation: "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O", reactants: "MnO₄⁻ + H⁺", conditions: "Acidic medium", tags: ["Redox", "Half-reaction"], prediction: { reaction: "Permanganate reduction", reaction_equation: "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O", reaction_type: "Redox half-reaction", summary: "Permanganate is reduced to Mn²⁺ in acidic medium while consuming protons and electrons.", products: ["Mn²⁺", "H₂O"], conditions: "Acidic medium.", mechanism: "Five-electron reduction half-reaction.", confidence: "High", limitations: "A complete reaction requires a corresponding oxidation half-reaction." } },
];

function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}

function ChemAI() {
  const [page, setPage] = useState<Page>("overview");
  const [reactants, setReactants] = useState("");
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saved, setSaved] = useState<SavedResult[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("chemai_saved_results");

    if (stored) {
      try {
        setSaved(JSON.parse(stored));
      } catch {
        setSaved([]);
      }
    }
  }, []);

  useEffect(() => {
    document.title = "ChemAI | AI Reaction Intelligence";
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast("");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fillExample = (
    value: string,
    exampleConditions = "",
  ) => {
    setReactants(value);
    setConditions(exampleConditions);
    setPrediction(null);
    setError("");
    navigate("predict");
  };

  const clearInput = () => {
    setReactants("");
    setConditions("");
    setPrediction(null);
    setError("");
  };

  const handlePredefinedReaction = (reaction: PredefinedReaction) => {
    // IMPORTANT: predefined library reactions NEVER call the AI backend.
    // The complete educational result is already stored locally above.
    setReactants(reaction.reactants);
    setConditions(reaction.conditions);
    setPrediction(reaction.prediction);
    setError("");
    setToast("Predefined reaction loaded. AI model not used.");
    navigate("predict");
  };

  const handlePredict = async (
    event?: FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault();

    if (!reactants.trim()) {
      setError("Please enter at least one reactant.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reactants: reactants.trim(),
          conditions: conditions.trim(),
        }),
      });

      const responseText = await response.text();

      console.log("STATUS:", response.status);
      console.log("RESPONSE:", responseText);

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Backend returned HTML/non-JSON (${response.status}): ${responseText.slice(
            0,
            300,
          )}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Prediction service unavailable.",
        );
      }

      // The backend may return Gemini's JSON as a string. Gemini also
      // sometimes wraps JSON in Markdown fences, so unwrap both cases.
      const parseAIJson = (value: unknown): any => {
        if (typeof value !== "string") return value;

        let cleaned = value.trim();

        cleaned = cleaned
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        try {
          return JSON.parse(cleaned);
        } catch {
          const firstBrace = cleaned.indexOf("{");
          const lastBrace = cleaned.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace > firstBrace) {
            const possibleJson = cleaned.slice(
              firstBrace,
              lastBrace + 1,
            );

            try {
              return JSON.parse(possibleJson);
            } catch {
              return value;
            }
          }

          return value;
        }
      };

      let result: any =
        data?.result ??
        data?.prediction ??
        data?.data ??
        data;

      result = parseAIJson(result);

      // Some backend versions return an object whose `summary` contains
      // the actual Gemini JSON. Parse that too instead of rendering the
      // entire JSON blob as plain text in the equation card.
      if (
        result &&
        typeof result === "object" &&
        typeof result.summary === "string"
      ) {
        const parsedSummary = parseAIJson(result.summary);

        if (
          parsedSummary &&
          typeof parsedSummary === "object" &&
          !Array.isArray(parsedSummary)
        ) {
          result = {
            ...parsedSummary,
            ...result,
          };

          // Prefer the useful human-readable explanation if Gemini gave us
          // one under another common field name.
          result.summary =
            parsedSummary.summary ??
            parsedSummary.explanation ??
            parsedSummary.process ??
            result.summary;
        }
      }

      if (!result || typeof result !== "object" || Array.isArray(result)) {
        throw new Error(
          "The prediction service returned an invalid response.",
        );
      }

      // Normalize common Gemini field names to the names already used by
      // the existing ChemAI result UI.
      const normalizedPrediction: Prediction = {
        ...result,

        reaction:
          result.reaction ??
          result.reaction_equation ??
          result.equation,

        reaction_equation:
          result.reaction_equation ??
          result.equation ??
          result.reaction,

        equation:
          result.equation ??
          result.reaction_equation ??
          result.reaction,

        reaction_type:
          result.reaction_type ??
          result.reactionType ??
          result.type,

        reactionType:
          result.reactionType ??
          result.reaction_type ??
          result.type,

        summary:
          result.summary &&
          typeof result.summary === "string" &&
          !result.summary.trim().startsWith("{")
            ? result.summary
            : result.process ??
              result.explanation ??
              "AI-generated reaction analysis.",

        products:
          result.products ??
          result.product ??
          [],

        conditions:
          result.conditions ??
          (conditions.trim() || "Not provided"),

        confidence:
          result.confidence ??
          "Medium",

        limitations:
          result.limitations ??
          "AI predictions may contain uncertainty.",
      };

      setPrediction(normalizedPrediction);
      setToast("Reaction analysis complete.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not complete the reaction analysis.",
      );
    } finally {
      setLoading(false);
    }
  };

  const saveResult = () => {
    if (!prediction) return;

    const item: SavedResult = {
      id: crypto.randomUUID(),
      reactants,
      conditions,
      prediction,
      savedAt: new Date().toISOString(),
    };

    const updated = [item, ...saved];

    setSaved(updated);
    localStorage.setItem(
      "chemai_saved_results",
      JSON.stringify(updated),
    );

    setToast("Prediction saved locally.");
  };

  const deleteSaved = (id: string) => {
    const updated = saved.filter((item) => item.id !== id);

    setSaved(updated);

    localStorage.setItem(
      "chemai_saved_results",
      JSON.stringify(updated),
    );

    setToast("Saved result deleted.");
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied to clipboard.");
    } catch {
      setToast("Clipboard access unavailable.");
    }
  };

  const copyAnalysis = () => {
    if (!prediction) return;

    copyText(JSON.stringify(prediction, null, 2));
  };

  const copyEquation = () => {
    if (!prediction) return;

    copyText(
      String(
        prediction.reaction_equation ||
          prediction.equation ||
          "No equation available",
      ),
    );
  };

  return (
    <>
      <SvgSprite />

      <div className="science-background" aria-hidden="true">
        <span className="formula f1">H₂O</span>
        <span className="formula f2">ΔG</span>
        <span className="formula f3">C₆H₆</span>
        <span className="formula f4">e⁻</span>
        <span className="formula f5">NH₃</span>
        <span className="formula f6">E°</span>
        <span className="formula f7">H⁺</span>
        <span className="formula f8">CH₄</span>
      </div>

      <button
        className="mobile-menu"
        aria-label="Open navigation"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((value) => !value)}
      >
        <Icon name={sidebarOpen ? "x" : "menu"} />
      </button>

      <div
        className={`sidebar-scrim ${
          sidebarOpen ? "open" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <Icon name="atom" />
          </div>

          <div>
            <strong>
              Chem<span>AI</span>
            </strong>
            <small>REACTION INTELLIGENCE</small>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          <p className="nav-label">WORKSPACE</p>

          <NavButton
            active={page === "overview"}
            icon="grid"
            label="Overview"
            onClick={() => navigate("overview")}
          />

          <NavButton
            active={page === "predict"}
            icon="flask"
            label="Predict Reaction"
            onClick={() => navigate("predict")}
          />

          <NavButton
            active={page === "library"}
            icon="library"
            label="Reaction Library"
            onClick={() => navigate("library")}
          />

          <NavButton
            active={page === "saved"}
            icon="bookmark"
            label="Saved Results"
            count={saved.length}
            onClick={() => navigate("saved")}
          />

          <p className="nav-label nav-label-spaced">
            EXPLORE
          </p>

          <NavButton
            active={page === "learning"}
            icon="learn"
            label="Learning Hub"
            onClick={() => navigate("learning")}
          />

          <NavButton
            active={page === "about"}
            icon="info"
            label="About ChemAI"
            onClick={() => navigate("about")}
          />
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot" />

            <div>
              <strong>AI SYSTEM</strong>
              <small>Production API connected</small>
            </div>
          </div>

          <p>
            CHEMAI v2.1{" "}
            <span>EDUCATIONAL AI</span>
          </p>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>CHEMISTRY LAB</span>
            <Icon name="chevron" />
            <strong>
              {pageTitle(page)}
            </strong>
          </div>

          <div className="top-status">
            <span className="status-dot" />
            <span>MODEL READY</span>
            <span className="lab-avatar">CS</span>
          </div>
        </header>

        {page === "overview" && (
          <OverviewPage
            onPredict={() => navigate("predict")}
            onLibrary={() => navigate("library")}
          />
        )}

        {page === "predict" && (
          <PredictPage
            reactants={reactants}
            conditions={conditions}
            setReactants={setReactants}
            setConditions={setConditions}
            loading={loading}
            error={error}
            prediction={prediction}
            onPredict={handlePredict}
            onClear={clearInput}
            onExample={fillExample}
            onRetry={() => handlePredict()}
            onSave={saveResult}
            onCopyAnalysis={copyAnalysis}
            onCopyEquation={copyEquation}
            onNewAnalysis={clearInput}
          />
        )}

        {page === "library" && (
          <LibraryPage onPredefined={handlePredefinedReaction} />
        )}

        {page === "saved" && (
          <SavedPage
            saved={saved}
            onDelete={deleteSaved}
            onOpen={(item) => {
              setReactants(item.reactants);
              setConditions(item.conditions);
              setPrediction(item.prediction);
              navigate("predict");
            }}
            onCopy={(item) =>
              copyText(
                JSON.stringify(
                  item.prediction,
                  null,
                  2,
                ),
              )
            }
          />
        )}

        {page === "learning" && <LearningPage />}

        {page === "about" && <AboutPage />}

        <footer>
          <div>
            <strong>ChemAI</strong>
            <span>AI REACTION INTELLIGENCE</span>
          </div>

          <span>EDUCATIONAL PROJECT · 2026</span>
        </footer>
      </main>

      <div
        className="toast-region"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <div className="toast">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}

function NavButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <Icon name={icon} />
      <span>{label}</span>

      {typeof count === "number" && count > 0 && (
        <b>{count}</b>
      )}
    </button>
  );
}

function OverviewPage({
  onPredict,
  onLibrary,
}: {
  onPredict: () => void;
  onLibrary: () => void;
}) {
  return (
    <section
      className="app-page active"
      data-title="OVERVIEW"
    >
      <div className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            AI-POWERED CHEMISTRY PLATFORM
          </p>

          <h1>
            AI-Powered
            <br />
            <span>Reaction Intelligence</span>
          </h1>

          <p className="hero-lede">
            Explore plausible products, pathways,
            mechanisms, reaction conditions, and
            safety considerations from a single
            chemical query.
          </p>

          <div className="hero-actions">
            <button
              className="button button-primary"
              onClick={onPredict}
            >
              Predict Reaction
              <Icon name="arrow" />
            </button>

            <button
              className="button button-secondary"
              onClick={onLibrary}
            >
              Explore Library
            </button>
          </div>

          <div className="hero-metrics">
            <div>
              <strong>Multi-path</strong>
              <span>Reaction reasoning</span>
            </div>

            <div>
              <strong>Context-aware</strong>
              <span>Conditions analysis</span>
            </div>

            <div>
              <strong>Safety-first</strong>
              <span>Responsible guidance</span>
            </div>
          </div>
        </div>

        <MoleculeStage />
      </div>

      <div className="overview-strip">
        <article>
          <span>01</span>
          <Icon name="flask" />

          <div>
            <strong>Define reactants</strong>
            <p>
              Enter names, formulas, or mixtures.
            </p>
          </div>
        </article>

        <article>
          <span>02</span>
          <Icon name="atom" />

          <div>
            <strong>Analyze pathways</strong>
            <p>
              Review plausible reaction routes.
            </p>
          </div>
        </article>

        <article>
          <span>03</span>
          <Icon name="shield" />

          <div>
            <strong>Verify responsibly</strong>
            <p>
              Use reliable sources and safe practice.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function MoleculeStage() {
  return (
    <div
      className="molecule-stage"
      aria-label="Animated molecular visualization"
    >
      <div className="stage-grid" />

      <svg
        className="molecular-network"
        viewBox="0 0 600 520"
        role="img"
        aria-label="Stylized molecular network"
      >
        <g className="bonds">
          <path d="M92 280 L185 220 L280 280 L370 220 L470 275" />
          <path d="M280 280 L280 150" />
          <path d="M294 280 L294 154" />
          <path d="M185 220 L130 120" />
          <path d="M470 275 L530 190" />
        </g>

        <g className="atom-node carbon">
          <circle cx="92" cy="280" r="25" />
          <text x="92" y="286">C</text>
        </g>

        <g className="atom-node carbon">
          <circle cx="185" cy="220" r="30" />
          <text x="185" y="227">C</text>
        </g>

        <g className="atom-node carbon main">
          <circle cx="280" cy="280" r="34" />
          <text x="280" y="288">C</text>
        </g>

        <g className="atom-node oxygen">
          <circle cx="287" cy="150" r="31" />
          <text x="287" y="158">O</text>
        </g>

        <g className="atom-node oxygen">
          <circle cx="370" cy="220" r="31" />
          <text x="370" y="228">O</text>
        </g>

        <g className="atom-node carbon">
          <circle cx="470" cy="275" r="29" />
          <text x="470" y="282">C</text>
        </g>

        <g className="atom-node hydrogen">
          <circle cx="130" cy="120" r="19" />
          <text x="130" y="126">H₃</text>
        </g>

        <g className="atom-node hydrogen">
          <circle cx="530" cy="190" r="19" />
          <text x="530" y="196">H₃</text>
        </g>

        <circle
          className="traveler t1"
          cx="0"
          cy="0"
          r="5"
        >
          <animateMotion
            dur="5s"
            repeatCount="indefinite"
            path="M92 280 L185 220 L280 280 L370 220 L470 275"
          />
        </circle>

        <circle
          className="traveler t2"
          cx="0"
          cy="0"
          r="4"
        >
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path="M280 280 L287 150"
          />
        </circle>
      </svg>

      <div className="orbit orbit-a">
        <i />
      </div>

      <div className="orbit orbit-b">
        <i />
      </div>

      <div className="stage-label label-one">
        <small>MOLECULAR FAMILY</small>
        <strong>ESTER</strong>
      </div>

      <div className="stage-label label-two">
        <small>STRUCTURE</small>
        <strong>CH₃COOCH₂CH₃</strong>
      </div>

      <p className="stage-caption">
        <span />
        STRUCTURAL ANALYSIS ONLINE
      </p>
    </div>
  );
}

function PredictPage({
  reactants,
  conditions,
  setReactants,
  setConditions,
  loading,
  error,
  prediction,
  onPredict,
  onClear,
  onExample,
  onRetry,
  onSave,
  onCopyAnalysis,
  onCopyEquation,
  onNewAnalysis,
}: {
  reactants: string;
  conditions: string;
  setReactants: (value: string) => void;
  setConditions: (value: string) => void;
  loading: boolean;
  error: string;
  prediction: Prediction | null;
  onPredict: (
    event?: FormEvent<HTMLFormElement>,
  ) => void;
  onClear: () => void;
  onExample: (
    reactants: string,
    conditions?: string,
  ) => void;
  onRetry: () => void;
  onSave: () => void;
  onCopyAnalysis: () => void;
  onCopyEquation: () => void;
  onNewAnalysis: () => void;
}) {
  return (
    <section
      className="app-page active"
      data-title="PREDICT REACTION"
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            REACTION WORKSPACE
          </p>

          <h2>Predict a reaction</h2>

          <p>
            Describe the starting materials and
            optional experimental context.
          </p>
        </div>

        <div className="heading-mark">
          <Icon name="flask" />
        </div>
      </div>

      <div className="reaction-engine" aria-hidden="true">
        <div className="engine-node">
          <span>01</span>
          <strong>REACTANTS</strong>
          <small>Starting materials</small>
        </div>

        <div className="engine-flow">
          <i />
          <b>+</b>
        </div>

        <div className="engine-core">
          <div className="core-orbit" />
          <Icon name="atom" />
          <strong>CHEMAI ENGINE</strong>
          <small>Pathway reasoning</small>
        </div>

        <div className="engine-flow">
          <i />
          <b>→</b>
        </div>

        <div className="engine-node">
          <span>03</span>
          <strong>PRODUCTS</strong>
          <small>Predicted outcomes</small>
        </div>
      </div>

      <form
        className="prediction-panel"
        onSubmit={onPredict}
      >
        <div className="panel-heading">
          <div>
            <span className="section-index">01</span>

            <div>
              <h3>Reaction input</h3>
              <p>
                Use chemical names, formulas, or both.
              </p>
            </div>
          </div>

          <span
            className="ready-badge"
            id="input-status"
          >
            {reactants.trim() ? "READY" : "WAITING"}
          </span>
        </div>

        <div className="field-shell">
          <div className="field-label">
            <label htmlFor="reactants-input">
              REACTANTS
            </label>

            <span>
              {reactants.length} / 500
            </span>
          </div>

          <textarea
            id="reactants-input"
            maxLength={500}
            required
            rows={5}
            value={reactants}
            onChange={(event) =>
              setReactants(event.target.value)
            }
            placeholder="e.g. CH₃COOH + C₂H₅OH"
            spellCheck={false}
          />

          <div className="field-footer">
            <span>
              Separate multiple reactants with a plus
              sign.
            </span>

            <button
              type="button"
              className="text-button"
              onClick={onClear}
            >
              <Icon name="x" />
              Clear
            </button>
          </div>
        </div>

        <div className="field-shell condition-shell">
          <div className="field-label">
            <label htmlFor="conditions-input">
              REACTION CONDITIONS <em>OPTIONAL</em>
            </label>

            <span>
              {conditions.length} / 300
            </span>
          </div>

          <input
            id="conditions-input"
            maxLength={300}
            value={conditions}
            onChange={(event) =>
              setConditions(event.target.value)
            }
            placeholder="e.g. H₂SO₄ catalyst, reflux, 78 °C"
          />
        </div>

        <div className="examples">
          <span>QUICK EXAMPLES</span>

          {examples.map((example) => (
            <button
              key={example.name}
              type="button"
              onClick={() =>
                onExample(
                  example.reactants,
                  example.conditions,
                )
              }
            >
              {example.name}
            </button>
          ))}
        </div>

        <button
          className="button button-primary predict-button"
          type="submit"
          disabled={loading}
        >
          <Icon name="atom" />

          <span>
            {loading
              ? "ANALYZING..."
              : "ANALYZE REACTION"}
          </span>

          <Icon name="arrow" />
        </button>
      </form>

      {loading && <LoadingPanel />}

      {error && !loading && (
        <section
          className="error-panel"
          role="alert"
        >
          <div className="error-icon">!</div>

          <div>
            <p className="eyebrow">
              ANALYSIS INTERRUPTED
            </p>

            <h3>Prediction unavailable</h3>

            <p>{error}</p>

            <button
              className="button button-secondary"
              type="button"
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {prediction && !loading && !error && (
        <ResultsArea
          prediction={prediction}
          onCopyAnalysis={onCopyAnalysis}
          onCopyEquation={onCopyEquation}
          onSave={onSave}
          onNewAnalysis={onNewAnalysis}
        />
      )}
    </section>
  );
}

function LoadingPanel() {
  return (
    <section
      className="loading-panel"
      aria-live="polite"
    >
      <div className="loading-visual">
        <div className="loading-orbit lo-one" />
        <div className="loading-orbit lo-two" />
        <Icon name="atom" />

        <span className="particle p-one" />
        <span className="particle p-two" />
        <span className="particle p-three" />
      </div>

      <p className="eyebrow">
        CHEMAI REACTION ENGINE
      </p>

      <h3>Analyzing molecular structure...</h3>

      <p>
        The hosted model may need a moment to wake up.
      </p>

      <div className="progress-track">
        <span />
      </div>
    </section>
  );
}

function ResultsArea({
  prediction,
  onCopyAnalysis,
  onCopyEquation,
  onSave,
  onNewAnalysis,
}: {
  prediction: Prediction;
  onCopyAnalysis: () => void;
  onCopyEquation: () => void;
  onSave: () => void;
  onNewAnalysis: () => void;
}) {
  const equation =
    String(
      prediction.reaction_equation ||
        prediction.reaction ||
        prediction.equation ||
        "—",
    );

  const type =
    String(
      prediction.reaction_type ||
        prediction.reactionType ||
        "REACTION",
    );

  return (
    <section
      className="results-area"
      aria-live="polite"
    >
      <div className="results-header">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            ANALYSIS COMPLETE
          </p>

          <h2>Reaction intelligence</h2>
        </div>

        <div className="result-actions">
          <button
            className="icon-action"
            onClick={onCopyAnalysis}
          >
            <Icon name="copy" />
            <span>Copy analysis</span>
          </button>

          <button
            className="icon-action"
            onClick={onSave}
          >
            <Icon name="save" />
            <span>Save result</span>
          </button>

          <button
            className="button button-primary small"
            onClick={onNewAnalysis}
          >
            <span>New analysis</span>
          </button>
        </div>
      </div>

      <div className="equation-card">
        <div className="equation-top">
          <span>{type}</span>

          <button
            className="text-button"
            onClick={onCopyEquation}
          >
            <Icon name="copy" />
            Copy equation
          </button>
        </div>

        <div className="equation">
          {equation}
        </div>

        {prediction.summary && (
          <p className="equation-summary">
            {String(prediction.summary)}
          </p>
        )}
      </div>

      <ReactionVisual prediction={prediction} />

      <div className="result-sections">
        {Object.entries(prediction)
          .filter(
            ([key]) =>
              ![
                "reaction_equation",
                "reaction",
                "equation",
                "reaction_type",
                "reactionType",
                "summary",
              ].includes(key),
          )
          .map(([key, value]) => (
            <ResultSection
              key={key}
              title={formatTitle(key)}
              value={value}
            />
          ))}
      </div>

      <div className="safety-notice permanent">
        <Icon name="shield" />

        <div>
          <strong>
            Laboratory safety notice
          </strong>

          <p>
            AI predictions can be incorrect. Verify
            chemistry information using reliable
            references, qualified supervision, and
            proper laboratory procedures before
            practical use.
          </p>
        </div>
      </div>
    </section>
  );
}

function ReactionVisual({
  prediction,
}: {
  prediction: Prediction;
}) {
  const products = Array.isArray(prediction.products)
    ? prediction.products.map(String)
    : prediction.products
      ? [String(prediction.products)]
      : ["Predicted products"];

  const confidence = String(prediction.confidence || "Medium");
  const confidenceValue =
    confidence.toLowerCase().includes("high") ? 92 :
    confidence.toLowerCase().includes("low") ? 42 : 68;

  return (
    <section className="reaction-visual-card" aria-label="Reaction pathway visualization">
      <div className="reaction-visual-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> PATHWAY VISUALIZATION</p>
          <h3>Reaction pathway</h3>
        </div>
        <span className="visual-status">AI MAPPED</span>
      </div>

      <div className="reaction-map">
        <div className="reaction-map-node reactant-node">
          <span className="map-number">01</span>
          <div className="molecule-icon">R</div>
          <strong>REACTANTS</strong>
          <small>Starting materials</small>
        </div>

        <div className="reaction-map-line">
          <i />
          <b>+</b>
        </div>

        <div className="reaction-map-node engine-node-visual">
          <span className="map-pulse" />
          <div className="molecule-icon">✦</div>
          <strong>CHEMAI</strong>
          <small>Pathway reasoning</small>
        </div>

        <div className="reaction-map-line">
          <i />
          <b>→</b>
        </div>

        <div className="reaction-map-node product-node">
          <span className="map-number">03</span>
          <div className="product-stack">
            {products.slice(0, 3).map((product, index) => (
              <span key={`${product}-${index}`}>{product}</span>
            ))}
          </div>
          <strong>PRODUCTS</strong>
          <small>Predicted outcomes</small>
        </div>
      </div>

      <div className="confidence-visual">
        <div className="confidence-copy">
          <span>MODEL CONFIDENCE</span>
          <strong>{confidence}</strong>
        </div>
        <div className="confidence-track" aria-label={`Confidence ${confidenceValue}%`}>
          <span style={{ width: `${confidenceValue}%` }} />
        </div>
        <span className="confidence-value">{confidenceValue}%</span>
      </div>
    </section>
  );
}

function ResultSection({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  return (
    <article className="result-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CHEMAI ANALYSIS</p>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="result-content">
        <FormattedValue value={value} />
      </div>
    </article>
  );
}

function FormattedValue({
  value,
}: {
  value: unknown;
}) {
  if (value === null || value === undefined) {
    return <p>Not available.</p>;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return <p>{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="content-list">
        {value.map((item, index) => (
          <div key={index}>
            <FormattedValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    return (
      <div className="data-grid">
        {Object.entries(
          value as Record<string, unknown>,
        ).map(([key, item]) => (
          <div key={key}>
            <strong>{formatTitle(key)}</strong>
            <FormattedValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  return <p>{String(value)}</p>;
}

function LibraryPage({
  onPredefined,
}: {
  onPredefined: (reaction: PredefinedReaction) => void;
}) {
  return (
    <section
      className="app-page active"
      data-title="REACTION LIBRARY"
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            REFERENCE COLLECTION
          </p>

          <h2>Reaction library</h2>

          <p>
            25 predefined reactions with locally stored
            educational results. No AI request is made.
          </p>
        </div>

        <div className="heading-mark">
          <Icon name="library" />
        </div>
      </div>

      <div className="library-grid">
        {predefinedReactions.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className="library-card"
            onClick={() => onPredefined(item)}
          >
            <div className="card-top">
              <span>{item.category}</span>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>

            <h3>{item.title}</h3>

            <div className="chem-formula">
              {item.equation}
            </div>

            <p>{item.conditions}</p>

            <div
              className="library-tags"
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                marginTop: "12px",
              }}
            >
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "10px",
                    padding: "4px 7px",
                    border: "1px solid currentColor",
                    borderRadius: "999px",
                    opacity: 0.65,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <span
              style={{
                display: "block",
                marginTop: "14px",
                fontSize: "11px",
                letterSpacing: "0.08em",
                opacity: 0.7,
              }}
            >
              PREDEFINED · NO AI CALL
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SavedPage({
  saved,
  onDelete,
  onOpen,
  onCopy,
}: {
  saved: SavedResult[];
  onDelete: (id: string) => void;
  onOpen: (item: SavedResult) => void;
  onCopy: (item: SavedResult) => void;
}) {
  return (
    <section
      className="app-page active"
      data-title="SAVED RESULTS"
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            LOCAL NOTEBOOK
          </p>

          <h2>Saved results</h2>

          <p>
            Your predictions stay in this browser and
            can be reopened or deleted.
          </p>
        </div>

        <div className="heading-mark">
          <Icon name="bookmark" />
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="empty-state">
          <Icon name="bookmark" />
          <h3>No saved results</h3>
          <p>
            Predictions you save will appear here.
          </p>
        </div>
      ) : (
        <div className="saved-grid">
          {saved.map((item) => {
            const equation = String(
              item.prediction.reaction_equation ||
                item.prediction.equation ||
                "No equation",
            );

            return (
              <article
                className="saved-card"
                key={item.id}
              >
                <div className="card-top">
                  <span>
                    {String(
                      item.prediction
                        .reaction_type ||
                        "REACTION",
                    )}
                  </span>

                  <span>
                    {new Date(
                      item.savedAt,
                    ).toLocaleDateString()}
                  </span>
                </div>

                <h3>{equation}</h3>

                <p>{item.reactants}</p>

                {item.conditions && (
                  <small>{item.conditions}</small>
                )}

                <div className="saved-actions">
                  <button
                    onClick={() => onOpen(item)}
                  >
                    Open
                  </button>

                  <button
                    onClick={() => onCopy(item)}
                  >
                    Copy
                  </button>

                  <button
                    onClick={() =>
                      onDelete(item.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LearningPage() {
  const topics = [
    {
      number: "01",
      title: "Reaction Types",
      text:
        "Understand addition, substitution, elimination, redox, acid-base, and decomposition reactions.",
    },
    {
      number: "02",
      title: "Reaction Mechanisms",
      text:
        "Explore how molecular changes can occur through sequences of elementary chemical steps.",
    },
    {
      number: "03",
      title: "Reaction Conditions",
      text:
        "Learn how catalysts, solvents, temperature, pressure, and reagents influence chemical transformations.",
    },
    {
      number: "04",
      title: "Thermodynamics & Kinetics",
      text:
        "Distinguish whether a reaction is energetically favorable from how quickly it may proceed.",
    },
  ];

  return (
    <section
      className="app-page active"
      data-title="LEARNING HUB"
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            CHEMISTRY FOUNDATIONS
          </p>

          <h2>Learning hub</h2>

          <p>
            A visual map of the concepts used to
            reason about chemical change.
          </p>
        </div>

        <div className="heading-mark">
          <Icon name="learn" />
        </div>
      </div>

      <div className="learning-grid">
        {topics.map((topic) => (
          <article
            className="learning-card"
            key={topic.number}
          >
            <span>{topic.number}</span>

            <h3>{topic.title}</h3>

            <p>{topic.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section
      className="app-page active"
      data-title="ABOUT CHEMAI"
    >
      <div className="about-hero">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            ABOUT THE PLATFORM
          </p>

          <h2>
            Where chemical reasoning meets
            responsible AI.
          </h2>

          <p>
            ChemAI helps learners explore plausible
            reaction outcomes and organize complex
            model output into understandable scientific
            context.
          </p>
        </div>

        <div className="about-atom">
          <div />
          <div />
          <div />
          <span>AI</span>
        </div>
      </div>

      <div className="about-grid">
        <article>
          <span>01</span>
          <h3>Mission</h3>
          <p>
            Make reaction reasoning easier to explore
            without presenting model output as
            experimental fact.
          </p>
        </article>

        <article>
          <span>02</span>
          <h3>How prediction works</h3>
          <p>
            Reactants and optional conditions are sent
            to the ChemAI service, which returns
            structured pathways, mechanisms, data, and
            cautions.
          </p>
        </article>

        <article>
          <span>03</span>
          <h3>Technology</h3>
          <p>
            A lightweight browser interface
            communicates with the ChemAI backend.
            Credentials remain on the backend.
          </p>
        </article>

        <article>
          <span>04</span>
          <h3>Responsible AI</h3>
          <p>
            Confidence is an estimate. Predictions
            require independent verification and must
            never replace laboratory safety protocols.
          </p>
        </article>
      </div>

      <div className="safety-notice">
        <Icon name="shield" />

        <div>
          <strong>Educational use</strong>

          <p>
            ChemAI is an educational decision-support
            tool, not a substitute for a trained chemist
            or validated experimental procedure.
          </p>
        </div>
      </div>
    </section>
  );
}

function pageTitle(page: Page) {
  const titles: Record<Page, string> = {
    overview: "OVERVIEW",
    predict: "PREDICT REACTION",
    library: "REACTION LIBRARY",
    saved: "SAVED RESULTS",
    learning: "LEARNING HUB",
    about: "ABOUT CHEMAI",
  };

  return titles[page];
}

function formatTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function SvgSprite() {
  return (
    <svg
      className="svg-sprite"
      aria-hidden="true"
    >
      <symbol id="i-atom" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="2" />
        <path
          d="M19.5 12c0 4.14-3.36 7.5-7.5 7.5S4.5 16.14 4.5 12 7.86 4.5 12 4.5s7.5 3.36 7.5 7.5Z"
          transform="rotate(60 12 12)"
        />
        <path
          d="M19.5 12c0 4.14-3.36 7.5-7.5 7.5S4.5 16.14 4.5 12 7.86 4.5 12 4.5s7.5 3.36 7.5 7.5Z"
          transform="rotate(-60 12 12)"
        />
      </symbol>

      <symbol id="i-grid" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </symbol>

      <symbol id="i-flask" viewBox="0 0 24 24">
        <path d="M9 3h6M10 3v6l-5.5 9.2A1.8 1.8 0 0 0 6 21h12a1.8 1.8 0 0 0 1.5-2.8L14 9V3" />
        <path d="M7.5 15h9" />
      </symbol>

      <symbol id="i-library" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
        <path d="M8 7h8M8 11h6" />
      </symbol>

      <symbol id="i-bookmark" viewBox="0 0 24 24">
        <path d="M6 3h12v18l-6-4-6 4V3Z" />
      </symbol>

      <symbol id="i-learn" viewBox="0 0 24 24">
        <path d="m2 10 10-5 10 5-10 5L2 10Z" />
        <path d="M6 12.5V17c3 2.5 9 2.5 12 0v-4.5" />
      </symbol>

      <symbol id="i-info" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7.5h.01" />
      </symbol>

      <symbol id="i-menu" viewBox="0 0 24 24">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </symbol>

      <symbol id="i-x" viewBox="0 0 24 24">
        <path d="m6 6 12 12M18 6 6 18" />
      </symbol>

      <symbol id="i-arrow" viewBox="0 0 24 24">
        <path d="M5 12h14M14 7l5 5-5 5" />
      </symbol>

      <symbol id="i-copy" viewBox="0 0 24 24">
        <rect
          x="8"
          y="8"
          width="11"
          height="11"
          rx="2"
        />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </symbol>

      <symbol id="i-save" viewBox="0 0 24 24">
        <path d="M5 3h12l2 2v16H5V3Z" />
        <path d="M8 3v6h8V3M8 21v-7h8v7" />
      </symbol>

      <symbol id="i-shield" viewBox="0 0 24 24">
        <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" />
        <path d="M12 8v5M12 16h.01" />
      </symbol>

      <symbol id="i-chevron" viewBox="0 0 24 24">
        <path d="m9 18 6-6-6-6" />
      </symbol>
    </svg>
  );
}

export default ChemAI;