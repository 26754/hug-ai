// 小说解析工具
const REEL_REGEX = /^(第[\d一二三四五六七八九十百千]+卷)\s*([^\n第]*)/gm;
const DEFAULT_CHAPTER_REGEX = /第\s*([0-9０-９零一二三四五六七八九十百千万]+)\s*[章回节]\s*([^\n\r]*)/g;

const CHINESE_NUM_MAP: { [key: string]: number } = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const CHINESE_UNIT_MAP: { [key: string]: number } = {
  十: 10,
  百: 100,
  千: 1000,
};

export interface Chapter {
  index: number;
  chapter: string;
  text: string;
}

export interface Reel {
  index: number;
  reel: string;
  chapters: Chapter[];
}

/**
 * 解析中文数字
 */
function parseNumber(numStr: string): number {
  if (/^\d+$/.test(numStr)) return parseInt(numStr, 10);
  if (/^十[一二三四五六七八九]?$/.test(numStr)) {
    if (numStr.length === 1) return 10;
    return 10 + CHINESE_NUM_MAP[numStr[1]];
  }
  let num = 0,
    digit = 0;
  for (const c of numStr) {
    if (CHINESE_NUM_MAP[c] !== undefined) digit = CHINESE_NUM_MAP[c];
    else if (CHINESE_UNIT_MAP[c] !== undefined) {
      if (digit === 0 && c === "十") digit = 1;
      num += digit * CHINESE_UNIT_MAP[c];
      digit = 0;
    }
  }
  num += digit;
  return num;
}

/**
 * 解析小说文本，提取卷和章节
 * @param text 小说原始文本
 * @param customChapterReg 自定义章节正则（可选）
 * @returns 解析后的小说结构（卷和章节）
 */
export default function parseNovel(text: string, customChapterReg?: string): Reel[] {
  REEL_REGEX.lastIndex = 0;
  const reelMatches = Array.from(text.matchAll(REEL_REGEX));
  const reels: Reel[] = [];
  let CHAPTER_REGEX: RegExp;

  // 解析章节正则
  if (customChapterReg) {
    const match = customChapterReg.match(/^\/(.*)\/([igmuy]*)$/);
    if (match) {
      CHAPTER_REGEX = new RegExp(match[1], match[2]);
    } else {
      CHAPTER_REGEX = new RegExp(customChapterReg);
    }
  } else {
    CHAPTER_REGEX = DEFAULT_CHAPTER_REGEX;
  }

  // 没有卷结构
  if (reelMatches.length === 0) {
    const chapters: Chapter[] = [];
    CHAPTER_REGEX.lastIndex = 0;
    const matches = Array.from(text.matchAll(CHAPTER_REGEX));

    if (matches.length === 0 && text.trim() !== "") {
      // 没有找到章节标记，将整段文本作为第 1 章
      chapters.push({ index: 1, chapter: "", text: text.trim() });
    } else {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index! + matches[i][0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
        const content = text
          .slice(start, end)
          .replace(/^[\r\n]+/, "")
          .trim();
        chapters.push({
          index: parseNumber(matches[i][1].replace(/第|章/g, "")),
          chapter: matches[i][2].trim(),
          text: content,
        });
      }
    }

    // 对章节排序
    chapters.sort((a, b) => a.index - b.index);
    reels.push({
      index: 1,
      reel: "正文卷",
      chapters,
    });
    return reels;
  }

  // 有卷结构
  for (let i = 0; i < reelMatches.length; i++) {
    const reelStart = reelMatches[i].index!;
    const reelEnd = i + 1 < reelMatches.length ? reelMatches[i + 1].index! : text.length;
    const reelText = text.slice(reelStart, reelEnd);

    const reelChapters: Chapter[] = [];
    CHAPTER_REGEX.lastIndex = 0;
    const chapterMatches = Array.from(reelText.matchAll(CHAPTER_REGEX));

    if (chapterMatches.length === 0) {
      // 卷内没有章节标记
      reelChapters.push({
        index: 1,
        chapter: reelMatches[i][2].trim(),
        text: reelText.replace(REEL_REGEX, "").trim(),
      });
    } else {
      for (let j = 0; j < chapterMatches.length; j++) {
        const start = chapterMatches[j].index! + chapterMatches[j][0].length;
        const end = j + 1 < chapterMatches.length ? chapterMatches[j + 1].index! : reelText.length;
        const content = reelText
          .slice(start, end)
          .replace(/^[\r\n]+/, "")
          .trim();
        reelChapters.push({
          index: parseNumber(chapterMatches[j][1].replace(/第|章/g, "")),
          chapter: chapterMatches[j][2].trim(),
          text: content,
        });
      }
    }

    reelChapters.sort((a, b) => a.index - b.index);
    reels.push({
      index: i + 1,
      reel: reelMatches[i][1].trim(),
      chapters: reelChapters,
    });
  }

  return reels;
}
