<template>
  <div class="audioAssets">
    <t-card>
      <template #header>
        <div class="cardHeader">
          <span>音频素材</span>
          <t-space>
            <t-button variant="outline" @click="showUploadDialog = true">
              <template #icon>
                <t-icon name="upload" />
              </template>
              上传音频
            </t-button>
            <t-button theme="primary" @click="showGenerateDialog = true">
              <template #icon>
                <t-icon name="add" />
              </template>
              AI 生成
            </t-button>
          </t-space>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filterBar">
        <t-input
          v-model="searchKeyword"
          placeholder="搜索音频..."
          :style="{ maxWidth: '300px' }"
          @enter="searchAudio">
          <template #prefix-icon>
            <t-icon name="search" />
          </template>
        </t-input>
        <t-select v-model="filterType" :style="{ width: '150px' }">
          <t-option value="all" label="全部类型" />
          <t-option value="bgm" label="背景音乐" />
          <t-option value="sfx" label="音效" />
          <t-option value="voice" label="配音" />
        </t-select>
      </div>

      <!-- 音频列表 -->
      <div class="audioGrid">
        <div v-for="audio in filteredAudios" :key="audio.id" class="audioCard">
          <div class="audioWaveform" @click="playAudio(audio)">
            <t-icon :name="isPlaying === audio.id ? 'pause-circle' : 'play-circle'" size="32px" />
            <div class="waveformBars">
              <div v-for="i in 20" :key="i" class="bar" :style="{ height: getRandomHeight() + '%' }"></div>
            </div>
          </div>
          <div class="audioInfo">
            <h4>{{ audio.name }}</h4>
            <div class="audioMeta">
              <t-tag size="small">{{ getTypeLabel(audio.type) }}</t-tag>
              <span class="duration">{{ formatDuration(audio.duration) }}</span>
            </div>
            <div class="audioActions">
              <t-button size="small" variant="text" @click="useAudio(audio)">
                插入
              </t-button>
              <t-button size="small" variant="text" @click="editAudio(audio)">
                编辑
              </t-button>
              <t-button size="small" variant="text" theme="danger" @click="deleteAudio(audio)">
                删除
              </t-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <t-empty v-if="filteredAudios.length === 0" description="暂无音频素材" />
      </div>

      <!-- 音频播放器 -->
      <div v-if="currentAudio" class="audioPlayer">
        <div class="playerInfo">
          <t-icon name="sound" />
          <span>{{ currentAudio.name }}</span>
        </div>
        <div class="playerControls">
          <t-icon name="play-circle" size="24px" @click="togglePlay" />
          <div class="progressBar">
            <div class="progress" :style="{ width: playProgress + '%' }"></div>
          </div>
          <span class="time">{{ formatDuration(currentTime) }} / {{ formatDuration(currentAudio.duration) }}</span>
        </div>
        <audio ref="audioPlayer" :src="currentAudio.url" @timeupdate="onTimeUpdate" @ended="onEnded" />
      </div>
    </t-card>

    <!-- 上传对话框 -->
    <t-dialog v-model:visible="showUploadDialog" header="上传音频" width="500px">
      <t-upload
        ref="uploadRef"
        v-model="uploadFiles"
        accept="audio/*"
        :limit="5"
        :before-upload="beforeUpload"
        @success="onUploadSuccess">
        <t-button variant="outline">
          <template #icon>
            <t-icon name="upload" />
          </template>
          选择音频文件
        </t-button>
      </t-upload>
      <template #footer>
        <t-button @click="showUploadDialog = false">关闭</t-button>
      </template>
    </t-dialog>

    <!-- AI 生成对话框 -->
    <t-dialog v-model:visible="showGenerateDialog" header="AI 生成音频" width="600px">
      <t-form labelWidth="100">
        <t-form-item label="音频类型">
          <t-radio-group v-model="generateForm.type">
            <t-radio-button value="bgm">背景音乐</t-radio-button>
            <t-radio-button value="sfx">音效</t-radio-button>
            <t-radio-button value="voice">配音</t-radio-button>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="描述">
          <t-textarea
            v-model="generateForm.description"
            placeholder="如: 欢快的背景音乐，轻快的节奏，适合喜剧场景"
            :rows="4" />
        </t-form-item>
        <t-form-item label="时长">
          <t-slider v-model="generateForm.duration" :min="5" :max="180" :step="5" />
          <span>{{ generateForm.duration }} 秒</span>
        </t-form-item>
      </t-form>
      <template #footer>
        <t-button theme="primary" @click="generateAudio" :loading="generating">
          生成
        </t-button>
        <t-button @click="showGenerateDialog = false">取消</t-button>
      </template>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import axios from "axios";

interface AudioItem {
  id: number;
  name: string;
  url: string;
  type: "bgm" | "sfx" | "voice";
  duration: number;
  size: number;
  createdAt: string;
}

const audios = ref<AudioItem[]>([]);
const searchKeyword = ref("");
const filterType = ref("all");
const isPlaying = ref<number | null>(null);
const currentAudio = ref<AudioItem | null>(null);
const currentTime = ref(0);
const playProgress = ref(0);
const audioPlayer = ref<HTMLAudioElement | null>(null);

const showUploadDialog = ref(false);
const showGenerateDialog = ref(false);
const generating = ref(false);
const uploadFiles = ref([]);

const generateForm = reactive({
  type: "bgm" as "bgm" | "sfx" | "voice",
  description: "",
  duration: 30,
});

const filteredAudios = computed(() => {
  return audios.value.filter((audio) => {
    const matchKeyword = audio.name.toLowerCase().includes(searchKeyword.value.toLowerCase());
    const matchType = filterType.value === "all" || audio.type === filterType.value;
    return matchKeyword && matchType;
  });
});

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bgm: "背景音乐",
    sfx: "音效",
    voice: "配音",
  };
  return labels[type] || type;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getRandomHeight(): number {
  return Math.random() * 60 + 20;
}

async function loadAudios() {
  try {
    const response = await axios.get("/api/assets/audio/list");
    if (response.data.success) {
      audios.value = response.data.data;
    }
  } catch (error) {
    MessagePlugin.error("加载音频列表失败");
  }
}

function searchAudio() {
  // 已在 computed 中自动过滤
}

function playAudio(audio: AudioItem) {
  if (isPlaying.value === audio.id) {
    togglePlay();
  } else {
    currentAudio.value = audio;
    isPlaying.value = audio.id;
    audioPlayer.value?.play();
  }
}

function togglePlay() {
  if (!audioPlayer.value) return;
  if (audioPlayer.value.paused) {
    audioPlayer.value.play();
  } else {
    audioPlayer.value.pause();
  }
}

function onTimeUpdate() {
  if (!audioPlayer.value || !currentAudio.value) return;
  currentTime.value = audioPlayer.value.currentTime;
  playProgress.value = (currentTime.value / currentAudio.value.duration) * 100;
}

function onEnded() {
  isPlaying.value = null;
  playProgress.value = 0;
}

function useAudio(audio: AudioItem) {
  MessagePlugin.success(`已选择音频: ${audio.name}`);
  // 可以 emit 事件或调用回调
}

function editAudio(audio: AudioItem) {
  // 打开编辑对话框
  console.log("编辑音频:", audio);
}

async function deleteAudio(audio: AudioItem) {
  try {
    await axios.post("/api/assets/audio/delete", { id: audio.id });
    audios.value = audios.value.filter((a) => a.id !== audio.id);
    MessagePlugin.success("删除成功");
  } catch (error) {
    MessagePlugin.error("删除失败");
  }
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
  return true;
}

function onUploadSuccess() {
  MessagePlugin.success("上传成功");
  showUploadDialog.value = false;
  loadAudios();
}

async function generateAudio() {
  generating.value = true;
  try {
    const response = await axios.post("/api/assets/audio/generate", {
      type: generateForm.type,
      description: generateForm.description,
      duration: generateForm.duration,
    });

    if (response.data.success) {
      MessagePlugin.success("音频生成中，请稍候...");
      showGenerateDialog.value = false;
      // 轮询生成状态
      pollGeneration(response.data.taskId);
    }
  } catch (error) {
    MessagePlugin.error("生成失败");
  } finally {
    generating.value = false;
  }
}

async function pollGeneration(taskId: string) {
  // 实现轮询逻辑
}

// 初始化
loadAudios();
</script>

<style scoped>
.audioAssets {
  padding: 16px;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filterBar {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.audioGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.audioCard {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.audioCard:hover {
  border-color: var(--td-brand-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.audioWaveform {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--td-bg-color-container-hover);
  cursor: pointer;
}

.waveformBars {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 32px;
}

.bar {
  width: 3px;
  background: var(--td-brand-color);
  border-radius: 2px;
  transition: height 0.1s;
}

.audioInfo {
  padding: 12px;
}

.audioInfo h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audioMeta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.duration {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.audioActions {
  display: flex;
  gap: 4px;
}

.audioPlayer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--td-bg-color-container);
  border-top: 1px solid var(--td-border-level-1-color);
  z-index: 100;
}

.playerInfo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

.playerControls {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progressBar {
  flex: 1;
  height: 4px;
  background: var(--td-border-level-1-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: var(--td-brand-color);
  transition: width 0.1s;
}

.time {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  min-width: 80px;
  text-align: right;
}
</style>
