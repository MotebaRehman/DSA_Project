# Frontend Implementation Guide

## Overview
This frontend is a **zero-build, browser-based application** using:
- **D3.js** - Force-Directed Network Visualization
- **Chart.js** - Epidemic Curve Plotting
- **Vanilla JavaScript** - No build tools needed

**Total files: 2** (`index.html` + `app.js`)

---

## Step 1: Install Backend Dependencies (if not already done)

Ensure your backend (`main.py`) has all required packages:

```bash
pip install -r requirements.txt
```

Verify you have:
- `fastapi`
- `uvicorn`
- `networkx`
- `pydantic`

---

## Step 2: Start the Backend Server

Run this command in a terminal from your project folder:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 3: Open the Frontend

Choose one of these methods to open `index.html` in your browser:

**Method 1: Direct File Path (Easiest)**
1. Open your browser (Chrome, Firefox, Edge, Safari)
2. Press `Ctrl+L` to focus the address bar
3. Type the full path: `file:///C:/Users/jovar/DSA_Project/index.html`
4. Press Enter

**Method 2: Drag & Drop**
1. Locate `index.html` in File Explorer
2. Drag the file into your open browser window

**Method 3: Command Line**
```bash
# Open with default browser (Windows PowerShell)
start C:\Users\jovar\DSA_Project\index.html

# Or open with specific browser
start chrome C:\Users\jovar\DSA_Project\index.html
start firefox C:\Users\jovar\DSA_Project\index.html
start msedge C:\Users\jovar\DSA_Project\index.html
```

The page will load and show:
- ✅ Control panel (left sidebar)
- ✅ Network visualization area (top-right)
- ✅ Epidemic curve chart (bottom-right)

---

## How to Use

### Starting a Simulation

1. **Configure Parameters** (left sidebar):
   - Population Size: 50-2000 (default 500)
   - Initial Infected: 1-100 (default 5)
   - Transmission Probability: 0-1 (default 0.3)
   - Recovery Time: 1-60 days (default 14)
   - Average Degree: 2-20 (default 6)
   - Rewiring Probability: 0-1 (default 0.1)

2. **Click "Start Simulation"**
   - Network graph appears with nodes color-coded:
     - 🟢 **Green** = Susceptible
     - 🔴 **Red** = Infected
     - 🔵 **Blue** = Recovered
   - Epidemic curve chart initializes

### Simulating Days

**Option A: Manual Stepping**
- Click "Step (Next Day)" to advance one day at a time
- Watch nodes change color and chart update in real-time

**Option B: Auto Play**
- Click "Auto Play" to simulate continuously (~0.5s per day)
- Click "Stop" to pause
- Click "Step" to resume manual stepping

### Applying Interventions

**Lockdown:**
1. Set "Lockdown Strength" (0-1, where 1 = remove 100% of edges)
2. Click "Apply Lockdown"
3. Graph edges reduce, slowing disease spread

**Vaccination:**
1. Set "Vaccination Fraction" (0-1, where 1 = vaccinate 100% of susceptible)
2. Click "Vaccinate"
3. Susceptible nodes turn blue (recovered/immune)

### Viewing Results

**Current Statistics (bottom-right sidebar):**
- Shows current day, susceptible/infected/recovered counts
- Updates every step

**Epidemic Curve (bottom-right chart):**
- Line chart showing S, I, R counts over time
- Green line = susceptible trend
- Red line = infected trend
- Blue line = recovered trend

---

## Features Implemented

✅ **Network Visualization**
- Force-directed graph (Spring Embedder) using D3.js
- Color-coded by status
- Real-time updates every day
- Responsive sizing

✅ **Epidemic Curve**
- Time-series chart with Chart.js
- Three lines: Susceptible, Infected, Recovered
- Auto-scales based on population size
- Smooth animations

✅ **Configuration Panel**
- All 7 key parameters adjustable before simulation
- Range sliders with live value display
- Number inputs for precise values

✅ **Simulation Control**
- Start/Reset buttons
- Manual step control
- Auto-play with 500ms intervals
- Status messages

✅ **Interventions**
- Lockdown (removes graph edges)
- Vaccination (converts susceptible to recovered)
- Both adjustable with real-time strength/fraction controls

✅ **Statistics Dashboard**
- Real-time day counter
- S, I, R counts
- Color-coded for clarity

---

## Technical Details

### API Communication
The frontend makes REST calls to your FastAPI backend:

```javascript
// Start simulation
POST /start
  Body: { population_size, initial_infected, transmission_prob, recovery_time, etc. }
  Returns: SimulationState { day, stats, nodes, links }

// Step one day
POST /step
  Body: { ...parameters }
  Returns: SimulationState

// Apply lockdown
POST /lockdown?strength=0.5
  Returns: SimulationState

// Apply vaccination
POST /vaccinate?fraction=0.1
  Returns: SimulationState
```

### CORS
Your backend already has CORS enabled (`allow_origins=["*"]`), so the frontend can communicate from any origin.

### Browser Compatibility
Works on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ❌ Internet Explorer (not supported)

---

## Troubleshooting

### "Cannot POST /start" or network errors
- **Cause:** Backend not running
- **Fix:** Run `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### Graph not appearing
- **Cause:** SVG rendering issue
- **Fix:** Refresh page (Ctrl+R), ensure browser zoom is 100%

### Chart not updating
- **Cause:** Chart.js conflict
- **Fix:** Clear browser cache (Ctrl+Shift+Delete), refresh

### Auto-play too fast/slow
- **Current:** 500ms per day
- **To change:** Edit `app.js`, line ~180: `setTimeout(autoPlayInterval, 500);`
  - Increase 500 for slower, decrease for faster

---

## Customization

### Change Colors
Edit `app.js`:
```javascript
const colorMap = {
    susceptible: "#22c55e",  // Green
    infected: "#ef4444",     // Red
    recovered: "#3b82f6"     // Blue
};
```

### Change Chart Animation Speed
Edit `index.html`, search for `Chart(ctx, {`:
```javascript
options: {
    animation: { duration: 500 }  // Add this to control animation
}
```

### Change Network Node Size
Edit `app.js`, line ~135:
```javascript
.attr("r", 5)  // Change 5 to your desired radius
```

---

## Summary

This is the **simplest possible frontend** that fulfills all requirements:
- ✅ Force-Directed Network Graph
- ✅ Color-coded nodes (Susceptible/Infected/Recovered)
- ✅ Epidemic Curve chart
- ✅ All parameters configurable
- ✅ Lockdown & Vaccination interventions
- ✅ Real-time statistics

**No build process, no frameworks, just HTML + JavaScript + CDN libraries.**

To start: Run backend → Open `index.html` → Configure & click "Start Simulation"

Good luck with your project! 🎓
