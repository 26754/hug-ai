// 多语言配置
import { ref, computed } from "vue";
import type { Ref, WritableComputedRef } from "vue";

export const languageList = [
  { label: "简体中文", value: "zh-CN", tips: "简体中文" },
  { label: "English", value: "en", tips: "English" },
  { label: "日本語", value: "ja", tips: "日本語" },
  { label: "한국어", value: "ko", tips: "한국어" },
];

// 获取缓存的语言
export const cachedLocale: WritableComputedRef<string | null> = computed({
  get: () => localStorage.getItem("locale"),
  set: (val) => {
    if (val) {
      localStorage.setItem("locale", val);
    } else {
      localStorage.removeItem("locale");
    }
  },
});
