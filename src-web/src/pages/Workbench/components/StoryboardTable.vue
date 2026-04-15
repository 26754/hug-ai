<template>
  <t-card class="storyboardTable">
    <template #header>
      <div class="titleBar dragHandle">
        <div class="title">
          <t-icon name="table" />
          <span>{{ $t("workbench.production.node.storyboardTable.title") }}</span>
        </div>
        <Handle
          :id="props.handleIds.source"
          type="source"
          :position="Position.Right"
          :style="{ right: '-12px' }" />
        <Handle
          :id="props.handleIds.target"
          type="target"
          :position="Position.Left"
          :style="{ left: '-12px' }" />
      </div>
    </template>

    <!-- 工具栏 -->
    <div class="toolbar">
      <t-button size="small" variant="outline" @click="showAddDialog = true">
        <template #icon>
          <t-icon name="add" />
        </template>
        添加分镜
      </t-button>
      <t-button size="small" variant="outline" @click="exportTable">
        <template #icon>
          <t-icon name="download" />
        </template>
        导出
      </t-button>
    </div>

    <!-- 分镜表格 -->
    <div class="tableContainer">
      <t-table :data="tableData" :columns="columns" row-key="id" stripe hover bordered size="small">
        <template #image="{ row }">
          <div class="imageCell" @click="previewImage(row)">
            <t-image
              v-if="row.image"
              :src="row.image"
              fit="cover"
              :style="{ width: '80px', height: '45px' }" />
            <div v-else class="imagePlaceholder">
              <t-icon name="image" />
            </div>
          </div>
        </template>

        <template #shot="{ row }">
          <t-tag size="small" :theme="getShotTheme(row.shot)">
            {{ getShotLabel(row.shot) }}
          </t-tag>
        </template>

        <template #operations="{ row }">
          <t-button size="small" variant="text" @click="editRow(row)">
            <t-icon name="edit" />
          </t-button>
          <t-button size="small" variant="text" theme="danger" @click="deleteRow(row)">
            <t-icon name="delete" />
          </t-button>
        </template>
      </t-table>
    </div>

    <!-- 编辑对话框 -->
    <t-dialog
      v-model:visible="showEditDialog"
      :header="isEditing ? '编辑分镜' : '添加分镜'"
      width="600px"
      :confirm-btn="{ content: '保存', theme: 'primary' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="saveRow">
      <t-form labelWidth="100">
        <t-form-item label="分镜序号">
          <t-input-number v-model="editForm.index" :min="1" />
        </t-form-item>
        <t-form-item label="画面描述">
          <t-textarea v-model="editForm.imagePrompt" placeholder="描述画面内容..." :rows="3" />
        </t-form-item>
        <t-form-item label="镜头类型">
          <t-select v-model="editForm.shot">
            <t-option value="establishing" label="建立镜头" />
            <t-option value="wide" label="全景" />
            <t-option value="medium" label="中景" />
            <t-option value="closeup" label="特写" />
            <t-option value="pov" label="主观镜头" />
            <t-option value="tracking" label="跟踪镜头" />
          </t-select>
        </t-form-item>
        <t-form-item label="台词">
          <t-textarea v-model="editForm.dialogue" placeholder="角色台词..." :rows="2" />
        </t-form-item>
        <t-form-item label="时长(秒)">
          <t-input-number v-model="editForm.duration" :min="1" :max="300" />
        </t-form-item>
        <t-form-item label="备注">
          <t-textarea v-model="editForm.note" placeholder="其他说明..." :rows="2" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 图片预览 -->
    <t-dialog v-model:visible="showPreview" header="图片预览" width="800px">
      <t-image v-if="previewUrl" :src="previewUrl" fit="contain" style="width: 100%" />
    </t-dialog>
  </t-card>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { MessagePlugin } from "tdesign-vue-next";

interface HandleIds {
  source: string;
  target: string;
}

interface StoryboardRow {
  id: number;
  index: number;
  imagePrompt: string;
  image?: string;
  shot: string;
  dialogue: string;
  duration: number;
  note: string;
}

const props = defineProps<{
  handleIds: HandleIds;
  nodeId: string;
}>();

const tableData = ref<StoryboardRow[]>([]);
const columns = [
  { colKey: "index", title: "序号", width: "60" },
  { colKey: "image", title: "画面", width: "100" },
  { colKey: "imagePrompt", title: "画面描述", ellipsis: true },
  { colKey: "shot", title: "镜头", width: "100" },
  { colKey: "dialogue", title: "台词", ellipsis: true, width: "150" },
  { colKey: "duration", title: "时长", width: "80" },
  { colKey: "operations", title: "操作", width: "100", align: "center" },
];

const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showPreview = ref(false);
const previewUrl = ref("");
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const editForm = reactive({
  index: 1,
  imagePrompt: "",
  shot: "medium",
  dialogue: "",
  duration: 5,
  note: "",
});

function getShotTheme(shot: string): string {
  const themes: Record<string, string> = {
    establishing: "primary",
    wide: "success",
    medium: "warning",
    closeup: "danger",
    pov: "info",
    tracking: "default",
  };
  return themes[shot] || "default";
}

function getShotLabel(shot: string): string {
  const labels: Record<string, string> = {
    establishing: "建立",
    wide: "全景",
    medium: "中景",
    closeup: "特写",
    pov: "主观",
    tracking: "跟踪",
  };
  return labels[shot] || shot;
}

function editRow(row: StoryboardRow) {
  isEditing.value = true;
  editingId.value = row.id;
  Object.assign(editForm, row);
  showEditDialog.value = true;
}

function deleteRow(row: StoryboardRow) {
  const index = tableData.value.findIndex((r) => r.id === row.id);
  if (index !== -1) {
    tableData.value.splice(index, 1);
    MessagePlugin.success("已删除");
  }
}

function saveRow() {
  if (isEditing.value && editingId.value !== null) {
    const index = tableData.value.findIndex((r) => r.id === editingId.value);
    if (index !== -1) {
      tableData.value[index] = { ...editForm, id: editingId.value! };
    }
  } else {
    tableData.value.push({
      ...editForm,
      id: Date.now(),
    });
  }
  showEditDialog.value = false;
  resetForm();
  MessagePlugin.success("保存成功");
}

function resetForm() {
  Object.assign(editForm, {
    index: tableData.value.length + 1,
    imagePrompt: "",
    shot: "medium",
    dialogue: "",
    duration: 5,
    note: "",
  });
  isEditing.value = false;
  editingId.value = null;
}

function previewImage(row: StoryboardRow) {
  if (row.image) {
    previewUrl.value = row.image;
    showPreview.value = true;
  }
}

function exportTable() {
  const headers = ["序号", "画面描述", "镜头", "台词", "时长", "备注"];
  const rows = tableData.value.map((row) => [
    row.index,
    row.imagePrompt,
    getShotLabel(row.shot),
    row.dialogue,
    row.duration + "s",
    row.note,
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `storyboard-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success("导出成功");
}

// 初始化
showAddDialog.value = true; // 触发添加对话框
</script>

<style scoped>
.storyboardTable {
  min-width: 400px;
}

.titleBar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tableContainer {
  max-height: 300px;
  overflow-y: auto;
}

.imageCell {
  cursor: pointer;
}

.imagePlaceholder {
  width: 80px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--td-bg-color-container-hover);
  border-radius: 4px;
  color: var(--td-text-color-disabled);
}
</style>
