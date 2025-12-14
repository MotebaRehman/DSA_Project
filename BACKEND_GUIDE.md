# Backend Implementation Guide

## Overview

This backend is a **simple, clear, and self-contained epidemic simulation API** built using:

* **FastAPI** – REST API framework
* **NetworkX** – Network (graph) generation and handling
* **Pydantic** – Data validation and structured request/response models
* **Pure Python logic** – No databases, no background workers, no hidden magic

It is designed to:

* Simulate disease spread using an SIR model
* Expose clean API endpoints for a browser-based frontend
* Be understandable from **zero to hero** for anyone running it

Total backend files:

* `main.py` – API routes and server setup
* `logic.py` – Core simulation engine
* `models.py` – Data models (schemas)
* `requirements.txt` – Dependencies

---

## Project Structure

```
DSA_Project/
│
├─ main.py              # FastAPI app and API routes
├─ logic.py             # Simulation logic (network + disease model)
├─ models.py            # Pydantic request/response models
├─ requirements.txt     # Python dependencies
```

---

## Step 1: Install Backend Dependencies

Make sure you are inside the project folder:

```bash
cd /d "D:\University\Semester 3\Data Structures & Algorithms\Project\DSA_Project"
```

Install all required packages:

```bash
pip install -r requirements.txt
```

### Required Packages

The backend depends on:

* `fastapi`
* `uvicorn`
* `networkx`
* `pydantic`

### Verification

Run:

```bash
pip show fastapi
pip show uvicorn
pip show networkx
pip show pydantic
```

If version information appears for each package, installation is successful.

---

## Step 2: Start the Backend Server

Run the following command from the project directory:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Expected Output

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

This means the backend server is live.

---

## Step 3: Verify Server is Running

Open a browser and visit:

```
http://localhost:8000/docs
```

### What You Should See

* Swagger UI interface
* A list of API endpoints such as:

  * `/start`
  * `/step`
  * `/lockdown`
  * `/vaccinate`
  * `/history`
  * `/export_csv`

If this page loads, the backend is **fully operational**.

---

## Core Concepts (Easy Explanation)

### Disease Model

This backend uses a **classic SIR model**:

* **Susceptible** – Can get infected
* **Infected** – Can spread disease
* **Recovered** – Immune, cannot be infected again

Each person is a **node** in a graph.
Each social connection is an **edge**.

---

## Network Generation

The population network is created using:

```python
nx.watts_strogatz_graph()
```

This produces a **small-world network**, which realistically models:

* Clusters (friend groups)
* Short paths between people

Parameters controlling the network:

* `population_size`
* `avg_degree`
* `rewire_prob`

---

## Simulation Engine (`logic.py`)

The `SimulationEngine` class controls the entire simulation.

### Initialization

When `/start` is called:

* A new network graph is created
* All nodes start as **susceptible**
* A random subset becomes **initially infected**
* Day counter resets to 0
* History tracking begins

---

### Daily Simulation Step

Each day:

1. Infected nodes try to infect neighbors
2. Infection chance = `transmission_prob × mask_multiplier`
3. Infected nodes recover after `recovery_time` days
4. Day counter increments
5. S/I/R counts are recorded

This logic is handled by:

```python
engine.step()
```

---

## Interventions

### Lockdown

Endpoint:

```
POST /lockdown?strength=0.5
```

Effect:

* Randomly removes a fraction of edges
* Reduces contact between individuals
* Slows disease spread

Strength meaning:

* `0.0` → no lockdown
* `1.0` → remove all connections

---

### Vaccination

Endpoint:

```
POST /vaccinate?fraction=0.1
```

Effect:

* Converts a fraction of **susceptible** nodes to **recovered**
* Vaccinated individuals cannot be infected

Fraction meaning:

* `0.1` → vaccinate 10% of susceptible population
* `1.0` → vaccinate everyone susceptible

---

## API Endpoints

### Start Simulation

```
POST /start
```

Body (JSON):

```json
{
  "population_size": 500,
  "initial_infected": 5,
  "transmission_prob": 0.3,
  "recovery_time": 14,
  "mask_multiplier": 1.0,
  "avg_degree": 6,
  "rewire_prob": 0.1
}
```

Returns:

* Current day
* S/I/R statistics
* Network nodes and edges

---

### Step Simulation

```
POST /step
```

Advances the simulation by **one day**.

---

### View History

```
GET /history
```

Returns:

* Daily S/I/R counts for the entire simulation

---

### Export CSV

```
GET /export_csv
```

Downloads epidemic history as a CSV file:

```
day,susceptible,infected,recovered
```

---

## CORS Configuration

CORS is fully open:

```python
allow_origins=["*"]
```

This allows the frontend to run directly from:

* `file:///` paths
* Any browser
* Any local or hosted origin

---

## Error Handling & Safety

* No database → no corruption risk
* Stateless API calls (except in-memory simulation)
* Safe defaults for all parameters
* No background threads

If the server stops, the simulation resets cleanly.

---

## Browser & Frontend Compatibility

The backend works with:

* Chrome
* Edge
* Firefox
* Safari

It is designed specifically to support the provided **HTML + JavaScript frontend**.

---

## Summary

This backend provides:

* ✅ Clear SIR epidemic model
* ✅ Realistic network simulation
* ✅ Clean REST API
* ✅ Lockdown & vaccination interventions
* ✅ CSV export for analysis
* ✅ Zero configuration complexity

To run:

1. Install dependencies
2. Start server with `uvicorn`
3. Open `/docs` to verify
4. Connect frontend