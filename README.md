# myfollows-skill

**English** | [中文](#中文说明)

A personalized multi-platform digest skill for [Claude Code](https://claude.ai/code) — follow exactly who YOU want, across the platforms YOU care about. No central curated list. No API keys required for content fetching.

> Inspired by [follow-builders](https://github.com/zarazhangrui/follow-builders) by [@zarazhangrui](https://github.com/zarazhangrui), extended to support custom KOL lists and multiple platforms.

---

## Supported Platforms

| Platform | Fetch Method | API Key Required |
|---|---|---|
| 𝕏 X / Twitter | [nitter](https://github.com/zedeus/nitter) RSS | None |
| ▶️ YouTube | YouTube native RSS feed | None |
| 💬 WeChat Official Accounts 微信公众号 | [RSSHub](https://rsshub.app) | None (public instance) |
| 📖 Xiaohongshu 小红书 | [RSSHub](https://rsshub.app) | None (public instance) |

---

## Features

- **100% user-defined** — you decide who to follow, no preset list
- **4 platforms** — Twitter/X, YouTube, WeChat Official Accounts, Xiaohongshu
- **No API keys needed** for any content fetching
- **Bilingual output** — English only, Chinese only, or English + Chinese interleaved paragraph by paragraph
- **Flexible delivery** — Telegram bot, Email (via Resend), or on-demand in terminal
- **Natural language control** — add/remove sources, change schedule, switch language, all via conversation

---

## Requirements

- [Claude Code](https://claude.ai/code) CLI installed
- [Node.js](https://nodejs.org) 18+
- Internet access (proxy recommended in regions where Twitter/YouTube are restricted)

---

## Installation

```bash
git clone https://github.com/Jasonfu828/myfollows-skill.git ~/.claude/skills/myfollows-skill
cd ~/.claude/skills/myfollows-skill/scripts && npm install --ignore-scripts
```

---

## Quick Start

Open Claude Code and say any of the following to begin:

```
日报
generate my digest
set up my digest
```

The first run will walk you through onboarding: choosing which accounts to follow, delivery time, language, and delivery method.

---

## Usage Examples

### Managing your follow list

```
Add @sama on Twitter
Add YouTube channel Andrej Karpathy, channel ID UCbmNph6atAoGfqLoCL_duAg
Add WeChat account 机器之心, RSS URL https://rsshub.app/wechat/mp/article/almosthuman2014
Add Xiaohongshu user ID 5e0234560000000001003c65
Remove @levie from my Twitter list
Show who I'm following
```

### Getting your digest

```
日报
generate my digest
what's new today
```

### Changing settings

```
Switch to weekly digest
Change delivery time to 8am
Switch to Chinese only
Switch to bilingual
```

---

## Configuration

All settings are stored at `~/.myfollows/config.json`:

```json
{
  "platform": "other",
  "language": "bilingual",
  "timezone": "Asia/Shanghai",
  "frequency": "daily",
  "deliveryTime": "09:00",
  "twitter": [
    { "handle": "sama", "name": "Sam Altman" },
    { "handle": "karpathy", "name": "Andrej Karpathy" }
  ],
  "youtube": [
    { "name": "Andrej Karpathy", "channelId": "UCbmNph6atAoGfqLoCL_duAg" }
  ],
  "wechat": [
    { "name": "机器之心", "rssUrl": "https://rsshub.app/wechat/mp/article/almosthuman2014" }
  ],
  "xiaohongshu": [
    { "name": "Creator Name", "userId": "5e0234560000000001003c65" }
  ],
  "delivery": {
    "method": "telegram",
    "chatId": "123456789"
  },
  "onboardingComplete": true
}
```

API keys and secrets go in `~/.myfollows/.env` (never committed to git):

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
# RESEND_API_KEY=your_resend_key_here
```

---

## How to Find IDs

### YouTube Channel ID

1. Go to the channel's page on YouTube
2. View page source (Cmd+U / Ctrl+U) and search for `"channelId"`
3. Or use a tool: https://commentpicker.com/youtube-channel-id.php
4. Channels with a handle (`@name`) can also use the handle directly in the URL

### WeChat Official Account RSS (via RSSHub)

1. Find the account's WeChat ID (微信号) — shown on their profile page
2. Construct the RSS URL: `https://rsshub.app/wechat/mp/article/{wechat_id}`
3. Alternative: search the account on Sogou WeChat search (https://weixin.sogou.com), the account ID appears in the URL

### Xiaohongshu User ID

1. Open the creator's profile on the Xiaohongshu web app: https://www.xiaohongshu.com
2. The user ID is in the URL path: `xiaohongshu.com/user/profile/{userId}`
3. Copy the alphanumeric string after `/profile/`

---

## Delivery Setup

### Telegram (Recommended)

1. Open Telegram, search for **@BotFather**
2. Send `/newbot` and follow the steps to create a bot
3. Copy the bot token (format: `123456789:AAH...`)
4. Search for your new bot by username and send it any message (e.g. `hi`)
5. Get your chat ID:
   ```bash
   curl -s "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates" | \
     python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['message']['chat']['id'])"
   ```
6. Save token to `~/.myfollows/.env` and tell Claude your chat ID

### Email (via Resend)

1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Create an API key in the dashboard
3. Save it to `~/.myfollows/.env` as `RESEND_API_KEY=...`

### On-demand (No setup)

Just ask for your digest anytime in Claude Code — no scheduled delivery, no configuration needed.

---

## Automatic Scheduling (Optional)

To receive your digest automatically at a set time, add a cron job (requires Telegram or Email delivery):

```bash
SKILL_DIR="$HOME/.claude/skills/myfollows-skill"
(crontab -l 2>/dev/null; echo "0 9 * * * cd $SKILL_DIR/scripts && node prepare-digest.js 2>/dev/null | node deliver.js 2>/dev/null") | crontab -
```

---

## Note on RSSHub

WeChat and Xiaohongshu content is fetched via [RSSHub](https://github.com/DIYgod/RSSHub), an open-source RSS aggregator.

The public instance (`rsshub.app`) is free but may have rate limits or occasional downtime. For reliable heavy usage, self-host your own instance:

```bash
docker run -d --name rsshub -p 1200:1200 diygod/rsshub
```

Full deployment guide: https://docs.rsshub.app/deploy/

Once self-hosted, update your RSS URLs to use your own instance (e.g. `http://localhost:1200/...`).

---

## License

MIT

---

---

## 中文说明

**[English](#myfollows-skill)** | 中文

一个基于 [Claude Code](https://claude.ai/code) 的个性化多平台日报 skill。完全自定义你想关注的人，支持 X/Twitter、YouTube、微信公众号和小红书，无需任何内容抓取 API key。

> 灵感来自 [@zarazhangrui](https://github.com/zarazhangrui) 的 [follow-builders](https://github.com/zarazhangrui/follow-builders)，在此基础上扩展支持自定义 KOL 列表和多平台。

---

## 支持平台

| 平台 | 抓取方式 | 是否需要 API Key |
|---|---|---|
| 𝕏 X / Twitter | [nitter](https://github.com/zedeus/nitter) RSS | 不需要 |
| ▶️ YouTube | YouTube 原生 RSS | 不需要 |
| 💬 微信公众号 | [RSSHub](https://rsshub.app) | 不需要（用公共实例） |
| 📖 小红书 | [RSSHub](https://rsshub.app) | 不需要（用公共实例） |

---

## 功能特点

- **100% 自定义** — 你决定关注谁，没有预设列表
- **4 个平台** — Twitter/X、YouTube、微信公众号、小红书
- **内容抓取无需 API key**
- **多语言输出** — 纯英文、纯中文，或中英逐段对照双语
- **灵活推送** — Telegram bot、邮件（Resend），或在终端按需获取
- **自然语言操控** — 添加/删除关注、修改时间、切换语言，直接对话即可

---

## 安装

```bash
git clone https://github.com/Jasonfu828/myfollows-skill.git ~/.claude/skills/myfollows-skill
cd ~/.claude/skills/myfollows-skill/scripts && npm install --ignore-scripts
```

---

## 快速开始

打开 Claude Code，说任意一句即可开始：

```
日报
生成日报
帮我设置日报
```

首次运行会引导你完成设置：选择关注对象、推送时间、语言偏好和推送方式。

---

## 使用示例

### 管理关注列表

```
Add @sama on Twitter
关注 YouTube 频道 Andrej Karpathy，channel ID 是 UCbmNph6atAoGfqLoCL_duAg
添加微信公众号 机器之心，RSS 地址 https://rsshub.app/wechat/mp/article/almosthuman2014
添加小红书用户 ID 5e0234560000000001003c65
取消关注 @levie
我在关注哪些人
```

### 获取日报

```
日报
生成今天的日报
今天有什么新内容
```

### 修改设置

```
改成每周推送
推送时间改到早上 8 点
改成纯中文
改成双语模式
```

---

## 配置文件

配置保存在 `~/.myfollows/config.json`：

```json
{
  "platform": "other",
  "language": "bilingual",
  "timezone": "Asia/Shanghai",
  "frequency": "daily",
  "deliveryTime": "09:00",
  "twitter": [
    { "handle": "sama", "name": "Sam Altman" }
  ],
  "youtube": [
    { "name": "Andrej Karpathy", "channelId": "UCbmNph6atAoGfqLoCL_duAg" }
  ],
  "wechat": [
    { "name": "机器之心", "rssUrl": "https://rsshub.app/wechat/mp/article/almosthuman2014" }
  ],
  "xiaohongshu": [
    { "name": "博主名字", "userId": "5e0234560000000001003c65" }
  ],
  "delivery": {
    "method": "telegram",
    "chatId": "123456789"
  },
  "onboardingComplete": true
}
```

API key 和敏感信息保存在 `~/.myfollows/.env`（不会提交到 git）：

```
TELEGRAM_BOT_TOKEN=你的_bot_token
# RESEND_API_KEY=你的_resend_key
```

---

## 如何获取各平台 ID

### YouTube Channel ID

1. 打开频道主页
2. 查看网页源代码（Cmd+U），搜索 `"channelId"`
3. 或使用工具：https://commentpicker.com/youtube-channel-id.php

### 微信公众号 RSS（通过 RSSHub）

1. 在公众号主页找到微信号（微信号不是公众号名称）
2. 拼接 RSS 地址：`https://rsshub.app/wechat/mp/article/{微信号}`
3. 也可以通过搜狗微信搜索找到微信号：https://weixin.sogou.com

### 小红书用户 ID

1. 打开小红书网页版：https://www.xiaohongshu.com
2. 进入博主主页，URL 中的路径即为用户 ID：`xiaohongshu.com/user/profile/{userId}`
3. 复制 `/profile/` 后面的字符串

---

## 推送方式设置

### Telegram（推荐）

1. 打开 Telegram，搜索 **@BotFather**
2. 发送 `/newbot`，按提示创建 bot
3. 复制 token（格式：`123456789:AAH...`）
4. 搜索你的 bot 用户名，给它发任意消息（如 `hi`）
5. 获取 chat ID：
   ```bash
   curl -s "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates" | \
     python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['message']['chat']['id'])"
   ```
6. 将 token 保存到 `~/.myfollows/.env`，告诉 Claude 你的 chat ID

### 邮件（通过 Resend）

1. 在 https://resend.com 注册（免费版每天 100 封）
2. 在控制台创建 API key
3. 保存到 `~/.myfollows/.env`：`RESEND_API_KEY=...`

### 按需获取（无需配置）

在 Claude Code 里随时说"日报"，无需定时推送配置。

---

## 定时自动推送（可选）

如果已配置 Telegram 或邮件，可以添加定时任务实现每日自动推送：

```bash
SKILL_DIR="$HOME/.claude/skills/myfollows-skill"
(crontab -l 2>/dev/null; echo "0 9 * * * cd $SKILL_DIR/scripts && node prepare-digest.js 2>/dev/null | node deliver.js 2>/dev/null") | crontab -
```

---

## RSSHub 说明

微信公众号和小红书内容通过 [RSSHub](https://github.com/DIYgod/RSSHub) 获取。

公共实例（`rsshub.app`）免费，但有频率限制，偶尔可能不稳定。如需稳定使用，建议自部署：

```bash
docker run -d --name rsshub -p 1200:1200 diygod/rsshub
```

完整部署文档：https://docs.rsshub.app/deploy/

自部署后，把配置中的 RSS 地址改为你自己的实例地址（如 `http://localhost:1200/...`）。

---

## 致谢

感谢 [@zarazhangrui](https://github.com/zarazhangrui) 的 [follow-builders](https://github.com/zarazhangrui/follow-builders) 提供灵感和参考实现。

---

## 开源协议

MIT

---

---

## Changelog / 更新记录

### v1.1.0 — 2026-04-21

**Added / 新增**
- YouTube channel support via native RSS feed (no API key) / 支持 YouTube 频道，使用原生 RSS 无需 API key
- WeChat Official Account support via RSSHub / 支持微信公众号（通过 RSSHub）
- Xiaohongshu (小红书) support via RSSHub / 支持小红书（通过 RSSHub）
- Bilingual README (English + Chinese) / README 新增中文说明
- Detailed ID lookup guide for each platform / 各平台 ID 获取指南

**Changed / 变更**
- Renamed from `custom-digest` to `myfollows-skill` / 从 `custom-digest` 重命名为 `myfollows-skill`
- Config directory changed from `~/.custom-digest/` to `~/.myfollows/` / 配置目录从 `~/.custom-digest/` 改为 `~/.myfollows/`
- `prepare-digest.js` rewritten to support all 4 platforms in parallel / `prepare-digest.js` 重写，支持 4 个平台并发抓取

---

### v1.0.0 — 2026-04-21

**Initial release / 首次发布**
- X/Twitter support via nitter RSS (no API key) / 支持 X/Twitter，通过 nitter RSS 抓取，无需 API key
- Custom KOL list — user-defined, not preset / 自定义 KOL 列表，完全由用户决定
- Telegram / Email / on-demand delivery / 支持 Telegram、邮件、按需三种推送方式
- English / Chinese / Bilingual output / 支持英文、中文、双语三种输出模式
- Inspired by follow-builders by @zarazhangrui / 灵感来自 @zarazhangrui 的 follow-builders
