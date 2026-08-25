import { Router } from "express";
import { agentRegistry, createArchOSMission, eventEngine, executionCoordinator, missionEngine, replayMission } from "../../src/archos/index";

export const missionRouter = Router();
const missions = new Map<string, ReturnType<typeof createArchOSMission>>();

missionRouter.get("/agents", (_req, res) => {
  res.json({ agents: agentRegistry.list() });
});

missionRouter.get("/missions", (_req, res) => {
  res.json({ missions: [...missions.values()] });
});

missionRouter.post("/missions", (req, res) => {
  const { title, objective, risk, tasks } = req.body ?? {};
  if (typeof title !== "string" || typeof objective !== "string" || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "title, objective and tasks are required" });
  }
  try {
    const mission = createArchOSMission({ title, objective, risk, tasks });
    missions.set(mission.id, mission);
    return res.status(201).json(mission);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid mission" });
  }
});

missionRouter.post("/missions/:id/plan", (req, res) => {
  const mission = missions.get(req.params.id);
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  const next = missionEngine.plan(mission, req.body?.actor ?? "operator");
  missions.set(next.id, next);
  return res.json(next);
});

missionRouter.post("/missions/:id/assign", (req, res) => {
  const mission = missions.get(req.params.id);
  const { taskId, agentId, actor = "orchestrator" } = req.body ?? {};
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  if (typeof taskId !== "string" || typeof agentId !== "string") {
    return res.status(400).json({ error: "taskId and agentId are required" });
  }
  try {
    const next = missionEngine.assign(mission, taskId, agentId, actor);
    missions.set(next.id, next);
    return res.json(next);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Assignment failed" });
  }
});

missionRouter.post("/missions/:id/start", (req, res) => {
  const mission = missions.get(req.params.id);
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  const next = missionEngine.start(mission, req.body?.actor ?? "orchestrator");
  missions.set(next.id, next);
  return res.json(next);
});

missionRouter.post("/missions/:id/tasks/:taskId/execute", async (req, res) => {
  const mission = missions.get(req.params.id);
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  try {
    const result = await executionCoordinator.executeTask(mission, req.params.taskId, req.body?.actor ?? "orchestrator");
    missions.set(result.mission.id, result.mission);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Task execution failed" });
  }
});

missionRouter.post("/missions/:id/verify", (req, res) => {
  const mission = missions.get(req.params.id);
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  const next = missionEngine.verify(mission, req.body?.actor ?? "verification");
  missions.set(next.id, next);
  return res.json(next);
});

missionRouter.get("/missions/:id/replay", (req, res) => {
  if (!missions.has(req.params.id)) return res.status(404).json({ error: "Mission not found" });
  return res.json({ missionId: req.params.id, events: replayMission(req.params.id) });
});

missionRouter.get("/events", (req, res) => {
  const missionId = typeof req.query.missionId === "string" ? req.query.missionId : undefined;
  return res.json({ events: eventEngine.list(missionId) });
});
