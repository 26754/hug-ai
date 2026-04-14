import db from "@/utils/db";
import oss from "@/utils/oss";
import getConfig from "./utils/getConfig";
import { v4 as uuid } from "uuid";
import error from "@/utils/error";
import cleanNovel from "./utils/cleanNovel";
import getPath from "@/utils/getPath";
import vmModule from "@/utils/vm";
import task from "@/utils/taskRecord";
import Ai from "@/utils/ai";
import { getPrompts } from "@/utils/getPrompts";
import { getArtPrompt } from "@/utils/getArtPrompt";
import replaceUrl from "@/utils/replaceUrl";
import writeVersion from "@/utils/writeVersion";
import * as vendor from "@/utils/vendor";

// 创建 vm 函数作为 runCode 的别名
const vm = vmModule.runCode || vmModule.vm;

export default {
  db,
  oss,
  getConfig,
  uuid,
  error,
  cleanNovel,
  vm,
  getPath,
  Ai,
  task,
  getPrompts,
  getArtPrompt,
  replaceUrl,
  writeVersion,
  vendor,
};
