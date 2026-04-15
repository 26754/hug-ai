<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="添加音频素材"
    width="500px"
    :close-on-overlay-click="false">
    <t-form labelWidth="100">
      <!-- 音频类型 -->
      <t-form-item label="音频类型" required>
        <t-radio-group v-model="formData.type">
          <t-radio value="bgm">
            <template #label>
              <div class="radioLabel">
                <t-icon name="music" />
                <span>背景音乐</span>
              </div>
            </template>
          </t-radio>
          <t-radio value="sfx">
            <template #label>
              <div class="radioLabel">
                <t-icon name="sound" />
                <span>音效</span>
              </div>
            </template>
          </t-radio>
          <t-radio value="voice">
            <template #label>
              <div class="radioLabel">
                <t-icon name="voice" />
                <span>配音</span>
              </div>
            </template>
          </t-radio>
        </t-radio-group>
      </t-form-item>

      <!-- 音频名称 -->
      <t-form-item label="音频名称" required>
        <t-input v-model="formData.name" placeholder="输入音频名称" />
      </t-form-item>

      <!-- 描述 -->
      <t-form-item label="描述">
        <t-textarea v-model="formData.description" placeholder="音频描述或用途..." :rows="3" />
      </t-form-item>

      <!-- 标签 -->
      <t-form-item label="标签">
        <t-select v-model="formData.tags" multiple filterable allowCreate defaultOption="local" placeholder="选择或输入标签">
          <t-option v-for="tag in presetTags" :key="tag" :value="tag" :label="tag" />
        </t-select>
      </t-form-item>

      <!-- 上传音频 -->
      <t-form-item label="上传音频" v-if="formData.type !== 'voice'">
        <t-upload
          ref="uploadRef"
          v-model:files="uploadFiles"
          accept="audio/*"
          :limit="1"
          :before-upload="beforeUpload"
          @success="onUploadSuccess"
          @fail="onUploadFail">
          <t-button variant="outline" @click="triggerUpload">
            <template #icon>
              <t-icon name="upload" />
            </template>
            选择音频文件
          </t-button>
        </t-upload>
        <div class="uploadTip">
          支持 MP3、WAV、OGG 格式，单文件不超过 50MB
        </div>
      </t-form-item>

      <!-- AI 生成配音 -->
      <t-form-item v-if="formData.type === 'voice'" label="配音内容">
        <t-textarea
          v-model="formData.voiceText"
          placeholder="输入要配音的文本内容..."
          :rows="4" />
        <div class="formTip">
          支持中文、英文、日文等语言
        </div>
      </t-form-item>

      <t-form-item v-if="formData.type === 'voice'" label="配音角色">
        <t-select v-model="formData.voiceRole" placeholder="选择配音角色">
          <t-option-group label="女声">
            <t-option value="female_yunyang" label="云 Yan（温柔）" />
            <t-option value="female_xiaoyan" label="小燕（活泼）" />
            <t-option value="female_aiwei" label="艾薇（知性）" />
          </t-option-group>
          <t-option-group label="男声">
            <t-option value="male_yunyang" label="云 Yang（磁性）" />
            <t-option value="male_xiaobai" label="小白（阳光）" />
          </t-option-group>
        </t-select>
      </t-form-item>

      <!-- 时长 -->
      <t-form-item label="时长(秒)">
        <t-input-number v-model="formData.duration" :min="1" :max="3600" />
      </t-form-item>
    </t-form>

    <template #footer>
      <div class="dialogFooter">
        <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
        <t-button theme="primary" :loading="submitting" @click="handleSubmit">
          {{ formData.type === 'voice' ? '生成配音' : '保存' }}
        </t-button>
      </div>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import axios from "axios";

interface AudioAsset {
  id?: number;
  name: string;
  type: "bgm" | "sfx" | "voice";
  description: string;
  tags: string[];
  url?: string;
  duration?: number;
  voiceText?: string;
  voiceRole?: string;
}

const props = defineProps<{
  visible: boolean;
  projectId?: number;
  editData?: AudioAsset;
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "success", audio: AudioAsset): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const uploadRef = ref();
const uploading = ref(false);
const submitting = ref(false);
const uploadFiles = ref([]);

const formData = reactive<AudioAsset>({
  name: "",
  type: "bgm",
  description: "",
  tags: [],
  duration: 30,
  voiceText: "",
  voiceRole: "",
});

const presetTags = [
  "欢快",
  "紧张",
  "悬疑",
  "浪漫",
  "史诗",
  "轻松",
  "悲伤",
  "战斗",
  "过渡",
  "开场",
  "结尾",
];

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.editData) {
        Object.assign(formData, props.editData);
      } else {
        resetForm();
      }
    }
  }
);

function resetForm() {
  Object.assign(formData, {
    name: "",
    type: "bgm",
    description: "",
    tags: [],
    duration: 30,
    voiceText: "",
    voiceRole: "",
  });
  uploadFiles.value = [];
}

function triggerUpload() {
  uploadRef.value?.click();
}

function beforeUpload(file: File) {
  const isAudio = file.type.startsWith("audio/");
  if (!isAudio) {
    MessagePlugin.error("只能上传音频文件");
    return false;
  }

  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    MessagePlugin.error("文件大小不能超过 50MB");
    return false;
  }

  // 提取文件名作为默认名称
  if (!formData.name) {
    formData.name = file.name.replace(/\.[^.]+$/, "");
  }

  return true;
}

function onUploadSuccess(context: any) {
  const response = context.response;
  if (response.success) {
    formData.url = response.data.url;
    formData.duration = response.data.duration || formData.duration;
    MessagePlugin.success("上传成功");
  }
}

function onUploadFail() {
  MessagePlugin.error("上传失败，请重试");
}

async function handleSubmit() {
  if (!formData.name.trim()) {
    MessagePlugin.warning("请输入音频名称");
    return;
  }

  if (formData.type === "voice" && !formData.voiceText?.trim()) {
    MessagePlugin.warning("请输入配音内容");
    return;
  }

  if (formData.type !== "voice" && !formData.url && !props.editData?.url) {
    MessagePlugin.warning("请上传音频文件");
    return;
  }

  submitting.value = true;

  try {
    const api = props.editData?.id ? "/api/assets/audio/update" : "/api/assets/audio/add";
    const response = await axios.post(api, {
      id: props.editData?.id,
      projectId: props.projectId,
      ...formData,
    });

    if (response.data.success) {
      MessagePlugin.success(props.editData?.id ? "更新成功" : "添加成功");
      emit("success", response.data.data);
      dialogVisible.value = false;
    }
  } catch (error) {
    MessagePlugin.error("操作失败，请重试");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.radioLabel {
  display: flex;
  align-items: center;
  gap: 6px;
}

.uploadTip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.formTip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.dialogFooter {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
