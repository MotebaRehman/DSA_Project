// Configuration
const API_URL = "http://localhost:8000";
let simulation_running = false;
let auto_playing = false;
let chart = null;
let networkVisualization = null;

// Elements
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const stepBtn = document.getElementById("stepBtn");
const autoPlayBtn = document.getElementById("autoPlayBtn");
const stopAutoBtn = document.getElementById("stopAutoBtn");
const lockdownBtn = document.getElementById("lockdownBtn");
const vaccineBtn = document.getElementById("vaccineBtn");
const statusEl = document.getElementById("status");

// Event Listeners
startBtn.addEventListener("click", startSimulation);
resetBtn.addEventListener("click", resetSimulation);
stepBtn.addEventListener("click", stepSimulation);
autoPlayBtn.addEventListener("click", toggleAutoPlay);
stopAutoBtn.addEventListener("click", stopAutoPlay);
lockdownBtn.addEventListener("click", applyLockdown);
vaccineBtn.addEventListener("click", applyVaccination);

// Range input displays
document.getElementById("transmissionProb").addEventListener("input", (e) => {
    document.getElementById("transProbDisplay").textContent = parseFloat(e.target.value).toFixed(2);
});

document.getElementById("rewiringProb").addEventListener("input", (e) => {
    document.getElementById("rewiringProbDisplay").textContent = parseFloat(e.target.value).toFixed(2);
});

document.getElementById("lockdownStrength").addEventListener("input", (e) => {
    document.getElementById("lockdownDisplay").textContent = parseFloat(e.target.value).toFixed(2);
});

document.getElementById("vaccinationFrac").addEventListener("input", (e) => {
    document.getElementById("vaccinationDisplay").textContent = parseFloat(e.target.value).toFixed(2);
});

// Initialize chart
function initializeChart() {
    const canvasEl = document.getElementById("chart");
    const ctx = canvasEl.getContext("2d");
    if (chart) {
        chart.destroy();
    }
    
    // Set explicit canvas size to prevent infinite growth
    const rect = canvasEl.parentElement.getBoundingClientRect();
    canvasEl.width = Math.max(100, rect.width - 40) || 600;
    canvasEl.height = Math.max(100, rect.height - 40) || 400;
    
    const maxPopulation = parseInt(document.getElementById("populationSize").value);
    
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [0],
            datasets: [
                {
                    label: "Susceptible",
                    data: [0],
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    tension: 0.3,
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: "#22c55e"
                },
                {
                    label: "Infected",
                    data: [0],
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    tension: 0.3,
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: "#ef4444"
                },
                {
                    label: "Recovered",
                    data: [0],
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    tension: 0.3,
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: "#3b82f6"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    beginAtZero: true,
                    min: 0,
                    max: maxPopulation,
                    ticks: {
                        font: { size: 11 }
                    }
                },
                x: {
                    ticks: {
                        font: { size: 11 }
                    }
                }
            },
            plugins: {
                filler: false
            }
        }
    });
}

// Get current parameters from UI
function getParameters() {
    return {
        population_size: parseInt(document.getElementById("populationSize").value),
        initial_infected: parseInt(document.getElementById("initialInfected").value),
        transmission_prob: parseFloat(document.getElementById("transmissionProb").value),
        recovery_time: parseInt(document.getElementById("recoveryTime").value),
        mask_multiplier: 1.0,
        avg_degree: parseInt(document.getElementById("avgDegree").value),
        rewire_prob: parseFloat(document.getElementById("rewiringProb").value)
    };
}

// Update UI with simulation state
function updateUI(data) {
    // Update stats
    document.getElementById("dayCounter").textContent = `Day ${data.day}`;
    document.getElementById("statSusceptible").textContent = data.stats.susceptible;
    document.getElementById("statInfected").textContent = data.stats.infected;
    document.getElementById("statRecovered").textContent = data.stats.recovered;

    // Update chart - only add if day is new
    if (chart) {
        const lastDay = chart.data.labels[chart.data.labels.length - 1];
        
        // Only add if this is a new day
        if (data.day !== lastDay) {
            chart.data.labels.push(data.day);
            chart.data.datasets[0].data.push(Math.max(0, data.stats.susceptible));
            chart.data.datasets[1].data.push(Math.max(0, data.stats.infected));
            chart.data.datasets[2].data.push(Math.max(0, data.stats.recovered));
            
            // Keep only last 100 data points to prevent memory crash
            while (chart.data.labels.length > 100) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
                chart.data.datasets[2].data.shift();
            }
        }
        chart.update('none');
    }

    // Draw network
    drawNetwork(data);
}

// Draw the force-directed network graph
function drawNetwork(data) {
    const svgElement = document.getElementById("network");
    const rect = svgElement.getBoundingClientRect();
    const width = Math.max(100, rect.width) || 600;
    const height = Math.max(100, rect.height) || 400;

    if (!data.nodes || data.nodes.length === 0) {
        return;
    }

    // Check if visualization already exists for this node count
    const existingCircles = d3.select("#network").selectAll("circle");
    if (existingCircles.size() > 0 && data.nodes.length === existingCircles.size()) {
        // Just update node colors without redrawing
        const colorMap = {
            susceptible: "#22c55e",
            infected: "#ef4444",
            recovered: "#3b82f6"
        };
        existingCircles.attr("fill", (d, i) => colorMap[data.nodes[i].status] || "#999");
        return;
    }

    // Clear previous visualization
    d3.select("#network").selectAll("*").remove();

    // Create SVG with explicit viewBox to prevent infinite growth
    const svg = d3.select("#network")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("display", "block")
        .style("max-width", "100%")
        .style("max-height", "100%");

    // Create node color mapping
    const colorMap = {
        susceptible: "#22c55e",
        infected: "#ef4444",
        recovered: "#3b82f6"
    };

    // Prepare nodes and links for D3
    const nodes = data.nodes.map(n => ({
        id: n.id,
        status: n.status
    }));

    const links = data.links.map(l => ({
        source: l.source,
        target: l.target
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(30)
            .strength(0.1))
        .force("charge", d3.forceManyBody().strength(-20))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(6));

    // Draw links
    const link = svg.selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.6);

    // Draw nodes
    const node = svg.selectAll("circle")
        .data(nodes, d => d.id)
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("fill", d => colorMap[d.status] || "#999")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8);

    // Update positions on tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });
}

// Start simulation
async function startSimulation() {
    try {
        statusEl.textContent = "Starting...";
        const params = getParameters();
        
        // Validate parameters
        if (params.initial_infected > params.population_size) {
            throw new Error("Initial infected cannot exceed population size");
        }
        
        console.log("Sending parameters:", params);
        
        const response = await fetch(`${API_URL}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            let errorDetails = "";
            try {
                const errorJson = await response.json();
                errorDetails = JSON.stringify(errorJson, null, 2);
                console.error("Backend validation error:", errorJson);
            } catch {
                errorDetails = await response.text();
                console.error("Backend error:", errorDetails);
            }
            throw new Error(`Backend rejected request (422): ${errorDetails}`);
        }

        const data = await response.json();
        console.log("Simulation started successfully:", data);
        simulation_running = true;

        // Update buttons
        startBtn.disabled = true;
        resetBtn.disabled = false;
        stepBtn.disabled = false;
        autoPlayBtn.disabled = false;
        lockdownBtn.disabled = false;
        vaccineBtn.disabled = false;

        // Initialize chart and UI
        initializeChart();
        updateUI(data);
        statusEl.textContent = "Running";
    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
        console.error(error);
    }
}

// Step simulation
async function stepSimulation() {
    if (!simulation_running) return;

    try {
        const params = getParameters();
        const response = await fetch(`${API_URL}/step`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });

        if (!response.ok) throw new Error("Failed to step simulation");

        const data = await response.json();
        updateUI(data);
        statusEl.textContent = `Day ${data.day}`;
    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
        console.error(error);
    }
}

// Auto play
function toggleAutoPlay() {
    if (auto_playing) {
        stopAutoPlay();
    } else {
        auto_playing = true;
        autoPlayBtn.disabled = true;
        stopAutoBtn.disabled = false;
        stepBtn.disabled = true;
        statusEl.textContent = "Auto-playing...";
        autoPlayInterval();
    }
}

function autoPlayInterval() {
    if (!auto_playing) return;
    stepSimulation().then(() => {
        setTimeout(autoPlayInterval, 500);
    });
}

// Stop auto play
function stopAutoPlay() {
    auto_playing = false;
    autoPlayBtn.disabled = false;
    stopAutoBtn.disabled = true;
    stepBtn.disabled = false;
    statusEl.textContent = "Paused";
}

// Reset simulation
function resetSimulation() {
    simulation_running = false;
    auto_playing = false;
    startBtn.disabled = false;
    resetBtn.disabled = true;
    stepBtn.disabled = true;
    autoPlayBtn.disabled = true;
    stopAutoBtn.disabled = true;
    lockdownBtn.disabled = true;
    vaccineBtn.disabled = true;

    // Clear UI
    d3.select("#network").selectAll("*").remove();
    document.getElementById("dayCounter").textContent = "Day 0";
    document.getElementById("statSusceptible").textContent = "0";
    document.getElementById("statInfected").textContent = "0";
    document.getElementById("statRecovered").textContent = "0";
    statusEl.textContent = "Ready to start";

    // Properly destroy and clear chart
    if (chart) {
        chart.destroy();
        chart = null;
    }
    
    // Clear canvas
    const canvasEl = document.getElementById("chart");
    if (canvasEl) {
        canvasEl.remove();
        const newCanvas = document.createElement("canvas");
        newCanvas.id = "chart";
        canvasEl.parentNode.appendChild(newCanvas);
    }
}

// Apply lockdown intervention
async function applyLockdown() {
    if (!simulation_running) return;

    try {
        const strength = parseFloat(document.getElementById("lockdownStrength").value);
        const response = await fetch(`${API_URL}/lockdown?strength=${strength}`, {
            method: "POST"
        });

        if (!response.ok) throw new Error("Failed to apply lockdown");

        const data = await response.json();
        updateUI(data);
        statusEl.textContent = `Lockdown applied (${(strength * 100).toFixed(0)}%)`;
    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
        console.error(error);
    }
}

// Apply vaccination intervention
async function applyVaccination() {
    if (!simulation_running) return;

    try {
        const fraction = parseFloat(document.getElementById("vaccinationFrac").value);
        const response = await fetch(`${API_URL}/vaccinate?fraction=${fraction}`, {
            method: "POST"
        });

        if (!response.ok) throw new Error("Failed to vaccinate");

        const data = await response.json();
        updateUI(data);
        statusEl.textContent = `Vaccinated ${(fraction * 100).toFixed(0)}%`;
    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
        console.error(error);
    }
}
