<template>
  <div class="skillManagement">
    <t-card>
      <template #header>
        <div class="cardHeader">
          <span>技能管理</span>
          <t-space>
            <t-button variant="outline" @click="scanSkills">
              <template #icon>
                <t-icon name="refresh" />
              </template>
              扫描技能
            </t-button>
            <t-button theme="primary" @click="showAddDialog = true">
              <template #icon>
                <t-icon name="add" />
              </template>
              添加技能
            </t-button>
          </t-space>
        </div>
      </template>

      <!-- 技能分类标签 -->
      <t-tabs v-model="activeCategory">
        <t-tab-panel value="all" label="全部" />
        <t-tab-panel value="script" label="剧本 Agent" />
        <t-tab-panel value="production" label="生产 Agent" />
        <t-tab-panel value="art" label="艺术风格" />
        <t-tab-panel value="story" label="故事类型" />
      </t-tabs>

      <!-- 技能列表 -->
      <div class="skillGrid">
        <div
          v-for="skill in filteredSkills"
          :key="skill.path"
          class="skillCard"
          @click="openEditor(skill)">
          <div class="skillIcon">
            <t-icon :name="getCategoryIcon(skill.category)" size="24px" />
          </div>
          <div class="skillInfo">
            <h4>{{ skill.name }}</h4>
            <p>{{ skill.description }}</p>
            <div class="skillMeta">
              <t-tag size="small">{{ skill.category }}</t-tag>
              <span class="skillPath">{{ skill.path }}</span>
            </div>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 技能编辑器对话框 -->
    <t-dialog
      v-model:visible="showEditor"
      :header="currentSkill?.name || '编辑技能'"
      width="90vw"
      placement="center"
      :close-on-overlay-click="false">
      <div class="editorContainer">
        <div class="editorToolbar">
          <t-space>
            <t-button size="small" theme="primary" @click="saveSkill" :loading="saving">
              保存
            </t-button>
            <t-button size="small" variant="outline" @click="showEditor = false">
              取消
            </t-button>
          </t-space>
          <t-button size="small" variant="outline" @click="resetContent">
            重置
          </t-button>
        </div>
        <textarea
          ref="editorRef"
          v-model="editContent"
          class="skillEditor"
          placeholder="编写技能内容..."></textarea>
      </div>
    </t-dialog>

    <!-- 添加技能对话框 -->
    <t-dialog
      v-model:visible="showAddDialog"
      header="添加技能"
      width="500px"
      :confirm-btn="{ content: '创建', theme: 'primary' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="createSkill">
      <t-form labelWidth="100">
        <t-form-item label="技能路径">
          <t-input v-model="newSkill.path" placeholder="如: my_custom_skill.md" />
        </t-form-item>
        <t-form-item label="技能名称">
          <t-input v-model="newSkill.name" placeholder="技能显示名称" />
        </t-form-item>
        <t-form-item label="分类">
          <t-select v-model="newSkill.category">
            <t-option value="script" label="剧本 Agent" />
            <t-option value="production" label="生产 Agent" />
            <t-option value="art" label="艺术风格" />
            <t-option value="story" label="故事类型" />
          </t-select>
        </t-form-item>
        <t-form-item label="描述">
          <t-textarea v-model="newSkill.description" placeholder="技能描述" :rows="3" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import axios from "axios";

interface Skill {
  path: string;
  name: string;
  description: string;
  category: string;
  content?: string;
}

const skills = ref<Skill[]>([]);
const activeCategory = ref("all");
const showEditor = ref(false);
const showAddDialog = ref(false);
const currentSkill = ref<Skill | null>(null);
const editContent = ref("");
const originalContent = ref("");
const saving = ref(false);
const editorRef = ref<HTMLTextAreaElement | null>(null);

const newSkill = ref({
  path: "",
  name: "",
  category: "script",
  description: "",
});

const filteredSkills = computed(() => {
  if (activeCategory.value === "all") return skills.value;
  return skills.value.filter(
    (s) => s.category.toLowerCase() === activeCategory.value
  );
});

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    script: "chat",
    production: "video",
    art: "palette",
    story: "book-open",
  };
  return iconMap[category.toLowerCase()] || "file";
}

async function loadSkills() {
  try {
    const response = await axios.post("/api/setting/skillManagement/getSkillList");
    if (response.data.success) {
      skills.value = response.data.data;
    }
  } catch (error) {
    MessagePlugin.error("加载技能列表失败");
  }
}

async function scanSkills() {
  try {
    await loadSkills();
    MessagePlugin.success("技能扫描完成");
  } catch (error) {
    MessagePlugin.error("扫描失败");
  }
}

async function openEditor(skill: Skill) {
  try {
    const response = await axios.post("/api/setting/skillManagement/getSkillContent", {
      path: skill.path,
    });
    if (response.data.success) {
      currentSkill.value = skill;
      editContent.value = response.data.data;
      originalContent.value = response.data.data;
      showEditor.value = true;
    }
  } catch (error) {
    MessagePlugin.error("加载技能内容失败");
  }
}

async function saveSkill() {
  if (!currentSkill.value) return;

  saving.value = true;
  try {
    await axios.post("/api/setting/skillManagement/saveSkillContent", {
      path: currentSkill.value.path,
      content: editContent.value,
    });
    MessagePlugin.success("保存成功");
    showEditor.value = false;
    loadSkills();
  } catch (error) {
    MessagePlugin.error("保存失败");
  } finally {
    saving.value = false;
  }
}

function resetContent() {
  editContent.value = originalContent.value;
}

async function createSkill() {
  try {
    const content = `---
name: ${newSkill.value.name}
description: ${newSkill.value.description}
category: ${newSkill.value.category}
---

# ${newSkill.value.name}

在这里编写技能内容...
`;

    await axios.post("/api/setting/skillManagement/saveSkillContent", {
      path: newSkill.value.path,
      content: content,
    });

    MessagePlugin.success("技能创建成功");
    showAddDialog.value = false;
    loadSkills();

    // 重置表单
    newSkill.value = {
      path: "",
      name: "",
      category: "script",
      description: "",
    };
  } catch (error) {
    MessagePlugin.error("创建失败");
  }
}

onMounted(() => {
  loadSkills();
});
</script>

<style scoped>
.skillManagement {
  padding: 16px;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skillGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.skillCard {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.skillCard:hover {
  border-color: var(--td-brand-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.skillIcon {
  color: var(--td-brand-color);
  margin-bottom: 12px;
}

.skillInfo h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.skillInfo p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
  line-height: 1.4;
}

.skillMeta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skillPath {
  font-size: 12px;
  color: var(--td-text-color-disabled);
}

.editorContainer {
  display: flex;
  flex-direction: column;
  height: 60vh;
}

.editorToolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.skillEditor {
  flex: 1;
  width: 100%;
  padding: 16px;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 14px;
  line-height: 1.6;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  resize: none;
}

.skillEditor:focus {
  outline: none;
  border-color: var(--td-brand-color);
}
</style>
