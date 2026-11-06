const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const PORT = 3173;
const HOST = "127.0.0.1";
let backend = null;
let mainWindow = null;
let quitting = false;

function requestHealth() {
  return new Promise((resolve) => {
    const request = http.get({ host: HOST, port: PORT, path: "/healthz", timeout: 1500 }, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on("timeout", () => { request.destroy(); resolve(false); });
    request.on("error", () => resolve(false));
  });
}

async function waitForBackend(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (backend && backend.exitCode !== null) {
      throw new Error("De ArchOS-backend is gestopt tijdens het opstarten.");
    }
    if (await requestHealth()) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("De lokale ArchOS-backend reageert niet binnen 30 seconden.");
}

function startBackend() {
  const backendRoot = path.join(process.resourcesPath, "backend");
  const entry = path.join(backendRoot, "dist", "server.cjs");
  if (!fs.existsSync(entry)) {
    throw new Error("Backendbestand ontbreekt: " + entry);
  }

  const userConfig = path.join(app.getPath("userData"), ".env");
  if (!fs.existsSync(userConfig)) {
    fs.mkdirSync(path.dirname(userConfig), { recursive: true });
    fs.writeFileSync(
      userConfig,
      "# ArchOS lokale configuratie\n# Vul alleen de API-sleutels in die je wilt gebruiken.\nGEMINI_API_KEY=\nOPENAI_API_KEY=\nADMIN_API_KEY=\n",
      "utf8"
    );
  }

  backend = spawn(process.execPath, [entry], {
    cwd: backendRoot,
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOST,
      ARCHOS_ENV_FILE: userConfig
    }
  });

  backend.on("error", (error) => {
    if (!quitting) dialog.showErrorBox("ArchOS backendfout", error.message);
  });
  backend.on("exit", (code) => {
    if (!quitting && code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox("ArchOS afgesloten", "De lokale backend is onverwacht gestopt (code " + code + ").");
    }
  });
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    backgroundColor: "#05070b",
    title: "ArchOS",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL("http://" + HOST + ":" + PORT);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  try {
    startBackend();
    await waitForBackend();
    await createMainWindow();
  } catch (error) {
    dialog.showErrorBox("ArchOS kon niet starten", error.message || String(error));
    app.quit();
  }
});

app.on("before-quit", () => {
  quitting = true;
  if (backend && !backend.killed) backend.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0 && await requestHealth()) {
    await createMainWindow();
  }
});
