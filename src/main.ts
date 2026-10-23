import "./style.css";

// M0 骨架占位页：仅验证挂载点连通。四屏（开局 / 卡片流 / 阶段小结 / 终局报告）在 M3 落地。
const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.innerHTML = `
    <main class="shell">
      <h1>心路</h1>
      <p class="muted">仓库骨架已就绪——游戏四屏将在 M3 落地，开发计划见 plan/ 目录。</p>
    </main>
  `;
}
