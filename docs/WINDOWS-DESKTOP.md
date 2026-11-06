# ArchOS Windows Desktop

ArchOS can be packaged as a Windows x64 desktop application using Electron.

## Build outputs

The GitHub Actions workflow **ArchOS Windows Desktop Build** creates two executables:

- `ArchOS-<version>-x64.exe`: interactive Windows installer (NSIS)
- `ArchOS-<version>-Portable-x64.exe`: portable executable

The build is available from the workflow's **Artifacts** section as `ArchOS-Windows-x64`.

## Runtime

- Electron starts the existing production Express/Vite backend as a local child process.
- The backend listens only on `127.0.0.1:3173` in the desktop build.
- The application window loads the existing production Vite build; the React UI is not replaced.
- The backend is stopped when the desktop application exits.
- Configuration is stored outside the installation directory at the current user's Electron application-data folder, in `.env`.

On first launch, ArchOS creates that `.env` file with empty `GEMINI_API_KEY`, `OPENAI_API_KEY`, and `ADMIN_API_KEY` entries. Add the keys you use and restart ArchOS. Do not commit API keys to the repository.

## Local build

```powershell
npm install
npm run build
npx electron-builder --win nsis portable --x64
```

The executable files are written to `release\`.
