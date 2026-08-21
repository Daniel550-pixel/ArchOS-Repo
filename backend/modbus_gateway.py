"""
ArchOS BMS Gateway: real Modbus-TCP reader -> MQTT bridge.
--sim spins up a local Modbus slave so the protocol path is 100% real
even without physical hardware. Swap --host to your PLC/BMS IP in prod.
"""
import argparse, json, time, threading
import paho.mqtt.client as mqtt

REGISTERS = [  # (field, address, scale)
    ("strain_mpa",   0, 0.1),
    ("accel_ms2",    1, 0.001),
    ("chiller_dt_c", 2, 0.1),
    ("power_mw",     3, 0.1),
    ("supply_temp_c",4, 0.1),
    ("flow_lps",     5, 0.1),
]
STATE_FILE = "bms_state.json"

def start_sim_server():
    from pymodbus.server import StartTcpServer
    from pymodbus.datastore import (ModbusSequentialDataBlock,
                                    ModbusSlaveContext, ModbusServerContext)
    import random, math
    store = ModbusSlaveContext(hr=ModbusSequentialDataBlock(0, [0]*100))
    ctx = ModbusServerContext(slaves=store, single=True)
    def mutate():
        t = 0
        while True:
            t += 1
            vals = [int(1420+math.sin(t/10)*40), int(12+random.uniform(-2,2)),
                    int(48+math.sin(t/20)*6), int(84+math.sin(t/15)*5),
                    int(72+random.uniform(-3,3)), int(120+random.uniform(-5,5))]
            store.setValues(3, 0, vals)  # fc=3 holding registers
            time.sleep(1)
    threading.Thread(target=mutate, daemon=True).start()
    threading.Thread(target=lambda: StartTcpServer(context=ctx, address=("0.0.0.0", 5020)), daemon=True).start()
    print("[BMS] Sim Modbus slave on :5020")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=5020)
    ap.add_argument("--sim", action="store_true")
    ap.add_argument("--broker", default="localhost")
    args = ap.parse_args()

    if args.sim: start_sim_server(); time.sleep(1)

    from pymodbus.client import ModbusTcpClient
    mb = ModbusTcpClient(args.host, port=args.port)
    mq = mqtt.Client()
    mq.connect(args.broker, 1883)

    print(f"[BMS] Reading {args.host}:{args.port} -> MQTT archos/b4471/bms")
    while True:
        try:
            if not mb.connect(): raise IOError("modbus connect failed")
            rr = mb.read_holding_registers(address=0, count=len(REGISTERS))
            mb.close()
            if rr.isError(): raise IOError(str(rr))
            state = {"ts": time.time(), "source": f"modbus://{args.host}:{args.port}"}
            for (field, _addr, scale), raw in zip(REGISTERS, rr.registers):
                state[field] = round(raw * scale, 3)
            mq.publish("archos/b4471/bms", json.dumps(state), retain=True)
            with open(STATE_FILE, "w") as f: json.dump(state, f)
        except Exception as e:
            print("[BMS] read error:", e)
        time.sleep(1)

if __name__ == "__main__":
    main()
