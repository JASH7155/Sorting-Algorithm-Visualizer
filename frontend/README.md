# Sorting Algorithm Visualizer

A web-based interactive Sorting Algorithm Visualizer with ML-based algorithm recommendation.

**Tech:** React (frontend), Flask (backend), scikit-learn (trainer), Python for benchmarking.

## Features
- Visualize 5 sorting algorithms: Bubble, Selection, Merge, Quick, Heap.
- Real-time animated trace with Play / Step / Step-Back.
- Live counters: comparisons and swaps.
- Sorted-prefix highlight (green) showing already-sorted portion.
- Speed presets (0.25x, 0.5x, 1x, 2x, 5x).
- Save & Load arrays (localStorage).
- Compare All: run all algorithms on the same array (frontend measured metrics).
- Download CSV: comparison results and the array.
- ML recommendation endpoint: frontend POSTs the array to `/recommend` and displays the predicted best algorithm + feature-based explanation.
- Backend training script `train.py` to generate benchmark dataset and train RandomForest.

## Run locally (frontend + backend)

### Backend (Python)
1. Create virtual env and install:
```bash
cd sorting-visualizer/backend
python -m venv venv
# activate venv
pip install -r requirements.txt
Train model (optional, but recommended):

python train.py
# creates model.pkl and benchmark_dataset.csv


Start backend:

python app.py


Backend serves /health and /recommend.

Frontend (React)

Install node/npm (LTS) and in project root:

cd sorting-visualizer/frontend
npm install
npm start


Open http://localhost:3000

How the ML recommendation works

Offline benchmarking script train.py generates synthetic arrays of varying sizes and distributions, runs instrumented algorithms, and labels each array with the best algorithm (by measured time).

A RandomForest classifier is trained on features (n, sortedness, unique_ratio, value range, mean, std, long_run) and saved to model.pkl.

The Flask /recommend endpoint loads the model, computes features for the posted array, and returns predicted algorithm + confidence + features.

Demo script (30-45s)

Start frontend and backend.

Show UI, generate a random array, pick an algorithm, click Play to show animation.

Click Compare All and show the table.

Click Recommend and highlight the explanation card (sortedness, unique_ratio).

Download CSV and show downloaded file.

Files of interest

frontend/src — React app (Visualizer, Controls, algorithms).

backend/train.py — benchmarking + model training.

backend/app.py — model serving API.

Notes

For production, serve the React build and Flask behind a server (NGINX) and persist a model artifact in a dedicated model storage.


---

## 6) Test checklist (do these after replacing files)

1. `npm start` (frontend) if not running. Reload browser.
2. Controls area now shows Speed presets, Compare All, Download buttons, Save Array.
3. Test **Speed presets**: click 0.25x/0.5x/1x/2x/5x and press Play — animation speed should change.
4. Test **Compare All**: click it and see the results table with time/comparisons/swaps. Then click **Download Compare CSV** to get CSV file.
5. Test **Save Array**: click it and it will save (localStorage). Scroll down to Saved arrays and Load/Delete work.
6. Test **Sorted portion highlight**: Play an algorithm and watch green bars appear for already-sorted prefix.
7. Test **Recommend**: click and see the Explanation card (features + reasons).
8. Test **Download Array CSV**: downloads the array as CSV.
9. Test **Step / Step Back** as before.

---

## If something fails — what to paste here
If any feature doesn't behave, paste:
- Browser console errors (DevTools Console) — copy the red/log lines.
- The small JSON response from backend `/recommend` if Recommendation not showing proper features.
- Which browser (Chrome/Edge/Firefox) and OS (Windows/macOS/Linux).

---

## Next polish we can do (optional afterwards)
- Add a small chart (bar chart) showing the compare times visually (use Recharts or simple SVG).
- Add unit test suite to verify traces sort arrays automatically.
- Host app (GitHub Pages + small Flask hosting) or Dockerize for demo.

---

If you want, I can now:
- Implement the optional chart for Compare All (visual bar chart), **or**
- Produce a short demo GIF + trimmed 30–45s recording script and a final README badge image.

Tell me which of those two to do next, or say **“I’m done”** if everything works and you want 