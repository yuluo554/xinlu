# tests/e2e/ · v2 双端冒烟（占位目录）

本目录在 **v2-M1'** 落位 `smoke.mjs`：IAB 驱动 375/1280 两档、从开局到终局一键通关（同步 evaluate 连点、
暖帧丢弃，套路见 `plan/HANDOFF-M7.md` §五），入口 `npm run e2e`，纳入 v2 每棒公共出口门。

- 契约与验收：`plan/v2/03-模块清单与验收.md` §1；
- 口径（环境/纪律）：`plan/v2/02-数据与口径.md` §八；
- 本目录当前**无测试实物**——`npm test` 不扫描本目录（vitest 只匹配 `*.test.ts`），
  `npm run e2e` 脚本入口也随 v2-M1' 同提交加入 `package.json`，避免出现指向不存在文件的假入口。
