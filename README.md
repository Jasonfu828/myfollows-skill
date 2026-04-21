# custom-digest

A personalized AI digest skill for Claude Code — follow exactly who YOU want.

Unlike [follow-builders](https://github.com/zarazhangrui/follow-builders) which tracks a curated central list, **custom-digest lets you define your own KOL list** on X/Twitter and your own podcast RSS feeds.

## Features

- ✅ **Custom Twitter/X KOL list** — follow any handles you choose
- ✅ **Custom podcast RSS feeds** — subscribe to any podcast
- ✅ **No API key required** for content fetching (uses nitter RSS for tweets)
- ✅ **Bilingual output** — English, Chinese, or side-by-side
- ✅ **Telegram / Email / on-demand** delivery
- ✅ **Add/remove sources anytime** via natural language

## Installation

```bash
git clone https://github.com/jasonfu828/custom-digest.git ~/.claude/skills/custom-digest
cd ~/.claude/skills/custom-digest/scripts && npm install
```

## Usage

In Claude Code, just say:

- **"日报"** or **"generate my digest"** — get today's digest
- **"Add @sama to my list"** — add a Twitter handle
- **"Remove the No Priors podcast"** — remove a source
- **"Switch to weekly digests"** — change frequency
- **"Show my sources"** — see current KOL list

First run will guide you through setup (KOL list, podcasts, delivery method, language).

## How It Works

1. **Tweets**: fetched via [nitter](https://github.com/zedeus/nitter) public RSS instances — no Twitter API key needed
2. **Podcasts**: fetched via standard RSS feeds
3. **Remixing**: Claude reads the raw content and writes a digestible summary
4. **Delivery**: Telegram bot, email (via Resend), or terminal output

## Config

Stored at `~/.custom-digest/config.json`:

```json
{
  "language": "bilingual",
  "timezone": "Asia/Shanghai",
  "frequency": "daily",
  "deliveryTime": "09:00",
  "xHandles": ["sama", "karpathy", "levie"],
  "podcasts": [
    { "name": "No Priors", "rssUrl": "https://feeds.megaphone.fm/nopriors" }
  ],
  "delivery": {
    "method": "telegram",
    "chatId": "your_chat_id"
  }
}
```

API keys go in `~/.custom-digest/.env`:
```
TELEGRAM_BOT_TOKEN=your_token_here
```

## Inspired By

[follow-builders](https://github.com/zarazhangrui/follow-builders) by [@zarazhangrui](https://github.com/zarazhangrui) — the original AI builders digest skill.

## License

MIT
