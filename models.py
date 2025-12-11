from pydantic import BaseModel
from typing import Dict, List


class SimParams(BaseModel):
    population_size: int = 500
    initial_infected: int = 5
    transmission_prob: float = 0.3
    recovery_time: int = 14
    mask_multiplier: float = 1.0
    avg_degree: int = 6
    rewire_prob: float = 0.1


class Node(BaseModel):
    id: int
    status: str


class Link(BaseModel):
    source: int
    target: int


class SimulationState(BaseModel):
    day: int
    stats: Dict[str, int]
    nodes: List[Node]
    links: List[Link]
