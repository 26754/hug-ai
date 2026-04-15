<template>
  <div class="cornerScape">
    <div class="cs-layout">
      <!-- 左侧设置面板 -->
      <div class="cs-sidebar">
        <t-card :title="$t('cornerScape.batchSettings')" class="cs-card">
          <t-form labelAlign="top">
            <!-- 快速操作 -->
            <t-form-item :label="$t('cornerScape.quickActions')">
              <div class="quickActions">
                <t-button theme="primary" variant="outline" size="small" @click="selectPromptEmpty">
                  {{ $t("cornerScape.selectPromptEmpty") }}
                </t-button>
                <t-button theme="primary" variant="outline" size="small" @click="selectUngenerated">
                  {{ $t("cornerScape.selectUngenerated") }}
                </t-button>
                <t-button theme="primary" variant="outline" size="small" @click="selectGenerated">
                  {{ $t("cornerScape.selectGenerated") }}
                </t-button>
                <t-button theme="primary" variant="outline" size="small" @click="toggleSelectAll">
                  {{ $t("cornerScape.toggleSelectAll") }}
                </t-button>
                <t-button theme="primary" variant="outline" size="small" @click="clearSelection">
                  {{ $t("cornerScape.clearSelection") }}
                </t-button>
                <t-button
                  theme="primary"
                  variant="outline"
                  size="small"
                  :disabled="!hasPreviewImages"
                  @click="previewAll">
                  {{ $t("cornerScape.batchPreview") }}
                </t-button>
              </div>
            </t-form-item>

            <!-- 资产类型筛选 -->
            <t-form-item :label="$t('cornerScape.assetTypeFilter')">
              <t-checkbox-group v-model="filterTypes" :options="typeOptions" />
            </t-form-item>

            <!-- 模型选择 -->
            <t-form-item :label="$t('cornerScape.genModel')">
              <t-select v-model="selectedModel" placeholder="选择模型" style="width: 100%">
                <t-option-group v-for="group in modelOptions" :key="group.label" :label="group.label">
                  <t-option
                    v-for="model in group.children"
                    :key="model.value"
                    :value="model.value"
                    :label="model.label">
                    {{ model.label }}
                  </t-option>
                </t-option-group>
                <template #empty>
                  <div class="emptyAction">
                    <t-button size="small" variant="text" theme="primary" @click="goVendorConfig">
                      {{ $t("cornerScape.goSetting") }}
                    </t-button>
                  </div>
                </template>
              </t-select>
            </t-form-item>

            <!-- 分辨率 -->
            <t-form-item :label="$t('cornerScape.resolution')">
              <t-select v-model="resolution" style="width: 100%">
                <t-option value="1K" label="1K" />
                <t-option value="2K" label="2K" />
                <t-option value="4K" label="4K" />
              </t-select>
            </t-form-item>

            <!-- 批量操作按钮 -->
            <t-form-item>
              <t-space direction="vertical" style="width: 100%">
                <t-button theme="primary" block @click="batchGeneratePrompt">
                  {{ $t("cornerScape.batchGenPrompt") }}
                </t-button>
                <t-button theme="primary" block @click="batchGenerateImage" :loading="batchGenerating">
                  {{ $t("cornerScape.startBatchGen") }}
                </t-button>
              </t-space>
            </t-form-item>
          </t-form>
        </t-card>
      </div>

      <!-- 主内容区 -->
      <div class="cs-content">
        <!-- 资产网格 -->
        <div class="assetGrid" v-if="assets.length > 0">
          <t-card
            v-for="item in filteredAssets"
            :key="item.id"
            class="assetCard"
            :class="{ selected: selectedIds.includes(item.id) }"
            @click="openDetail(item)">
            <template #header>
              <div class="assetHeader">
                <t-checkbox
                  :checked="selectedIds.includes(item.id)"
                  @click.stop
                  @change="toggleSelect(item.id)" />
                <span class="assetName">{{ item.name }}</span>
                <t-tag size="small" :theme="getTypeTheme(item.type)">
                  {{ getTypeLabel(item.type) }}
                </t-tag>
              </div>
            </template>

            <div class="assetImage">
              <t-checkbox
                class="selectOverlay"
                :checked="selectedIds.includes(item.id)"
                @click.stop
                @change="toggleSelect(item.id)" />

              <!-- 生成中状态 -->
              <div v-if="item.state === 'generating'" class="generating">
                <t-loading />
                <span>{{ $t("cornerScape.generating") }}</span>
              </div>

              <!-- 生成失败状态 -->
              <div v-else-if="item.state === 'failed'" class="failed">
                <t-icon name="error-circle" size="32px" />
                <span>{{ $t("cornerScape.genFailed") }}</span>
                <t-tag theme="danger" size="small">{{ $t("cornerScape.viewError") }}</t-tag>
              </div>

              <!-- 已完成状态 -->
              <t-image
                v-else-if="item.filePath"
                :src="item.filePath"
                fit="cover"
                class="assetImg"
                :preview="true">
                <template #overlayContent>
                  <div class="imageTools">
                    <t-button size="small" theme="default" @click.stop="regenerate(item)">
                      <t-icon name="refresh" />
                    </t-button>
                    <t-button size="small" theme="default" @click.stop="deleteAsset(item)">
                      <t-icon name="delete" />
                    </t-button>
                  </div>
                </template>
              </t-image>

              <!-- 待生成状态 -->
              <div v-else class="pending">
                <t-icon name="image" size="32px" />
                <span>{{ $t("cornerScape.waitingGen") }}</span>
              </div>
            </div>

            <div class="assetMeta">
              <t-tag size="small" variant="outline" v-if="item.model">{{ item.model }}</t-tag>
              <t-tag size="small" variant="outline" v-if="item.resolution">{{ item.resolution }}</t-tag>
            </div>

            <div class="assetPrompt" v-if="item.prompt">
              {{ item.prompt.substring(0, 100) }}{{ item.prompt.length > 100 ? '...' : '' }}
            </div>
          </t-card>
        </div>

        <!-- 空状态 -->
        <t-empty v-else :description="$t('cornerScape.emptyAssets')">
          <template #icon>
            <t-icon name="image" size="48px" />
          </template>
        </t-empty>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <t-drawer
      v-model:visible="drawerVisible"
      :header="currentAsset?.name"
      size="480px"
      :closeOnEscKeydown="true">
      <div v-if="currentAsset" class="assetDetail">
        <!-- 当前图片 -->
        <div class="detailImage">
          <t-image
            v-if="currentAsset.filePath"
            :src="currentAsset.filePath"
            fit="contain"
            :preview="true" />
          <div v-else class="detailPending">
            <t-icon name="image" size="48px" />
            <span>{{ $t("cornerScape.noImage") }}</span>
          </div>
        </div>

        <!-- 历史图片 -->
        <div v-if="historyImages.length > 0" class="historySection">
          <h4>{{ $t("cornerScape.history") }}</h4>
          <div class="historyGrid">
            <div
              v-for="img in historyImages"
              :key="img.id"
              class="historyItem"
              :class="{ selected: selectedHistoryId === img.id }"
              @click="selectHistory(img)">
              <t-image :src="img.filePath" fit="cover" />
            </div>
          </div>
        </div>

        <t-form labelAlign="top" class="detailForm">
          <!-- 模型选择 -->
          <t-form-item :label="$t('cornerScape.genModel')">
            <t-select v-model="detailForm.model" style="width: 100%">
              <t-option-group v-for="group in modelOptions" :key="group.label" :label="group.label">
                <t-option
                  v-for="model in group.children"
                  :key="model.value"
                  :value="model.value"
                  :label="model.label">
                  {{ model.label }}
                </t-option>
              </t-option-group>
            </t-select>
          </t-form-item>

          <!-- 分辨率 -->
          <t-form-item :label="$t('cornerScape.resolution')">
            <t-select v-model="detailForm.resolution" style="width: 100%">
              <t-option value="1K" label="1K" />
              <t-option value="2K" label="2K" />
              <t-option value="4K" label="4K" />
            </t-select>
          </t-form-item>

          <!-- 提示词 -->
          <t-form-item :label="$t('cornerScape.prompt')">
            <t-textarea
              v-model="detailForm.prompt"
              :placeholder="$t('cornerScape.promptPlaceholder')"
              :autosize="{ minRows: 4, maxRows: 8 }"
              :disabled="polishing" />
          </t-form-item>

          <!-- 操作按钮 -->
          <t-form-item>
            <t-space>
              <t-button
                theme="default"
                variant="outline"
                :loading="polishing"
                @click="polishPrompt">
                <template #icon>
                  <t-icon name="edit" />
                </template>
                {{ $t("cornerScape.aiPolish") }}
              </t-button>
              <t-button
                theme="primary"
                :disabled="currentAsset.state === 'generating'"
                @click="regenerateItem">
                <template #icon>
                  <t-icon name="refresh" />
                </template>
                {{ $t("cornerScape.regenerate") }}
              </t-button>
            </t-space>
          </t-form-item>
        </t-form>
      </div>
    </t-drawer>

    <!-- 批量预览弹窗 -->
    <t-dialog v-model:visible="previewVisible" header="批量预览" width="80%" placement="center">
      <t-image-viewer :images="previewImages" />
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import axios from "axios";

interface Asset {
  id: number;
  type: string;
  name: string;
  prompt: string;
  filePath: string | null;
  state: string;
  model: string;
  resolution: string;
  describe: string;
  historyImages: { id: number; filePath: string }[];
}

interface ModelOption {
  label: string;
  children: { label: string; value: string }[];
}

const assets = ref<Asset[]>([]);
const selectedIds = ref<number[]>([]);
const filterTypes = ref<string[]>(["role", "scene", "tool"]);
const selectedModel = ref("");
const resolution = ref("2K");
const batchGenerating = ref(false);
const polishing = ref(false);

// 抽屉状态
const drawerVisible = ref(false);
const currentAsset = ref<Asset | null>(null);
const selectedHistoryId = ref<number | null>(null);
const detailForm = reactive({
  model: "",
  resolution: "",
  prompt: "",
});

// 预览
const previewVisible = ref(false);
const previewImages = computed(() =>
  assets.value
    .filter((a) => selectedIds.value.includes(a.id) && a.filePath)
    .map((a) => a.filePath as string)
);

// 模型选项
const modelOptions = ref<ModelOption[]>([
  {
    label: "图像模型",
    children: [
      { label: "Flux", value: "flux" },
      { label: "SDXL", value: "sdxl" },
      { label: "Wan2.6", value: "wan2.6" },
    ],
  },
]);

const typeOptions = [
  { value: "role", label: "角色" },
  { value: "scene", label: "场景" },
  { value: "tool", label: "道具" },
];

const filteredAssets = computed(() =>
  assets.value.filter((a) => filterTypes.value.includes(a.type))
);

const hasPreviewImages = computed(() => previewImages.value.length > 0);

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    role: "角色",
    scene: "场景",
    tool: "道具",
  };
  return labels[type] || type;
}

function getTypeTheme(type: string): string {
  const themes: Record<string, string> = {
    role: "primary",
    scene: "success",
    tool: "warning",
  };
  return themes[type] || "default";
}

async function loadAssets() {
  try {
    const response = await axios.post("/api/cornerScape/getAllAssets", {});
    if (response.data.success) {
      assets.value = response.data.data;
    }
  } catch (error) {
    console.error("加载资产失败:", error);
    assets.value = [];
  }
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id);
  if (idx === -1) {
    selectedIds.value.push(id);
  } else {
    selectedIds.value.splice(idx, 1);
  }
}

function selectPromptEmpty() {
  const empty = assets.value
    .filter((a) => !a.prompt || a.prompt.trim() === "")
    .map((a) => a.id);
  if (empty.length === 0) {
    MessagePlugin.warning("没有未填写提示词的资产");
    return;
  }
  selectedIds.value = empty;
  MessagePlugin.success(`已选择 ${empty.length} 个资产`);
}

function selectUngenerated() {
  selectedIds.value = assets.value
    .filter((a) => !a.filePath)
    .map((a) => a.id);
  MessagePlugin.success(`已选择 ${selectedIds.value.length} 个待生成资产`);
}

function selectGenerated() {
  selectedIds.value = assets.value
    .filter((a) => a.filePath)
    .map((a) => a.id);
  MessagePlugin.success(`已选择 ${selectedIds.value.length} 个已生成资产`);
}

function toggleSelectAll() {
  if (selectedIds.value.length === filteredAssets.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = filteredAssets.value.map((a) => a.id);
  }
}

function clearSelection() {
  selectedIds.value = [];
}

function previewAll() {
  if (hasPreviewImages.value) {
    previewVisible.value = true;
  }
}

function openDetail(item: Asset) {
  currentAsset.value = item;
  detailForm.model = item.model || selectedModel.value;
  detailForm.resolution = item.resolution || resolution.value;
  detailForm.prompt = item.prompt || "";
  drawerVisible.value = true;
}

const historyImages = computed(() => currentAsset.value?.historyImages || []);

function selectHistory(img: { id: number; filePath: string }) {
  selectedHistoryId.value = selectedHistoryId.value === img.id ? null : img.id;
  if (selectedHistoryId.value && currentAsset.value) {
    currentAsset.value.filePath = img.filePath;
  }
}

async function batchGeneratePrompt() {
  if (selectedIds.value.length === 0) {
    MessagePlugin.warning("请先选择资产");
    return;
  }
  try {
    await axios.post("/api/cornerScape/batchGeneratePrompt", {
      assetIds: selectedIds.value,
    });
    MessagePlugin.success("批量生成提示词任务已提交");
    loadAssets();
  } catch (error) {
    MessagePlugin.error("生成失败");
  }
}

async function batchGenerateImage() {
  if (selectedIds.value.length === 0) {
    MessagePlugin.warning("请先选择资产");
    return;
  }
  if (!selectedModel.value) {
    MessagePlugin.warning("请选择生成模型");
    return;
  }

  batchGenerating.value = true;
  try {
    await axios.post("/api/cornerScape/batchGenerateImage", {
      assetIds: selectedIds.value,
      model: selectedModel.value,
      resolution: resolution.value,
    });
    MessagePlugin.success("批量生成任务已提交");
    loadAssets();
  } catch (error) {
    MessagePlugin.error("生成失败");
  } finally {
    batchGenerating.value = false;
  }
}

async function regenerate(item: Asset) {
  if (!selectedModel.value) {
    MessagePlugin.warning("请选择生成模型");
    return;
  }
  try {
    await axios.post("/api/assetsGenerate/generateAssets", {
      id: item.id,
      model: selectedModel.value,
      resolution: resolution.value,
    });
    MessagePlugin.success("生成任务已提交");
    loadAssets();
  } catch (error) {
    MessagePlugin.error("生成失败");
  }
}

async function regenerateItem() {
  if (!currentAsset.value) return;
  if (!detailForm.model) {
    MessagePlugin.warning("请选择生成模型");
    return;
  }
  if (!detailForm.prompt.trim()) {
    MessagePlugin.warning("请填写提示词");
    return;
  }

  try {
    // 保存提示词
    await axios.post("/api/assets/saveAssets", {
      id: currentAsset.value.id,
      prompt: detailForm.prompt,
    });

    // 生成图片
    await axios.post("/api/assetsGenerate/generateAssets", {
      id: currentAsset.value.id,
      model: detailForm.model,
      resolution: detailForm.resolution,
    });

    MessagePlugin.success("生成任务已提交");
    drawerVisible.value = false;
    loadAssets();
  } catch (error) {
    MessagePlugin.error("生成失败");
  }
}

async function polishPrompt() {
  if (!detailForm.prompt.trim()) {
    MessagePlugin.warning("请先填写描述内容");
    return;
  }

  polishing.value = true;
  try {
    const response = await axios.post("/api/assetsGenerate/polishAssetsPrompt", {
      assetsId: currentAsset.value?.id,
      describe: detailForm.prompt,
    });
    if (response.data.success) {
      detailForm.prompt = response.data.data.prompt;
      MessagePlugin.success("提示词优化成功");
    }
  } catch (error) {
    MessagePlugin.error("优化失败");
  } finally {
    polishing.value = false;
  }
}

async function deleteAsset(item: Asset) {
  try {
    await axios.post("/api/assets/deleteAssets", { id: item.id });
    MessagePlugin.success("删除成功");
    loadAssets();
  } catch (error) {
    MessagePlugin.error("删除失败");
  }
}

function goVendorConfig() {
  // 跳转到供应商配置
  window.location.href = "/#/settings?vendor";
}

onMounted(() => {
  loadAssets();
});
</script>

<style scoped>
.cornerScape {
  height: 100%;
  padding: 16px;
  background: var(--td-bg-color-page);
}

.cs-layout {
  display: flex;
  gap: 16px;
  height: 100%;
}

.cs-sidebar {
  width: 320px;
  flex-shrink: 0;
}

.cs-card {
  height: 100%;
}

.cs-content {
  flex: 1;
  overflow-y: auto;
}

.quickActions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assetGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.assetCard {
  cursor: pointer;
  transition: all 0.2s;
}

.assetCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.assetCard.selected {
  border-color: var(--td-brand-color);
}

.assetHeader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assetName {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.assetImage {
  position: relative;
  aspect-ratio: 4/3;
  background: var(--td-bg-color-container-hover);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selectOverlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.assetImg {
  width: 100%;
  height: 100%;
}

.generating,
.failed,
.pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--td-text-color-secondary);
}

.imageTools {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px;
  border-radius: 4px;
}

.assetMeta {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.assetPrompt {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 详情抽屉 */
.assetDetail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detailImage {
  background: var(--td-bg-color-container-hover);
  border-radius: 8px;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detailPending {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--td-text-color-disabled);
  padding: 48px;
}

.historySection h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
}

.historyGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.historyItem {
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.historyItem:hover {
  border-color: var(--td-brand-color);
}

.historyItem.selected {
  border-color: var(--td-brand-color);
}

.detailForm {
  margin-top: 16px;
}

.emptyAction {
  padding: 8px;
  text-align: center;
}
</style>
