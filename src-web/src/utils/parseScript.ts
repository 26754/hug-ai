// 剧本解析工具

export interface ScriptChapter {
  title: string;
  content: string;
  lineNumber: number;
}

export interface ScriptParseResult {
  title: string;
  outline: string;
  scenes: {
    title: string;
    startLine: number;
    endLine: number;
  }[];
  lines: {
    type: "dialogue" | "description" | "action" | "stage_direction";
    speaker?: string;
    content: string;
    lineNumber: number;
  }[];
}

/**
 * 解析剧本文本
 * @param text 剧本原始文本
 * @returns 解析后的剧本结构
 */
export default function parseScript(text: string): ScriptParseResult {
  const lines = text.split("\n");
  const result: ScriptParseResult = {
    title: "",
    outline: "",
    scenes: [],
    lines: [],
  };

  let currentScene: { title: string; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const trimmed = line.trim();

    // 空行跳过
    if (!trimmed) continue;

    // 提取标题（第一个非空行）
    if (!result.title) {
      result.title = trimmed;
      continue;
    }

    // 提取大纲（第二个非空行）
    if (!result.outline && result.title && trimmed.length < 200) {
      result.outline = trimmed;
      continue;
    }

    // 检测场景标记
    const sceneMatch = trimmed.match(/^(场景|Scene|S)\s*[\.、:：]\s*(.+)/i);
    if (sceneMatch) {
      if (currentScene) {
        currentScene.startLine;
      }
      currentScene = {
        title: sceneMatch[2],
        startLine: lineNumber,
      };
      result.scenes.push({
        title: sceneMatch[2],
        startLine: lineNumber,
        endLine: lineNumber,
      });
      continue;
    }

    // 解析对话行
    const dialogueMatch = trimmed.match(/^【(.+?)】(.+)/);
    if (dialogueMatch) {
      result.lines.push({
        type: "dialogue",
        speaker: dialogueMatch[1],
        content: dialogueMatch[2],
        lineNumber,
      });
      continue;
    }

    // 解析旁白/解说
    const narrationMatch = trimmed.match(/^旁白[：:](.+)/);
    if (narrationMatch) {
      result.lines.push({
        type: "description",
        speaker: "旁白",
        content: narrationMatch[1],
        lineNumber,
      });
      continue;
    }

    // 解析动作指示
    const actionMatch = trimmed.match(/^\((.+)\)$|^\[动作：(.+)\]/);
    if (actionMatch) {
      result.lines.push({
        type: "action",
        content: actionMatch[1] || actionMatch[2],
        lineNumber,
      });
      continue;
    }

    // 解析舞台指示
    const stageMatch = trimmed.match(/^【(.+?)】$/);
    if (stageMatch) {
      result.lines.push({
        type: "stage_direction",
        content: stageMatch[1],
        lineNumber,
      });
      continue;
    }

    // 默认作为描述
    result.lines.push({
      type: "description",
      content: trimmed,
      lineNumber,
    });
  }

  // 更新场景结束行
  for (let i = 0; i < result.scenes.length; i++) {
    if (i < result.scenes.length - 1) {
      result.scenes[i].endLine = result.scenes[i + 1].startLine - 1;
    } else {
      result.scenes[i].endLine = lines.length;
    }
  }

  return result;
}

/**
 * 格式化剧本为标准格式
 * @param result 解析后的剧本
 * @returns 格式化后的文本
 */
export function formatScript(result: ScriptParseResult): string {
  const output: string[] = [];

  // 标题
  output.push(`# ${result.title}`);
  output.push("");

  // 大纲
  if (result.outline) {
    output.push(`**大纲**: ${result.outline}`);
    output.push("");
  }

  // 场景列表
  if (result.scenes.length > 0) {
    output.push("## 场景");
    for (const scene of result.scenes) {
      output.push(`- ${scene.title} (第${scene.startLine}-${scene.endLine}行)`);
    }
    output.push("");
  }

  // 正文
  output.push("## 正文");
  for (const line of result.lines) {
    switch (line.type) {
      case "dialogue":
        output.push(`【${line.speaker}】${line.content}`);
        break;
      case "description":
        output.push(line.content);
        break;
      case "action":
        output.push(`（${line.content}）`);
        break;
      case "stage_direction":
        output.push(`【${line.content}】`);
        break;
    }
  }

  return output.join("\n");
}
