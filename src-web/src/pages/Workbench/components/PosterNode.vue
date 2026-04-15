<template>
  <t-card class="poster">
    <template #header>
      <div class="titleBar dragHandle">
        <div class="title">
          <t-icon name="image" />
          <span>{{ $t('workbench.production.node.poster.title') }}</span>
        </div>
        <t-tag size="small" variant="outline">
          {{ $t('workbench.production.node.poster.coverCount', { count: posterItems.length }) }}
        </t-tag>
        <Handle
          :id="props.handleIds.target"
          type="target"
          :position="Position.Left"
          :style="{ left: '-12px' }" />
      </div>
    </template>

    <!-- 海报网格 -->
    <div class="posterGrid">
      <div
        v-for="(item, index) in posterItems"
        :key="item.id"
        class="posterCard"
        @click="selectPoster(item)">
        <div class="posterImage">
          <t-image
            v-if="item.image"
            :src="item.image"
            fit="cover"
            class="posterImg"
            :style="{ aspectRatio: ratioOptions[item.ratio] || '2/3' }">
            <template #overlayContent>
              <div class="imageToolsWrap">
                <t-space direction="vertical" size="4px">
                  <t-button
                    size="small"
                    variant="primary"
                    theme="default"
                    @click.stop="editPoster(item)">
                    <t-icon name="edit" />
                  </t-button>
                  <t-button
                    size="small"
                    variant="primary"
                    theme="default"
                    @click.stop="regeneratePoster(item)">
                    <t-icon name="refresh" />
                  </t-button>
                  <t-button
                    size="small"
                    variant="primary"
                    theme="danger"
                    @click.stop="deletePoster(item)">
                    <t-icon name="delete" />
                  </t-button>
                </t-space>
              </div>
            </template>
          </t-image>
          <div v-else class="posterPlaceholder">
            <t-icon name="image" size="32px" />
            <span>点击生成</span>
          </div>
        </div>
        <div class="posterInfo">
          <span class="posterTitle">{{ item.title || '海报 ' + (index + 1) }}</span>
          <t-tag size="small" variant="outline">{{ ratioLabels[item.ratio] || '竖版' }}</t-tag>
        </div>
      </div>

      <!-- 添加按钮 -->
      <div class="addPoster" @click="addPoster">
        <t-icon name="add" size="24px" />
        <span>添加海报</span>
      </div>
    </div>

    <!-- 生成对话框 -->
    <t-dialog
      v-model:visible="showGenerateDialog"
      header="生成海报"
      width="600px"
      :confirm-btn="{ content: '开始生成', theme: 'primary' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="generatePosters">
      <t-form labelWidth="100">
        <t-form-item label="生成数量">
          <t-input-number v-model="generateForm.count" :min="1" :max="9" />
        </t-form-item>
        <t-form-item label="画面比例">
          <t-select v-model="generateForm.ratio">
            <t-option value="2:3" label="2:3 竖版" />
            <t-option value="3:4" label="3:4 竖版" />
            <t-option value="16:9" label="16:9 横版" />
            <t-option value="1:1" label="1:1 方版" />
          </t-select>
        </t-form-item>
        <t-form-item label="风格描述">
          <t-textarea
            v-model="generateForm.style"
            placeholder="如: 电影海报风格，高对比度，戏剧性光影"
            :rows="3" />
        </t-form-item>
        <t-form-item label="画面元素">
          <t-textarea
            v-model="generateForm.elements"
            placeholder="如: 主角正脸，特写，背景虚化"
            :rows="2" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </t-card>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { MessagePlugin } from "tdesign-vue-next";
import axios from "axios";

interface HandleIds {
  source: string;
  target: string;
}

interface PosterItem {
  id: number;
  image?: string;
  title?: string;
  ratio: string;
  prompt?: string;
  status: "pending" | "generating" | "done" | "failed";
}

const props = defineProps<{
  handleIds: HandleIds;
  nodeId: string;
}>();

const posterItems = ref<PosterItem[]>([]);
const showGenerateDialog = ref(false);
const selectedPoster = ref<PosterItem | null>(null);

const ratioOptions: Record<string, string> = {
  "2:3": "2/3",
  "3:4": "3/4",
  "16:9": "16/9",
  "1:1": "1/1",
};

const ratioLabels: Record<string, string> = {
  "2:3": "竖版",
  "3:4": "竖版",
  "16:9": "横版",
  "1:1": "方版",
};

const generateForm = reactive({
  count: 3,
  ratio: "2:3",
  style: "",
  elements: "",
});

function addPoster() {
  showGenerateDialog.value = true;
}

function selectPoster(item: PosterItem) {
  if (!item.image) {
    editPoster(item);
  }
}

function editPoster(item: PosterItem) {
  selectedPoster.value = item;
  showGenerateDialog.value = true;
}

async function generatePosters() {
  showGenerateDialog.value = false;

  try {
    const response = await axios.post("/api/production/poster/generate", {
      nodeId: props.nodeId,
      count: generateForm.count,
      ratio: generateForm.ratio,
      style: generateForm.style,
      elements: generateForm.elements,
    });

    if (response.data.success) {
      const newItems = response.data.data.map(
        (img: string, index: number) => ({
          id: Date.now() + index,
          image: img,
          title: `海报 ${posterItems.value.length + index + 1}`,
          ratio: generateForm.ratio,
          status: "done" as const,
        })
      );
      posterItems.value.push(...newItems);
      MessagePlugin.success(`成功生成 ${newItems.length} 张海报`);
    }
  } catch (error) {
    MessagePlugin.error("生成失败，请重试");
  }
}

async function regeneratePoster(item: PosterItem) {
  item.status = "generating";
  try {
    const response = await axios.post("/api/production/poster/regenerate", {
      posterId: item.id,
      style: generateForm.style,
      elements: generateForm.elements,
    });

    if (response.data.success) {
      item.image = response.data.data.image;
      item.status = "done";
      MessagePlugin.success("重新生成成功");
    }
  } catch (error) {
    item.status = "failed";
    MessagePlugin.error("重新生成失败");
  }
}

async function deletePoster(item: PosterItem) {
  const index = posterItems.value.findIndex((p) => p.id === item.id);
  if (index !== -1) {
    posterItems.value.splice(index, 1);
    MessagePlugin.success("已删除");
  }
}
</script>

<style scoped>
.poster {
  min-width: 300px;
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

.posterGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.posterCard {
  cursor: pointer;
  transition: transform 0.2s;
}

.posterCard:hover {
  transform: scale(1.02);
}

.posterImage {
  border-radius: 8px;
  overflow: hidden;
  background: var(--td-bg-color-container-hover);
}

.posterImg {
  width: 100%;
  display: block;
}

.posterPlaceholder {
  aspect-ratio: 2/3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--td-text-color-disabled);
}

.posterInfo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.posterTitle {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.imageToolsWrap {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 8px;
}

.addPoster {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed var(--td-border-level-1-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--td-text-color-secondary);
  transition: all 0.2s;
  min-height: 200px;
}

.addPoster:hover {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}
</style>
