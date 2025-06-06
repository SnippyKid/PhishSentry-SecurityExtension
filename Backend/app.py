from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

# Load model and vectorizer
model = joblib.load("phishing_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# Init Flask app
app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return "🚀 PhishSentry API is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        email_text = data.get("email", "")

        if not email_text:
            return jsonify({"error": "No email text provided."}), 400

        # Transform input
        vectorized = vectorizer.transform([email_text])
        prediction = model.predict(vectorized)[0]
        proba = model.predict_proba(vectorized)[0][prediction]

        result = {
            "prediction": int(prediction),
            "confidence": round(float(proba) * 100, 2)  # in %
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
