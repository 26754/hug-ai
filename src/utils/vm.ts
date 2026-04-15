// 延迟加载所有重型依赖，避免 esbuild 打包问题
let VM: any = null;
let sharp: any = null;
let axios: any = null;
let createOpenAI: any = null;
let createDeepSeek: any = null;
let createZhipu: any = null;
let createQwen: any = null;
let createGoogleGenerativeAI: any = null;
let createAnthropic: any = null;
let createOpenAICompatible: any = null;
let createXai: any = null;
let createMinimax: any = null;
let FormData: any = null;
let jsonwebtoken: any = null;
let u: any = null;

async function loadDeps() {
  if (VM) return;
  const vm2 = await import("vm2");
  VM = vm2.VM;
  sharp = await import("sharp");
  axios = (await import("axios")).default;
  const openai = await import("@ai-sdk/openai");
  createOpenAI = openai.createOpenAI;
  const deepseek = await import("@ai-sdk/deepseek");
  createDeepSeek = deepseek.createDeepSeek;
  const zhipu = await import("zhipu-ai-provider");
  createZhipu = zhipu.createZhipu;
  const qwen = await import("qwen-ai-provider-v5");
  createQwen = qwen.createQwen;
  const google = await import("@ai-sdk/google");
  createGoogleGenerativeAI = google.createGoogleGenerativeAI;
  const anthropic = await import("@ai-sdk/anthropic");
  createAnthropic = anthropic.createAnthropic;
  const openaiCompat = await import("@ai-sdk/openai-compatible");
  createOpenAICompatible = openaiCompat.createOpenAICompatible;
  const xai = await import("@ai-sdk/xai");
  createXai = xai.createXai;
  const minimax = await import("vercel-minimax-ai-provider");
  createMinimax = minimax.createMinimax;
  FormData = (await import("form-data")).default;
  jsonwebtoken = (await import("jsonwebtoken")).default;
  u = (await import("@/utils")).default;
}

export default async function runCode(code: string, vendor?: Record<string, any>) {
  await loadDeps();

  code = code.replace(/export\s*\{\s*\};?/g, ""); // 去掉 export {} 以免沙盒环境报错
  // 创建一个沙盒
  const exports: Record<string, any> = {};
  const sandbox: Record<string, any> = {
    createOpenAI,
    createDeepSeek,
    createZhipu,
    createQwen,
    createAnthropic,
    createOpenAICompatible,
    createXai,
    createMinimax,
    createGoogleGenerativeAI,
    zipImage,
    zipImageResolution,
    urlToBase64,
    mergeImages,
    pollTask,
    fetch: fetch,
    exports,
    axios,
    FormData,
    logger,
    jsonwebtoken,
  };
  if (vendor !== undefined) {
    sandbox.vendor = vendor;
  }
  const vm = new VM({
    timeout: 0,
    sandbox,
    compiler: "javascript",
    eval: false,
    wasm: false,
  });

  vm.run(code);

  return exports as Record<string, any>;
}
export function logger(logstring: string) {
  console.log("【VM】" + logstring);
}
/**
 * 压缩图片，目标字节数不高于 size
 */
export async function zipImage(completeBase64: string, size: number): Promise<string> {
  let quality = 80;
  let buffer = Buffer.from(completeBase64.split(",")[1], "base64");
  let output = await sharp.default(buffer).jpeg({ quality }).toBuffer();
  while (output.length > size && quality > 10) {
    quality -= 10;
    output = await sharp.default(buffer).jpeg({ quality }).toBuffer();
  }
  return "data:image/jpeg;base64," + output.toString("base64");
}

export async function zipImageResolution(completeBase64: string, width: number, height: number): Promise<string> {
  const buffer = Buffer.from(completeBase64.split(",")[1], "base64");
  const out = await sharp.default(buffer).resize(width, height).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

//url转Base64
export async function urlToBase64(url: string): Promise<string> {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const mime = res.headers["content-type"] || "image/jpeg";
  const b64 = Buffer.from(res.data).toString("base64");
  return `data:${mime};base64,${b64}`;
}

export async function pollTask(
  fn: () => Promise<{ completed: boolean; data?: string; error?: string }>,
  interval = 3000,
  timeout = 3000000,
): Promise<{ completed: boolean; data?: string; error?: string }> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await fn();
      if (result.completed) return result;
      if (result?.error) return result;
    } catch (e: any) {
      return { completed: false, error: u?.error?.(e)?.message || "poll error" };
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return { completed: false, error: "poll timeout" };
}

// 合并图片
export async function mergeImages(images: string[], direction: "horizontal" | "vertical" = "horizontal", gap = 0): Promise<string> {
  const sharpImages = await Promise.all(images.map((img) => sharp.default(Buffer.from(img.split(",")[1], "base64")).toBuffer()));
  const metadata = await Promise.all(sharpImages.map((img) => sharp.default(img).metadata()));
  const widths = metadata.map((m) => m.width || 0);
  const heights = metadata.map((m) => m.height || 0);
  const totalWidth = direction === "horizontal" ? widths.reduce((a, b) => a + b, 0) + gap * (images.length - 1) : Math.max(...widths);
  const totalHeight = direction === "vertical" ? heights.reduce((a, b) => a + b, 0) + gap * (images.length - 1) : Math.max(...heights);
  const composites = sharpImages.map((img, i) => {
    const x = direction === "horizontal" ? widths.slice(0, i).reduce((a, b) => a + b, 0) + gap * i : 0;
    const y = direction === "vertical" ? heights.slice(0, i).reduce((a, b) => a + b, 0) + gap * i : 0;
    return { input: img, left: x, top: y };
  });
  const out = await sharp.default({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
  return "data:image/png;base64," + out.toString("base64");
}
