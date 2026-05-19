import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
  email: string;
  orgId: string;
  role: string;
  name: string;
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Upsert user in our DB
  const dbUser = await prisma.user.upsert({
    where: { email: user.email! },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
      avatar: user.user_metadata?.avatar_url ?? null,
    },
    update: {},
  });

  // Get first org membership
  const membership = await prisma.orgMembership.findFirst({
    where: { userId: dbUser.id, joinedAt: { not: null } },
    orderBy: { joinedAt: 'desc' },
  });

  if (!membership) {
    return NextResponse.json(
      { error: 'No organization found. Please contact your administrator.' },
      { status: 403 },
    );
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    orgId: membership.orgId,
    role: membership.role,
  };
}

export function isAuthContext(val: unknown): val is AuthContext {
  return (
    typeof val === 'object' &&
    val !== null &&
    'userId' in val &&
    'orgId' in val
  );
}
