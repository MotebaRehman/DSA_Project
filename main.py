from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from models import SimParams, SimulationState
from logic import SimulationEngine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SimulationEngine()


@app.get("/")
def root():
    return {"status": "running"}


@app.post("/start", response_model=SimulationState)
def start(params: SimParams):
    engine.initialize(params)
    return engine.get_data()


@app.post("/step", response_model=SimulationState)
def step(params: SimParams):
    engine.step(
        params.transmission_prob,
        params.recovery_time,
        mask_multiplier=params.mask_multiplier,
    )
    return engine.get_data()


@app.post("/lockdown", response_model=SimulationState)
def lockdown(strength: float = 0.5):
    engine.apply_intervention("lockdown", strength=strength)
    return engine.get_data()


@app.post("/vaccinate", response_model=SimulationState)
def vaccinate(fraction: float = 0.1):
    engine.apply_intervention("vaccinate", fraction=fraction)
    return engine.get_data()


@app.get("/history")
def history():
    return {"history": engine.get_history()}


@app.get("/export_csv")
def export_csv():
    csv_str = engine.export_history_csv()
    return Response(content=csv_str, media_type="text/csv")
