import os
import time
from dotenv import load_dotenv
from google import genai

# Load .env from the same folder as this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is not configured on the backend.")

# Gemini model
# Can be overridden from .env with GEMINI_MODEL
MODEL_NAME = "gemini-3.6-flash"

print("🔥 USING GEMINI MODEL:", MODEL_NAME)

client = genai.Client(api_key=API_KEY)


def predict_reaction(reactants, conditions=""):
    reactants = str(reactants).strip()
    conditions = str(conditions or "").strip()

    if not reactants:
        raise ValueError("Please enter reactants.")

    prompt = f"""
You are ChemAI, an AI chemistry reaction prediction assistant.

Analyze the following chemical reaction.

Reactants:
{reactants}

Additional conditions:
{conditions if conditions else "Not provided"}

Return the prediction in clear structured JSON with these fields:

{{
  "reaction": "balanced overall reaction if possible",
  "products": ["main product(s)"],
  "reaction_type": "reaction type",
  "conditions": "required or likely conditions",
  "temperature": "temperature if relevant",
  "catalyst": "catalyst if relevant",
  "solvent": "solvent if relevant",
  "process": "brief reaction process",
  "product_properties": "important properties of the predicted product",
  "confidence": "High/Medium/Low",
  "limitations": "important limitations or uncertainty"
}}

Rules:
- Give chemically reasonable predictions.
- Do not invent certainty when the reaction is ambiguous.
- If multiple products are plausible, mention the main possibilities.
- Keep explanations concise.
- Return valid JSON only.
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        if response and response.text:
            return response.text.strip()

        raise ValueError("Gemini returned an empty response.")

    except Exception as exc:
        error_message = str(exc)

        # Handle Gemini quota/rate-limit errors.
        # Do NOT immediately retry a 429 because the API may explicitly
        # tell us to wait several seconds/minutes.
        if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
            raise ValueError(
                f"Gemini quota/rate limit exceeded for model "
                f"'{MODEL_NAME}'. Please wait for the quota to reset "
                f"or use a project/model with available quota."
            ) from exc

        # Retry once for other temporary API failures.
        time.sleep(1)

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
            )

            if response and response.text:
                return response.text.strip()

            raise ValueError("Gemini returned an empty response.")

        except Exception as retry_error:
            raise ValueError(
                f"Gemini prediction failed: {str(retry_error)}"
            ) from retry_error