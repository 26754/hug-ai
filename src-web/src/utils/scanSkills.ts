// 技能扫描工具
import axios from "axios";
import { NotifyPlugin, Progress } from "tdesign-vue-next";
import { h, ref } from "vue";

// 延迟函数
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function scanSkills() {
  const progressValue = ref(0);

  // 显示进度通知
  const notifyInstance = NotifyPlugin.info({
    title: "技能扫描中",
    content: () =>
      h("div", { style: "width: 100%; padding-top: 10px;" }, [
        h(Progress, {
          percentage: progressValue.value,
          status: progressValue.value >= 100 ? "success" : "active",
        }),
      ]),
    duration: 0,
    closeBtn: true,
  });

  try {
    const [{ data }] = await Promise.all([
      axios.post("/api/setting/skillManagement/scanSkills"),
      (async () => {
        for (let i = 1; i <= 10; i++) {
          await delay(100);
          progressValue.value = i * 9;
        }
      })(),
    ]);

    progressValue.value = 100;
    await delay(300);
    NotifyPlugin.close(notifyInstance);

    // 成功通知
    const changes = [
      data.insertedCount && `新增 ${data.insertedCount} 个`,
      data.updatedCount && `更新 ${data.updatedCount} 个`,
      data.removedCount && `移除 ${data.removedCount} 个`,
    ].filter(Boolean);

    NotifyPlugin.success({
      title: "扫描完成",
      content: `共扫描 ${data.totalFiles} 个文件 | ${changes.join(" | ")}`,
      closeBtn: true,
    });

    // 警告通知
    if (data.noDescriptionSkillCount > 0 || data.noAttributionSkillCount > 0) {
      const warnings = [];
      if (data.noDescriptionSkillCount > 0) {
        warnings.push(`${data.noDescriptionSkillCount} 个缺少描述`);
      }
      if (data.noAttributionSkillCount > 0) {
        warnings.push(`${data.noAttributionSkillCount} 个缺少分类`);
      }
      NotifyPlugin.warning({
        title: "配置警告",
        content: warnings.join(" | "),
        duration: 6000,
        closeBtn: true,
      });
    }

    return data;
  } catch (error) {
    NotifyPlugin.close(notifyInstance);
    NotifyPlugin.error({
      title: "扫描失败",
      content: "请检查网络连接后重试",
      duration: 3000,
      closeBtn: true,
    });
    throw error;
  }
}
