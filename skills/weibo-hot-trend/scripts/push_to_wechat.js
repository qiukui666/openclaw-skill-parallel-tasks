#!/usr/bin/env node
/**
 * 微博热搜推送到微信
 * 用法: node push_to_wechat.js [条数]
 * 默认10条
 */

const count = parseInt(process.argv[2]) || 10;

async function main() {
  // 获取热搜数据（调用同目录下的 weibo.js）
  const { execSync } = require('child_process');
  
  console.log(`正在获取微博热搜 TOP ${count}...`);
  
  let raw;
  try {
    raw = execSync(`node ${__dirname}/weibo.js ${count}`, { 
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024
    });
  } catch (e) {
    console.error('获取热搜失败:', e.message);
    process.exit(1);
  }

  // 解析输出，提取标题和链接
  const lines = raw.split('\n');
  const items = [];
  let currentItem = null;

  for (const line of lines) {
    const numMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (numMatch) {
      if (currentItem) items.push(currentItem);
      currentItem = { num: numMatch[1], title: numMatch[2], url: '' };
      continue;
    }
    const heatMatch = line.match(/热度:\s*(\S+)/);
    if (heatMatch && currentItem) {
      currentItem.heat = heatMatch[1];
      continue;
    }
    const linkMatch = line.match(/https?:\/\/s\.weibo\.com[^\s]+/);
    if (linkMatch && currentItem) {
      currentItem.url = linkMatch[0];
    }
  }
  if (currentItem) items.push(currentItem);

  if (items.length === 0) {
    console.error('未解析到热搜数据');
    process.exit(1);
  }

  // 格式化推送文本
  const date = new Date().toLocaleDateString('zh-CN');
  let msg = `📮 微博热搜 TOP ${items.length} | ${date}\n\n`;
  
  for (const item of items) {
    const num = item.num.padStart(2, ' ');
    msg += `${num}. ${item.title}`;
    if (item.heat) msg += `\n    🔥 ${item.heat}`;
    msg += '\n\n';
  }

  msg += `—— 以上来自微博热搜`;

  console.log(msg);

  // 输出 JSON 格式，方便调用方解析
  console.log('\n---RAW_JSON---');
  console.log(JSON.stringify({ items, msg, count: items.length }));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
