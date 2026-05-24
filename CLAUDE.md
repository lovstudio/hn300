# CLAUDE.md

此项目是候鸟300 二零二六活动报名资料助手，技术栈为 Vite + React + TypeScript + Tailwind CSS v4。

## 工作约定

- 用户可见文案使用简体中文。
- 站点是报名流程工具，不是营销落地页；第一屏应保持可操作入口。
- 使用 Warm Academic 风格，UI 组件中优先使用语义化 Tailwind 类名，如 `bg-background`、`text-foreground`、`bg-primary`、`border-border`。
- 不改动上级目录里的原始招募稿和资料模板；如需给站点使用，复制到 `public/templates/`。
- 运行校验：`pnpm typecheck` 与 `pnpm build`。
