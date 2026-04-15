import path from "path";
import fs from "fs";
import getPath from "@/utils/getPath";
import db from "@/utils/db";

// 动态导入类型
type FeatureExtractionPipeline = {
  (text: string, options?: any): Promise<any>;
  dispose?: () => Promise<void>;
};

// ── 模型配置 ──
let extractor: FeatureExtractionPipeline | null = null;
let transformersEnv: any = null;

async function loadTransformers() {
  if (transformersEnv) return;
  // 动态导入 transformers（避免顶级导入 onnxruntime-node）
  const transformers = await import("@huggingface/transformers");
  transformersEnv = transformers.env;
  transformersEnv.allowRemoteModels = false;
  transformersEnv.allowLocalModels = true;
  transformersEnv.localModelPath = getPath("models").replace(/\\/g, "/") + "/";
  return transformers;
}

export async function initEmbedding(): Promise<void> {
  if (extractor) return;

  const { pipeline } = await loadTransformers() || {};

  const modelConfigData = await db("o_setting").whereIn("key", ["modelOnnxFile", "modelDtype"]);
  const modelObj: Record<string, string> = {};
  Object.entries(modelConfigData).forEach(([key, value]) => {
    modelObj[key] = value as string;
  });
  let modelOnnxFile = modelObj?.modelOnnxFile ? JSON.parse(modelObj.modelOnnxFile) : ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]; // 模型文件路径
  let modelDtype = modelObj?.modelDtype ?? "fp16"; // 量化类型：fp32
  const onnxPath = path.join(getPath("models"), ...modelOnnxFile);
  if (!fs.existsSync(onnxPath)) {
    console.warn(`[Embedding] 模型文件不存在，跳过初始化: ${onnxPath}`);
    return;
  }

  const modelFolder = modelOnnxFile[0];
  // @ts-ignore - pipeline 重载联合类型过于复杂
  extractor = await pipeline("feature-extraction", modelFolder, { dtype: modelDtype });
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (!extractor) {
    try {
      await initEmbedding();
    } catch (e) {
      console.warn("[Embedding] 模型初始化失败:", e);
      return [];
    }
  }
  if (!extractor) return [];
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  return a.reduce((dot, v, i) => dot + v * b[i], 0);
}

export async function disposeEmbedding(): Promise<void> {
  await extractor?.dispose?.();
  extractor = null;
}
