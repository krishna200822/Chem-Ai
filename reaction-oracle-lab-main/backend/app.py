"""
ChemAI backend starter.

PUT YOUR GEMINI API KEY IN THE GEMINI_API_KEY ENVIRONMENT VARIABLE.
Do not put a real API key in frontend JavaScript or commit it to GitHub.

Install:
  pip install -r requirements.txt

Run:
  GEMINI_API_KEY="your-key" python app.py
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# ============================================================
# GEMINI API KEY: PUT YOUR KEY IN THE ENVIRONMENT VARIABLE BELOW
# Example (Windows PowerShell):
#   $env:GEMINI_API_KEY="YOUR_GEMINI_KEY"
# Example (Linux/macOS):
#   export GEMINI_API_KEY="YOUR_GEMINI_KEY"
# ============================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SYSTEM_PROMPT = """
You are ChemAI, an educational chemistry reaction analysis assistant.
Analyze the supplied reactants and optional conditions.

Return ONLY valid JSON with this shape:
{
  "reaction": {
    "type": "string",
    "equation": "string"
  },
  "reactants": [],
  "products": [],
  "pathways": [],
  "mechanism": "string",
  "conditions": {
    "temperature": "string",
    "solvent": "string",
    "catalyst": "string",
    "time": "string"
  },
  "thermodynamics": {},
  "kinetics": {},
  "observations": [],
  "safety": [],
  "limitations": [],
  "confidence": "string",
  "summary": "string"
}

Be chemically careful. If the input is ambiguous, say so in limitations and reduce confidence.
Do not invent experimental verification. Keep safety information educational and avoid dangerous procedural instructions.
"""

def call_gemini(reactants: str, conditions: str):
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured on the backend.")

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(MODEL_NAME)
    prompt = f"""{SYSTEM_PROMPT}

Reactants:
{reactants}

Conditions:
{conditions or "Not specified"}

Return JSON only.
"""
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    raw = response.text.strip()
    return json.loads(raw)

@app.get("/health")
def health():
    return jsonify({"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)})

@app.post("/predict")
def predict():
    data = request.get_json(silent=True) or {}
    reactants = str(data.get("reactants", "")).strip()
    conditions = str(data.get("conditions", "")).strip()

    if not reactants:
        return jsonify({"error": "Reactants are required."}), 400

    try:
        result = call_gemini(reactants, conditions)
        return jsonify(result)
    except json.JSONDecodeError:
        return jsonify({"error": "Gemini returned invalid structured data."}), 502
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
