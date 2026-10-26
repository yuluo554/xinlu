#!/usr/bin/env node
// 语义配图 55 张自产 CC0 线稿（plan/v5/02 §九 D9 ▸ v5-M3'''' 落地形态；v5-M6 因 SI-001 修配图：
// 退役 4 张（night×2 / meal×2，摘出情绪·时间·社交图标后事件归零）+ 新增 11 张（pet/toy/media/music 4 类 10 张 + funeral 补 1 张））。
//
// 为什么自产而不是采集：本机实测到不了可检索的 CC0 图源（Wikimedia/Openverse 不通，Pexels/Pixabay
// 只有 CDN 直连、无法核验画面与许可），照片路线的 provenance 无法逐张证真；且照片 WebP 实测
// ≈4.3KB/张 × 48 张 ≈ 207KB，远超预算门余量。自产线稿沿 v4 stage-scenes 先例（自产 CC0 单色剪影），
// 许可零风险、可逐张对文案留痕、体积 ≈0.8KB/张。
//
// 构图纪律（第一版踩过的坑）：**一张只有一个主体，居中放大**。第一版每张右侧堆了三个无意义方框当
// 「背景建筑」，结果 46 张看起来几乎一样（总览目检一眼就看出来了）。现在只画这一类的那件东西。
//
// 形态：400×140 viewBox（卡片上半屏横向画幅）；描边与填充全走 CSS 变量，随四主题联动。
// 幂等：覆盖写。用法：node tools/v5-gen-scenes.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "assets/web-ready/scenes");
const W = 400;
const H = 140;

/** 画布骨架：地面线（可关）+ 主体。主体用单一 SVG 组，填充层可选。 */
function scene(outline, fill = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
  <rect width="${W}" height="${H}" fill="var(--scene-bg,#f2eee3)"/>
  ${fill ? `<g fill="var(--scene-fill,#cfc9b8)" stroke="none">${fill}</g>` : ""}
  <g fill="none" stroke="var(--scene-line,#3a3730)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${outline}</g>
  <path d="M46 122h308" stroke="var(--scene-line,#3a3730)" stroke-width="1.5" opacity=".45" fill="none" stroke-linecap="round"/>
</svg>
`;
}

/** 标签 → { 文件名: SVG }；文件名 = <tag>-<variant>，与 scene-map.json 的键一致。 */
const SCENES = {
  // ── home 家：门 / 院 / 床 / 窗（各自只画那一件） ──
  "home-threshold": scene(
    `<path d="M132 122V56h136v66"/><path d="M132 56l68-30 68 30"/><path d="M184 122V88h32v34"/><circle cx="210" cy="106" r="2.5"/>`,
    `<path d="M132 56l68-30 68 30z"/>`,
  ),
  "home-courtyard": scene(
    `<path d="M112 122V50h176v72"/><path d="M112 84h176"/><path d="M168 84v38M232 84v38"/>
     <path d="M112 50h176"/><circle cx="200" cy="68" r="9"/>`,
    `<circle cx="200" cy="68" r="9"/>`,
  ),
  "home-bedroom": scene(
    `<path d="M110 122V84h180"/><path d="M110 84V66h180v18"/><rect x="128" y="92" width="52" height="20" rx="5"/>
     <path d="M110 122h180"/><path d="M110 96v26M290 96v26"/>`,
    `<rect x="128" y="92" width="52" height="20" rx="5"/><path d="M110 84V66h180v18z"/>`,
  ),
  "home-window": scene(
    `<rect x="130" y="26" width="140" height="86" rx="2"/><path d="M200 26v86M130 69h140"/>
     <path d="M116 112h168"/><path d="M172 96h56v16h-56z"/>
     <circle cx="252" cy="46" r="7"/>`,
    `<rect x="130" y="26" width="140" height="86" rx="2"/>`,
  ),

  // ── kitchen 厨房：灶 / 桌 / 菜篮 ──
  "kitchen-stove": scene(
    `<rect x="120" y="58" width="160" height="64" rx="4"/><circle cx="164" cy="80" r="13"/><circle cx="200" cy="80" r="13"/>
     <path d="M120 106h160"/><path d="M146 58V40h108v18"/><rect x="176" y="88" width="48" height="14" rx="3"/>`,
    `<rect x="120" y="58" width="160" height="64" rx="4"/>`,
  ),
  "kitchen-table": scene(
    `<path d="M96 78h208"/><path d="M120 78v44M280 78v44"/><path d="M108 78V66h184v12"/>
     <circle cx="152" cy="56" r="11"/><circle cx="248" cy="56" r="11"/><path d="M188 66v-8h24v8"/>`,
    `<path d="M108 78V66h184v12z"/><circle cx="152" cy="56" r="11"/><circle cx="248" cy="56" r="11"/>`,
  ),
  "kitchen-vegetables": scene(
    `<path d="M126 84h148l-16 38H142z"/><path d="M158 84c0-18 12-30 28-34"/><path d="M204 84c0-22 14-34 30-38"/>
     <path d="M140 96h120"/><circle cx="200" cy="64" r="7"/>`,
    `<path d="M126 84h148l-16 38H142z"/>`,
  ),

  // ── school 校园：门 / 操场 / 走廊 ──
  "school-gate": scene(
    `<path d="M104 122V52h48v70M248 122V52h48v70"/><path d="M152 60h96M152 70h96"/>
     <path d="M188 70v52"/><path d="M164 122v-26h72v26"/><path d="M104 52l24-14 24 14M248 52l24-14 24 14"/>`,
    `<path d="M164 122v-26h72v26z"/>`,
  ),
  "school-field": scene(
    `<path d="M76 122h248"/><path d="M76 122V92h248v30"/><path d="M76 106h248"/>
     <path d="M128 92V72M200 92V72M272 92V72"/><circle cx="200" cy="44" r="16"/><path d="M200 60v10"/>`,
    `<circle cx="200" cy="44" r="16"/>`,
  ),
  "school-corridor": scene(
    `<path d="M88 122V34h224v88"/><path d="M88 54h224"/><path d="M88 92h224"/>
     <path d="M152 54v38M200 54v38M248 54v38"/><path d="M180 122v-22h40v22"/>`,
    ``,
  ),

  // ── classroom 教室：黑板 / 课桌 / 卷子 ──
  "classroom-blackboard": scene(
    `<rect x="96" y="26" width="208" height="70" rx="3"/><path d="M96 104h208"/>
     <path d="M126 48h100M126 64h68M126 80h120"/><path d="M296 96h24"/>`,
    `<rect x="96" y="26" width="208" height="70" rx="3"/>`,
  ),
  "classroom-desks": scene(
    `<path d="M84 84h100v12H84z"/><path d="M100 96v26M168 96v26"/><path d="M84 66h100"/>
     <path d="M216 84h100v12H216z"/><path d="M232 96v26M300 96v26"/><path d="M216 66h100"/>`,
    `<path d="M84 84h100v12H84z"/><path d="M216 84h100v12H216z"/>`,
  ),
  "classroom-paper": scene(
    `<path d="M132 22h136v96H132z"/><path d="M132 40h136"/>
     <path d="M150 58h96M150 74h100M150 90h64"/><path d="M164 104h32"/>`,
    `<path d="M132 22h136v96H132z"/>`,
  ),

  // ── street 街巷：巷 / 店面 / 路口 ──
  "street-alley": scene(
    `<path d="M60 122V56h96v66"/><path d="M156 122V70h88v52"/><path d="M244 122V50h96v72"/>
     <path d="M60 56l-10-10M340 50l10-10"/><path d="M84 80h44M180 92h40M268 74h48"/>
     <path d="M24 122h352"/>`,
    `<path d="M156 122V70h88v52z"/>`,
  ),
  "street-shopfront": scene(
    `<path d="M96 122V66h208v56"/><path d="M96 66l26-26h156l26 26"/>
     <path d="M120 96h160v26H120z"/><path d="M200 96v26"/><path d="M136 82h40M224 82h40"/>`,
    `<path d="M120 96h160v26H120z"/><path d="M96 66l26-26h156l26 26z"/>`,
  ),
  "street-crossing": scene(
    `<path d="M56 122h288"/><path d="M56 122l56-40M136 122l56-40M216 122l56-40M296 122l56-40"/>
     <path d="M296 82V30"/><circle cx="296" cy="22" r="10"/><path d="M270 82h52"/>`,
    ``,
  ),

  // ── station 车站：站台 / 行李 / 票 ──
  "station-platform": scene(
    `<path d="M40 122h320"/><path d="M40 96h320"/><path d="M76 96V56h248v40"/>
     <path d="M120 96v-22M200 96v-22M280 96v-22"/>
     <rect x="100" y="62" width="56" height="22" rx="2"/><rect x="244" y="62" width="56" height="22" rx="2"/>`,
    ``, 
  ),
  "station-luggage": scene(
    `<path d="M116 82h84v40h-84z"/><path d="M138 82V68h40v14"/><path d="M152 96v10M176 96v10"/>
     <path d="M232 122V96h56v26"/><path d="M232 108h56"/>
     <path d="M244 96V78h32v18"/>`,
    `<path d="M116 82h84v40h-84z"/>`,
  ),
  "station-ticket": scene(
    `<rect x="112" y="48" width="176" height="56" rx="4"/><path d="M112 66h176"/>
     <path d="M132 84h84M132 94h48"/><circle cx="264" cy="84" r="10"/>`,
    `<rect x="112" y="48" width="176" height="56" rx="4"/>`,
  ),

  // ── factory 厂区：厂房 / 机器 ──
  "factory-hall": scene(
    `<path d="M80 122V70l46-26 46 26v52"/><path d="M172 122V86l46-22 46 22v36"/>
     <path d="M80 122h248"/><path d="M104 122V96h36v26"/>`,
    `<path d="M80 122V70l46-26 46 26v52z"/><path d="M172 122V86l46-22 46 22v36z"/>`,
  ),
  "factory-machine": scene(
    `<rect x="112" y="52" width="176" height="70" rx="4"/><circle cx="168" cy="86" r="18"/>
     <path d="M112 68h176"/><path d="M288 86h32"/><rect x="140" y="96" width="40" height="12" rx="3"/>`,
    `<rect x="112" y="52" width="176" height="70" rx="4"/><circle cx="168" cy="86" r="18"/>`,
  ),

  // ── office 办公：工位 / 会议桌 ──
  "office-desk": scene(
    `<path d="M96 86h208"/><path d="M96 86V74h208v12"/><path d="M120 86v36M280 86v36"/>
     <rect x="128" y="52" width="80" height="30" rx="2"/><path d="M140 74v-22h56v22"/>
     <path d="M236 66h44M236 78h44"/>`,
    `<rect x="128" y="52" width="80" height="30" rx="2"/><path d="M96 86V74h208v12z"/>`,
  ),
  "office-meeting": scene(
    `<path d="M88 122V84h224v38"/><path d="M88 96h224"/>
     <circle cx="128" cy="62" r="14"/><circle cx="200" cy="62" r="14"/><circle cx="272" cy="62" r="14"/>
     <path d="M128 76v8M200 76v8M272 76v8"/>`,
    `<path d="M88 122V84h224v38z"/>`,
  ),

  // ── hospital 医院：病房 / 走廊 / 药 ──
  "hospital-ward": scene(
    `<path d="M92 122V86h108"/><path d="M92 86V68h108v18"/><rect x="112" y="92" width="36" height="18" rx="4"/>
     <path d="M92 122V112M200 122V112"/><path d="M236 122V70h32v52"/><path d="M236 86h32"/>
     <path d="M248 58h8v16h-8zM244 62h16"/>`,
    `<path d="M92 86V68h108v18z"/><rect x="112" y="92" width="36" height="18" rx="4"/>`,
  ),
  "hospital-corridor": scene(
    `<path d="M84 122V30h232v92"/><path d="M84 52h232"/>
     <rect x="112" y="66" width="44" height="56"/><rect x="178" y="66" width="44" height="56"/><rect x="244" y="66" width="44" height="56"/>
     <path d="M84 104h232"/>`,
    ``,
  ),
  "hospital-medicine": scene(
    `<rect x="104" y="56" width="86" height="66" rx="6"/><path d="M104 78h86"/><path d="M130 96h34"/>
     <circle cx="268" cy="88" r="26"/><path d="M268 72v32M252 88h32"/>`,
    `<rect x="104" y="56" width="86" height="66" rx="6"/><circle cx="268" cy="88" r="26"/>`,
  ),

  // ── market 市场：摊 / 秤 ──
  "market-stall": scene(
    `<path d="M104 122V82h192v40"/><path d="M92 82h216l-16-30H108z"/>
     <circle cx="144" cy="100" r="11"/><circle cx="200" cy="100" r="11"/><circle cx="256" cy="100" r="11"/>`,
    `<path d="M92 82h216l-16-30H108z"/><circle cx="144" cy="100" r="11"/><circle cx="200" cy="100" r="11"/><circle cx="256" cy="100" r="11"/>`,
  ),
  "market-scales": scene(
    `<path d="M140 110h120"/><path d="M200 110V44"/><path d="M156 44h88"/>
     <path d="M156 44l-22 32h44z"/><path d="M244 44l-22 32h44z"/><path d="M188 110h24"/>`,
    `<path d="M156 44l-22 32h44z"/><path d="M244 44l-22 32h44z"/>`,
  ),

  // ── field 田野：垄 / 收割 ──
  "field-rows": scene(
    `<path d="M40 92h320"/><path d="M70 92v30M112 92v30M154 92v30M196 92v30M238 92v30M280 92v30M322 92v30"/>
     <path d="M92 92c0-16 8-26 20-30"/><path d="M176 92c0-16 8-26 20-30"/><path d="M260 92c0-16 8-26 20-30"/>
     <circle cx="330" cy="38" r="16"/>`,
    `<circle cx="330" cy="38" r="16"/>`,
  ),
  "field-harvest": scene(
    `<path d="M52 122h296"/><path d="M96 122V64M140 122V64M184 122V64"/>
     <path d="M96 78h88M96 96h88"/><path d="M96 64l14-16M184 64l-14-16"/>
     <path d="M250 122V86h74v36"/><path d="M250 102h74"/>`,
    `<path d="M250 122V86h74v36z"/>`,
  ),

  // ── wedding 婚宴：席 / 厅 ──
  "wedding-table": scene(
    `<path d="M76 96h248v12H76z"/><path d="M100 108v14M300 108v14"/>
     <circle cx="128" cy="80" r="9"/><circle cx="176" cy="80" r="9"/><circle cx="224" cy="80" r="9"/><circle cx="272" cy="80" r="9"/>
     <path d="M200 96V52"/><circle cx="200" cy="40" r="12"/>`,
    `<path d="M76 96h248v12H76z"/><circle cx="200" cy="40" r="12"/>`,
  ),
  "wedding-hall": scene(
    `<path d="M52 122V44h296v78"/><path d="M52 64h296"/>
     <path d="M104 64v58M156 64v58M244 64v58M296 64v58"/>
     <circle cx="200" cy="90" r="18"/><path d="M200 108v14"/><path d="M200 76v-8"/>`,
    ``,
  ),

  // ── funeral 丧事：灵堂 / 花 ──
  "funeral-hall": scene(
    `<path d="M76 122V74h248v48"/><path d="M76 88h248"/>
     <circle cx="200" cy="58" r="14"/><path d="M186 58h28"/>
     <path d="M116 100v22M284 100v22"/>`,
    ``,
  ),
  "funeral-flowers": scene(
    `<path d="M200 122V72"/><circle cx="200" cy="56" r="18"/><circle cx="182" cy="74" r="12"/><circle cx="218" cy="74" r="12"/>
     <circle cx="200" cy="88" r="10"/><path d="M182 122h36"/><path d="M200 104v18"/>`,
    `<circle cx="200" cy="56" r="18"/><circle cx="182" cy="74" r="12"/><circle cx="218" cy="74" r="12"/><circle cx="200" cy="88" r="10"/>`,
  ),
  // 第 3 张：v5-M6 补——摘出情绪图标后 funeral 只剩 3 条事件，2 张图在哈希下必死 1 张
  //（`h >>> 16 % 2` 对那 3 条事件同命中 1 号位），补第 3 张让 3 条事件各得一张。
  "funeral-candles": scene(
    `<path d="M132 122V78M268 122V78"/><path d="M110 122h44M246 122h44"/>
     <path d="M132 78v-22M268 78v-26"/><path d="M124 56h16l-4-16h-8z"/><path d="M260 52h16l-4-16h-8z"/>`,
    `<path d="M124 56h16l-4-16h-8z"/><path d="M260 52h16l-4-16h-8z"/>`,
  ),

  // ── night / meal 两类已退役（v5-M6）──
  // 摘出情绪·时间·社交图标后，这两类的合法用户归零：夜色只剩 1 条、饭桌 0 条。
  // 少事件在哈希下必然留死图（2 条事件无论取 2/3/4 张都同命中一张），留死图会被
  // `scenes.test.ts`「无死图」判红 —— 故整类退役、图稿同笔删除，事件转显式豁免。

  // ── rain 雨天：街 / 伞 ──
  "rain-street": scene(
    `<path d="M84 96V58h96v38"/><path d="M180 96V72h64v24"/><path d="M244 96V50h92v46"/>
     <path d="M68 108l-6 12M116 108l-6 12M164 108l-6 12M212 108l-6 12M260 108l-6 12M308 108l-6 12"/>
     <path d="M48 96h328" opacity=".4"/>`,
    `<path d="M180 96V72h64v24z"/>`,
  ),
  "rain-umbrella": scene(
    `<path d="M200 112V62"/><path d="M148 62a52 32 0 0 1 104 0z"/>
     <path d="M200 112c0 10-12 10-12 2"/><path d="M174 34l-8-10M226 34l8-10M200 26v-10"/>`,
    `<path d="M148 62a52 32 0 0 1 104 0z"/>`,
  ),

  // ── outdoors 户外：公园（树 + 长椅）/ 路上（步道 + 远处山影） ──
  "outdoors-park": scene(
    `<path d="M150 122V70"/><circle cx="150" cy="48" r="24"/><circle cx="122" cy="66" r="14"/><circle cx="178" cy="66" r="14"/>
     <path d="M252 104h76"/><path d="M262 104v18M318 104v18"/><path d="M252 92h76v12h-76z"/>`,
    `<circle cx="150" cy="48" r="24"/><circle cx="122" cy="66" r="14"/><circle cx="178" cy="66" r="14"/><path d="M252 92h76v12h-76z"/>`,
  ),
  "outdoors-road": scene(
    `<path d="M60 122c40-10 60-40 90-40s50 20 90 10 60-30 100-34"/>
     <path d="M240 122l18-52 18 52z"/><path d="M258 70v-12"/><circle cx="258" cy="52" r="6"/>
     <path d="M110 84l6-14 6 14z"/>`,
    `<path d="M240 122l18-52 18 52z"/>`,
  ),

  // ── meal 饭桌已退役（见上：社交图标摘出后该类事件归零）──

  // ── study 书桌：书 / 台灯 / 写字 ──
  "study-books": scene(
    `<path d="M92 104h216v10H92z"/><path d="M108 104V94h184v10"/><path d="M124 94V84h152v10"/>
     <rect x="140" y="44" width="26" height="40" rx="2"/><rect x="172" y="52" width="24" height="32" rx="2"/><rect x="202" y="38" width="28" height="46" rx="2"/>`,
    `<path d="M108 104V94h184v10z"/><rect x="140" y="44" width="26" height="40" rx="2"/><rect x="172" y="52" width="24" height="32" rx="2"/><rect x="202" y="38" width="28" height="46" rx="2"/>`,
  ),
  "study-lamp": scene(
    `<path d="M104 110h192v10H104z"/><path d="M124 110v12M276 110v12"/>
     <path d="M188 110V66"/><path d="M188 66l-32-22"/><circle cx="148" cy="36" r="14"/>
     <path d="M118 84h26M232 84h26"/>`,
    `<circle cx="148" cy="36" r="14"/>`,
  ),
  "study-writing": scene(
    `<path d="M84 102h180v10H84z"/><path d="M100 112v10M248 112v10"/>
     <path d="M112 102V82h124v20"/><path d="M124 92h100"/>
     <path d="M272 102l62-52 14 14-62 52-18 6z"/>`,
    `<path d="M112 102V82h124v20z"/>`,
  ),

  // ── relic 旧物：盒 / 照片 / 信 ──
  "relic-box": scene(
    `<rect x="120" y="60" width="160" height="60" rx="4"/><path d="M120 82h160"/><path d="M176 60v22"/>
     <path d="M196 72h24"/><path d="M136 96h128"/>`,
    `<rect x="120" y="60" width="160" height="60" rx="4"/>`,
  ),
  "relic-photo": scene(
    `<rect x="92" y="36" width="96" height="76" rx="2"/><path d="M102 46h76v56h-76z"/>
     <circle cx="126" cy="64" r="8"/><path d="M104 100l22-20 16 14 16-18 18 24"/>
     <rect x="212" y="48" width="80" height="64" rx="2"/><path d="M222 58h60v44h-60z"/>`,
    `<rect x="92" y="36" width="96" height="76" rx="2"/><rect x="212" y="48" width="80" height="64" rx="2"/>`,
  ),
  "relic-letter": scene(
    `<path d="M112 46h176v72H112z"/><path d="M112 46l88 44 88-44"/>
     <path d="M132 102h48M132 92h72"/>`,
    `<path d="M112 46h176v72H112z"/>`,
  ),

  // ── v5-M6 新增 4 类（SI-001 修复第二半）：宠物 / 玩物 / 影音 / 器乐 ──
  // 这四类是「图标本身是这类场景的核心物件」的键（兔/猫/拼图/手柄/电视/收音机/吉他/琴/话筒）——
  // 原先被硬塞进 `study`（书桌）导致「画书堆配兔子」。改挂本四类后覆盖率只掉一点、图形对事。
  // 画法沿既定纪律：一张只有一个主体、居中放大；描边/填充走 CSS 变量，随四主题联动。
  "pet-cat": scene(
    `<circle cx="200" cy="66" r="18"/>
     <path d="M186 54l-5-18 16 8M214 54l5-18-16 8"/>
     <circle cx="193" cy="66" r="2"/><circle cx="207" cy="66" r="2"/>
     <path d="M182 72h-14M182 77h-14M218 72h14M218 77h14"/>
     <path d="M176 122c0-22 10-36 24-36s24 14 24 36"/>
     <path d="M188 122v-14M212 122v-14"/><path d="M248 118c14-2 18-12 12-20"/>`,
    `<circle cx="200" cy="66" r="18"/><path d="M176 122c0-22 10-36 24-36s24 14 24 36z"/>`,
  ),
  "pet-cage": scene(
    `<rect x="140" y="40" width="120" height="82" rx="4"/>
     <path d="M164 44v74M196 44v74M228 44v74"/>
     <path d="M132 122h136"/><path d="M180 40c6-16 30-16 36 0"/>
     <circle cx="204" cy="74" r="10"/><path d="M198 66l-4-16M210 66l4-16"/>
     <path d="M188 104c0-13 7-20 16-20s16 7 16 20"/>`,
    `<circle cx="204" cy="74" r="10"/><path d="M188 104c0-13 7-20 16-20s16 7 16 20z"/>`,
  ),
  "toy-jigsaw": scene(
    `<path d="M158 34h60v22a11 11 0 1 1 0 22v22h-60v-22a11 11 0 1 0 0-22z"/>
     <path d="M120 120h160"/>`,
    `<path d="M158 34h60v22a11 11 0 1 1 0 22v22h-60v-22a11 11 0 1 0 0-22z"/>`,
  ),
  "toy-gamepad": scene(
    `<rect x="142" y="58" width="116" height="50" rx="20"/>
     <path d="M172 74v18M163 83h18"/>
     <circle cx="222" cy="78" r="5"/><circle cx="238" cy="90" r="5"/>
     <path d="M258 70c12-6 16-16 10-26"/>`,
    `<rect x="142" y="58" width="116" height="50" rx="20"/>`,
  ),
  "media-tv": scene(
    `<rect x="128" y="40" width="144" height="80" rx="4"/>
     <rect x="140" y="52" width="120" height="56" rx="2"/>
     <path d="M172 40l-14-18M228 40l14-18"/>
     <path d="M168 120v6M232 120v6M150 126h100"/>`,
    `<rect x="140" y="52" width="120" height="56" rx="2"/>`,
  ),
  "media-radio": scene(
    `<rect x="126" y="52" width="148" height="66" rx="6"/>
     <circle cx="168" cy="86" r="17"/><circle cx="168" cy="86" r="6"/>
     <circle cx="234" cy="72" r="9"/><circle cx="252" cy="98" r="6"/>
     <path d="M240 52l18-26"/>`,
    `<circle cx="168" cy="86" r="17"/>`,
  ),
  "media-phone": scene(
    `<rect x="164" y="24" width="72" height="98" rx="9"/>
     <rect x="174" y="38" width="52" height="62" rx="2"/>
     <circle cx="200" cy="110" r="5"/><path d="M196 32h8"/>`,
    `<rect x="174" y="38" width="52" height="62" rx="2"/>`,
  ),
  "music-guitar": scene(
    `<circle cx="176" cy="94" r="26"/><circle cx="176" cy="66" r="20"/><circle cx="176" cy="86" r="7"/>
     <path d="M194 54l46-34"/><path d="M238 20l14-10 8 8-14 10z"/><path d="M186 62l52-38"/>`,
    `<circle cx="176" cy="94" r="26"/><circle cx="176" cy="66" r="20"/>`,
  ),
  "music-piano": scene(
    `<rect x="112" y="56" width="176" height="54" rx="2"/>
     <path d="M134 56v54M156 56v54M178 56v54M200 56v54M222 56v54M244 56v54M266 56v54"/>
     <path d="M124 56v30h11v-30M146 56v30h11v-30M190 56v30h11v-30M212 56v30h11v-30M234 56v30h11v-30"/>
     <path d="M132 110v10M268 110v10M112 120h176"/>`,
    `<rect x="112" y="56" width="176" height="54" rx="2"/>`,
  ),
  "music-mic": scene(
    `<rect x="186" y="26" width="28" height="46" rx="14"/>
     <path d="M192 36h16M192 48h16M192 60h16"/>
     <path d="M200 72v34"/><path d="M176 112h48"/><path d="M200 112c14 8 26 6 32-4"/>`,
    `<rect x="186" y="26" width="28" height="46" rx="14"/>`,
  ),
};

mkdirSync(OUT, { recursive: true });
let count = 0;
for (const [name, svg] of Object.entries(SCENES)) {
  writeFileSync(resolve(OUT, `${name}.svg`), svg);
  count += 1;
}
process.stdout.write(`语义配图：写出 ${count} 张 SVG → assets/web-ready/scenes/\n`);
