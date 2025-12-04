# 🚀 Sorting Algorithm Visualizer with ML-Based Recommendation

An interactive **Sorting Algorithm Visualizer** built using **React**, **Flask**, and **Machine Learning (Random Forest)** that recommends the most efficient sorting algorithm based on input array characteristics.

This project combines **Data Structures**, **Frontend Engineering**, **Backend Engineering**, and **Machine Learning** into one complete system.

---

## 🌟 Features

### 🔹 **Sorting Visualizer**

* Visualize **Bubble**, **Selection**, **Merge**, **Quick**, and **Heap Sort**
* Smooth animations with:

  * **Comparisons** (yellow)
  * **Swaps** (red)
  * **Pivot** markers (Quick Sort)
  * **Sorted prefix highlight** (green)
* **Playback controls**

  * Play / Pause
  * Step
  * Step-Back
  * Adjustable speed slider
  * Speed presets: 0.25x, 0.5x, 1x, 2x, 5x

---

### 🔹 **ML-Based Algorithm Recommendation**

* Backend analyzes the input array and extracts features:

  * Sortedness ratio
  * Unique ratio
  * Value range
  * Standard deviation
  * Longest increasing run
* Random Forest classifier predicts the best sorting algorithm
* UI displays:

  * **Recommended algorithm**
  * **Confidence score**
  * **Feature table**
  * **Human-friendly explanation (“Why this was chosen?”)**

---

### 🔹 **Advanced Utilities**

* **Compare All Algorithms**

  * Runs all 5 algorithms on the input
  * Shows:

    * Time (ms)
    * Comparisons
    * Swaps
    * Trace length
  * Helps visualize efficiency differences

* **Save / Load Arrays**

  * Store arrays in browser localStorage
  * Reload them for repeated testing or demos

* **Download CSV**

  * Download current array as CSV
  * Download comparison results CSV

---

## 🧠 Machine Learning Pipeline

### 🔹 `train.py`

* Generates synthetic datasets of input arrays
* Runs instrumented sorting algorithms
* Measures:

  * Comparisons
  * Swaps
  * Runtime
* Extracts features and labels best algorithm
* Trains a **Random Forest classifier**
* Saves model → `model.pkl`

### 🔹 `/recommend` API (Flask)

Returns:

```json
{
  "algorithm": "merge",
  "confidence": 0.91,
  "features": {
     "n": 50,
     "sortedness": 0.23,
     "unique_ratio": 0.90,
     "range": 87,
     "mean": 42.3,
     "std": 12.1,
     "long_run": 0.12
  }
}
```

---

## 📁 Project Structure

```
sorting-visualizer/
│
├── backend/
│   ├── app.py                 # Flask server (recommend endpoint)
│   ├── train.py               # ML training script
│   ├── model.pkl              # ML model (ignored in git)
│   ├── requirements.txt
│   └── venv/                  # Virtual environment (ignored)
│
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── Controls.js
    │   ├── Visualizer.js
    │   ├── algorithms.js
    │   └── index.css
    ├── public/
    ├── package.json
```

---

## 🔧 Installation & Setup

### 1️⃣ Backend Setup (Flask + ML)

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python train.py        # optional: creates model.pkl
python app.py
```

Backend runs on:

```
http://127.0.0.1:5000
```

---

### 2️⃣ Frontend Setup (React)

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🧪 Demo Flow

1. Generate a random array
2. Choose an algorithm → watch animated visualization
3. Use Step and Step-Back to explore trace
4. Click **Compare All** → compare performance metrics
5. Click **Recommend** → see ML-based suggestion + explanation
6. Save the array to evaluate later
7. Export CSVs for reporting or ML dataset building

---

## 📊 Why This Project Is Unique

* Combines **DSA + React + Python + Machine Learning**
* Real-time visualization with detailed instrumentation
* Intelligent algorithm selection using trained ML model
* Educational tool + engineering project + research component
* Clean, modular architecture suitable for extensions

---

## 📄 Future Improvements (Planned)

* Deploy frontend on Vercel / Netlify
* Deploy backend on Render / Railway
* Add Radix Sort & Counting Sort
* Add animations for merge sub-arrays
* Add chart visualization for Compare All results

---

## 👨‍💻 Author

**Sai Jashwanth**
Sorting Algorithm Visualizer with real-time animation + ML-based recommendation system.

---

## ⭐ Show Your Support

If you like this project, please give it a **⭐ star** on GitHub!
