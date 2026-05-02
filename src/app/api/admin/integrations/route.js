import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth-server';
import { getAppSetting, setAppSetting, maskApiKey } from '@/lib/app-settings';
import { CHAT_CONFIG } from '@/config/chat-config';
import anthropicService from '@/lib/anthropic-service';

const ANTHROPIC_KEY = 'anthropic_api_key';
const ANTHROPIC_MODEL_KEY = 'anthropic_model';

async function requireAdmin(request) {
  const user = await getUserFromCookies(request.cookies);
  if (!user || !user.isAdmin) return null;
  return user;
}

async function buildState() {
  const storedKey = await getAppSetting(ANTHROPIC_KEY);
  const fromEnvKey = !storedKey && !!process.env.ANTHROPIC_API_KEY;
  const effectiveKey = storedKey || (fromEnvKey ? process.env.ANTHROPIC_API_KEY : '');

  const storedModel = await getAppSetting(ANTHROPIC_MODEL_KEY);
  const fromEnvModel = !storedModel && !!process.env.ANTHROPIC_MODEL;
  const effectiveModel =
    storedModel || (fromEnvModel ? process.env.ANTHROPIC_MODEL : CHAT_CONFIG.ANTHROPIC_MODEL);

  return {
    anthropicApiKey: {
      configured: !!effectiveKey,
      source: storedKey ? 'database' : fromEnvKey ? 'env' : 'none',
      masked: maskApiKey(effectiveKey),
    },
    anthropicModel: {
      value: effectiveModel,
      source: storedModel ? 'database' : fromEnvModel ? 'env' : 'default',
      available: anthropicService.getAvailableModels(),
    },
  };
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json(await buildState());
}

export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body?.anthropicApiKey === 'string') {
    const incoming = body.anthropicApiKey.trim();
    if (incoming && !incoming.startsWith('sk-ant-')) {
      return NextResponse.json(
        { error: 'Invalid Anthropic API key format (expected to start with sk-ant-)' },
        { status: 400 }
      );
    }
    await setAppSetting(ANTHROPIC_KEY, incoming);
  }

  if (typeof body?.anthropicModel === 'string') {
    const incoming = body.anthropicModel.trim();
    const allowed = new Set(anthropicService.getAvailableModels().map((m) => m.id));
    if (incoming && !allowed.has(incoming)) {
      return NextResponse.json(
        { error: `Unknown model. Allowed: ${[...allowed].join(', ')}` },
        { status: 400 }
      );
    }
    await setAppSetting(ANTHROPIC_MODEL_KEY, incoming);
  }

  return NextResponse.json(await buildState());
}
