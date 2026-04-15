<template>
  <div class="vendorConfig">
    <!-- 供应商列表 -->
    <t-card class="vendorList">
      <template #header>
        <div class="cardHeader">
          <span>{{ $t("settings.vendor.title") }}</span>
          <t-button theme="primary" size="small" @click="showAddDialog = true">
            <template #icon>
              <t-icon name="add" />
            </template>
            添加供应商
          </t-button>
        </div>
      </template>

      <t-table :data="vendors" :columns="columns" row-key="id" hover stripe>
        <template #status="{ row }">
          <t-tag :theme="row.enable ? 'success' : 'default'">
            {{ row.enable ? "已启用" : "已禁用" }}
          </t-tag>
        </template>
        <template #operations="{ row }">
          <t-button size="small" variant="text" @click="editVendor(row)">
            编辑
          </t-button>
          <t-button size="small" variant="text" @click="toggleVendor(row)">
            {{ row.enable ? "禁用" : "启用" }}
          </t-button>
          <t-button size="small" variant="text" theme="danger" @click="deleteVendor(row)">
            删除
          </t-button>
        </template>
      </t-table>
    </t-card>

    <!-- 添加/编辑供应商对话框 -->
    <t-dialog
      v-model:visible="showAddDialog"
      :header="editingVendor ? '编辑供应商' : '添加供应商'"
      width="600px"
      :confirm-btn="{ content: '保存', theme: 'primary' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="saveVendor">
      <t-form labelWidth="100">
        <t-form-item label="供应商ID">
          <t-input v-model="vendorForm.id" placeholder="如: myvendor" :disabled="!!editingVendor" />
        </t-form-item>
        <t-form-item label="供应商名称">
          <t-input v-model="vendorForm.name" placeholder="如: 我的供应商" />
        </t-form-item>
        <t-form-item label="作者">
          <t-input v-model="vendorForm.author" placeholder="作者名称" />
        </t-form-item>
        <t-form-item label="描述">
          <t-textarea v-model="vendorForm.description" placeholder="供应商描述" :rows="3" />
        </t-form-item>
        <t-form-item label="官方链接">
          <t-input v-model="vendorForm.link" placeholder="https://..." />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { MessagePlugin, DialogPlugin } from "tdesign-vue-next";
import axios from "axios";

interface Vendor {
  id: string;
  name: string;
  author: string;
  description: string;
  link: string;
  enable: boolean;
  inputs: string[];
  models: any[];
}

const vendors = ref<Vendor[]>([]);
const showAddDialog = ref(false);
const editingVendor = ref<Vendor | null>(null);

const vendorForm = ref({
  id: "",
  name: "",
  author: "",
  description: "",
  link: "",
});

const columns = [
  { colKey: "id", title: "ID", width: 120 },
  { colKey: "name", title: "名称", width: 150 },
  { colKey: "author", title: "作者", width: 120 },
  { colKey: "status", title: "状态", width: 100 },
  { colKey: "operations", title: "操作", width: 180 },
];

async function loadVendors() {
  try {
    const response = await axios.post("/api/setting/vendorConfig/getVendorList");
    if (response.data.success) {
      vendors.value = response.data.data;
    }
  } catch (error) {
    MessagePlugin.error("加载供应商列表失败");
  }
}

function editVendor(vendor: Vendor) {
  editingVendor.value = vendor;
  vendorForm.value = {
    id: vendor.id,
    name: vendor.name,
    author: vendor.author,
    description: vendor.description,
    link: vendor.link,
  };
  showAddDialog.value = true;
}

async function saveVendor() {
  try {
    const api = editingVendor.value
      ? "/api/setting/vendorConfig/updateVendorInputs"
      : "/api/setting/vendorConfig/addVendor";

    await axios.post(api, {
      id: vendorForm.value.id,
      name: vendorForm.value.name,
      author: vendorForm.value.author,
      description: vendorForm.value.description,
      link: vendorForm.value.link,
    });

    MessagePlugin.success(editingVendor.value ? "更新成功" : "添加成功");
    showAddDialog.value = false;
    loadVendors();
  } catch (error) {
    MessagePlugin.error("保存失败");
  }
}

async function toggleVendor(vendor: Vendor) {
  try {
    await axios.post("/api/setting/vendorConfig/enableVendor", {
      id: vendor.id,
      enable: !vendor.enable,
    });
    MessagePlugin.success(vendor.enable ? "已禁用" : "已启用");
    loadVendors();
  } catch (error) {
    MessagePlugin.error("操作失败");
  }
}

async function deleteVendor(vendor: Vendor) {
  const confirmDialog = DialogPlugin.confirm({
    header: "确认删除",
    body: `确定要删除供应商 "${vendor.name}" 吗？此操作不可恢复。`,
    theme: "danger",
    onConfirm: async () => {
      confirmDialog.hide();
      try {
        await axios.post("/api/setting/vendorConfig/deleteVendor", { id: vendor.id });
        MessagePlugin.success("删除成功");
        loadVendors();
      } catch (error) {
        MessagePlugin.error("删除失败");
      }
    },
  });
}

onMounted(() => {
  loadVendors();
});
</script>

<style scoped>
.vendorConfig {
  padding: 16px;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
