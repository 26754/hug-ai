<template>
  <div class="uiConfig">
    <t-form labelAlign="top">
      <!-- 颜色模式 -->
      <t-form-item label="颜色模式">
        <t-radio-group variant="default-filled" v-model="themeConfig.mode" @change="handleModeChange">
          <t-radio-button value="auto">
            <t-icon name="refresh" />
            自动
          </t-radio-button>
          <t-radio-button value="light">
            <t-icon name="sunny" />
            浅色
          </t-radio-button>
          <t-radio-button value="dark">
            <t-icon name="moon" />
            深色
          </t-radio-button>
        </t-radio-group>
        <div class="mode-hint" v-if="themeConfig.mode === 'auto'">
          当前跟随系统: {{ isDark ? '深色模式' : '浅色模式' }}
        </div>
      </t-form-item>

      <!-- 主题色 -->
      <t-form-item label="主题色">
        <div class="themeColorConfig">
          <button
            v-for="color in presetColors"
            :key="color"
            class="presetColor"
            :class="{ active: normalizeColor(themeConfig.primaryColor) === color }"
            :style="{ backgroundColor: color }"
            type="button"
            @click="themeConfig.primaryColor = color" />
          <t-color-picker
            v-model="themeConfig.primaryColor"
            :color-modes="['monochrome', 'linear']"
            format="HEX"
            :enable-alpha="false"
            :swatch-width="32"
            :swatch-height="32" />
        </div>
      </t-form-item>

      <!-- 字体大小 -->
      <t-form-item label="字体大小">
        <div class="fontSizeConfig">
          <t-slider
            v-model="themeConfig.fontSize"
            :min="12"
            :max="20"
            :step="1"
            :marks="{ 12: '12', 14: '14', 16: '16', 18: '18', 20: '20' }"
            @change="handleFontSizeChange" />
          <span class="fontSizeValue">{{ themeConfig.fontSize }}px</span>
        </div>
        <div class="preview-text" :style="{ fontSize: `${themeConfig.fontSize}px` }">
          预览文本：这是一段示例文字，用于预览字体大小效果
        </div>
      </t-form-item>

      <!-- 紧凑模式 -->
      <t-form-item label="界面密度">
        <t-radio-group variant="default-filled" v-model="compactMode">
          <t-radio-button :value="false">
            <t-icon name="chart-default" />
            默认
          </t-radio-button>
          <t-radio-button :value="true">
            <t-icon name="compact" />
            紧凑
          </t-radio-button>
        </t-radio-group>
      </t-form-item>

      <!-- 动画效果 -->
      <t-form-item label="动画效果">
        <t-switch v-model="enableAnimation" />
        <span class="switch-label">{{ enableAnimation ? '启用' : '禁用' }}</span>
      </t-form-item>

      <!-- 保存按钮 -->
      <t-form-item>
        <t-space>
          <t-button theme="primary" @click="saveTheme" :loading="saving">
            <template #icon>
              <t-icon name="save" />
            </template>
            保存设置
          </t-button>
          <t-button variant="outline" @click="resetTheme">
            <template #icon>
              <t-icon name="refresh" />
            </template>
            重置
          </t-button>
        </t-space>
      </t-form-item>

      <!-- 快捷键提示 -->
      <t-divider />
      <t-form-item label="快捷键">
        <div class="shortcuts-hint">
          <t-space direction="vertical" :size="8">
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + D</span>
              <span class="shortcut-desc">切换暗色模式</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + S</span>
              <span class="shortcut-desc">保存</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">F11</span>
              <span class="shortcut-desc">全屏</span>
            </div>
          </t-space>
        </div>
      </t-form-item>
    </t-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import { useTheme, presetColors as defaultPresetColors, type ThemeMode, type FontSize } from "@/utils/useTheme";

const { config, isDark, setMode, setPrimaryColor, setFontSize, save, reset, updateDarkMode } = useTheme();

const themeConfig = ref({
  mode: config.value.mode as ThemeMode,
  primaryColor: config.value.primaryColor,
  fontSize: config.value.fontSize as FontSize,
});

const compactMode = ref(false);
const enableAnimation = ref(true);
const saving = ref(false);

// 预设颜色
const presetColors = defaultPresetColors;

function normalizeColor(color: string): string {
  return color.toLowerCase();
}

function handleModeChange(value: ThemeMode) {
  setMode(value);
}

function handleFontSizeChange(value: number) {
  setFontSize(value as FontSize);
}

async function saveTheme() {
  saving.value = true;
  try {
    // 同步配置
    config.value.mode = themeConfig.value.mode;
    config.value.primaryColor = themeConfig.value.primaryColor;
    config.value.fontSize = themeConfig.value.fontSize;
    
    // 应用设置
    setMode(themeConfig.value.mode);
    setPrimaryColor(themeConfig.value.primaryColor);
    setFontSize(themeConfig.value.fontSize);
    save();
    
    // 保存其他设置
    localStorage.setItem("compactMode", String(compactMode.value));
    localStorage.setItem("enableAnimation", String(enableAnimation.value));
    
    MessagePlugin.success("主题设置已保存");
  } finally {
    saving.value = false;
  }
}

function resetTheme() {
  themeConfig.value = {
    mode: "auto",
    primaryColor: "#0052d9",
    fontSize: 16,
  };
  compactMode.value = false;
  enableAnimation.value = true;
  
  reset();
  updateDarkMode();
  
  MessagePlugin.info("已重置为默认设置");
}

onMounted(() => {
  // 加载保存的设置
  const savedCompact = localStorage.getItem("compactMode");
  if (savedCompact !== null) {
    compactMode.value = savedCompact === "true";
  }
  
  const savedAnimation = localStorage.getItem("enableAnimation");
  if (savedAnimation !== null) {
    enableAnimation.value = savedAnimation !== "false";
  }
  
  // 应用紧凑模式
  if (compactMode.value) {
    document.documentElement.classList.add("compact-mode");
  }
  
  // 应用动画设置
  if (!enableAnimation.value) {
    document.documentElement.classList.add("no-animation");
  }
});

// 监听紧凑模式变化
watch(compactMode, (value) => {
  if (value) {
    document.documentElement.classList.add("compact-mode");
  } else {
    document.documentElement.classList.remove("compact-mode");
  }
});

// 监听动画设置变化
watch(enableAnimation, (value) => {
  if (value) {
    document.documentElement.classList.remove("no-animation");
  } else {
    document.documentElement.classList.add("no-animation");
  }
});
</script>

<style scoped>
.uiConfig {
  padding: 20px;
  max-width: 600px;
}

.mode-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.themeColorConfig {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.presetColor {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.presetColor:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.presetColor.active {
  border-color: var(--td-brand-color, #0052d9);
  box-shadow: 0 0 0 2px var(--td-brand-color, #0052d9);
}

.fontSizeConfig {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.fontSizeConfig :deep(.t-slider) {
  flex: 1;
}

.fontSizeValue {
  min-width: 50px;
  text-align: right;
  font-weight: 500;
  color: var(--td-brand-color, #0052d9);
}

.preview-text {
  margin-top: 12px;
  padding: 12px;
  background: var(--td-bg-color-container, #fff);
  border-radius: 6px;
  border: 1px dashed var(--td-border-level-1-color, #e7e7e7);
  color: var(--td-text-color-primary, rgba(0, 0, 0, 0.9));
}

.switch-label {
  margin-left: 12px;
  color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
}

.shortcuts-hint {
  background: var(--td-bg-color-container, #fff);
  padding: 12px;
  border-radius: 6px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortcut-key {
  padding: 4px 8px;
  background: var(--td-bg-color-secondary-container, #f3f3f3);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: var(--td-text-color-primary, rgba(0, 0, 0, 0.9));
}

.shortcut-desc {
  color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
  font-size: 13px;
}

/* 暗色模式适配 */
:deep(.dark) .preview-text,
.dark .preview-text {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.dark) .shortcuts-hint,
.dark .shortcuts-hint {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.dark) .shortcut-key,
.dark .shortcut-key {
  background: rgba(255, 255, 255, 0.1);
}
</style>
