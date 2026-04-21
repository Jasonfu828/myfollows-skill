#!/usr/bin/env node

// ============================================================================
// MyFollows — Prepare Script
// ============================================================================
// Fetches content from all configured platforms and outputs a JSON blob.
//
// Platforms:
//   - X/Twitter    : nitter RSS (no API key)
//   - YouTube      : YouTube native RSS (no API key, uses channel ID)
//   - WeChat (微信) : RSSHub RSS URL (user-provided)
//   - Xiaohongshu  : RSSHub RSS URL (built from user ID)
//
// Usage: node prepare-digest.js
// Output: JSON to stdout
// ============================================================================

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const USER_DIR = join(homedir(), '.myfollows');
const CONFIG_PATH = join(USER_DIR, 'config.json');

const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.cz',
  'https://nitter.poast.org',
  'https://nitter.lunar.icu',
];

const RSSHUB_BASE = 'https://rsshub.app';
const ITEMS_PER_SOURCE = 5;

// -- Config ------------------------------------------------------------------

async function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return { twitter: [], youtube: [], wechat: [], xiaohongshu: [], language: 'bilingual', delivery: { method: 'stdout' } };
  }
  return JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
}

// -- Fetch helpers -----------------------------------------------------------

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)' }
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// -- XML helpers -------------------------------------------------------------

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function extractItems(xml) {
  const re = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  const items = [];
  let m;
  while ((m = re.exec(xml)) !== null) items.push(m[1]);
  return items;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function parseDate(str) {
  try { return new Date(str).toISOString(); } catch { return null; }
}

// -- X / Twitter (nitter RSS) ------------------------------------------------

async function fetchTwitter(account) {
  for (const instance of NITTER_INSTANCES) {
    try {
      const xml = await fetchWithTimeout(`${instance}/${account.handle}/rss`, 8000);
      if (!xml.includes('<item>') && !xml.includes('<entry>')) continue;
      const channelDesc = extractTag(xml, 'description');
      const items = extractItems(xml).slice(0, ITEMS_PER_SOURCE);
      const tweets = items.map(item => {
        const title = stripHtml(extractTag(item, 'title'));
        const link = extractTag(item, 'link');
        const desc = stripHtml(extractTag(item, 'description'));
        return {
          text: (desc.length > title.length ? desc : title).slice(0, 500),
          url: link,
          createdAt: parseDate(extractTag(item, 'pubDate')),
        };
      }).filter(t => t.url && t.text);
      if (tweets.length === 0) continue;
      return {
        platform: 'twitter',
        handle: account.handle,
        name: account.name || account.handle,
        bio: channelDesc.replace(/^RSS feed for .+? on nitter\./i, '').trim(),
        tweets,
      };
    } catch { /* try next instance */ }
  }
  return null;
}

// -- YouTube (native RSS, no API key) ----------------------------------------

async function fetchYouTube(channel) {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
    const xml = await fetchWithTimeout(url, 10000);
    const items = extractItems(xml).slice(0, ITEMS_PER_SOURCE);
    const videos = items.map(item => {
      const title = stripHtml(extractTag(item, 'title'));
      let link = extractAttr(item, 'link', 'href');
      if (!link) link = extractTag(item, 'link');
      const published = parseDate(extractTag(item, 'published') || extractTag(item, 'pubDate'));
      const description = stripHtml(
        extractTag(item, 'media:description') || extractTag(item, 'summary') || extractTag(item, 'description')
      ).slice(0, 2000);
      return { title, url: link, publishedAt: published, description };
    }).filter(v => v.title && v.url);
    return { platform: 'youtube', name: channel.name, channelId: channel.channelId, videos };
  } catch {
    return null;
  }
}

// -- WeChat (via RSSHub) -----------------------------------------------------

async function fetchWeChat(account) {
  try {
    const xml = await fetchWithTimeout(account.rssUrl, 12000);
    const items = extractItems(xml).slice(0, ITEMS_PER_SOURCE);
    const articles = items.map(item => {
      const title = stripHtml(extractTag(item, 'title'));
      const link = extractTag(item, 'link');
      const published = parseDate(extractTag(item, 'pubDate') || extractTag(item, 'published'));
      const content = stripHtml(
        extractTag(item, 'content:encoded') || extractTag(item, 'description') || extractTag(item, 'summary')
      ).slice(0, 3000);
      return { title, url: link, publishedAt: published, content };
    }).filter(a => a.title);
    return { platform: 'wechat', name: account.name, articles };
  } catch {
    return null;
  }
}

// -- Xiaohongshu (via RSSHub) ------------------------------------------------

async function fetchXiaohongshu(creator) {
  try {
    const rssUrl = creator.rssUrl || `${RSSHUB_BASE}/xiaohongshu/user/${creator.userId}`;
    const xml = await fetchWithTimeout(rssUrl, 12000);
    const items = extractItems(xml).slice(0, ITEMS_PER_SOURCE);
    const posts = items.map(item => {
      const title = stripHtml(extractTag(item, 'title'));
      const link = extractTag(item, 'link');
      const published = parseDate(extractTag(item, 'pubDate') || extractTag(item, 'published'));
      const content = stripHtml(
        extractTag(item, 'description') || extractTag(item, 'summary')
      ).slice(0, 1000);
      return { title, url: link, publishedAt: published, content };
    }).filter(p => p.title);
    return { platform: 'xiaohongshu', name: creator.name, posts };
  } catch {
    return null;
  }
}

// -- Main --------------------------------------------------------------------

async function main() {
  const config = await loadConfig();
  const errors = [];

  const [twitterResults, youtubeResults, wechatResults, xhsResults] = await Promise.all([
    Promise.allSettled((config.twitter || []).map(a => fetchTwitter(a))),
    Promise.allSettled((config.youtube || []).map(c => fetchYouTube(c))),
    Promise.allSettled((config.wechat || []).map(a => fetchWeChat(a))),
    Promise.allSettled((config.xiaohongshu || []).map(c => fetchXiaohongshu(c))),
  ]);

  const twitter = twitterResults.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
  const youtube = youtubeResults.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
  const wechat = wechatResults.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
  const xiaohongshu = xhsResults.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);

  const fetchedTwitter = new Set(twitter.map(a => a.handle));
  for (const a of (config.twitter || [])) {
    if (!fetchedTwitter.has(a.handle)) errors.push(`Twitter @${a.handle}: all nitter instances failed`);
  }
  youtubeResults.forEach((r, i) => {
    if (!r.value) errors.push(`YouTube ${(config.youtube || [])[i]?.name}: fetch failed`);
  });
  wechatResults.forEach((r, i) => {
    if (!r.value) errors.push(`WeChat ${(config.wechat || [])[i]?.name}: fetch failed`);
  });
  xhsResults.forEach((r, i) => {
    if (!r.value) errors.push(`Xiaohongshu ${(config.xiaohongshu || [])[i]?.name}: fetch failed`);
  });

  const output = {
    status: 'ok',
    generatedAt: new Date().toISOString(),
    config: {
      language: config.language || 'en',
      delivery: config.delivery || { method: 'stdout' },
    },
    twitter,
    youtube,
    wechat,
    xiaohongshu,
    stats: {
      twitter: twitter.length,
      youtube: youtube.reduce((n, c) => n + c.videos.length, 0),
      wechat: wechat.reduce((n, a) => n + a.articles.length, 0),
      xiaohongshu: xiaohongshu.reduce((n, c) => n + c.posts.length, 0),
    },
    errors,
  };

  process.stdout.write(JSON.stringify(output, null, 2));
}

main().catch(e => {
  process.stdout.write(JSON.stringify({ status: 'error', error: e.message }));
  process.exit(1);
});
