<template>
  <div class="setting-page">
    <t-layout>
      <!-- 侧边栏 -->
      <t-aside class="setting-aside">
        <div class="logo">
          <t-icon name="chat" size="28px" />
          <span>HUG AI</span>
        </div>
        <t-menu v-model:value="activeMenu" theme="dark">
          <t-menu-item value="language">
            <template #icon>
              <t-icon name="language" />
            </template>
            {{ $t("settings.language.title") }}
          </t-menu-item>
          <t-menu-item value="ui">
            <template #icon>
              <t-icon name="palette" />
            </template>
            {{ $t("settings.ui.title") }}
          </t-menu-item>
          <t-menu-item value="database">
            <template #icon>
              <t-icon name="database" />
            </template>
            {{ $t("settings.db.title") }}
          </t-menu-item>
          <t-menu-item value="vendor">
            <template #icon>
              <t-icon name="cloud" />
            </template>
            {{ $t("settings.vendor.title") }}
          </t-menu-item>
        </t-menu>
      </t-aside>

      <!-- 主内容区 -->
      <t-layout>
        <t-content class="setting-content">
          <div class="content-header">
            <h2>{{ currentTitle }}</h2>
          </div>
          <div class="content-body">
            <component :is="currentComponent" />
          </div>
        </t-content>
      </t-layout>
    </t-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import LanguageConfig from "./components/LanguageConfig.vue";
import UIConfig from "./components/UIConfig.vue";
import DBConfig from "./components/DBConfig.vue";
import VendorConfig from "./components/VendorConfig.vue";

const { t } = useI18n();

const activeMenu = ref("language");

const menuTitleMap: Record<string, string> = {
  language: "settings.language.title",
  ui: "settings.ui.title",
  database: "settings.db.title",
  vendor: "settings.vendor.title",
};

const currentTitle = computed(() => t(menuTitleMap[activeMenu.value] || "settings.title"));

const componentMap: Record<string, any> = {
  language: LanguageConfig,
  ui: UIConfig,
  database: DBConfig,
  vendor: VendorConfig,
};

const currentComponent = computed(() => componentMap[activeMenu.value] || null);
</script>

<style scoped>
.setting-page {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.setting-aside {
  width: 240px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.setting-content {
  background: var(--td-bg-color-container);
  overflow-y: auto;
}

.content-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.content-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.content-body {
  padding: 24px 32px;
  max-width: 800px;
}

/* TDesign 暗色主题适配 */
:deep(.t-menu) {
  background: transparent;
  border-right: none;
}

:deep(.t-menu__item) {
  margin: 4px 8px;
  border-radius: 8px;
}

:deep(.t-menu__item:hover) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.t-menu__item--active) {
  background: rgba(0, 82, 217, 0.3) !important;
}
</style>
