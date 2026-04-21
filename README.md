# myfollows-skill

A personalized multi-platform digest skill for Claude Code — follow exactly who YOU want, across the platforms YOU care about.

## Supported Platforms

| Platform | Source | API Key? |
|---|---|---|
| 𝕏 X / Twitter | nitter RSS | ❌ None needed |
| ▶️ YouTube | YouTube native RSS | ❌ None needed |
| 💬 WeChat 微信公众号 | RSSHub | ❌ Uses public instance |
| 📖 Xiaohongshu 小红书 | RSSHub | ❌ Uses public instance |

## Features

- ✅ **100% user-defined follow list** — no central curated list
- ✅ **4 platforms** — Twitter, YouTube, WeChat, Xiaohongshu
- ✅ **No API keys** for content fetching
- ✅ **Bilingual output** — English, Chinese, or interleaved
- ✅ **Telegram / Email / on-demand** delivery
- ✅ **Add/remove sources anytime** via natural language

## Installation

```bash
git clone https://github.com/Jasonfu828/myfollows-skill.git ~/.claude/skills/myfollows-skill
cd ~/.claude/skills/myfollows-skill/scripts && npm install --ignore-scripts
```

## Usage

In Claude Code, just say:

- **"日报"** or **"generate my digest"** — get today's digest
- **"Add @sama on Twitter"** — add a Twitter account
- **"Add YouTube channel Andrej Karpathy, channel ID UCbmNph6atAoGfqLoCL_duAg"**
- **"Add WeChat account 机器之心 RSS https://rsshub.app/wechat/mp/article/almosthuman2014"**
- **"Add Xiaohongshu user ID 5e0234560000000001003c65"**
- **"Remove @levie from my list"**
- **"Show who I'm following"**

First run will guide you through full setup.

## Config

Stored at `~/.myfollows/config.json`:

```json
{
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
    { "name": "Creator Name", "userId": "5e0234560000000001003c65" }
  ],
  "delivery": {
    "method": "telegram",
    "chatId": "your_chat_id"
  }
}
```

Secrets at `~/.myfollows/.env`:
```
TELEGRAM_BOT_TOKEN=your_token_here
```

## How to Find IDs

**YouTube Channel ID:**
1. Go to the channel page
2. View page source → search for `"channelId"`
3. Or use: https://commentpicker.com/youtube-channel-id.php

**WeChat Account RSS (via RSSHub):**
1. Find the WeChat ID (微信号) on the account's profile
2. URL: `https://rsshub.app/wechat/mp/article/{wechat_id}`
3. Or search on Sogou: https://weixin.sogou.com

**Xiaohongshu User ID:**
1. Go to profile on https://www.xiaohongshu.com
2. User ID is in the URL: `xiaohongshu.com/user/profile/{userId}`

## Note on RSSHub

Public RSSHub (`rsshub.app`) may have rate limits or occasional downtime.
For reliable heavy usage, self-host: https://docs.rsshub.app/deploy/

## Inspired By

[follow-builders](https://github.com/zarazhangrui/follow-builders) by [@zarazhangrui](https://github.com/zarazhangrui)

## License

MIT
