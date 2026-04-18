# MEMORY.md - Long-term Memory

_Last updated: 2026-04-18 (after daily retro)_

## 用户基本信息

- **时区**: Asia/Shanghai (UTC+8)
- **主要沟通渠道**: 微信（WeChat），所有对话通过微信收发
- **开发环境**: WSL2 (Windows)，不是纯服务器环境
- **用户特点**: 技术背景强，喜欢实验新工具，结果导向但有耐心，容忍度中等

## 技术栈 & 工具

### AI Agent 工具链
- **OpenClaw**: 主 Agent（当前对话），模型 MiniMax-M2.7（主）、M2.5（备用）
- **Claude Code**: 备用 Coding Agent，已安装 173 个 CCB agents（`~/.claude/plugins/marketplaces/thedotmack/site/agents/`）
- **Gemini CLI**: 安装失败（403 PERMISSION_DENIED，账号可能无 Code Assist 权限）
- **微信小露**: 另一套 OpenClaw 实例，web_fetch 走不通微信文章

### 关键路径
- OpenClaw 配置: `/home/qiukui/.openclaw/`
- Hermes Agent: `/home/qiukui/hermes-agent/`
- Workspace: `/home/qiukui/.openclaw/workspace/`
- Workspace skills: `/home/qiukui/.openclaw/workspace/skills/`

### 浏览器 & 自动化
- **WSL Playwright**: `~/.cache/ms-playwright/chromium-1217/`，npm install 安装，headless 模式可用
- **Windows Chrome**: 有微信登录态，会被微信反爬拦
- **Chrome CDP MCP**: 尝试接入 OpenClaw MCP client（进行中）

### 飞书集成
- Hermes 的 `FeishuAdapter` 已实现 `send_streaming_card` / `_update_card_element` / `finalize_streaming_card`
- 流式卡片底层用 `lark_oapi` SDK 的 CardKit API
- skill 框架: `feishu-streaming`（`/home/qiukui/.openclaw/workspace/skills/feishu-streaming/SKILL.md`）

## 重要结论（Know-How）

### 微信文章读取 ✅
- **正确方式**: 用"分享链接"方式（mp.weixin.qq.com/s/xxx?sharer_shareinfo=...），OpenClaw Playwright 干净 UA 可直接读取
- **错误方式**: 直接分享文章会带微信登录态，触发 wappoc_appmsgcaptcha 验证码，无法自动绕过
- **微信小露**: web_fetch 走不通，需要调用 Playwright

### Gemini CLI ❌
- 认证成功（Google OAuth）但 API 403 PERMISSION_DENIED
- 可能原因：无 Code Assist 权限 / 地区限制
- **结论**: 目前不可用，安装前需先验证账号权限

### exec SIGKILL 问题 ⚠️
- WSL 环境下 exec 进程会被 SIGKILL 批量杀掉
- 触发场景：长时间 node 脚本、headed 模式 Playwright、npm install
- **缓解**: 任务加 timeout、headless 优先、及时回收进程

### Claude Code Agency Agents 派发协议
- 主 agent 判断任务领域 → 派给 Claude Code + 对应 agent
- 子 agent 回报格式：tag + line + goal_status + next_role + 5字段报告
- 派发命令：`openclaw sessions spawn --name <agent> --runtime ccoder -- <agent-name> [任务描述]`

## 待完成任务

- [ ] Chrome CDP MCP server 接入 OpenClaw（子 agent 正在处理）
- [ ] feishu-streaming-skill 完成实现（子 agent 正在处理）
- [ ] SIGKILL 根因排查（WSL 资源/cgroup 设置）
- [ ] 系统健康检查自动化脚本

## 教训 & 改进

1. **异步任务失败必须主动上报**：不要等用户来问，后台任务失败时应主动发消息通知
2. **外部工具安装前先验证可行性**：Gemini CLI 案例教训，先验证账号权限再安装
3. **微信验证码不尝试自动化**：明确告知用户无法自动绕过，避免浪费双方时间
4. **复杂任务分阶段确认**：每步完成后及时报告，不要最后才发现失败
5. **系统健康检查应自动化**：建立一键诊断脚本（npm 包完整性、exec 状态、Playwright 可用性、MCP 连接）
