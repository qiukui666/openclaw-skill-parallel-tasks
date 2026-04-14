# 🦞 OpenClaw Parallel Tasks Skill

<div align="center">

**让 AI 同时处理多个任务，速度快 3-10 倍**

⏱️ 超时保护 · 🛡️ 错误隔离 · 📊 实时进度

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-blue.svg)](https://github.com/openclaw/openclaw)

</div>

---

## 🎯 这个 Skill 解决什么问题？

**场景：你让 AI 同时调研 10 个竞品**

❌ **普通方式**：一个一个查，查完第一个再查第二个，超级慢
✅ **用这个 Skill**：同时启动 10 个子任务一起查，快 10 倍

**典型使用场景：**
- 📡 同时抓取多个网站内容（比串行快 5-10 倍）
- 🔍 同时搜索多个平台
- 📊 同时分析多个文件
- 🧪 同时测试多个接口

---

## ⚡ 性能对比

```
串行（Before）：
任务1 → 任务2 → 任务3    总耗时：15 分钟

并行（After）：
任务1 ─┬─> 总耗时：5 分钟 ⚡
任务2 ─┼─> 提升 200%！
任务3 ─┘
```

---

## 🚀 快速开始

### 安装

```bash
# 方式1：openclaw CLI 安装（推荐）
openclaw skills install https://github.com/qiukui666/openclaw-skill-parallel-tasks/archive/refs/tags/v1.0.0.tar.gz

# 方式2：手动安装
cp -r parallel-tasks ~/.openclaw/workspace/skills/
```

### 使用

```
/parallel
- 搜索竞品A的信息
- 搜索竞品B的信息
- 搜索竞品C的信息
```

### 效果

```
🚀 正在并行执行 3 个任务...

✅ [1/3] 竞品A调研 完成 (23s)
✅ [2/3] 竞品B调研 完成 (31s)
✅ [3/3] 竞品C调研 完成 (18s)

⏱️ 总耗时：31 秒（串行需要约 72 秒）
```

---

## 📖 详细用法

### 输入格式

#### 1. 列表格式（推荐）

```
/parallel
- 任务1描述
- 任务2描述
- 任务3描述
```

#### 2. 命名任务（便于追踪）

```
/parallel
[后端] 实现用户认证API
[前端] 构建登录表单组件
[测试] 编写集成测试用例
```

#### 3. 自定义超时

```
/parallel timeout=600
- [调研] 研究AI Agent行业趋势 (timeout=300)
- [实现] 开发完整功能 (timeout=600)
- [测试] 全面测试 (timeout=900)
```

---

## 🔧 工作原理

```
你：帮我同时调研10个竞品
         │
         ▼
┌─────────────────────────────────────────┐
│        Parallel Tasks Skill              │
│                                         │
│  同时启动 N 个子任务（默认最多5个）       │
│                                         │
│  ┌───────┐ ┌───────┐ ┌───────┐         │
│  │任务1  │ │任务2  │ │任务3  │ ...     │
│  │(子代理)│ │(子代理)│ │(子代理)│         │
│  └───────┘ └───────┘ └───────┘         │
│         │         │         │           │
│         └─────────┼─────────┘           │
│                   ▼                     │
│         汇总结果，返回给你               │
└─────────────────────────────────────────┘
```

---

## 🎯 适用场景

| ✅ 适合 | ❌ 不适合 |
|---------|----------|
| 同时搜索多个平台 | 任务之间有依赖（任务2需要任务1的结果） |
| 同时抓取多个网页 | 超快速任务（子代理启动开销不值得） |
| 同时分析多个文件 | 需要共享状态的任务 |
| 同时测试多个接口 | |

---

## ⚙️ 配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `timeout` | 300秒 | 每个任务超时时间 |
| `maxConcurrent` | 5 | 最大并发数 |
| `stopOnError` | false | 一个失败是否全部停止 |

---

## 📦 发布说明

当前版本：**v1.0.0**

包含：
- `SKILL.md` - Skill 元数据定义
- `scripts/executor.ts` - 并行执行器
- `README.md` - 本文档

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

MIT License

---

## 👤 作者

**qiukui666** - [GitHub](https://github.com/qiukui666)

---

<div align="center">
如果你觉得这个 Skill 有用，给个 ⭐ 吧！
</div>
