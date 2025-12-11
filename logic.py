import networkx as nx
import random
import csv
from io import StringIO
from models import Node, Link


class SimulationEngine:
    def __init__(self):
        self.graph = None
        self.statuses = {}
        self.timers = {}
        self.day = 0
        self.history = []

    def initialize(self, params):
        # Generate network
        self.graph = nx.watts_strogatz_graph(
            n=params.population_size,
            k=params.avg_degree,
            p=params.rewire_prob
        )

        # Setup states
        self.statuses = {n: "susceptible" for n in self.graph.nodes()}
        self.timers = {n: 0 for n in self.graph.nodes()}
        self.day = 0
        self.history = []

        # Infect initial people
        infected_nodes = random.sample(
            list(self.graph.nodes()), params.initial_infected
        )
        for n in infected_nodes:
            self.statuses[n] = "infected"
            self.timers[n] = 0

        self._record_history()

    def step(self, transmission_prob, recovery_time, mask_multiplier=1.0):
        if self.graph is None:
            return

        new_status = self.statuses.copy()

        for node in self.graph.nodes():
            if self.statuses[node] == "infected":

                # Infect neighbors
                for nbr in self.graph.neighbors(node):
                    if self.statuses[nbr] == "susceptible":
                        if random.random() < transmission_prob * mask_multiplier:
                            new_status[nbr] = "infected"
                            self.timers[nbr] = 0

                # Recovery
                self.timers[node] += 1
                if self.timers[node] >= recovery_time:
                    new_status[node] = "recovered"

        self.statuses = new_status
        self.day += 1
        self._record_history()

    def apply_intervention(self, type="lockdown", **kwargs):
        if self.graph is None:
            return

        if type == "lockdown":
            strength = kwargs.get("strength", 0.5)
            edges = list(self.graph.edges())

            remove_count = int(len(edges) * strength)
            to_remove = random.sample(edges, remove_count)

            self.graph.remove_edges_from(to_remove)

        elif type == "vaccinate":
            frac = kwargs.get("fraction", 0.1)
            susceptible = [n for n in self.graph.nodes()
                           if self.statuses[n] == "susceptible"]

            vaccinate_count = int(len(susceptible) * frac)
            chosen = random.sample(susceptible, vaccinate_count)

            for n in chosen:
                self.statuses[n] = "recovered"

            self._record_history()

    def get_data(self):
        if self.graph is None:
            return {
                "day": 0,
                "stats": {"susceptible": 0, "infected": 0, "recovered": 0},
                "nodes": [],
                "links": []
            }

        nodes = [Node(id=n, status=self.statuses[n]) for n in self.graph.nodes()]
        links = [Link(source=u, target=v) for u, v in self.graph.edges()]

        stats = {
            "susceptible": list(self.statuses.values()).count("susceptible"),
            "infected": list(self.statuses.values()).count("infected"),
            "recovered": list(self.statuses.values()).count("recovered"),
        }

        return {
            "day": self.day,
            "stats": stats,
            "nodes": nodes,
            "links": links
        }

    def get_history(self):
        return self.history

    def export_history_csv(self):
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(["day", "susceptible", "infected", "recovered"])

        for h in self.history:
            writer.writerow([h["day"], h["susceptible"],
                             h["infected"], h["recovered"]])
        return si.getvalue()

    def _record_history(self):
        self.history.append({
            "day": self.day,
            "susceptible": list(self.statuses.values()).count("susceptible"),
            "infected": list(self.statuses.values()).count("infected"),
            "recovered": list(self.statuses.values()).count("recovered"),
        })
