<template>
  <a-config-provider :locale="antLocale">
    <div id="app" :class="{ 'windows-titlebar': useCustomTitleBar }">
      <a-row class="header" type="flex" align="middle">
        <a-col flex="none" class="brand-col">
          <RouterLink to="/" class="brand-link">
            <div class="brand-content">
              <img src="./assets/logo.svg" alt="Lite-SQLearner" class="logo" />
              <span class="title">Lite-SQLearner</span>
            </div>
          </RouterLink>
        </a-col>
        <a-col flex="auto" class="menu-col">
          <a-menu
            :selected-keys="selectedKeys"
            mode="horizontal"
            :style="{ lineHeight: '64px' }"
            @click="doClickMenu"
          >
            <a-menu-item key="/learn">{{ t("app.menu.learn") }}</a-menu-item>
            <a-menu-item key="/levels">{{ t("app.menu.levels") }}</a-menu-item>
            <a-menu-item key="/playground">{{
              t("app.menu.playground")
            }}</a-menu-item>
          </a-menu>
        </a-col>
        <a-col flex="380px" class="toolbar-col">
          <a-space :size="12" class="toolbar-space">
            <a-button
              v-if="showUpdateButton"
              size="small"
              class="update-button"
              :loading="isCheckingUpdates"
              @click="handleCheckForUpdates"
            >
              {{ checkUpdateLabel }}
            </a-button>
            <span class="language-label">
              <svg
                class="language-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M12 2.5C12 2.5 8.5 7 8.5 12s3.5 9.5 3.5 9.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M12 2.5C12 2.5 15.5 7 15.5 12s-3.5 9.5-3.5 9.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M2.5 12h19"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M3.5 8h17M3.5 16h17"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-dasharray="1 0"
                />
              </svg>
              {{ t("app.language.label") }}
            </span>
            <a-select
              v-model:value="languagePreference"
              size="small"
              class="language-select"
              dropdown-class-name="app-language-dropdown"
              :options="languageOptions"
            />
            <a-switch
              class="theme-switch"
              :checked="isDark"
              :checked-children="t('app.theme.dark')"
              :un-checked-children="t('app.theme.light')"
              @change="handleThemeChange"
            />
          </a-space>
        </a-col>
      </a-row>
      <div class="content">
        <router-view />
      </div>
      <div class="footer">
        <p>{{ footerText }}</p>
      </div>
      <a-back-top :style="{ right: '60px' }" />

      <AISidebar v-if="showAISidebar" />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import enUS from "ant-design-vue/es/locale/en_US";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import { useGlobalStore } from "./core/globalStore";
import type { LanguagePreference } from "./core/i18n";
import { useAppI18n } from "./composables/useAppI18n";

const AISidebar = defineAsyncComponent(
  () => import("./components/AISidebar.vue")
);

const route = useRoute();
const router = useRouter();
const globalStore = useGlobalStore();
const { t, locale } = useAppI18n();
const electronBridge = (window as Window).electron;
const useCustomTitleBar = electronBridge?.platform === "win32";
const isCheckingUpdates = ref(false);

const selectedKeys = computed(() => {
  if (route.path === "/" || route.path.startsWith("/learn")) {
    return ["/learn"];
  }
  if (route.path.startsWith("/levels")) {
    return ["/levels"];
  }
  if (route.path.startsWith("/playground")) {
    return ["/playground"];
  }
  return [];
});
const showAISidebar = computed(() => {
  return (
    route.path === "/" ||
    route.path.startsWith("/learn") ||
    route.path.startsWith("/playground")
  );
});
const isDark = computed(() => globalStore.theme === "dark");
const antLocale = computed(() => (locale.value === "en-US" ? enUS : zhCN));
const showUpdateButton = computed(() =>
  Boolean(electronBridge?.checkForUpdates)
);
const checkUpdateLabel = computed(() =>
  locale.value === "zh-CN" ? "检查更新" : "Check Updates"
);
const languagePreference = computed<LanguagePreference>({
  get: () => globalStore.languagePreference,
  set: (value) => globalStore.setLanguagePreference(value),
});
const languageOptions = computed(() => [
  { value: "auto", label: t("app.language.auto") },
  { value: "zh-CN", label: t("app.language.zhCN") },
  { value: "en-US", label: t("app.language.enUS") },
]);
const currentYear = computed(() => new Date().getFullYear());
const footerText = computed(() => t("app.footer", { year: currentYear.value }));

const doClickMenu = ({ key }: any) => {
  if (key && key !== "theme") {
    router.push({
      path: key,
    });
  }
};

const handleThemeChange = (checked: boolean) => {
  globalStore.theme = checked ? "dark" : "light";
};

const handleCheckForUpdates = async () => {
  if (!electronBridge?.checkForUpdates || isCheckingUpdates.value) {
    return;
  }

  isCheckingUpdates.value = true;
  try {
    const result = await electronBridge.checkForUpdates();
    const isZh = locale.value === "zh-CN";

    if (result.status === "up-to-date") {
      message.success(
        isZh
          ? `当前已是最新版本（v${result.currentVersion}）`
          : `You're up to date (v${result.currentVersion})`
      );
      return;
    }

    if (result.status === "update-available") {
      message.info(
        isZh
          ? `检测到新版本 v${result.latestVersion}，已弹出下载提示`
          : `New version v${result.latestVersion} found. Download prompt shown.`
      );
      return;
    }

    if (result.status === "checking") {
      message.info(
        isZh
          ? "正在进行更新检查，请稍后重试"
          : "Update check is already running. Please try again shortly."
      );
      return;
    }

    message.error(
      isZh
        ? `检查更新失败：${result.message || "未知错误"}`
        : `Failed to check for updates: ${result.message || "Unknown error"}`
    );
  } catch (error) {
    const isZh = locale.value === "zh-CN";
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    message.error(
      isZh
        ? `检查更新失败：${errorMessage}`
        : `Failed to check for updates: ${errorMessage}`
    );
  } finally {
    isCheckingUpdates.value = false;
  }
};

watch(
  () => globalStore.theme,
  (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    electronBridge?.setWindowTheme?.(theme);
  },
  { immediate: true }
);

watch(
  () => locale.value,
  (nextLocale) => {
    document.documentElement.lang = nextLocale;
  },
  { immediate: true }
);
</script>

<style scoped>
.header {
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px;
  background: var(--header-bg);
  -webkit-app-region: drag;
  user-select: none;
}

#app.windows-titlebar .header {
  padding-top: 8px;
  padding-right: 160px;
}

.brand-col {
  flex-shrink: 0;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.brand-content {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.menu-col {
  min-width: 0;
  padding: 0 16px;
}

.ant-menu-horizontal {
  border-bottom: none !important;
}

.logo {
  width: 56px;
}

.title {
  margin-left: 8px;
  font-size: 20px;
  line-height: 1;
  white-space: nowrap;
  color: var(--text-color);
}

.content {
  padding: 24px;
}

.toolbar-col {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.toolbar-space {
  align-items: center;
}

.update-button {
  white-space: nowrap;
}

:deep(.ant-menu) {
  -webkit-app-region: no-drag;
}

.language-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-text);
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.language-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.75;
}

.language-select {
  min-width: 130px;
}

.theme-switch {
  min-width: 78px;
}

:global([data-theme="dark"] .language-select .ant-select-selector) {
  background: rgba(15, 23, 42, 0.85) !important;
  border-color: rgba(71, 85, 105, 0.55) !important;
  color: var(--text-color) !important;
}

:global([data-theme="dark"] .language-select:hover .ant-select-selector),
:global([data-theme="dark"]
    .language-select.ant-select-focused
    .ant-select-selector) {
  border-color: rgba(96, 165, 250, 0.75) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15) !important;
}

:global([data-theme="dark"] .language-select .ant-select-selection-item),
:global([data-theme="dark"] .language-select .ant-select-arrow) {
  color: #e2e8f0 !important;
}

:global([data-theme="dark"] .app-language-dropdown) {
  background: #0f172a !important;
  border: 1px solid rgba(71, 85, 105, 0.55);
  box-shadow: 0 10px 28px rgba(2, 6, 23, 0.5);
}

:global([data-theme="dark"] .app-language-dropdown .ant-select-item) {
  color: #e2e8f0 !important;
}

:global([data-theme="dark"]
    .app-language-dropdown
    .ant-select-item-option-active:not(.ant-select-item-option-disabled)) {
  background: rgba(30, 41, 59, 0.85) !important;
}

:global([data-theme="dark"]
    .app-language-dropdown
    .ant-select-item-option-selected:not(.ant-select-item-option-disabled)) {
  background: rgba(59, 130, 246, 0.22) !important;
  color: #bfdbfe !important;
}

:global([data-theme="dark"] .toolbar-col .ant-switch) {
  background: rgba(71, 85, 105, 0.5) !important;
}

:global([data-theme="dark"] .toolbar-col .ant-switch-checked) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
}

:global([data-theme="dark"] .toolbar-col .ant-switch-inner) {
  color: #e2e8f0 !important;
}

.footer {
  padding: 12px;
  text-align: center;
  background: var(--footer-bg);
}

.footer p {
  margin-bottom: 4px;
}
</style>
