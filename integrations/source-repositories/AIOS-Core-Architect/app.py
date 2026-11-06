import threading
import time
from datetime import datetime
import gradio as gr
import os
import json

# Load AIOS configs
CONFIG_PATH = "configs"

def load_json(file_name):
    path = os.path.join(CONFIG_PATH, file_name)
    with open(path, "r") as f:
        return json.load(f)

system_config = load_json("system_config.json")
modules_config = load_json("modules.json")

# AIOS module class
class Module:
    def __init__(self, name):
        self.name = name
        self.active = True
        self.revenue = 0
        self.logs = []

    def simulate_revenue(self, amount=1000):
        if self.active:
            self.revenue += amount
            timestamp = datetime.utcnow().isoformat()
            self.logs.append(f"[{timestamp}] {self.name} revenue: {self.revenue}")

# Initialize all modules
all_modules = {m: Module(m) for m_list in modules_config.values() for m in m_list}

# AIOS simulation loop
def aios_loop():
    while True:
        for m in all_modules.values():
            m.simulate_revenue()
        time.sleep(3)

# Start AIOS thread
threading.Thread(target=aios_loop, daemon=True).start()

# Gradio interface for live logs

def get_logs():
    logs = []
    for m in all_modules.values():
        logs.extend(m.logs[-5:])
    logs.sort()
    return "\n".join(logs[-50:])

with gr.Blocks() as demo:
    log_box = gr.Textbox(label="AIOS Logs", lines=25, interactive=False)
    refresh_btn = gr.Button("Refresh Logs")
    refresh_btn.click(get_logs, outputs=log_box)

demo.launch(server_name="0.0.0.0", server_port=7860)
