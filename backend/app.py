from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print("Loaded model from", MODEL_PATH)
else:
    print("Model not found at", MODEL_PATH, " — run train.py first to create model.pkl")

def extract_features(arr):
    arr = list(arr)
    n = len(arr)
    if n == 0:
        return {"n":0,"sortedness":1.0,"unique_ratio":0.0,"range":0,"mean":0,"std":0,"long_run":0}
    a = np.array(arr)
    sortedness = sum(1 for i in range(n-1) if arr[i] <= arr[i+1])/(n-1) if n>1 else 1.0
    unique_ratio = len(set(arr))/n
    rng = float(np.max(a)-np.min(a))
    mean = float(np.mean(a))
    std = float(np.std(a))
    # long run
    best = cur = 1
    for i in range(1, n):
        if arr[i] >= arr[i-1]:
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
    long_run = best/n
    return {"n":n, "sortedness":sortedness, "unique_ratio":unique_ratio, "range":rng, "mean":mean, "std":std, "long_run":long_run}

@app.route("/health")
def health():
    return jsonify({"status":"ok"})

@app.route("/recommend", methods=["POST"])
def recommend():
    global model
    data = request.get_json() or {}
    arr = data.get("array", [])
    features = extract_features(arr)
    if model is None:
        return jsonify({"error":"model not found. Run training script on server.", "algorithm":"merge", "confidence":0.0})
    X = [[features["n"], features["sortedness"], features["unique_ratio"], features["range"], features["mean"], features["std"], features["long_run"]]]
    pred = model.predict(X)[0]
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)[0]
        classes = model.classes_
        conf = float(max(probs))
    else:
        conf = 0.0
    return jsonify({"algorithm": str(pred), "confidence": conf, "features": features})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
