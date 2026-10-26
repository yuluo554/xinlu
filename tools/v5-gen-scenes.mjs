#!/usr/bin/env node
// 语义配图 46 张自产 CC0 线稿（plan/v5/02 §九 D9 ▸ v5-M3'''' 落地形态）。
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

  // ── night 夜色：窗 / 灯 ──
  "night-window": scene(
    `<rect x="116" y="20" width="168" height="94" rx="2"/><path d="M200 20v94M116 68h168"/>
     <circle cx="164" cy="44" r="9"/><circle cx="240" cy="90" r="6"/><circle cx="176" cy="98" r="3"/>`,
    `<rect x="116" y="20" width="168" height="94" rx="2"/><circle cx="164" cy="44" r="9"/>`,
  ),
  "night-lamp": scene(
    `<path d="M200 122V56"/><path d="M166 56h68"/><path d="M166 56l-18 28h104l-18-28"/>
     <path d="M182 122h36"/><path d="M258 78l10 8M142 78l-10 8"/>`,
    `<path d="M166 56l-18 28h104l-18-28z"/>`,
  ),

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

  // ── meal 饭桌：桌 / 碗 ──
  "meal-table": scene(
    `<path d="M72 92h256v12H72z"/><path d="M96 104v18M304 104v18"/>
     <circle cx="132" cy="74" r="11"/><circle cx="186" cy="74" r="11"/><circle cx="240" cy="74" r="11"/><circle cx="292" cy="74" r="11"/>
     <path d="M200 92V62"/><path d="M186 62h28"/>`,
    `<path d="M72 92h256v12H72z"/><circle cx="132" cy="74" r="11"/><circle cx="186" cy="74" r="11"/><circle cx="240" cy="74" r="11"/><circle cx="292" cy="74" r="11"/>`,
  ),
  "meal-bowl": scene(
    `<path d="M124 74h152l-20 40H144z"/><path d="M136 74c0-16 14-24 30-24"/>
     <path d="M212 74c0-20 14-30 34-30"/><path d="M110 114h180"/><path d="M200 96v18"/>`,
    `<path d="M124 74h152l-20 40H144z"/>`,
  ),

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
};

mkdirSync(OUT, { recursive: true });
let count = 0;
for (const [name, svg] of Object.entries(SCENES)) {
  writeFileSync(resolve(OUT, `${name}.svg`), svg);
  count += 1;
}
process.stdout.write(`语义配图：写出 ${count} 张 SVG → assets/web-ready/scenes/\n`);
