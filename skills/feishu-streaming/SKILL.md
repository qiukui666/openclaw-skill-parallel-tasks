---
name: feishu-streaming
title: 飞书流式卡片输出
description: 通过 Hermes Gateway 的 FeishuAdapter 创建和更新飞书流式卡片消息，实现逐字输出效果。AI agent 在处理需要流式输出的任务时，应使用本 skill 提供的工具按序调用。
version: 1.1.0
author: qiukui
category: messaging
tags:
  - feishu
  - streaming
  - streaming-card
  - 流式卡片
  - lark
activation:
  mode: event
  triggers:
    - 飞书流式卡片
    - streaming card
    - 逐字输出
    - 逐句输出
---

# 飞书流式卡片 Skill

## 功能

在飞书创建**流式卡片（Streaming Card）**，支持逐字/逐句实时更新卡片内容，让用户看到 AI 思考和输出的全过程。

## 何时使用

当 AI 需要流式输出（streaming）大量内容时（长回答、代码生成、文件分析等），使用本 skill：
- 先创建卡片，用户立即看到"正在思考..."
- 边生成边更新卡片，用户实时看到内容涌现
- 生成完毕，锁定卡片并展示 token 统计

## 工具名称与参数

### 1. `feishu_streaming_create` — 创建流式卡片

**时机**：开始处理请求时立即调用（生成任何内容之前）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chat_id` | string | ✅ | 飞书会话 ID（oc_xxx 群聊，ou_xxx 私聊） |
| `greeting` | string | ✅ | 卡片标题/问候语，如 `"主人，苏菲为您服务！"` |
| `subtitle` | string | ❌ | 副标题，如 `"正在思考您的问题，请稍候..."` |

**返回**：
```json
{
  "success": true,
  "card_id": "card_id_xxx",
  "message_id": "om_xxx",
  "sequence": 1
}
```
**重要**：保存返回的 `card_id` 和 `sequence`，后续 update 和 finalize 需要用到。

---

### 2. `feishu_streaming_update` — 更新卡片元素

**时机**：每次有新的内容块（chunk）产生时调用，逐段更新卡片内容。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `card_id` | string | ✅ | 第一步返回的 card_id |
| `element_key` | string | ✅ | 要更新的元素 ID（见下方常见元素） |
| `new_text` | string | ✅ | 要写入的新文本内容 |
| `sequence` | integer | ✅ | 当前序列号（首次传 `1`，后续用上一次返回的 `next_sequence`） |

**常见 `element_key` 值**：

| element_key | 用途 | 示例内容 |
|-------------|------|---------|
| `status_label` | 右上角状态徽章 | `"⏳ 执行中..."` |
| `thinking_content` | 思考/分析区域 | `"正在分析这个问题..."` |
| `response_content` | 主要回复正文（流式输出区） | `"首先..."` 不断累积追加 |
| `tools_label` | 工具调用计数 | `"🔧 工具调用 (3次)"` |
| `footer` | 底部 token 统计（通常 finalize 时才填） | — |

**返回**：
```json
{
  "success": true,
  "element_key": "response_content",
  "sequence": 1,
  "next_sequence": 2
}
```

> ⚠️ **sequence 必须递增**。每次 update 成功后，用返回的 `next_sequence` 作为下一次调用的 sequence 值。

---

### 3. `feishu_streaming_finalize` — 结束流式输出

**时机**：所有内容生成完毕后调用，锁定卡片并写入 token 统计。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chat_id` | string | ✅ | 同第一步的 chat_id |
| `model` | string | ✅ | 模型名称，如 `"MiniMax-M2.7"` |
| `elapsed` | number | ✅ | 总耗时（秒），如 `12.5` |
| `in_t` | integer | ✅ | 输入/上下文 token 数 |
| `out_t` | integer | ✅ | 输出 token 数 |
| `cache_t` | integer | ❌ | 缓存复用 token 数（无则填 `0`） |
| `ctx_used` | integer | ✅ | 使用的上下文 token 数 |
| `ctx_limit` | integer | ✅ | 上下文窗口上限 |

**返回**：
```json
{
  "success": true,
  "chat_id": "oc_xxx"
}
```

---

## 完整调用流程

```
1. feishu_streaming_create(chat_id, greeting, subtitle)
   → 保存 card_id, sequence

2. [内容开始产生]
   feishu_streaming_update(card_id, "thinking_content", "正在思考...", sequence=1)
   → 保存 next_sequence

3. [持续更新正文区域]
   feishu_streaming_update(card_id, "response_content", "首句内容...", sequence=2)
   → 保存 next_sequence
   
   feishu_streaming_update(card_id, "response_content", "首句内容...后续句...", sequence=3)
   ...（每次内容更新都用 response_content，序列递增）

4. [完成]
   feishu_streaming_finalize(chat_id, model, elapsed, in_t, out_t, cache_t, ctx_used, ctx_limit)
```

## 典型使用场景示例

### 场景：用户问了一个需要长回答的问题

```python
# Step 1: 立即创建卡片
create_result = feishu_streaming_create(
    chat_id="oc_123456789",
    greeting="主人，苏菲正在思考您的问题！",
    subtitle="正在分析中，请稍候..."
)

# Step 2: 通知用户正在分析
feishu_streaming_update(
    card_id=create_result["card_id"],
    element_key="thinking_content",
    new_text="🔍 正在搜索相关信息...",
    sequence=create_result["sequence"]
)

# Step 3: 逐步更新回复内容
feishu_streaming_update(
    card_id=create_result["card_id"],
    element_key="response_content",
    new_text="根据我的分析，",
    sequence=2
)

# Step 4: 继续追加内容（sequence 必须递增）
feishu_streaming_update(
    card_id=create_result["card_id"],
    element_key="response_content",
    new_text="根据我的分析，这个问题可以从以下几个方面...",
    sequence=3
)

# Step 5: 最终完成
feishu_streaming_finalize(
    chat_id="oc_123456789",
    model="MiniMax-M2.7",
    elapsed=8.3,
    in_t=1200,
    out_t=850,
    cache_t=200,
    ctx_used=1400,
    ctx_limit=10000
)
```

## 注意事项

1. **sequence 必须单调递增** — 每成功调用一次 update，下一次 sequence 必须用返回的 `next_sequence`。跳跃或重复会导致更新失败。
2. **一个 chat_id 对应一张卡片** — 不要在同一个 chat_id 里并发创建多张流式卡片。
3. **finalize 后不要继续 update** — finalize 后卡片锁定，继续更新会报错。
4. **chat_id 来源** — 从飞书消息事件的 `chat_id` 字段获取（格式为 `oc_xxx` 群聊或 `ou_xxx` 私聊）。
5. **错误处理** — 如果 `feishu_streaming_create` 失败（返回 error），降级为普通消息发送（`feishu_message` tool）。

## Hermes 环境

- Python venv: `~/.hermes/venv/bin/python`
- FeishuAdapter: `gateway.platforms.feishu`
- 工具文件: `tools/streaming_card_tool.py`
- 依赖: `lark_oapi` SDK（Hernes venv 内已安装）
