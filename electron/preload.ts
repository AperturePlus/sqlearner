import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  getSystemLocale: () => ipcRenderer.invoke("app:get-system-locale"),
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  openExternal: (url: string) => ipcRenderer.invoke("app:open-external", url),
  setWindowTheme: (theme: "light" | "dark") =>
    ipcRenderer.send("app:set-window-theme", theme),
});
