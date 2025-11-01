import axios, { AxiosRequestConfig } from 'axios';
import { config } from './config.js';

export async function fetchWithRetry(
  url: string,
  options: AxiosRequestConfig = {},
  retries = config.retryAttempts
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        ...options,
        timeout: config.timeout,
        headers: {
          'User-Agent': config.userAgent,
          ...options.headers
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      if (i === retries - 1) throw error;
      await sleep(config.requestDelay * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function extractNumber(text: string): number | undefined {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

export function sanitizeUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return baseUrl + url;
  return baseUrl + '/' + url;
}

export function saveToFile(filename: string, data: any): void {
  const fs = require('fs');
  const path = require('path');

  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Data saved to ${filename}`);
}
