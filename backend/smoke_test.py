"""Runs every algo x compatible dataset once through the API function. Usage: python smoke_test.py"""
import json
import time

from fastapi.testclient import TestClient

from main import app

c = TestClient(app)
meta = c.get("/api/meta").json()
fail = 0
for a in meta["algorithms"]:
    for d in meta["datasets"]:
        if not set(a["tasks"]) & set(d["tasks"]) or (a["needs_2d"] and d["dims"] != 2):
            continue
        t = time.time()
        resp = c.post("/api/run", json=dict(algo=a["id"], dataset=d["key"]))
        ok = resp.status_code == 200
        size = len(resp.content) // 1024 if ok else 0
        print(f"{'OK ' if ok else 'FAIL'} {a['id']:9} {d['key']:11} {time.time() - t:5.2f}s {size:5d}KB", "" if ok else resp.text[:300])
        fail += not ok
print("failures:", fail)
