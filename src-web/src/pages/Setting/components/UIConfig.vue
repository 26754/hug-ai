<template>
  <div class="uiConfig">
    <t-form labelAlign="top">
      <!-- 颜色模式 -->
      <t-form-item label="颜色模式">
        <t-radio-group variant="default-filled" v-model="themeSetting.mode">
          <t-radio-button value="auto">自动</t-radio-button>
          <t-radio-button value="light">浅色</t-radio-button>
          <t-radio-button value="dark">深色</t-radio-button>
        </t-radio-group>
      </t-form-item>

      <!-- 主题色 -->
      <t-form-item label="主题色">
        <div class="themeColorConfig">
          <button
            v-for="color in presetColors"
            :key="color"
            class="presetColor"
            :class="{ active: normalizeColor(themeSetting.primaryColor) === color }"
            :style="{ backgroundColor: color }"
            type="button"
            @click="themeSetting.primaryColor = color" />
          <t-color-picker
            v-model="themeSetting.primaryColor"
            :color-modes="['monochrome']"
            format="HEX"
            :enable-alpha="false" />
        </div>
      </t-form-item>

      <!-- 字体大小 -->
      <t-form-item label="字体大小">
        <t-radio-group variant="default-filled" v-model="themeSetting.fontSize">
          <t-radio-button :value="12">极小</t-radio-button>
          <t-radio-button :value="13">较小</t-radio-button>
          <t-radio-button :value="14">小</t-radio-button>
          <t-radio-button :value="16">默认</t-radio-button>
          <t-radio-button :value="18">大</t-radio-button>
          <t-radio-button :value="20">极大</t-radio-button>
        </t-radio-group>
      </t-form-item>

      <!-- 保存按钮 -->
      <t-form-item>
        <t-button theme="primary" @click="saveTheme" :loading="saving">
          保存设置
        </t-button>
      </t-form-item>
    </t-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { MessagePlugin } from "tdesign-vue-next";

interface ThemeSetting {
  mode: "auto" | "light" | "dark";
  primaryColor: string;
  fontSize: number;
}

const themeSetting = ref<ThemeSetting>({
  mode: "auto",
  primaryColor: "#0052d9",
  fontSize: 16,
});

const saving = ref(false);

const presetColors = [
  "#0052d9", // 科技蓝
  "#0594fa",
  "#008d57", // 翡翠绿
  "#00a870",
  "#d94008", // 橙红
  "#e34d26",
  "#7a34eb", // 紫色
  "#8b5cf6",
  "#0f172a", // 深灰
  "#1e293b",
];

function normalizeColor(color: string): string {
  return color.toLowerCase();
}

function saveTheme() {
  saving.value = true;
  try {
    // 保存到本地存储
    localStorage.setItem("themeSetting", JSON.stringify(themeSetting.value));

    // 应用主题
    applyTheme();

    MessagePlugin.success("主题设置已保存");
  } finally {
    saving.value = false;
  }
}

function applyTheme() {
  const root = document.documentElement;

  // 应用字体大小
  root.style.fontSize = `${themeSetting.value.fontSize}px`;

  // 应用主题色 (作为 CSS 变量)
  root.style.setProperty("--td-brand-color", themeSetting.value.primaryColor);

  // 应用颜色模式
  if (themeSetting.value.mode === "dark") {
    document.body.classList.add("tdesign-theme-dark");
    document.body.classList.remove("tdesign-theme-light");
  } else if (themeSetting.value.mode === "light") {
    document.body.classList.add("tdesign-theme-light");
    document.body.classList.remove("tdesign-theme-dark");
  } else {
    document.body.classList.remove("tdesign-theme-dark", "tdesign-theme-light");
  }
}

onMounted(() => {
  // 加载已保存的主题
  const saved = localStorage.getItem("themeSetting");
  if (saved) {
    try {
      themeSetting.value = JSON.parse(saved);
      applyTheme();
    } catch (e) {
      console.error("Failed to load theme:", e);
    }
  }
});
</script>

<style scoped>
.uiConfig {
  padding: 16px;
}

.themeColorConfig {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.presetColor {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.presetColor:hover {
  transform: scale(1.1);
}

.presetColor.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--td-brand-color);
}
</style>
