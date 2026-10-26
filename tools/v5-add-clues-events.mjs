#!/usr/bin/env node
// 线索解锁事件入库（plan/v5/02 §十 ▸ v5-M3''''）：6 阶段 × 2 解读 = 12 条。
// 每条 `pre: [<该解读的 flag>]`——flag 由 src/engine/clues.ts 的 resolveClue 写入（不走选项 flag），
// 因此线索事件只在玩家对上一个线索表过态之后才可能入池（validate C 区 + E.PRE 双向守门）。
// 口径：context / fate 线；文案主句 ≤120、detail ≥100 且以主句开头；月龄落在「锚事件之后、本阶段
// 最早 critical 之前」（validate E.AGE ③ 反向约束）。
// 幂等：同 id 已存在则跳过。用法：node tools/v5-add-clues-events.mjs [--dry]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PATH = resolve(ROOT, "src/data/events.json");
const DRY = process.argv.includes("--dry");

/** id → { stage, ageHint, ageMonths, flag, text, detail, options } */
const EVENTS = [
  // ── childhood：字条（anchor childhood-017 @12岁）──
  {
    id: "childhood-018",
    stage: "childhood",
    ageHint: "12岁",
    ageMonths: 144,
    flag: "clue-note-liked",
    text: "第二天早自习，你的铅笔盒底下压着半页作业纸，上面是一道数学题的解法，字迹工整得不像临时写的。",
    detail:
      "第二天早自习，你的铅笔盒底下压着半页作业纸，上面是一道数学题的解法，字迹工整得不像临时写的。纸是沿着格线撕的，撕口没有毛边。解法写在正面，背面还留着半道没擦净的算式。教室的日光灯管闪了一下，粉笔灰在光里浮着，你听见后排椅子挪动的声音。你把那半页纸翻过来又翻过去，忽然明白那张字条不是随手写的——他先问了你想考哪所中学。",
    options: [
      { text: "回头问他那道题", deltas3: { outlook: 2 }, resourceDeltas: { mood: 2 } },
      { text: "把纸收进课本里", deltas3: { worldview: 2 }, resourceDeltas: { mood: 1 } },
    ],
  },
  {
    id: "childhood-020",
    stage: "childhood",
    ageHint: "12岁",
    ageMonths: 144,
    flag: "clue-note-casual",
    text: "那半页作业纸后来又出现过两回，都是别人的：一页借给后排抄题，一页被老师收去做范例。",
    detail:
      "那半页作业纸后来又出现过两回，都是别人的：一页借给后排抄题，一页被老师收去做范例。字条这件事，就在这些纸页里慢慢淡了。你偶尔会想起那道没算完的算式，想起铅笔盒扣上时的一声轻响，也就到此为止。教室后墙的板报换了新的一期，课本翻到了下一个单元。那年冬天很冷，你摸着窗玻璃，冰得缩回手，玻璃上化出一个小洞。",
    options: [
      { text: "专心解那道题", deltas3: { worldview: 2 }, resourceDeltas: { mood: 1 } },
      { text: "下课去问问老师", deltas3: { outlook: 2 }, resourceDeltas: { mood: 2 } },
    ],
  },

  // ── teen：陌生来信（anchor teen-015 @16岁）──
  {
    id: "teen-018",
    stage: "teen",
    ageHint: "16岁8个月",
    ageMonths: 200,
    flag: "clue-letter-mother",
    text: "你拿着信去问母亲，她只看了一眼信封，就去柜子深处翻出一个铁皮盒——里面是同一叠信纸。",
    detail:
      "你拿着信去问母亲，她只看了一眼信封，就去柜子深处翻出一个铁皮盒——里面是同一叠信纸。盒盖有点锈，打开时有股樟脑味。她说那是她十六岁那年，在同一个城市、同一个邮局寄出去的信，寄给一个后来没再回信的人。灯光照着她翻信的手，指节有点肿。她没问你怎么会有这封信，只把盒盖合上，说：字是会长大的，你看着像，其实不是。",
    options: [
      { text: "问她那个人是谁", deltas3: { worldview: 2 }, resourceDeltas: { mood: -1 } },
      { text: "把信放回铁皮盒", deltas3: { outlook: 2 }, resourceDeltas: { mood: 2 } },
    ],
  },
  {
    id: "teen-020",
    stage: "teen",
    ageHint: "16岁8个月",
    ageMonths: 200,
    flag: "clue-letter-stranger",
    text: "你把信按邮戳上的省份查了地图，又去问传达室，门卫说这栋楼里前些年确实住过姓这个的人。",
    detail:
      "你把信按邮戳上的省份查了地图，又去问传达室，门卫说这栋楼里前些年确实住过姓这个的人。传达室的小窗开着一半，暖气片烫手，桌上摊着泛黄的挂号登记本。门卫翻了很久，指给你看一行已经褪色的名字，说人早搬走了，走的时候没留地址。你把信揣回兜里，走廊的灯在头顶嗡嗡地响，墙上的挂历停在上一页。原来有些信寄不到，跟写字的人没关系。",
    options: [
      { text: "按地址写回信", deltas3: { outlook: 2 }, resourceDeltas: { mood: 1 } },
      { text: "把信念完就收好", deltas3: { worldview: 2 }, resourceDeltas: { mood: 2 } },
    ],
  },

  // ── youth：凌晨三点的楼道（anchor youth-015 @26岁）──
  {
    id: "youth-018",
    stage: "youth",
    ageHint: "27岁",
    ageMonths: 324,
    flag: "clue-night-neighbor",
    text: "你推开门探出头，隔壁的门也开着一条缝，里面的人也在看走廊——两个人对视一秒，都笑了。",
    detail:
      "你推开门探出头，隔壁的门也开着一条缝，里面的人也在看走廊——两个人对视一秒，都笑了。他手里端着一碗刚泡上的面，热气在楼道灯下往上飘。你们谁都没说自己为什么睡不着，就在楼梯口站着吃完那碗面，听见楼下垃圾车开过的声音。回屋时你才发现，冰箱的嗡嗡声其实一直都在，只是刚才被说话声盖住了。那栋楼里原来不止你一个人醒着。",
    options: [
      { text: "约他以后一起吃饭", deltas3: { outlook: 2 }, resourceDeltas: { mood: 3 } },
      { text: "道声晚安就回屋", deltas3: { worldview: 2 }, resourceDeltas: { mood: 2 } },
    ],
  },
  {
    id: "youth-020",
    stage: "youth",
    ageHint: "27岁",
    ageMonths: 324,
    flag: "clue-night-wind",
    text: "你把门轻轻带上，那声响又来了——是走廊尽头的窗没关严，风把插销撞在框上。",
    detail:
      "你把门轻轻带上，那声响又来了——是走廊尽头的窗没关严，风把插销撞在框上。你去把窗关好，铁框冰得硌手，玻璃上有一层薄薄的水汽。回来路过冰箱，压缩机正好停了，屋子静得能听见自己的心跳。你把手机翻过来扣在桌上，决定不再看它。那一夜剩下的部分，你睡得很沉，第二天醒来甚至记不清做过什么梦。",
    options: [
      { text: "以后睡前关好窗", deltas3: { worldview: 2 }, resourceDeltas: { mood: 2 } },
      { text: "给自己定个作息", deltas3: { outlook: 2 }, resourceDeltas: { mood: 3 } },
    ],
  },

  // ── adult：旧项圈（anchor adult-013 @36岁）──
  {
    id: "adult-018",
    stage: "adult",
    ageHint: "37岁3个月",
    ageMonths: 447,
    flag: "clue-collar-grief",
    text: "孩子把项圈系在自己手腕上，说这样它就还在家里。你蹲下来，看见那块磨平的名牌上还留着半个字。",
    detail:
      "孩子把项圈系在自己手腕上，说这样它就还在家里。你蹲下来，看见那块磨平的名牌上还留着半个字。皮革已经开裂，扣环上有一层绿色的锈。你没有说「它不在了」这样的话，只把项圈在手里掂了掂，闻见一点旧皮子和雨水的味道。阳台的藤筐还在原位，饭盆洗得发亮，墙上那张旧挂历还圈着它打疫苗的日子。那天晚上孩子睡着以后，你把项圈挂在了藤筐边上——不高不低，正好让进门的人看见。",
    options: [
      { text: "陪他讲讲那只狗", deltas3: { outlook: 3 }, resourceDeltas: { mood: 2 } },
      { text: "把项圈收进抽屉", deltas3: { worldview: 2 }, resourceDeltas: { mood: 1 } },
    ],
  },
  {
    id: "adult-020",
    stage: "adult",
    ageHint: "37岁3个月",
    ageMonths: 447,
    flag: "clue-collar-keep",
    text: "孩子把项圈和狗碗一起收进书包，说要带去学校给同学看。你没拦，只提醒他别把扣环弄丢了。",
    detail:
      "孩子把项圈和狗碗一起收进书包，说要带去学校给同学看。你没拦，只提醒他别把扣环弄丢了。第二天他回来，书包里多了张画——一只四条腿很长、耳朵很大的狗，旁边写着「我家的」。画纸边角卷着，蜡笔的颜色涂到线外去了。你把画贴在冰箱门上，磁贴压住一角。冰箱嗡嗡地响，厨房的灯管有点闪，饭香从锅里升上来，日子就这么往下过。",
    options: [
      { text: "把画收进相册", deltas3: { outlook: 2 }, resourceDeltas: { mood: 2 } },
      { text: "跟他一起再画一只", deltas3: { worldview: 2 }, resourceDeltas: { mood: 3 } },
    ],
  },

  // ── midlife：没寄出的信（anchor midlife-014 @53岁）──
  {
    id: "midlife-018",
    stage: "midlife",
    ageHint: "56岁",
    ageMonths: 672,
    flag: "clue-unsent-unfinished",
    text: "信封口没粘，里面只有半张信纸，写到一半停了笔。落款那行日期，正是你最难的那一年。",
    detail:
      "信封口没粘，里面只有半张信纸，写到一半停了笔。落款那行日期，正是你最难的那一年。纸已经发脆，折痕处透出光，摸上去有点扎手。你把那半张纸读了两遍，认出是写给一个人的——那阵子你确实有话想说，最后咽了回去。储藏室的灯泡瓦数低，照着一屋子的旧物，空气里有一点霉味。你把信重新折好，放回奖状底下，忽然想起当时为什么停笔：不是不想说，是说了也改变不了什么。",
    options: [
      { text: "把它写完寄出去", deltas3: { outlook: 3 }, resourceDeltas: { mood: -1 } },
      { text: "原样放回原处", deltas3: { worldview: 2 }, resourceDeltas: { mood: 2 } },
    ],
  },
  {
    id: "midlife-020",
    stage: "midlife",
    ageHint: "56岁",
    ageMonths: 672,
    flag: "clue-unsent-forgot",
    text: "你翻过信封背面，看见自己当年写的「明天寄」三个字。明天过去了三十年，邮票也早就不通用了。",
    detail:
      "你翻过信封背面，看见自己当年写的「明天寄」三个字。明天过去了三十年，邮票也早就不通用了。你笑了一下，又有点说不上来的感觉——原来有些事不是忘了，是被排在了永远轮不到的队尾。你把信放进要留的那只箱子里，纸边蹭过手指，有点割人。窗外的路灯亮了，楼下有人在喊孩子回家吃饭，声音拖得很长。",
    options: [
      { text: "留着当个提醒", deltas3: { worldview: 2 }, resourceDeltas: { mood: 2 } },
      { text: "撕了，扔进废纸箱", deltas3: { outlook: 2 }, resourceDeltas: { mood: 1 } },
    ],
  },

  // ── elder：铁盒里的票根（anchor elder-402 @66岁）──
  {
    id: "elder-404",
    stage: "elder",
    ageHint: "71岁",
    ageMonths: 852,
    flag: "clue-ticket-secret",
    text: "你又把票根拿出来对着灯看，背面用铅笔写着一个日期，比你们认识的日子早了整整两年。",
    detail:
      "你又把票根拿出来对着灯看，背面用铅笔写着一个日期，比你们认识的日子早了整整两年。票根已经发脆，边角卷起，灯下能看见纸里的纤维。老伴在厨房洗碗，水声哗哗地响，隐约有碗碟碰在一起的脆响。你把票根放回铁盒夹层，盒盖合上时咔的一声。这一晚你睡得不太踏实，半夜醒来听见她翻身，也醒着。你们谁都没提那张票根。第二天早上，她把豆浆分了你一半，说今天想去公园走走。你应了一声，忽然觉得有些事不问，也是一种过日子的办法。",
    options: [
      { text: "找个机会问一问", deltas3: { worldview: 3 }, resourceDeltas: { mood: -1 } },
      { text: "不问，就当没看见", deltas3: { outlook: 2 }, resourceDeltas: { mood: 2 } },
    ],
  },
  {
    id: "elder-405",
    stage: "elder",
    ageHint: "71岁",
    ageMonths: 852,
    flag: "clue-ticket-mixed",
    text: "你把铁盒整个倒出来，票根、粮票、旧照片混成一堆——那张票根来自另一个城市的剧团，你们谁都没去过。",
    detail:
      "你把铁盒整个倒出来，票根、粮票、旧照片混成一堆——那张票根来自另一个城市的剧团，你们谁都没去过。多半是哪次搬家时随手塞进来的，和一堆旧纸待了半辈子。纸片落了一桌面，有一股干草似的气味，日光灯照得纸面泛白。你把该扔的挑出来，能留的重新码整齐。老伴凑过来看，指着一张黑白照片说这是哪年拍的，你算了算，比你以为的还早三年。午后的阳光斜进屋里，照在两张凑在一起的脸上。",
    options: [
      { text: "把旧照片一张张翻完", deltas3: { outlook: 3 }, resourceDeltas: { mood: 3 } },
      { text: "重新码好收进柜子", deltas3: { worldview: 2 }, resourceDeltas: { mood: 2 } },
    ],
  },
];

const events = JSON.parse(readFileSync(PATH, "utf8"));
const indexOf = new Map(events.map((e, i) => [e.id, i]));
let added = 0;
let updated = 0;
for (const spec of EVENTS) {
  const row = {
    id: spec.id,
    stage: spec.stage,
    type: "context",
    ageHint: spec.ageHint,
    text: spec.text,
    detail: spec.detail,
    options: spec.options,
    ageMonths: spec.ageMonths,
    line: "fate",
    pre: [spec.flag],
  };
  const at = indexOf.get(spec.id);
  if (at === undefined) {
    events.push(row);
    added += 1;
  } else {
    // 幂等 upsert：已存在则整条覆盖（口径改动要能被重跑带进库，不靠手改 JSON）
    events[at] = row;
    updated += 1;
  }
}
if (!DRY) writeFileSync(PATH, JSON.stringify(events, null, 2) + "\n");
process.stdout.write(`${DRY ? "[dry] " : ""}线索解锁事件：新增 ${added} 条 / 覆盖 ${updated} 条，事件库共 ${events.length} 条\n`);
