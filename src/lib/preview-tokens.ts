import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface PreviewTokenData {
  testId: string;
  userId: string;
  expiresAt: number;
  testTitle: string;
}

// Use a simple file-based storage in the temp directory
const TOKENS_DIR = join(process.cwd(), '.next', 'cache', 'preview-tokens');
const TOKENS_FILE = join(TOKENS_DIR, 'tokens.json');

// Ensure directory exists
function ensureTokensDir() {
  if (!existsSync(TOKENS_DIR)) {
    mkdirSync(TOKENS_DIR, { recursive: true });
  }
}

// Load tokens from file
function loadTokens(): Map<string, PreviewTokenData> {
  try {
    ensureTokensDir();
    if (!existsSync(TOKENS_FILE)) {
      return new Map();
    }
    const data = readFileSync(TOKENS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return new Map(Object.entries(parsed));
  } catch (error) {
    console.warn('Failed to load preview tokens:', error);
    return new Map();
  }
}

// Save tokens to file
function saveTokens(tokens: Map<string, PreviewTokenData>) {
  try {
    ensureTokensDir();
    const data = JSON.stringify(Object.fromEntries(tokens));
    writeFileSync(TOKENS_FILE, data, 'utf8');
  } catch (error) {
    console.warn('Failed to save preview tokens:', error);
  }
}

// Clean up expired tokens
function cleanupExpiredTokens(tokens: Map<string, PreviewTokenData>): boolean {
  const now = Date.now();
  let hasChanges = false;

  for (const [token, data] of tokens.entries()) {
    if (data.expiresAt < now) {
      tokens.delete(token);
      hasChanges = true;
    }
  }

  return hasChanges;
}

export function createPreviewToken(
  token: string,
  data: PreviewTokenData
): void {
  const tokens = loadTokens();
  tokens.set(token, data);

  // Clean up expired tokens while we're at it
  cleanupExpiredTokens(tokens);

  saveTokens(tokens);
}

export function getPreviewToken(token: string): PreviewTokenData | undefined {
  const tokens = loadTokens();

  // Clean up expired tokens first
  const hasChanges = cleanupExpiredTokens(tokens);
  if (hasChanges) {
    saveTokens(tokens);
  }

  const data = tokens.get(token);
  if (data && data.expiresAt < Date.now()) {
    tokens.delete(token);
    saveTokens(tokens);
    return undefined;
  }

  return data;
}

export function deletePreviewToken(token: string): boolean {
  const tokens = loadTokens();
  const deleted = tokens.delete(token);

  if (deleted) {
    saveTokens(tokens);
  }

  return deleted;
}
