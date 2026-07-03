import { getStudyLevelMeta } from "./data";
import type { VocabularyCard } from "./types";

export type VocabularyMeaningDisplay = {
  label: string;
  text: string;
  sourceLabel?: string;
  sourceText?: string;
};

const chineseTextPattern = /[\u4e00-\u9fff]/;

// Small reviewed glossary for imported JLPT entries whose upstream source uses English glosses.
// Unmapped glosses stay labelled as English instead of being presented as Chinese.
const reviewedJlptGlosses = new Map<string, string>([
  ["ah!,oh!", "啊！哦！"],
  ["ah", "啊"],
  ["to meet", "见面；遇见"],
  ["meeting", "会议；会面"],
  ["meeting room", "会议室"],
  ["conversation", "会话；谈话"],
  ["blue", "蓝色；蓝色的"],
  ["red", "红色；红色的"],
  ["white", "白色；白色的"],
  ["black", "黑色；黑色的"],
  ["person", "人"],
  ["child", "孩子"],
  ["parents", "父母"],
  ["husband", "丈夫"],
  ["wife", "妻子"],
  ["friend", "朋友"],
  ["teacher", "老师"],
  ["student", "学生"],
  ["school", "学校"],
  ["company", "公司"],
  ["country", "国家；乡下"],
  ["city", "城市"],
  ["house", "房子；家"],
  ["room", "房间"],
  ["book", "书"],
  ["newspaper", "报纸"],
  ["letter", "信；字母"],
  ["water", "水"],
  ["fire", "火"],
  ["rain", "雨"],
  ["wind", "风"],
  ["snow", "雪"],
  ["sky", "天空"],
  ["mountain", "山"],
  ["river", "河流"],
  ["sea", "海"],
  ["tree", "树"],
  ["flower", "花"],
  ["grass", "草"],
  ["dog", "狗"],
  ["cat", "猫"],
  ["fish", "鱼"],
  ["bird", "鸟"],
  ["morning", "早上"],
  ["noon", "中午"],
  ["evening", "傍晚；晚上"],
  ["night", "夜晚"],
  ["today", "今天"],
  ["tomorrow", "明天"],
  ["yesterday", "昨天"],
  ["now", "现在"],
  ["next time", "下次"],
  ["last,end", "最后；结束"],
  ["beginning,first", "开始；最初"],
  ["one", "一"],
  ["two", "二"],
  ["three", "三"],
  ["four", "四"],
  ["five", "五"],
  ["six", "六"],
  ["seven", "七"],
  ["eight", "八"],
  ["nine", "九"],
  ["ten", "十"],
  ["one hundred million", "一亿"],
  ["big", "大的"],
  ["small", "小的"],
  ["long", "长的"],
  ["short", "短的"],
  ["high", "高的"],
  ["low", "低的"],
  ["new", "新的"],
  ["old", "旧的；老的"],
  ["good", "好的"],
  ["bad", "坏的；不好的"],
  ["beautiful", "美丽的；漂亮的"],
  ["delicious", "好吃的"],
  ["glad", "高兴的"],
  ["sad", "悲伤的"],
  ["lonely", "寂寞的"],
  ["frightening", "可怕的"],
  ["danger", "危险"],
  ["safety", "安全"],
  ["relief", "安心；放心"],
  ["opinion", "意见"],
  ["idea", "想法；主意"],
  ["method", "方法"],
  ["reason", "理由"],
  ["meaning", "意思；意义"],
  ["example", "例子"],
  ["question", "问题"],
  ["answer", "回答；答案"],
  ["mistake", "错误"],
  ["failure,mistake", "失败；错误"],
  ["practice", "练习"],
  ["study", "学习"],
  ["exam", "考试"],
  ["examination", "考试"],
  ["science", "科学"],
  ["education", "教育"],
  ["research", "研究"],
  ["medicine", "药；医学"],
  ["hospital", "医院"],
  ["police", "警察"],
  ["airport", "机场"],
  ["station", "车站"],
  ["road", "道路"],
  ["place", "地方；场所"],
  ["thing,matter", "事情；事物"],
  ["sound,note", "声音；音符"],
  ["voice", "声音"],
  ["hair", "头发"],
  ["arm", "手臂"],
  ["neck", "脖子"],
  ["stone", "石头"],
  ["money", "钱"],
  ["gift", "礼物"],
  ["souvenir", "纪念品；土特产"],
  ["toy", "玩具"],
  ["kimono", "和服"],
  ["cake", "蛋糕"],
  ["salad", "沙拉"],
  ["sandwich", "三明治"],
  ["petrol", "汽油"],
  ["computer", "电脑"],
  ["dictionary", "词典"],
  ["freedom", "自由"],
  ["society,public", "社会；公众"],
  ["government worker", "公务员"],
  ["international", "国际的"],
  ["industry", "工业；产业"],
  ["finance,economy", "金融；经济"],
  ["traffic,transportation", "交通；运输"],
  ["accessory", "饰品；配件"],
  ["part-time job", "兼职；打工"],
  ["announcer", "播音员；主持人"],
  ["driver", "司机"],
  ["customer", "顾客"],
  ["guest,customer", "客人；顾客"],
  ["neighbourhood", "附近；邻近地区"],
  ["condition,health", "状态；健康状况"],
  ["air,atmosphere", "空气；气氛"],
  ["season", "季节"],
  ["opportunity", "机会"],
  ["mood", "心情；气氛"],
  ["feeling,mood", "心情；感觉"],
  ["spirit,mood", "精神；心情"],
  ["play", "玩耍；游戏"],
  ["return", "返回；归还"],
  ["copy", "复制"],
]);

export function getVocabularyMeaningDisplay(card: VocabularyCard): VocabularyMeaningDisplay {
  const meta = getStudyLevelMeta(card.level);
  const sourceText = card.meaningZh.trim();

  if (meta.language !== "ja") {
    return { label: meta.meaningLabel, text: sourceText };
  }

  if (hasChineseText(sourceText)) {
    return { label: "中文释义", text: sourceText };
  }

  const reviewedText = translateReviewedJlptGloss(sourceText);
  if (reviewedText) {
    return {
      label: "中文释义",
      text: reviewedText,
      sourceLabel: "英文释义",
      sourceText,
    };
  }

  return { label: "英文释义", text: sourceText };
}

export function getVocabularyMeaningSearchText(card: VocabularyCard): string[] {
  const display = getVocabularyMeaningDisplay(card);
  const values = [display.text, card.meaningZh, display.sourceText ?? ""].map((value) => value.trim()).filter(Boolean);

  return Array.from(new Set(values));
}

export function formatVocabularyMeaningWithSource(card: VocabularyCard): string {
  const display = getVocabularyMeaningDisplay(card);
  return display.sourceText
    ? `${display.text}（${display.sourceLabel}：${display.sourceText}）`
    : display.text;
}

export function getVocabularyMeaningPromptLines(card: VocabularyCard): string[] {
  const display = getVocabularyMeaningDisplay(card);
  const lines = [`${display.label}: ${display.text}`];
  if (display.sourceText) {
    lines.push(`${display.sourceLabel}: ${display.sourceText}`);
  }
  return lines;
}

function translateReviewedJlptGloss(value: string): string | null {
  const normalized = normalizeGloss(value);
  const exact = reviewedJlptGlosses.get(normalized);
  if (exact) return exact;

  const parts = splitGlossParts(normalized);
  if (parts.length <= 1) return null;

  const translatedParts = parts.map((part) => reviewedJlptGlosses.get(part));
  if (translatedParts.some((part) => !part)) return null;

  return Array.from(new Set(translatedParts as string[])).join("；");
}

function splitGlossParts(value: string): string[] {
  return value.split(/[,;，；/]/).map((part) => part.trim()).filter(Boolean);
}

function normalizeGloss(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*([,;:!/])\s*/g, "$1")
    .replace(/[.。]+$/g, "");
}

function hasChineseText(value: string): boolean {
  return chineseTextPattern.test(value);
}
