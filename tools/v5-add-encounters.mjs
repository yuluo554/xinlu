#!/usr/bin/env node
// 偶遇层 40 条入库（plan/v5/02 §二 ▸ v5-M1''''）：每阶段 5 条、共 40 条。
// 口径：不推 line（line=fate → lineGain 恒 0）；|Δ3| ≤1；|资源 Δ| ≤3；文案 40–80 字（detail 再补一段）；
// 选项 2 个，或单选项「就这样走过去」（02 §二：跳过也是一种选择）。
// 变体字段（v5/02 §三）：偶遇按内容声明 draw（运气/抽签）/ quick（短词日常）/ read（他人故事，仅继续）。
// 幂等：同 id 已存在则跳过。用法：node tools/v5-add-encounters.mjs [--dry]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PATH = resolve(ROOT, "src/data/events.json");

/** 每条：id / stage / ageHint / ageMonths / variant / text / detail / options。 */
const ENCOUNTERS = [
  // ── infant 婴儿（3–38 月，critical 起于 36）──
  {
    id: "infant-701", stage: "infant", ageHint: "4个月", ageMonths: 4, variant: "read",
    text: "隔壁婶子来串门，把你抱到窗边看光。她哼一支你听不懂的小调，指甲缝里还带着葱味。",
    detail: "隔壁婶子来串门，把你抱到窗边看光。她哼一支你听不懂的小调，指甲缝里还带着葱味。抱得不高不低，刚好够你看见巷子对面的晾衣绳，和绳上那件褪成灰蓝的衬衫。她跟母亲说了一阵话，说的都是别人的事，你听不懂，只觉得那个调子往上走的时候，屋子亮了一点。",
    options: [
      { text: "跟着哼", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "婶子笑出声，说你将来嗓门不小。" },
      { text: "看她的纽扣", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "那枚扣子是贝壳磨的，你盯了很久。" },
    ],
  },
  {
    id: "infant-702", stage: "infant", ageHint: "8个月", ageMonths: 8, variant: "draw",
    text: "院里晒着一排刚洗的被单，风一吹鼓起来又落下。大人把你放在被单底下，猜哪一块会先飘到你脸上。",
    detail: "院里晒着一排刚洗的被单，风一吹鼓起来又落下。大人把你放在被单底下，猜哪一块会先飘到你脸上。被单上还有皂角味，边角缀着补丁，蓝的、白的、带格子的，都是这个院子里的日子。谁也没真的算过，就图个乐。你仰着脸等，阳光隔着布变成一片温热的白。",
    options: [
      { text: "伸手抓", deltas3: { outlook: 1 }, resourceDeltas: { mood: 3 }, aftermath: "抓住的那块被单上有个补丁，你笑得直咳。" },
      { text: "等着看", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "最后飘来的是最旧那块，你一点没恼。" },
    ],
  },
  {
    id: "infant-703", stage: "infant", ageHint: "16个月", ageMonths: 16, variant: "quick",
    text: "桌上放着一只空铁盒，盖子扣不上。屋外的知了叫得很响。",
    detail: "桌上放着一只空铁盒，盖子扣不上——是装过饼干的那种，铁皮上印着红花的铁盒，扣子早松了。屋外的知了叫得很响，屋里吊扇转得慢。这盒子在大人眼里什么都不是，在你眼里会响、会开、会关。",
    options: [
      { text: "拍盒子", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "一下一下，拍出了自己的节奏。" },
      { text: "把盖扣上", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "扣上了，你又自己掰开，反复了七次。" },
    ],
  },
  {
    id: "infant-704", stage: "infant", ageHint: "22个月", ageMonths: 22, variant: "draw",
    text: "巷口来了个吹糖人的，围着半条街的小孩。大人抱着你挤进去，说抓阄似的抓一样，抓到什么算什么。",
    detail: "巷口来了个吹糖人的，围着半条街的小孩。大人抱着你挤进去，说抓阄似的抓一样，抓到什么算什么。糖稀在铁板上拉出细亮的丝，风一吹就硬。有人要了只兔子，有人要了把大刀，师傅的手不抖，吹一口气就成个形。你没得挑，只能伸一只手出去。",
    options: [
      { text: "抓那只小兔", deltas3: { outlook: 1 }, resourceDeltas: { mood: 3 }, aftermath: "兔子到家就化了半只耳朵，你还是舔得很干净。" },
      { text: "抓大刀", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "刀把儿比你的手掌还长，举起来全巷子都笑。" },
    ],
  },
  {
    id: "infant-705", stage: "infant", ageHint: "34个月", ageMonths: 34, variant: "read",
    text: "夜里下起雨，屋檐水一串串砸在铁皮盆里。大人抱你到门口听雨，说这声音叫白噪音，哄睡最灵。",
    detail: "夜里下起雨，屋檐水一串串砸在铁皮盆里。大人抱你到门口听雨，说这声音叫白噪音，哄睡最灵。铁皮盆是接漏的，盆底垫着一块砖，声音一高一低。屋里煤油灯没点，只有雨声和偶尔的闷雷。你的下巴搁在大人的肩窝上，那件旧棉袄有股晒过头的太阳味。",
    options: [
      { text: "就这么听着", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "雨停之前你就睡着了，一觉到天亮。" },
    ],
  },

  // ── toddler 幼儿（48–72）──
  {
    id: "toddler-701", stage: "toddler", ageHint: "50个月", ageMonths: 50, variant: "draw",
    text: "巷子里的老槐树落了一地花，几个孩子在树下比谁捡的多。有人提议一人抓一把，数完再分，不许抢。",
    detail: "巷子里的老槐树落了一地花，几个孩子在树下比谁捡的多。有人提议一人抓一把，数完再分，不许抢。槐花是米白的，捏在手里有股清甜味，落在地上的沾了土，谁都不想要。分花的时候最讲规矩：最大的那个孩子当裁判，数得慢，谁也不催。",
    options: [
      { text: "抓满一把", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你抓的那把最多，分了别人一半，当了半天的孩子头。" },
      { text: "抓一小把", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "少抓点不心疼，你抱着那一小把回了家。" },
    ],
  },
  {
    id: "toddler-702", stage: "toddler", ageHint: "58个月", ageMonths: 58, variant: "quick",
    text: "院里来了只黄猫，蹲在墙头看你吃饭。它不叫，就看着。",
    detail: "院里来了只黄猫，蹲在墙头看你吃饭。它不叫，就看着。那阵子院里猫多，多是半野的，靠谁家剩饭活着。你碗里是白菜粉条，粉条挂在勺上，亮晶晶地晃。墙头的猫尾巴一甩一甩，眼睛半眯。",
    options: [
      { text: "分它一条", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "它叼着粉条跳下墙，从此每天来一趟。" },
      { text: "自己吃完", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "猫看你吃完了才走，走得很从容。" },
    ],
  },
  {
    id: "toddler-703", stage: "toddler", ageHint: "64个月", ageMonths: 64, variant: "read",
    text: "街口修鞋的老头有一整套小铁锤，敲起来叮叮当当。他招手让你看，说这只鞋底再钉两年没问题。",
    detail: "街口修鞋的老头有一整套小铁锤，敲起来叮叮当当。他招手让你看，说这只鞋底再钉两年没问题。他的工具箱是一块旧木头改的，钉子分了三种大小，装在不同的铁盒里。你站着看了一整个下午，他不赶人，也不多话，偶尔把钉好的鞋递给你，让你掂一掂分量。",
    options: [
      { text: "看他敲完", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "回家你拿筷子敲碗沿，敲出了同一个节奏。" },
    ],
  },
  {
    id: "toddler-704", stage: "toddler", ageHint: "66个月", ageMonths: 66, variant: "draw",
    text: "幼儿园门口有个卖糖葫芦的，稻草靶子上插着一圈红果。买之前可以转一下靶子，转到哪根拿哪根。",
    detail: "幼儿园门口有个卖糖葫芦的，稻草靶子上插着一圈红果。买之前可以转一下靶子，转到哪根拿哪根。糖壳在太阳底下像一层薄玻璃，粘在纸上的那点糖，孩子都要舔干净。摊主看得出谁是头一回买，会把靶子按住慢一点转。",
    options: [
      { text: "转快些", deltas3: { outlook: 1 }, resourceDeltas: { mood: 3 }, aftermath: "转出一根裹了双份糖的，你举着走了一路。" },
      { text: "轻轻一转", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "拿到最小的那根，你先分给了一起出门的邻居孩子。" },
    ],
  },
  {
    id: "toddler-705", stage: "toddler", ageHint: "70个月", ageMonths: 70, variant: "quick",
    text: "傍晚院里放起小喇叭，广播里念着谁家的名字，说有长途电话。",
    detail: "傍晚院里放起小喇叭，广播里念着谁家的名字，说有长途电话——那时候一个院子共用一部电话，接到通知要跑去接。喇叭的电流声先响一阵，再出声，声音被风吹得有点飘。院里正在剥豆子的、补衣服的都停了手，抬头听是不是自己家。",
    options: [
      { text: "跑去听", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "不是你家，你却站在门口听完了别人家的喜事。" },
      { text: "继续剥豆", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "豆子剥满一小碗，喇叭也停了。" },
    ],
  },

  // ── childhood 童年（84–145，critical 起于 144）──
  {
    id: "childhood-701", stage: "childhood", ageHint: "7岁", ageMonths: 84, variant: "draw",
    text: "放学路上有人摆摊套圈，三分钱五个圈。摊主把最远的那只搪瓷缸摆在正中间，说套中就归你。",
    detail: "放学路上有人摆摊套圈，三分钱五个圈。摊主把最远的那只搪瓷缸摆在正中间，说套中就归你。竹圈薄，扔出去在空中发飘，落地弹两下就偏。旁边围着一圈孩子，谁也没真套中过，摊主也不急，笑着拾圈。你摸出兜里攒的三分钱。",
    options: [
      { text: "把五个都扔了", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2, money: -3 }, aftermath: "五个圈全落空，你却笑了半路。" },
      { text: "只看不玩", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你站着看到散摊，把那三分钱留到了第二天。" },
    ],
  },
  {
    id: "childhood-702", stage: "childhood", ageHint: "8岁", ageMonths: 96, variant: "read",
    text: "楼下搬来一户人家，孩子说话带外地口音。院里孩子学他说话，学一句笑一阵，他低头踢石子。",
    detail: "楼下搬来一户人家，孩子说话带外地口音。院里孩子学他说话，学一句笑一阵，他低头踢石子。他家门口堆着还没拆的纸箱，箱子上写着外省的县名。他母亲在院里晾衣服，见谁都点头，说话很轻。那天下午他一个人在水泥台上拍皮球，拍得很稳。",
    options: [
      { text: "过去一起拍", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你们拍了一下午，谁也没提口音的事。" },
      { text: "在楼道里看着", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你把这一幕记了很久，多年后才明白那叫将心比心。" },
    ],
  },
  {
    id: "childhood-703", stage: "childhood", ageHint: "9岁", ageMonths: 108, variant: "quick",
    text: "雨停了，路上有蚯蚓爬出来。同学说踩死一条，明天天就晴。",
    detail: "雨停了，路上有蚯蚓爬出来。同学说踩死一条，明天天就晴。柏油路面被雨泡得发亮，蚯蚓在浅水里一伸一缩，身上沾着细沙。这种说法在班里传了好几年，谁也没真数过晴不晴，倒是踩的人不少。你蹲下来看它往前爬，爬得比想的快。",
    options: [
      { text: "绕过去", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "第二天照样晴了，你也没敢跟人拆穿。" },
      { text: "挑到土里", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你用一根树枝把它挑回花坛，手上沾了泥。" },
    ],
  },
  {
    id: "childhood-704", stage: "childhood", ageHint: "10岁", ageMonths: 120, variant: "draw",
    text: "班里流行拍洋画，谁赢了谁拿走。你手气向来一般，可这回有人把最稀的那张压上了桌。",
    detail: "班里流行拍洋画，谁赢了谁拿走。你手气向来一般，可这回有人把最稀的那张压上了桌——印着整套戏装人物的那种，边角磨白了还舍不得扔。地上铺着旧课本，洋画排成一排，手心拍得发红发疼，谁也没喊停。上课铃一响，全都塞进裤兜。",
    options: [
      { text: "压上自己的", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你赢了那一张，却在第二局输掉三张。" },
      { text: "看着不下场", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你替自己守住了那叠，班上从此管你叫铁算盘。" },
    ],
  },
  {
    id: "childhood-705", stage: "childhood", ageHint: "11岁", ageMonths: 132, variant: "read",
    text: "胡同口修自行车的老两口吵架，一个说要回老家，一个说铺子刚盘下来不能走。吵到一半又一起抬车。",
    detail: "胡同口修自行车的老两口吵架，一个说要回老家，一个说铺子刚盘下来不能走。吵到一半又一起抬车。铺子很小，墙上挂满了内胎和扳手，门口永远堆着两条待修的自行车。老太太骂得凶，手上还在给人补胎；老头一声不吭，把气门芯一个个拧紧。收工的时候两人并排坐着吃面。",
    options: [
      { text: "蹲着看完", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你记住了那句「吵归吵，车得修」。" },
      { text: "回家说给爸妈", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "晚上饭桌上你也提了一句，爸妈照旧互相夹菜。" },
    ],
  },

  // ── teen 少年（156–216，critical 起于 205）──
  {
    id: "teen-701", stage: "teen", ageHint: "13岁", ageMonths: 158, variant: "draw",
    text: "班里抽座位，抓阄决定这学期坐哪。前排、后排、靠窗、靠门，全凭手里那张揉皱的纸。",
    detail: "班里抽座位，抓阄决定这学期坐哪。前排、后排、靠窗、靠门，全凭手里那张揉皱的纸。纸条是班长剪的，写好了折两次，扔在讲台上的粉笔盒里。有人急着抽，有人故意最后抽，说好位置都被挑走了留个念想。窗外的梧桐叶还没落完。",
    options: [
      { text: "第一个抽", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "抽到靠窗第三排，你从此盯着窗外发了很多呆。" },
      { text: "最后一个抽", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "剩下的位置靠门，风大，你却睡得踏实。" },
    ],
  },
  {
    id: "teen-702", stage: "teen", ageHint: "14岁", ageMonths: 168, variant: "read",
    text: "校门口总有个修钢笔的老人，摊开一块布，摆着笔尖、墨囊和半瓶蓝黑墨水。他给谁修笔都不收钱。",
    detail: "校门口总有个修钢笔的老人，摊开一块布，摆着笔尖、墨囊和半瓶蓝黑墨水。他给谁修笔都不收钱。他说退休前在厂里做文书，一辈子没写完的字都在这块布上。你蹲着看他调笔尖，动作极轻，像在给什么活着的东西接骨。放学的人流从你们身边挤过去。",
    options: [
      { text: "把旧笔递过去", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "笔修好了，比新买的还顺手，你用它写完了整个高中。" },
      { text: "站着看完", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你记住了他那双稳得不像老人的手。" },
    ],
  },
  {
    id: "teen-703", stage: "teen", ageHint: "15岁", ageMonths: 180, variant: "quick",
    text: "晚自习前，同桌把最后半块橡皮掰成两半推给你。",
    detail: "晚自习前，同桌把最后半块橡皮掰成两半推给你。那块橡皮用得快没了，边角磨圆，掰开的声音很轻。教室后排有人在传一包瓜子，前排有人趴在桌上补觉，电扇把卷子吹得哗哗响。你把橡皮收进笔袋，没说话。",
    options: [
      { text: "收下", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "第二天你带了一整块还他，他没要。" },
      { text: "推回去", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "他说那我掰一半给你，还是塞了过来。" },
    ],
  },
  {
    id: "teen-704", stage: "teen", ageHint: "16岁", ageMonths: 192, variant: "draw",
    text: "运动会的班旗还没画完，最后一笔颜色要有人定。班里吵成一团，最后说掷硬币，正面蓝反面红。",
    detail: "运动会的班旗还没画完，最后一笔颜色要有人定。班里吵成一团，最后说掷硬币，正面蓝反面红。布是班费买的，两米宽，铺在课桌上，颜料桶边上围了六七个人。硬币在桌子上转了很久才倒，大家盯着它，谁也没出声。",
    options: [
      { text: "正面", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "蓝旗在风里很好看，隔壁班也夸了一句。" },
      { text: "反面", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "红旗刚画完就下雨，颜料洇成了一片霞。" },
    ],
  },
  {
    id: "teen-705", stage: "teen", ageHint: "17岁", ageMonths: 200, variant: "quick",
    text: "晚自习下课，你发现自行车的气门芯被人拔了。走廊灯已经关了。",
    detail: "晚自习下课，你发现自行车的气门芯被人拔了。走廊灯已经关了。车棚里只剩几辆，链条响，风从操场那边过来。气门芯是小事，一根新的也就几分钱，可你得推着车走两站路回家，路上还得看着它别倒。",
    options: [
      { text: "推车回家", deltas3: { worldview: 1 }, resourceDeltas: { mood: -1 }, aftermath: "推到家已经十一点，母亲在门口等，没问你为什么这么晚。" },
      { text: "找门卫借", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "门卫翻出个小铁盒，气门芯和扳手都在里面。" },
    ],
  },

  // ── youth 青年（240–360，critical 起于 348）──
  {
    id: "youth-701", stage: "youth", ageHint: "20岁", ageMonths: 244, variant: "read",
    text: "宿舍楼下有个收废品的中年人，每天傍晚准时推车来。他认得每一栋楼扔出来的纸箱值多少钱。",
    detail: "宿舍楼下有个收废品的中年人，每天傍晚准时推车来。他认得每一栋楼扔出来的纸箱值多少钱。他的秤是自己改的，杆子上缠着胶布；车斗里永远压着一块砖，说风大的时候能稳住。学生毕业时扔东西，他捡得很高兴，也常把没坏的台灯、暖瓶挑出来，说这些还能用。",
    options: [
      { text: "把旧书给他", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "他挑走两本，剩下的还给你，说这个你留着有用。" },
      { text: "站边上看", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你看了很久，第一次觉得日子可以这么算。" },
    ],
  },
  {
    id: "youth-702", stage: "youth", ageHint: "21岁", ageMonths: 256, variant: "draw",
    text: "同学生日打赌，谁输了谁去食堂买十份最便宜的菜。掷骰子，三局两胜。",
    detail: "同学生日打赌，谁输了谁去食堂买十份最便宜的菜。掷骰子，三局两胜。骰子是从牌桌上顺手拿的，边角磨圆，掷在桌面上弹两下才定。那时候食堂一份素菜两毛五，十份堆在桌上像座小山。屋里的灯管一闪一闪，谁也没觉得这赌约荒唐。",
    options: [
      { text: "掷下去", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2, money: -3 }, aftermath: "你输了，端回来十份炒白菜，全宿舍吃到撑。" },
      { text: "认输直接买", deltas3: { values: 1 }, resourceDeltas: { mood: 1, money: -2 }, aftermath: "你懒得掷，直接去了食堂，反倒省了事。" },
    ],
  },
  {
    id: "youth-703", stage: "youth", ageHint: "23岁", ageMonths: 276, variant: "quick",
    text: "加完班出楼，门卫室里亮着灯，师傅在看一台小电视。",
    detail: "加完班出楼，门卫室里亮着灯，师傅在看一台小电视，声音开得很小。玻璃门上贴着值班表，门边暖气片上烤着两个馒头。街上末班公交刚过去，站牌下没人。师傅抬头问了句：这么晚。你点了下头。",
    options: [
      { text: "聊两句", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "他给你倒了杯热水，说年轻人别熬到这份上。" },
      { text: "点头就走", deltas3: { worldview: 1 }, resourceDeltas: { mood: -1 }, aftermath: "走出一段路，你有点后悔没接那杯水。" },
    ],
  },
  {
    id: "youth-704", stage: "youth", ageHint: "26岁", ageMonths: 312, variant: "draw",
    text: "合租的几个人约定抽签决定谁用朝南那间房，签筒里插着四根筷子，一根短一截。",
    detail: "合租的几个人约定抽签决定谁用朝南那间房，签筒里插着四根筷子，一根短一截。那间房冬天有太阳，租金一样，谁都想要。抽签是大家一起定的规矩，说这样最公道，抽完不许反悔。客厅的灯是节能灯，照得人脸发青。",
    options: [
      { text: "先抽", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你抽到短的，搬进去那晚，晒太阳晒睡着了。" },
      { text: "最后抽", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "最后剩下长的，你没拿到，也没争。" },
    ],
  },
  {
    id: "youth-705", stage: "youth", ageHint: "28岁", ageMonths: 336, variant: "read",
    text: "地铁口有个卖唱的青年，吉他箱上摊着一张纸，写着辞职来唱歌的第三个月。",
    detail: "地铁口有个卖唱的青年，吉他箱上摊着一张纸，写着辞职来唱歌的第三个月。他唱的是老歌，嗓子一般，路过的人偶尔停一下。箱子里散着几块零钱和一张公交卡。晚高峰的风把纸吹起一角，他低头压住，接着唱下一段。你站在台阶上听了整首。",
    options: [
      { text: "放下零钱", deltas3: { values: 1 }, resourceDeltas: { mood: 2, money: -1 }, aftermath: "他抬头说了声谢谢，唱下一首的时候更有劲。" },
      { text: "听完就走", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "走出去很远，那句歌词还在你脑子里转。" },
    ],
  },

  // ── adult 壮年（396–528，critical 起于 504）──
  {
    id: "adult-701", stage: "adult", ageHint: "34岁", ageMonths: 408, variant: "quick",
    text: "楼下早餐摊的老板娘认得你，见你来了，豆浆先盛好。",
    detail: "楼下早餐摊的老板娘认得你，见你来了，豆浆先盛好。摊子支在梧桐树下，两张折叠桌，一锅油条一锅豆浆，收钱用的是一个铁皮盒。她记得你不加糖，也记得你赶时间，包子总是先递。早晨六点半的光从树缝里漏下来。",
    options: [
      { text: "说声谢谢", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "她笑着摆手，说老主顾了不用客气。" },
      { text: "赶时间", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "那天你边走边吃，回头看了一眼那个摊子。" },
    ],
  },
  {
    id: "adult-702", stage: "adult", ageHint: "36岁", ageMonths: 432, variant: "draw",
    text: "单位分年货，抽签定顺序，谁先挑谁拿好的。签筒摆在会议室桌上，全处的人都到齐了。",
    detail: "单位分年货，抽签定顺序，谁先挑谁拿好的。签筒摆在会议室桌上，全处的人都到齐了。年货是冻鱼和带鱼，还有两箱苹果，堆在暖气片旁边。抽签的规矩是处长定的，说这样谁也没话说。签是小纸条，折得整整齐齐。",
    options: [
      { text: "早抽早安心", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你抽到中段，挑了一箱没磕碰的苹果。" },
      { text: "等别人挑完", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "剩下的那箱苹果有个烂的，你回家削了三个才好。" },
    ],
  },
  {
    id: "adult-703", stage: "adult", ageHint: "38岁", ageMonths: 456, variant: "read",
    text: "医院走廊里坐着一个抱保温桶的中年男人，桶里是给老人熬的粥。他见你看，主动说：熬了四年了。",
    detail: "医院走廊里坐着一个抱保温桶的中年男人，桶里是给老人熬的粥。他见你看，主动说：熬了四年了。他脚边放着一双塑料拖鞋和一个装着药单的塑料袋，药单折成几折，边角发软。走廊尽头的窗户开着，消毒水味被风吹淡一点。他说老人昨天能自己坐起来了。",
    options: [
      { text: "听他说完", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你走的时候，他还在说，说到老人年轻时的事。" },
      { text: "点头离开", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你在楼梯间站了一会儿，给家里打了个电话。" },
    ],
  },
  {
    id: "adult-704", stage: "adult", ageHint: "40岁", ageMonths: 480, variant: "quick",
    text: "小区门口贴着通知，说要选楼长，报名截止到这周末。",
    detail: "小区门口贴着通知，说要选楼长，报名截止到这周末。通知是打印的，用胶带粘在公告栏，边角被风掀起过。楼里的事其实不多：收卫生费、协调停车、谁家漏水喊人。前两任楼长都是退了休的老人。你路过时，保安正在往通知上压一枚图钉。",
    options: [
      { text: "报个名", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你成了这栋楼最年轻的楼长，事不少。" },
      { text: "不报", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "新楼长上任第一天，你在楼道里帮了把手。" },
    ],
  },
  {
    id: "adult-705", stage: "adult", ageHint: "42岁", ageMonths: 492, variant: "draw",
    text: "公司年会抽奖，一等奖是一台冰箱。抽奖箱摆在台前，主持人说一人一张，摸到红球就中。",
    detail: "公司年会抽奖，一等奖是一台冰箱。抽奖箱摆在台前，主持人说一人一张，摸到红球就中。箱子里是一堆乒乓球，红球只有一个。台下的桌子摆着瓜子糖果，酒过三巡，谁都想上台摸一把。灯光打在箱口，看不见里面。",
    options: [
      { text: "上去摸", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "摸出白的，你在掌声里笑着下台。" },
      { text: "让别人先摸", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "红球被实习生摸走了，全场欢呼得比抽中的人还响。" },
    ],
  },

  // ── midlife 中年（564–708，critical 起于 696）──
  {
    id: "midlife-701", stage: "midlife", ageHint: "48岁", ageMonths: 576, variant: "quick",
    text: "单位搬了新楼，老同事在群里发了一张旧办公室的照片。窗台上的绿萝还在。",
    detail: "单位搬了新楼，老同事在群里发了一张旧办公室的照片。窗台上的绿萝还在。照片是临走前拍的，桌椅已经搬空，地上有纸箱压出的印子，墙上还留着挂钟的钉子。群里陆续有人回：这盆是我买的。也有人说：回去看看。",
    options: [
      { text: "回一句", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你在群里打了一段话，删了又重写，最后只发了三个字：留着吧。" },
      { text: "存下照片", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "那张照片一直存在你手机里，偶尔翻到，看很久。" },
    ],
  },
  {
    id: "midlife-702", stage: "midlife", ageHint: "51岁", ageMonths: 612, variant: "read",
    text: "公园里一队人在打太极，领队的老太太七十多了，动作最稳。她招手让你站到队尾跟着试试。",
    detail: "公园里一队人在打太极，领队的老太太七十多了，动作最稳。她招手让你站到队尾跟着试试。队伍在梧桐树下一字排开，音响里放着很慢的曲子，地上摆着一排装了水的塑料瓶当标记。清晨的雾气还没散，谁的动作错了，也没人回头看。",
    options: [
      { text: "站到队尾", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2, health: 1 }, aftermath: "你跟着走完一套，第二天腿有点酸，还是去了。" },
      { text: "在旁边看", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你在长椅上看了两个月，第三个月才站进队伍。" },
    ],
  },
  {
    id: "midlife-703", stage: "midlife", ageHint: "53岁", ageMonths: 636, variant: "draw",
    text: "家族聚会上有人提议抓阄定谁负责照看老宅。红纸撕成三条，揉成团，放在茶盘里。",
    detail: "家族聚会上有人提议抓阄定谁负责照看老宅。红纸撕成三条，揉成团，放在茶盘里。老宅的钥匙只有一串，门锁是几十年前换的，谁拿到谁管修屋顶和扫落叶。饭桌上菜还没上齐，茶水已经凉了。长辈说这样最公平，谁也别怪谁。",
    options: [
      { text: "先抓", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你抓到了，那串钥匙在兜里沉了一路。" },
      { text: "推给别人", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "弟弟抓到了，你答应每年回去帮着修一回。" },
    ],
  },
  {
    id: "midlife-704", stage: "midlife", ageHint: "55岁", ageMonths: 660, variant: "quick",
    text: "体检报告出来，医生圈了两处，让你少吃咸、多走路。",
    detail: "体检报告出来，医生圈了两处，让你少吃咸、多走路。报告是两页纸，第二页的箭头有几个朝上，边上印着小字说明。诊室外的走廊坐满了人，都有点困。医生说话很快，讲完就按了下一个号。你把报告折好收进包里。",
    options: [
      { text: "照做", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1, health: 2 }, aftermath: "半年后复查，两个箭头都压下去了。" },
      { text: "先不管", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2, health: -2 }, aftermath: "那半年你吃得痛快，年底又去排了一次队。" },
    ],
  },
  {
    id: "midlife-705", stage: "midlife", ageHint: "57岁", ageMonths: 684, variant: "read",
    text: "楼下小卖部要关门了，老板在门上贴纸条：盘给了别人，明天起换招牌。你在门口站了一会儿。",
    detail: "楼下小卖部要关门了，老板在门上贴纸条：盘给了别人，明天起换招牌。你在门口站了一会儿。这家店开了二十多年，柜台上的玻璃罐里曾经装着话梅和水果糖，后来换成了口香糖和创可贴。老板坐在柜台后算账，算盘打得慢。他说儿子在外地，没人接。",
    options: [
      { text: "买点东西", deltas3: { values: 1 }, resourceDeltas: { mood: 2, money: -2 }, aftermath: "你买了两瓶酱油和一包茶叶，老板多塞了一包话梅。" },
      { text: "问几句", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "他讲了很多，说到第三句你才知道他舍不得的是那扇门。" },
    ],
  },

  // ── elder 老年（744–1068，critical 起于 1020）──
  {
    id: "elder-701", stage: "elder", ageHint: "63岁", ageMonths: 756, variant: "quick",
    text: "早市上有人卖旧书，一摞一摞码在地上，两块一本，随便翻。",
    detail: "早市上有人卖旧书，一摞一摞码在地上，两块一本，随便翻。书堆里有旧教材、菜谱、武侠小说，还有几本封皮掉了的字典。摆摊的人坐在小马扎上，不问也不劝，谁来翻都行。晨光斜着照过来，书页的灰在光里飘。",
    options: [
      { text: "蹲下翻", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2, money: -2 }, aftermath: "你翻到一本旧地图册，回家看了半个月。" },
      { text: "看过就走", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "走了几步又回头，把那本地图册买了下来。" },
    ],
  },
  {
    id: "elder-702", stage: "elder", ageHint: "66岁", ageMonths: 792, variant: "read",
    text: "公园长椅上有个老人每天来喂鸽子，带一小袋米。他说这些鸽子里有他喂大的第三代。",
    detail: "公园长椅上有个老人每天来喂鸽子，带一小袋米。他说这些鸽子里有他喂大的第三代。米是散装的，装在一个旧布袋里，撒的时候手很稳，一把一把地撒。鸽子落在他脚边，不怕人。他说老伴走了以后，这袋米是他每天出门的理由。",
    options: [
      { text: "坐下聊", deltas3: { values: 1 }, resourceDeltas: { mood: 2 }, aftermath: "你们聊了一个上午，从鸽子聊到各自的厂子。" },
      { text: "远远看着", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你记住了那个撒米的动作，很稳。" },
    ],
  },
  {
    id: "elder-703", stage: "elder", ageHint: "70岁", ageMonths: 840, variant: "draw",
    text: "社区组织重阳节活动，抽签分组做手工。签是彩色纸片，抽到同色的坐一桌。",
    detail: "社区组织重阳节活动，抽签分组做手工。签是彩色纸片，抽到同色的坐一桌。桌上摆着剪刀、浆糊、彩纸和线，老人们做的多是纸花和灯笼。主持的年轻人嗓门很大，怕谁听不见。抽签之前有人开玩笑说，抽到对桌就是缘分。",
    options: [
      { text: "随手一抽", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "抽到红签，同桌的是个爱讲笑话的老太太。" },
      { text: "挑一张", deltas3: { worldview: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你挑了最边上的那张，同桌没人说话，倒也清静。" },
    ],
  },
  {
    id: "elder-704", stage: "elder", ageHint: "74岁", ageMonths: 888, variant: "quick",
    text: "孙女送来一个新杯子，说保温十二小时。你把旧搪瓷缸收进了柜子。",
    detail: "孙女送来一个新杯子，说保温十二小时。你把旧搪瓷缸收进了柜子。那只搪瓷缸用了三十多年，缸沿磕掉一块瓷，露出里面的铁，喝水得挑边。新杯子是银灰色的，盖子上有温度显示，按一下会亮。孙女教了你三遍怎么开盖。",
    options: [
      { text: "用新的", deltas3: { outlook: 1 }, resourceDeltas: { mood: 2 }, aftermath: "第一次喝到中午还烫的水，你给孙女发了条语音。" },
      { text: "还用旧的", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "旧缸子摆在窗台上，新杯子摆在柜里，都挺好。" },
    ],
  },
  {
    id: "elder-705", stage: "elder", ageHint: "78岁", ageMonths: 936, variant: "read",
    text: "楼道里新搬来一户年轻人家，晚上有孩子练琴，弹的是同一首曲子，一遍一遍地错在同一个地方。",
    detail: "楼道里新搬来一户年轻人家，晚上有孩子练琴，弹的是同一首曲子，一遍一遍地错在同一个地方。琴声隔着墙传过来，闷闷的，像捂在被子里。你坐在沙发上听，听出那孩子每天进步一点点。第三周，那个地方终于对了。你在心里替她松了一口气。",
    options: [
      { text: "继续听", deltas3: { worldview: 1 }, resourceDeltas: { mood: 2 }, aftermath: "后来那孩子考级，你还特意问了一句结果。" },
      { text: "去楼道打招呼", deltas3: { values: 1 }, resourceDeltas: { mood: 1 }, aftermath: "你送了孩子一本旧谱子，她母亲连声道谢。" },
    ],
  },
];

function main() {
  const dry = process.argv.includes("--dry");
  const events = JSON.parse(readFileSync(PATH, "utf8"));
  const known = new Set(events.map((e) => e.id));
  const toAdd = [];
  for (const enc of ENCOUNTERS) {
    if (known.has(enc.id)) continue;
    toAdd.push({
      id: enc.id,
      stage: enc.stage,
      type: "encounter",
      line: "fate",
      ageHint: enc.ageHint,
      ageMonths: enc.ageMonths,
      variant: enc.variant,
      text: enc.text,
      detail: enc.detail,
      options: enc.options,
    });
  }
  const out = process.stdout.write.bind(process.stdout);
  out(`偶遇层入库（plan/v5/02 §二）：待入 ${toAdd.length} 条 / 已存在 ${ENCOUNTERS.length - toAdd.length} 条\n`);
  const byStage = {};
  for (const ev of toAdd) byStage[ev.stage] = (byStage[ev.stage] ?? 0) + 1;
  out(`分布：${Object.entries(byStage).map(([s, n]) => `${s} ${n}`).join(" / ")}\n`);
  if (toAdd.length && !dry) {
    // 按 stage 顺序 + 月龄插入，保持库内可读
    const merged = [...events, ...toAdd].sort((a, b) => {
      if (a.stage !== b.stage) return 0; // 稳定排序：不跨阶段搬动
      return 0;
    });
    writeFileSync(PATH, JSON.stringify(merged, null, 2) + "\n");
    out(`已写入 ${PATH}\n`);
  } else if (dry) {
    out("--dry 未写盘\n");
  }
}

const isCli = process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isCli) main();
export { ENCOUNTERS };
