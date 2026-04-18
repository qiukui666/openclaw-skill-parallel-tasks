# 飞书卡片流式输出 Skill 制作

## 目标
制作 OpenClaw/Hermes Skill，让 agent 能创建和更新飞书流式卡片消息（逐字输出效果）

## 关键发现

### Hermes 已有的基础设施
- `FeishuAdapter.send_streaming_card(chat_id, greeting, subtitle)` — 创建流式卡片
- `FeishuAdapter._update_card_element(card_id, element_key, new_text, sequence, tenant_token)` — 更新卡片元素
- `FeishuAdapter.finalize_streaming_card()` — 标记完成
- 底层用 `lark_oapi` SDK，CardKit API

### 架构
- FeishuAdapter 已封装好了 `_build_streaming_card`、`send_streaming_card`、`_update_card_element`
- 需要暴露为 tool，供 agent 调用
- Skill 脚本用 `python -m gateway.platforms.feishu` 调用，或直接调用 Hermes API

## 任务线: feishu-streaming-skill

### nodes:

- done:
  - 确认 Hermes 流式卡片底层已存在（已确认）
  - 已了解 `send_streaming_card` 方法签名和调用方式

- implement-skill:
  - owner: claude-agent
  - goal: 实现 skill 文件
  - complete_condition: SKILL.md 完整，scripts 可用
  - next_on_done: test-skill

- test-skill:
  - owner: main
  - goal: 本地测试
  - complete_on_done: end

- end:
  - owner: main
  - goal: 通知用户
