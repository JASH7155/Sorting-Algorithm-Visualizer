import time
import random
import numpy as np
import pandas as pd
from collections import deque
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import math

# ---------- instrumented algorithms (return comparisons, swaps, elapsed_ms) ----------

def bubble_stats(a):
    arr = a.copy()
    comps = swaps = 0
    t0 = time.time()
    n = len(arr)
    for i in range(n-1):
        for j in range(n-1-i):
            comps += 1
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swaps += 1
    t = (time.time() - t0) * 1000
    return comps, swaps, t

def selection_stats(a):
    arr = a.copy()
    comps = swaps = 0
    t0 = time.time()
    n = len(arr)
    for i in range(n-1):
        minIdx = i
        for j in range(i+1, n):
            comps += 1
            if arr[j] < arr[minIdx]:
                minIdx = j
        if minIdx != i:
            arr[i], arr[minIdx] = arr[minIdx], arr[i]
            swaps += 1
    t = (time.time() - t0) * 1000
    return comps, swaps, t

def merge_stats(a):
    arr = a.copy()
    comps = swaps = 0
    t0 = time.time()

    def merge(left, right):
        nonlocal comps, swaps
        i = j = 0
        out = []
        while i < len(left) and j < len(right):
            comps += 1
            if left[i] <= right[j]:
                out.append(left[i]); i += 1
            else:
                out.append(right[j]); j += 1
                swaps += 1  # count as overwrite-ish
        out.extend(left[i:]); out.extend(right[j:])
        return out

    def ms(x):
        if len(x) <= 1: return x
        mid = len(x)//2
        return merge(ms(x[:mid]), ms(x[mid:]))
    _ = ms(arr)
    t = (time.time() - t0) * 1000
    return comps, swaps, t

def quick_stats(a):
    arr = a.copy()
    comps = swaps = 0
    t0 = time.time()

    def partition(l, r):
        nonlocal comps, swaps, arr
        pivot = arr[r]
        i = l - 1
        for j in range(l, r):
            comps += 1
            if arr[j] < pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                swaps += 1
        arr[i+1], arr[r] = arr[r], arr[i+1]
        swaps += 1
        return i+1

    def qs(l, r):
        if l < r:
            p = partition(l, r)
            qs(l, p-1)
            qs(p+1, r)
    qs(0, len(arr)-1)
    t = (time.time() - t0) * 1000
    return comps, swaps, t

def heap_stats(a):
    arr = a.copy()
    comps = swaps = 0
    t0 = time.time()
    n = len(arr)
    def heapify(size, i):
        nonlocal comps, swaps, arr
        largest = i
        l = 2*i + 1
        r = 2*i + 2
        if l < size:
            comps += 1
            if arr[l] > arr[largest]:
                largest = l
        if r < size:
            comps += 1
            if arr[r] > arr[largest]:
                largest = r
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            swaps += 1
            heapify(size, largest)
    for i in range(n//2 - 1, -1, -1):
        heapify(n, i)
    for end in range(n-1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]
        swaps += 1
        heapify(end, 0)
    t = (time.time() - t0) * 1000
    return comps, swaps, t

ALGS = {
    "bubble": bubble_stats,
    "selection": selection_stats,
    "merge": merge_stats,
    "quick": quick_stats,
    "heap": heap_stats
}

# ---------- features ----------

def sortedness_ratio(arr):
    if len(arr) < 2: return 1.0
    return sum(1 for i in range(len(arr)-1) if arr[i] <= arr[i+1]) / (len(arr)-1)

def long_run_ratio(arr):
    if not arr: return 0.0
    best = cur = 1
    for i in range(1, len(arr)):
        if arr[i] >= arr[i-1]:
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
    return best / len(arr)

def feature_vector(arr):
    a = np.array(arr)
    n = len(arr)
    return {
        "n": n,
        "sortedness": sortedness_ratio(arr),
        "unique_ratio": len(set(arr))/n if n else 0,
        "range": float(np.max(a)-np.min(a)) if n else 0,
        "mean": float(np.mean(a)) if n else 0,
        "std": float(np.std(a)) if n else 0,
        "long_run": long_run_ratio(arr)
    }

# ---------- dataset generation ----------

def gen_array(n, dist="uniform"):
    if dist == "uniform":
        return [random.randint(1, 100) for _ in range(n)]
    if dist == "reversed":
        return list(range(n, 0, -1))
    if dist == "nearly_sorted":
        base = list(range(1, n+1))
        swaps = max(1, n//20)
        for _ in range(swaps):
            i = random.randrange(n); j = random.randrange(n)
            base[i], base[j] = base[j], base[i]
        return base
    if dist == "few_unique":
        choices = [random.randint(1, 5) for _ in range(max(2, n//5))]
        return [random.choice(choices) for _ in range(n)]
    # fallback
    return [random.randint(1, 100) for _ in range(n)]

def label_best_algorithm(arr):
    # run all algorithms and pick minimal elapsed time, tie-breaker by swaps then comps
    results = {}
    for name, fn in ALGS.items():
        comps, swaps, ms = fn(arr)
        results[name] = {"comps": comps, "swaps": swaps, "ms": ms}
    # choose by time
    best = min(results.items(), key=lambda item: (item[1]["ms"], item[1]["swaps"], item[1]["comps"]))
    return best[0], results

def build_dataset(sample_count=1500):
    rows = []
    dists = ["uniform", "nearly_sorted", "reversed", "few_unique"]
    sizes = [10, 20, 30, 50]  # include variety; you can increase
    for _ in range(sample_count):
        n = random.choice(sizes)
        dist = random.choice(dists)
        arr = gen_array(n, dist)
        label, results = label_best_algorithm(arr)
        feats = feature_vector(arr)
        feats["label"] = label
        feats["time_bubble"] = results["bubble"]["ms"]
        feats["time_selection"] = results["selection"]["ms"]
        feats["time_merge"] = results["merge"]["ms"]
        feats["time_quick"] = results["quick"]["ms"]
        feats["time_heap"] = results["heap"]["ms"]
        rows.append(feats)
    return pd.DataFrame(rows)

# ---------- train ----------

def train_and_save(sample_count=1500, out_model="model.pkl"):
    print("Building dataset...")
    df = build_dataset(sample_count)
    X = df[["n","sortedness","unique_ratio","range","mean","std","long_run"]]
    y = df["label"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print("Training RandomForest...")
    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print("Accuracy on test set:", acc)
    print(classification_report(y_test, y_pred))
    joblib.dump(clf, out_model)
    print("Saved model to", out_model)
    # also save a sample CSV for inspection
    df.to_csv("benchmark_dataset.csv", index=False)
    print("Saved dataset CSV benchmark_dataset.csv")

if __name__ == "__main__":
    # tune sample_count as you like (1500 is quick; increase to 5k+ for better results)
    train_and_save(sample_count=1800, out_model="model.pkl")
