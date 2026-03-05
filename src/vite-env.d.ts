/// <reference types="vite/client" />

import { StateTree, PiniaPluginContext } from "pinia";

// 手动声明 pinia-plugin-persistedstate 模块类型
// 原因：该包的 package.json exports 字段未正确配置 types 路径
// 导致 TypeScript 无法正确解析类型定义
declare module "pinia-plugin-persistedstate" {
  import { PiniaPlugin } from "pinia";

  type StorageLike = Pick<Storage, "getItem" | "setItem">;

  interface Serializer {
    serialize: (value: StateTree) => string;
    deserialize: (value: string) => StateTree;
  }

  interface PersistedStateOptions {
    key?: string;
    storage?: StorageLike;
    paths?: Array<string>;
    serializer?: Serializer;
    beforeRestore?: (context: PiniaPluginContext) => void;
    afterRestore?: (context: PiniaPluginContext) => void;
  }

  interface PersistedStateFactoryOptions
    extends Pick<
      PersistedStateOptions,
      "storage" | "serializer" | "afterRestore" | "beforeRestore"
    > {}

  function createPersistedState(
    factoryOptions?: PersistedStateFactoryOptions
  ): PiniaPlugin;

  const piniaPluginPersistedstate: PiniaPlugin;
  export default piniaPluginPersistedstate;
  export { createPersistedState, PersistedStateOptions };
}

declare module "pinia" {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?:
      | boolean
      | import("pinia-plugin-persistedstate").PersistedStateOptions;
  }
}

// Type declarations for monaco-editor internal SQL language module
declare module "monaco-editor/esm/vs/basic-languages/sql/sql" {
  import type { languages } from "monaco-editor";

  export const conf: languages.LanguageConfiguration;
  export const language: languages.IMonarchLanguage;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ElectronBridge {
  platform?: string;
  getSystemLocale?: () => Promise<string>;
  checkForUpdates?: () => Promise<UpdateCheckResult>;
  openExternal?: (url: string) => Promise<boolean>;
  setWindowTheme?: (theme: "light" | "dark") => void;
}

interface UpdateCheckResult {
  status: "update-available" | "up-to-date" | "error" | "checking";
  currentVersion: string;
  latestVersion?: string;
  releaseUrl?: string;
  releaseName?: string;
  message?: string;
}

interface Window {
  electron?: ElectronBridge;
}
