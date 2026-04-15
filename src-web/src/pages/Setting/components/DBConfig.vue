<template>
  <div class="dbConfig">
    <!-- 数据库概览 -->
    <t-card class="actionItem">
      <div class="actionInfo">
        <h4>{{ $t("settings.db.dbInfo") }}</h4>
        <p>{{ $t("settings.db.dbInfoDesc") }}</p>
      </div>
      <t-button variant="outline" @click="loadDbInfo" :loading="loading">
        <template #icon>
          <t-icon name="view" />
        </template>
        {{ $t("settings.db.viewInfo") }}
      </t-button>
    </t-card>

    <!-- 数据库信息展示 -->
    <t-card v-if="dbInfo" class="infoCard">
      <t-descriptions :column="2" border>
        <t-descriptions-item label="数据库路径">{{ dbInfo.path }}</t-descriptions-item>
        <t-descriptions-item label="数据库大小">{{ dbInfo.size }}</t-descriptions-item>
        <t-descriptions-item label="小说数量">{{ dbInfo.novelCount }}</t-descriptions-item>
        <t-descriptions-item label="剧本数量">{{ dbInfo.scriptCount }}</t-descriptions-item>
        <t-descriptions-item label="项目数量">{{ dbInfo.projectCount }}</t-descriptions-item>
        <t-descriptions-item label="素材数量">{{ dbInfo.assetsCount }}</t-descriptions-item>
      </t-descriptions>
    </t-card>

    <!-- 导出数据库 -->
    <t-card class="actionItem">
      <div class="actionInfo">
        <h4>{{ $t("settings.db.exportDb") }}</h4>
        <p>{{ $t("settings.db.exportDbDesc") }}</p>
      </div>
      <t-button variant="outline" @click="exportDatabase" :loading="exporting">
        <template #icon>
          <t-icon name="download" />
        </template>
        {{ $t("settings.db.export") }}
      </t-button>
    </t-card>

    <!-- 导入数据库 -->
    <t-card class="actionItem">
      <div class="actionInfo">
        <h4>{{ $t("settings.db.importDb") }}</h4>
        <p>{{ $t("settings.db.importDbDesc") }}</p>
      </div>
      <t-button variant="outline" @click="triggerImport" :loading="importing">
        <template #icon>
          <t-icon name="upload" />
        </template>
        {{ $t("settings.db.import") }}
      </t-button>
      <input
        ref="fileInput"
        type="file"
        accept=".sqlite,.db,.zip"
        style="display: none"
        @change="handleFileSelect" />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { MessagePlugin, DialogPlugin } from "tdesign-vue-next";
import axios from "axios";

interface DbInfo {
  path: string;
  size: string;
  novelCount: number;
  scriptCount: number;
  projectCount: number;
  assetsCount: number;
}

const loading = ref(false);
const exporting = ref(false);
const importing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const dbInfo = ref<DbInfo | null>(null);

async function loadDbInfo() {
  loading.value = true;
  try {
    const response = await axios.get("/api/setting/dbConfig/getInfo");
    if (response.data.success) {
      dbInfo.value = response.data.data;
    }
  } catch (error) {
    MessagePlugin.error("获取数据库信息失败");
  } finally {
    loading.value = false;
  }
}

async function exportDatabase() {
  exporting.value = true;
  try {
    const response = await axios.get("/api/setting/dbConfig/export", {
      responseType: "blob",
    });

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `hug-ai-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    MessagePlugin.success("数据库导出成功");
  } catch (error) {
    MessagePlugin.error("导出失败，请重试");
  } finally {
    exporting.value = false;
  }
}

function triggerImport() {
  fileInput.value?.click();
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // 确认对话框
  const confirmDialog = DialogPlugin.confirm({
    header: "确认导入",
    body: `即将导入数据库文件 "${file.name}"，这将覆盖当前数据。是否继续？`,
    theme: "warning",
    onConfirm: async () => {
      confirmDialog.hide();
      await performImport(file);
    },
  });
}

async function performImport(file: File) {
  importing.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);

    await axios.post("/api/setting/dbConfig/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    MessagePlugin.success("数据库导入成功，页面将刷新");
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    MessagePlugin.error("导入失败，请重试");
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped>
.dbConfig {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actionItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actionInfo h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.actionInfo p {
  margin: 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.infoCard {
  margin-bottom: 8px;
}
</style>
