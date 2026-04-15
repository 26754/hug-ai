<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="批量生成"
    width="700px"
    :close-on-overlay-click="false">
    <div class="batchGenContainer">
      <!-- 步骤指示器 -->
      <t-steps :current="currentStep" status="process">
        <t-step-item title="选择资产" />
        <t-step-item title="配置参数" />
        <t-step-item title="确认生成" />
      </t-steps>

      <!-- 步骤1: 选择资产 -->
      <div v-show="currentStep === 0" class="stepContent">
        <t-form labelWidth="100">
          <t-form-item label="资产类型">
            <t-radio-group v-model="formData.type">
              <t-radio-button value="role">角色</t-radio-button>
              <t-radio-button value="scene">场景</t-radio-button>
              <t-radio-button value="tool">道具</t-radio-button>
              <t-radio-button value="all">全部</t-radio-button>
            </t-radio-group>
          </t-form-item>
          <t-form-item label="选择方式">
            <t-radio-group v-model="formData.selectMode">
              <t-radio-button value="unfinished">未完成</t-radio-button>
              <t-radio-button value="all">全部</t-radio-button>
              <t-radio-button value="custom">自定义</t-radio-button>
            </t-radio-group>
          </t-form-item>
          <t-form-item v-if="formData.selectMode === 'custom'" label="选择资产">
            <t-checkbox-group v-model="formData.selectedIds">
              <div class="assetCheckList">
                <t-checkbox
                  v-for="asset in filteredAssets"
                  :key="asset.id"
                  :value="asset.id"
                  :label="asset.name" />
              </div>
            </t-checkbox-group>
          </t-form-item>
          <t-form-item label="已选择">
            <t-tag theme="primary">{{ formData.selectedIds.length }} 个资产</t-tag>
          </t-form-item>
        </t-form>
      </div>

      <!-- 步骤2: 配置参数 -->
      <div v-show="currentStep === 1" class="stepContent">
        <t-form labelWidth="100">
          <t-form-item label="生成模型">
            <t-select v-model="formData.model" placeholder="选择模型" style="width: 100%">
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
          <t-form-item label="分辨率">
            <t-select v-model="formData.resolution" style="width: 100%">
              <t-option value="1K" label="1K (1024x1024)" />
              <t-option value="2K" label="2K (2048x2048)" />
              <t-option value="4K" label="4K (4096x4096)" />
            </t-select>
          </t-form-item>
          <t-form-item label="风格预设">
            <t-select v-model="formData.stylePreset" placeholder="选择风格（可选）" style="width: 100%">
              <t-option value="" label="不使用" />
              <t-option value="anime" label="动漫" />
              <t-option value="real" label="写实" />
              <t-option value="oil" label="油画" />
              <t-option value="ink" label="水墨" />
              <t-option value="3d" label="3D渲染" />
            </t-select>
          </t-form-item>
          <t-form-item label="负面提示词">
            <t-textarea
              v-model="formData.negativePrompt"
              placeholder="不想出现的元素，如: 低质量, 模糊, 变形..."
              :rows="2" />
          </t-form-item>
          <t-form-item label="生成数量">
            <t-input-number v-model="formData.countPerAsset" :min="1" :max="4" />
            <span style="margin-left: 8px; color: var(--td-text-color-secondary)">
              每个资产生成数量
            </span>
          </t-form-item>
        </t-form>
      </div>

      <!-- 步骤3: 确认生成 -->
      <div v-show="currentStep === 2" class="stepContent">
        <t-result theme="info" title="确认生成">
          <template #icon>
            <t-icon name="image" size="48px" />
          </template>
          <div class="confirmInfo">
            <t-descriptions :column="2" bordered size="small">
              <t-descriptions-item label="资产数量">
                {{ formData.selectedIds.length }} 个
              </t-descriptions-item>
              <t-descriptions-item label="每资产数量">
                {{ formData.countPerAsset }} 张
              </t-descriptions-item>
              <t-descriptions-item label="生成模型">
                {{ getModelLabel(formData.model) }}
              </t-descriptions-item>
              <t-descriptions-item label="分辨率">
                {{ formData.resolution }}
              </t-descriptions-item>
              <t-descriptions-item label="风格预设" :span="2">
                {{ formData.stylePreset || "不使用" }}
              </t-descriptions-item>
            </t-descriptions>
            <div class="totalCount">
              总计将生成
              <t-tag theme="primary" size="large">
                {{ formData.selectedIds.length * formData.countPerAsset }}
              </t-tag>
              张图片
            </div>
          </div>
        </t-result>
      </div>
    </div>

    <template #footer>
      <div class="dialogFooter">
        <t-button v-if="currentStep > 0" variant="outline" @click="prevStep">
          上一步
        </t-button>
        <t-button v-if="currentStep < 2" theme="primary" @click="nextStep">
          下一步
        </t-button>
        <t-button
          v-if="currentStep === 2"
          theme="primary"
          :loading="generating"
          @click="startGeneration">
          开始生成
        </t-button>
      </div>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import axios from "axios";

interface Asset {
  id: number;
  name: string;
  type: string;
  hasImage: boolean;
}

interface ModelOption {
  label: string;
  children: { label: string; value: string }[];
}

const props = defineProps<{
  visible: boolean;
  projectId?: number;
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const currentStep = ref(0);
const generating = ref(false);
const assets = ref<Asset[]>([]);

const formData = reactive({
  type: "all",
  selectMode: "unfinished",
  selectedIds: [] as number[],
  model: "",
  resolution: "2K",
  stylePreset: "",
  negativePrompt: "低质量, 模糊, 变形, 比例失调",
  countPerAsset: 1,
});

const modelOptions: ModelOption[] = [
  {
    label: "图像模型",
    children: [
      { label: "Flux", value: "flux" },
      { label: "SDXL", value: "sdxl" },
      { label: "Wan2.6", value: "wan2.6" },
    ],
  },
];

const filteredAssets = computed(() => {
  if (formData.type === "all") return assets.value;
  return assets.value.filter((a) => a.type === formData.type);
});

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadAssets();
      resetForm();
    }
  }
);

watch(
  () => formData.selectMode,
  (mode) => {
    if (mode === "unfinished") {
      formData.selectedIds = assets.value.filter((a) => !a.hasImage).map((a) => a.id);
    } else if (mode === "all") {
      formData.selectedIds = assets.value.map((a) => a.id);
    }
  }
);

async function loadAssets() {
  try {
    const response = await axios.post("/api/assets/list", {
      projectId: props.projectId,
    });
    if (response.data.success) {
      assets.value = response.data.data.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        hasImage: !!a.filePath,
      }));
      // 默认选择未完成的
      formData.selectedIds = assets.value.filter((a) => !a.hasImage).map((a) => a.id);
    }
  } catch (error) {
    console.error("加载资产失败:", error);
  }
}

function resetForm() {
  currentStep.value = 0;
  formData.selectedIds = [];
  formData.model = "";
  formData.resolution = "2K";
  formData.stylePreset = "";
  formData.negativePrompt = "低质量, 模糊, 变形, 比例失调";
  formData.countPerAsset = 1;
}

function getModelLabel(value: string): string {
  for (const group of modelOptions) {
    const found = group.children.find((m) => m.value === value);
    if (found) return found.label;
  }
  return value;
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--;
}

function nextStep() {
  if (currentStep.value === 0 && formData.selectedIds.length === 0) {
    MessagePlugin.warning("请至少选择一个资产");
    return;
  }
  if (currentStep.value === 1 && !formData.model) {
    MessagePlugin.warning("请选择生成模型");
    return;
  }
  if (currentStep.value < 2) currentStep.value++;
}

async function startGeneration() {
  generating.value = true;
  try {
    const response = await axios.post("/api/assetsGenerate/batchGenerateImageAssets", {
      assetIds: formData.selectedIds,
      model: formData.model,
      resolution: formData.resolution,
      stylePreset: formData.stylePreset,
      negativePrompt: formData.negativePrompt,
      count: formData.countPerAsset,
    });

    if (response.data.success) {
      MessagePlugin.success(`已提交 ${formData.selectedIds.length} 个生成任务`);
      dialogVisible.value = false;
      emit("success");
    }
  } catch (error) {
    MessagePlugin.error("生成失败，请重试");
  } finally {
    generating.value = false;
  }
}
</script>

<style scoped>
.batchGenContainer {
  padding: 16px 0;
}

.stepContent {
  padding: 24px 0;
  min-height: 300px;
}

.assetCheckList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background: var(--td-bg-color-container-hover);
  border-radius: 8px;
}

.confirmInfo {
  max-width: 500px;
  margin: 0 auto;
}

.totalCount {
  text-align: center;
  margin-top: 16px;
  font-size: 16px;
}

.dialogFooter {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
