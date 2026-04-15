<template>
  <div class="modelMap">
    <t-card>
      <template #header>
        <div class="cardHeader">
          <span>模型映射配置</span>
          <t-space>
            <t-button variant="outline" @click="loadModelMap">
              <template #icon>
                <t-icon name="refresh" />
              </template>
              刷新
            </t-button>
            <t-button theme="primary" @click="showAddDialog = true">
              <template #icon>
                <t-icon name="add" />
              </template>
              添加映射
            </t-button>
          </t-space>
        </div>
      </template>

      <!-- 说明 -->
      <t-alert theme="info" class="infoAlert">
        <template #message>
          模型映射用于将供应商的模型 ID 转换为内部统一标识符，方便在不同供应商之间切换使用。
        </template>
      </t-alert>

      <!-- 映射列表 -->
      <t-table :data="modelMaps" :columns="columns" row-key="id" stripe hover>
        <template #model="{ row }">
          <div class="modelCell">
            <span class="internalModel">{{ row.internalModel }}</span>
            <t-icon name="arrow-right" />
            <span class="externalModel">{{ row.externalModel }}</span>
          </div>
        </template>
        <template #vendor="{ row }">
          <t-tag>{{ row.vendor }}</t-tag>
        </template>
        <template #status="{ row }">
          <t-switch v-model="row.enabled" @change="toggleEnabled(row)" />
        </template>
        <template #operations="{ row }">
          <t-button size="small" variant="text" @click="editMapping(row)">编辑</t-button>
          <t-button size="small" variant="text" theme="danger" @click="deleteMapping(row)">删除</t-button>
        </template>
      </t-table>
    </t-card>

    <!-- 添加/编辑对话框 -->
    <t-dialog
      v-model:visible="showAddDialog"
      :header="editingId ? '编辑映射' : '添加映射'"
      width="500px"
      :confirm-btn="{ content: '保存', theme: 'primary' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="saveMapping">
      <t-form labelWidth="120">
        <t-form-item label="供应商" required>
          <t-select v-model="formData.vendor" placeholder="选择供应商">
            <t-option v-for="v in vendors" :key="v" :value="v" :label="v" />
          </t-select>
        </t-form-item>
        <t-form-item label="内部模型 ID" required>
          <t-input v-model="formData.internalModel" placeholder="如: gpt-4" />
          <template #description>
            内部使用的统一模型标识符
          </template>
        </t-form-item>
        <t-form-item label="外部模型 ID" required>
          <t-input v-model="formData.externalModel" placeholder="如: claude-3-opus" />
          <template #description>
            供应商实际的模型 ID
          </template>
        </t-form-item>
        <t-form-item label="模型类型">
          <t-select v-model="formData.modelType">
            <t-option value="text" label="文本模型" />
            <t-option value="image" label="图像模型" />
            <t-option value="video" label="视频模型" />
            <t-option value="embedding" label="向量模型" />
          </t-select>
        </t-form-item>
        <t-form-item label="启用状态">
          <t-switch v-model="formData.enabled" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { MessagePlugin, DialogPlugin } from "tdesign-vue-next";
import axios from "axios";

interface ModelMap {
  id: number;
  vendor: string;
  internalModel: string;
  externalModel: string;
  modelType: string;
  enabled: boolean;
}

const modelMaps = ref<ModelMap[]>([]);
const showAddDialog = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive({
  vendor: "",
  internalModel: "",
  externalModel: "",
  modelType: "text",
  enabled: true,
});

const vendors = ["toonflow", "openai", "anthropic", "deepseek", "google", " volcengine", "klingai", "minimax"];

const columns = [
  { colKey: "model", title: "映射关系", width: 300 },
  { colKey: "vendor", title: "供应商", width: 120 },
  { colKey: "modelType", title: "类型", width: 100 },
  { colKey: "status", title: "状态", width: 80 },
  { colKey: "operations", title: "操作", width: 150, align: "center" },
];

async function loadModelMap() {
  try {
    const response = await axios.post("/api/setting/modelMap/getModelMap");
    if (response.data.success) {
      modelMaps.value = response.data.data;
    }
  } catch (error) {
    MessagePlugin.error("加载失败");
  }
}

function editMapping(item: ModelMap) {
  editingId.value = item.id;
  Object.assign(formData, item);
  showAddDialog.value = true;
}

async function saveMapping() {
  try {
    const api = editingId.value
      ? "/api/setting/modelMap/updateModelMap"
      : "/api/setting/modelMap/addModelMap";

    await axios.post(api, {
      id: editingId.value,
      ...formData,
    });

    MessagePlugin.success("保存成功");
    showAddDialog.value = false;
    loadModelMap();
    editingId.value = null;
  } catch (error) {
    MessagePlugin.error("保存失败");
  }
}

async function toggleEnabled(item: ModelMap) {
  try {
    await axios.post("/api/setting/modelMap/updateModelMap", {
      id: item.id,
      enabled: item.enabled,
    });
    MessagePlugin.success(item.enabled ? "已启用" : "已禁用");
  } catch (error) {
    MessagePlugin.error("操作失败");
  }
}

async function deleteMapping(item: ModelMap) {
  const confirmDialog = DialogPlugin.confirm({
    header: "确认删除",
    body: `确定要删除映射 "${item.internalModel} → ${item.externalModel}" 吗？`,
    theme: "danger",
    onConfirm: async () => {
      confirmDialog.hide();
      try {
        await axios.post("/api/setting/modelMap/deleteModelMap", { id: item.id });
        MessagePlugin.success("删除成功");
        loadModelMap();
      } catch (error) {
        MessagePlugin.error("删除失败");
      }
    },
  });
}

onMounted(() => {
  loadModelMap();
});
</script>

<style scoped>
.modelMap {
  padding: 16px;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.infoAlert {
  margin-bottom: 16px;
}

.modelCell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.internalModel {
  font-weight: 500;
  color: var(--td-brand-color);
}

.externalModel {
  color: var(--td-text-color-secondary);
}
</style>
