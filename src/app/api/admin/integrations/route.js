import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth-server';
import { getAppSetting, setAppSetting, maskApiKey } from '@/lib/app-settings';

const ANTHROPIC_KEY = 'anthropic_api_key';

async function requireAdmin(request) {
  const user = await getUserFromCookies(request.cookies);
  if (!user || !user.isAdmin) return null;
  return user;
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const stored = await getAppSetting(ANTHROPIC_KEY);
  const fromEnv = !stored && !!process.env.ANTHROPIC_API_KEY;
  const effective = stored || (fromEnv ? process.env.ANTHROPIC_API_KEY : '');
  return NextResponse.json({
    anthropicApiKey: {
      configured: !!effective,
      source: stored ? 'database' : fromEnv ? 'env' : 'none',
      masked: maskApiKey(effective),
    },
  });
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

  const incoming = typeof body?.anthropicApiKey === 'string' ? body.anthropicApiKey.trim() : null;
  if (incoming === null) {
    return NextResponse.json({ error: 'anthropicApiKey is required' }, { status: 400 });
  }
  if (incoming && !incoming.startsWith('sk-ant-')) {
    return NextResponse.json(
      { error: 'Invalid Anthropic API key format (expected to start with sk-ant-)' },
      { status: 400 }
    );
  }

  await setAppSetting(ANTHROPIC_KEY, incoming);

  return NextResponse.json({
    anthropicApiKey: {
      configured: !!incoming,
      source: incoming ? 'database' : 'none',
      masked: maskApiKey(incoming),
    },
  });
}
