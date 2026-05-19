import { notFound } from 'next/navigation';
import { PermitWorkspace } from '@/components/permits/PermitWorkspace';
import type { PermitWithRelations } from '@permitpro/shared';

async function getPermit(id: string): Promise<PermitWithRelations | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/permits/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const permit = await getPermit(id);

  if (!permit) {
    notFound();
  }

  return <PermitWorkspace permit={permit} />;
}
