<template>
  <div class="languageConfig">
    <p class="sectionDesc">{{ $t("settings.language.desc") }}</p>
    <div class="langGrid">
      <div
        v-for="item in languageList"
        :key="item.value"
        class="langCard"
        :class="{ active: selectedLang === item.value }"
        @click="selectLang(item.value)">
        <div class="langInfo">
          <div class="langName">{{ item.label }}</div>
          <div class="langNative">{{ item.tips }}</div>
        </div>
        <t-icon v-if="selectedLang === item.value" name="check-circle-filled" class="checkIcon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MessagePlugin } from "tdesign-vue-next";

interface LanguageItem {
  label: string;
  value: string;
  tips: string;
}

const { locale } = useI18n();

const languageList: LanguageItem[] = [
  { label: "简体中文", value: "zh-CN", tips: "简体中文" },
  { label: "English", value: "en", tips: "English" },
  { label: "日本語", value: "ja", tips: "日本語" },
  { label: "한국어", value: "ko", tips: "한국어" },
];

const selectedLang = ref<string>(
  localStorage.getItem("locale") || "zh-CN"
);

function selectLang(val: string) {
  selectedLang.value = val;
  locale.value = val;
  localStorage.setItem("locale", val);
  MessagePlugin.success(`语言已切换为 ${languageList.find(l => l.value === val)?.label}`);
}

// 初始化
watch(
  () => selectedLang.value,
  (newVal) => {
    locale.value = newVal;
  },
  { immediate: true }
);
</script>

<style scoped>
.languageConfig {
  padding: 16px;
}

.sectionDesc {
  color: var(--td-text-color-secondary);
  margin-bottom: 16px;
  font-size: 14px;
}

.langGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.langCard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.langCard:hover {
  border-color: var(--td-brand-color);
  background-color: var(--td-bg-color-container-hover);
}

.langCard.active {
  border-color: var(--td-brand-color);
  background-color: var(--td-brand-color-light);
}

.langInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.langName {
  font-weight: 500;
  font-size: 16px;
}

.langNative {
  color: var(--td-text-color-secondary);
  font-size: 12px;
}

.checkIcon {
  color: var(--td-brand-color);
  font-size: 20px;
}
</style>
