import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from gemini import predict_reaction

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)

CORS(app)

@app.get("/")
def home():
    return jsonify({
        "name": "ChemAI Reaction Predictor API",
        "status": "online"
    })

@app.get("/health")
def health():
    return jsonify({
        "status": "healthy"
    })

@app.post("/predict")
def predict():
    if not request.is_json:
        return jsonify({"error": "Request must use JSON."}), 400

    data = request.get_json(silent=True) or {}

    reactants = str(data.get("reactants", "")).strip()
    conditions = str(data.get("conditions", "")).strip()

    if not reactants:
        return jsonify({"error": "Please enter reactants."}), 400

    if len(reactants) > 500:
        return jsonify({
            "error": "Reactant input must be 500 characters or fewer."
        }), 400

    try:
        result = predict_reaction(reactants, conditions)

        return jsonify({
            "result": result
        }), 200

    except ValueError as exc:
        return jsonify({
            "error": str(exc)
        }), 502

    except Exception:
        app.logger.exception("Reaction prediction failed")

        return jsonify({
            "error": "The prediction service could not complete the analysis. Please try again."
        }), 502


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({
        "error": "Request is too large."
    }), 413


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )