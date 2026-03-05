import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
} from "electron";
import * as https from "https";
import path from "path";

const APP_ID = "com.lite.sqlearner";
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";
const RELEASES_PAGE_URL = "https://github.com/AperturePlus/lite-sqlearner/releases";
const RELEASES_API_URL =
  "https://api.github.com/repos/AperturePlus/lite-sqlearner/releases/latest";
const AUTO_UPDATE_CHECK_DELAY_MS = 5000;
let mainWindow: BrowserWindow | null = null;
let updateCheckInProgress = false;
let latestPromptedVersion = "";

type ThemeMode = "light" | "dark";
type UpdateCheckStatus = "update-available" | "up-to-date" | "error" | "checking";

interface UpdateCheckResult {
  status: UpdateCheckStatus;
  currentVersion: string;
  latestVersion?: string;
  releaseUrl?: string;
  releaseName?: string;
  message?: string;
}

interface GithubReleasePayload {
  tag_name?: string;
  html_url?: string;
  name?: string;
}

const getWindowPalette = (theme: ThemeMode) => {
  if (theme === "dark") {
    return {
      backgroundColor: "#0f172a",
      titleBarColor: "#0b1220",
      titleBarSymbolColor: "#e2e8f0",
    };
  }
  return {
    backgroundColor: "#f7f7f7",
    titleBarColor: "#ffffff",
    titleBarSymbolColor: "#0f172a",
  };
};

const resolveInitialTheme = (): ThemeMode =>
  nativeTheme.shouldUseDarkColors ? "dark" : "light";

const applyWindowTheme = (window: BrowserWindow, theme: ThemeMode) => {
  const palette = getWindowPalette(theme);
  window.setBackgroundColor(palette.backgroundColor);

  if (isWindows) {
    window.setTitleBarOverlay({
      color: palette.titleBarColor,
      symbolColor: palette.titleBarSymbolColor,
      height: 36,
    });
  }
};

const normalizeVersion = (version: string): string =>
  version.trim().replace(/^v/i, "");

const parseVersion = (version: string) => {
  const normalized = normalizeVersion(version);
  const [corePart, prereleasePart] = normalized.split("-", 2);
  const coreSegments = corePart
    .split(".")
    .filter(Boolean)
    .map((segment) => {
      const value = Number.parseInt(segment, 10);
      return Number.isNaN(value) ? 0 : value;
    });
  const prereleaseSegments = prereleasePart
    ? prereleasePart
        .split(".")
        .filter(Boolean)
        .map((segment) => {
          if (/^\d+$/.test(segment)) {
            return Number.parseInt(segment, 10);
          }
          return segment.toLowerCase();
        })
    : [];
  return { coreSegments, prereleaseSegments };
};

const comparePrerelease = (left: Array<number | string>, right: Array<number | string>) => {
  if (left.length === 0 && right.length === 0) {
    return 0;
  }
  if (left.length === 0) {
    return 1;
  }
  if (right.length === 0) {
    return -1;
  }

  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftSegment = left[index];
    const rightSegment = right[index];

    if (leftSegment == null && rightSegment == null) {
      return 0;
    }
    if (leftSegment == null) {
      return -1;
    }
    if (rightSegment == null) {
      return 1;
    }
    if (leftSegment === rightSegment) {
      continue;
    }

    if (typeof leftSegment === "number" && typeof rightSegment === "number") {
      return leftSegment > rightSegment ? 1 : -1;
    }
    if (typeof leftSegment === "number" && typeof rightSegment === "string") {
      return -1;
    }
    if (typeof leftSegment === "string" && typeof rightSegment === "number") {
      return 1;
    }
    if (leftSegment > rightSegment) {
      return 1;
    }
    if (leftSegment < rightSegment) {
      return -1;
    }
  }

  return 0;
};

const compareVersions = (leftVersion: string, rightVersion: string) => {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);
  const maxLength = Math.max(left.coreSegments.length, right.coreSegments.length, 3);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left.coreSegments[index] ?? 0;
    const rightValue = right.coreSegments[index] ?? 0;
    if (leftValue === rightValue) {
      continue;
    }
    return leftValue > rightValue ? 1 : -1;
  }

  return comparePrerelease(left.prereleaseSegments, right.prereleaseSegments);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? "Unknown error");
};

const fetchLatestRelease = (): Promise<GithubReleasePayload> =>
  new Promise((resolve, reject) => {
    const request = https.request(
      RELEASES_API_URL,
      {
        method: "GET",
        headers: {
          "User-Agent": `Lite-SQLearner/${app.getVersion()}`,
          Accept: "application/vnd.github+json",
        },
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        let rawData = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          rawData += chunk;
        });
        response.on("end", () => {
          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`GitHub API request failed (${statusCode})`));
            return;
          }
          try {
            const parsed = JSON.parse(rawData) as GithubReleasePayload;
            resolve(parsed);
          } catch (_error) {
            reject(new Error("Failed to parse release metadata"));
          }
        });
      }
    );

    request.setTimeout(12000, () => {
      request.destroy(new Error("Update check timed out"));
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });

const isZhLocale = () => app.getLocale().toLowerCase().startsWith("zh");

const promptUpdateDialog = async (update: UpdateCheckResult) => {
  if (update.status !== "update-available") {
    return;
  }
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const zhLocale = isZhLocale();
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: zhLocale ? "发现新版本" : "Update Available",
    message: zhLocale
      ? `检测到新版本 v${update.latestVersion}`
      : `A new version (v${update.latestVersion}) is available`,
    detail: zhLocale
      ? `当前版本：v${update.currentVersion}\n最新版本：v${update.latestVersion}\n是否前往发布页下载更新？`
      : `Current version: v${update.currentVersion}\nLatest version: v${update.latestVersion}\nOpen the releases page to download the update?`,
    buttons: zhLocale ? ["前往下载", "稍后"] : ["Open Releases", "Later"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (response === 0 && update.releaseUrl) {
    void shell.openExternal(update.releaseUrl);
  }
};

const runUpdateCheck = async (manual: boolean): Promise<UpdateCheckResult> => {
  if (updateCheckInProgress) {
    return {
      status: "checking",
      currentVersion: app.getVersion(),
      message: "Update check is already running",
    };
  }

  updateCheckInProgress = true;
  try {
    const currentVersion = normalizeVersion(app.getVersion());
    const latestRelease = await fetchLatestRelease();
    const latestVersion = normalizeVersion(latestRelease.tag_name || "");
    const releaseUrl = latestRelease.html_url || RELEASES_PAGE_URL;

    if (!latestVersion) {
      throw new Error("Latest release version is missing");
    }

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
    if (!hasUpdate) {
      return {
        status: "up-to-date",
        currentVersion,
        latestVersion,
        releaseUrl,
        releaseName: latestRelease.name,
      };
    }

    const result: UpdateCheckResult = {
      status: "update-available",
      currentVersion,
      latestVersion,
      releaseUrl,
      releaseName: latestRelease.name,
    };

    const shouldPrompt = manual || latestPromptedVersion !== latestVersion;
    if (shouldPrompt) {
      latestPromptedVersion = latestVersion;
      await promptUpdateDialog(result);
    }

    return result;
  } catch (error) {
    return {
      status: "error",
      currentVersion: normalizeVersion(app.getVersion()),
      message: getErrorMessage(error),
    };
  } finally {
    updateCheckInProgress = false;
  }
};

const scheduleAutoUpdateCheck = () => {
  if (isDev || !app.isPackaged) {
    return;
  }

  setTimeout(() => {
    void runUpdateCheck(false);
  }, AUTO_UPDATE_CHECK_DELAY_MS);
};

if (isWindows) {
  app.setAppUserModelId(APP_ID);
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const createWindow = () => {
  const initialTheme = resolveInitialTheme();
  const palette = getWindowPalette(initialTheme);
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: palette.backgroundColor,
    ...(isWindows
      ? {
          titleBarStyle: "hidden" as const,
          titleBarOverlay: {
            color: palette.titleBarColor,
            symbolColor: palette.titleBarSymbolColor,
            height: 36,
          },
        }
      : {}),
    ...(isMac ? { titleBarStyle: "hiddenInset" as const } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow = window;

  if (!isDev && process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
  }

  window.once("ready-to-show", () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file://")) {
      return;
    }
    if (
      isDev &&
      process.env.VITE_DEV_SERVER_URL &&
      url.startsWith(process.env.VITE_DEV_SERVER_URL)
    ) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });

  window.on("closed", () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    window.loadURL(devServerUrl);
  } else {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  }
};

if (gotTheLock) {
  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    ipcMain.handle("app:get-system-locale", () => {
      const preferredLanguages = app.getPreferredSystemLanguages?.() || [];
      const firstPreferred = preferredLanguages[0];
      return firstPreferred || app.getLocale() || "en-US";
    });
    ipcMain.handle("app:check-for-updates", () => runUpdateCheck(true));
    ipcMain.handle("app:open-external", (_event, targetUrl: string) => {
      if (typeof targetUrl !== "string") {
        return false;
      }
      const normalizedUrl = targetUrl.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        return false;
      }
      void shell.openExternal(normalizedUrl);
      return true;
    });
    ipcMain.on("app:set-window-theme", (_event, theme: ThemeMode) => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        return;
      }
      if (theme !== "light" && theme !== "dark") {
        return;
      }
      applyWindowTheme(mainWindow, theme);
    });

    createWindow();
    scheduleAutoUpdateCheck();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
