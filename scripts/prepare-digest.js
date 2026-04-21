#!/usr/bin/env node

// ============================================================================
// Custom Digest — Prepare Script
// ============================================================================
// Fetches tweets from nitter RSS (no API key needed) and podcast episodes
// from user-defined RSS feeds. Outputs a single JSON blob for the agent to remix.
//
// Usage: node prepare-digest.js
// Output: JSON to stdout
// ============================================================================

import { readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const USER_DIR = join(homedir(), '.custom-digest');
const CONFIG_PATH = join(USER_DIR, 'config.json');

// Nitter instances to try in order (public, no API key needed)
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.cz',
  'https://nitter.poast.org',
  'https://nitter.lunar.icu',
];

// How many tweets to fetch per user
const TWEETS_PER_USER = 5;

// How many podcast episodes to fetch per feed
const EPISODES_PER_FEED = 1;

// -- Config ------------------------------------------------------------------

async function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return { xHandles: [], podcasts: [], language: 'bilingual', delivery: { method: 'stdout' } };
  }
  return JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
}

// -- XML Parsing (no dependencies) -------------------------------------------

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
}

function extractAllTags(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
  }
  return results;
}

function extractItems(xml) {
  const re = /<item>([\s\S]*?)<\/item>/gi;
  const items = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return items;
}

function parseDate(str) {
  try {
    return new Date(str).toISOString();
  } catch {
    return null;
  }
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// -- Fetch with timeout ------------------------------------------------------

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

// -- Fetch Tweets via Nitter RSS ---------------------------------------------

async function fetchTweetsForHandle(handle) {
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `${instance}/${handle}/rss`;
      const xml = await fetchWithTimeout(url, 8000);

      if (!xml.includes('<item>')) continue;

      // Extract channel-level bio from description
      const channelDesc = extractTag(xml, 'description');

      const items = extractItems(xml).slice(0, TWEETS_PER_USER);
      const tweets = items.map(item => {
        const title = stripHtml(extractTag(item, 'title'));
        const link = extractTag(item, 'link');
        const pubDate = parseDate(extractTag(item, 'pubDate'));
        const desc = stripHtml(extractTag(item, 'description'));

        // Nitter puts the tweet text in the description; title is often a truncation
        const text = desc.length > title.length ? desc : title;

        return {
          text: text.slice(0, 500),
          url: link,
          createdAt: pubDate,
        };
      }).filter(t => t.url && t.text);

      if (tweets.length === 0) continue;

      return {
        source: 'x',
        handle,
        name: handle, // will be enriched by the agent using bio
        bio: channelDesc.replace(/^RSS feed for .+? on nitter\./i, '').trim(),
        tweets,
        fetchedFrom: instance,
      };
    } catch {
      // Try next instance
    }
  }
  return null; // all instances failed
}

async function fetchAllTweets(handles) {
  const results = await Promise.allSettled(
    handles.map(h => fetchTweetsForHandle(h))
  );
  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

// -- Fetch Podcasts via RSS --------------------------------------------------

async function fetchPodcastEpisodes(podcast) {
  try {
    const xml = await fetchWithTimeout(podcast.rssUrl, 10000);
    const items = extractItems(xml).slice(0, EPISODES_PER_FEED);

    return items.map(item => {
      const title = stripHtml(extractTag(item, 'title'));
      const link = extractTag(item, 'link') || extractTag(item, 'enclosure url') || '';
      const pubDate = parseDate(extractTag(item, 'pubDate'));
      const description = stripHtml(extractTag(item, 'description') || extractTag(item, 'summary') || '');
      const duration = extractTag(item, 'itunes:duration') || '';

      // Try to get a good description (prefer content:encoded)
      const contentEncoded = extractTag(item, 'content:encoded');
      const summary = contentEncoded ? stripHtml(contentEncoded).slice(0, 3000) : description.slice(0, 3000);

      return {
        source: 'podcast',
        name: podcast.name,
        title,
        url: link,
        publishedAt: pubDate,
        duration,
        description: summary,
      };
    }).filter(e => e.title);
  } catch (e) {
    return [];
  }
}

async function fetchAllPodcasts(podcasts) {
  const results = await Promise.allSettled(
    podcasts.map(p => fetchPodcastEpisodes(p))
  );
  const episodes = [];
  for (const r of results) {
    if (r.status === 'fulfilled') episodes.push(...r.value);
  }
  return episodes;
}

// -- Main --------------------------------------------------------------------

async function main() {
  const config = await loadConfig();
  const handles = config.xHandles || [];
  const podcastFeeds = config.podcasts || [];

  if (handles.length === 0 && podcastFeeds.length === 0) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      error: 'No sources configured. Run onboarding to add Twitter handles and podcast feeds.',
    }));
    process.exit(1);
  }

  // Fetch in parallel
  const [xBuilders, podcastEpisodes] = await Promise.all([
    fetchAllTweets(handles),
    fetchAllPodcasts(podcastFeeds),
  ]);

  const errors = [];
  const fetchedHandles = new Set(xBuilders.map(b => b.handle));
  for (const h of handles) {
    if (!fetchedHandles.has(h)) {
      errors.push(`Could not fetch tweets for @${h} (all nitter instances failed)`);
    }
  }

  const output = {
    status: 'ok',
    generatedAt: new Date().toISOString(),
    config: {
      language: config.language || 'en',
      delivery: config.delivery || { method: 'stdout' },
    },
    x: xBuilders,
    podcasts: podcastEpisodes,
    stats: {
      xBuilders: xBuilders.length,
      totalTweets: xBuilders.reduce((n, b) => n + b.tweets.length, 0),
      podcastEpisodes: podcastEpisodes.length,
    },
    errors,
  };

  process.stdout.write(JSON.stringify(output, null, 2));
}

main().catch(e => {
  process.stdout.write(JSON.stringify({ status: 'error', error: e.message }));
  process.exit(1);
});
