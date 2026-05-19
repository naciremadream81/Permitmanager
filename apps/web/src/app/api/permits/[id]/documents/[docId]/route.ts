import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { UpdateDocumentSchema } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const existing = await prisma.document.findFirst({
      where: { id: params.docId, permitId: params.id },
    });
    if (!existing) return notFound('Document not found');

    const body = await request.json() as unknown;
    const data = UpdateDocumentSchema.parse(body);

    const updated = await prisma.document.update({ where: { id: params.docId }, data });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'DOCUMENT_UPDATED',
      entityType: 'document',
      entityId: params.docId,
      metadata: data as Record<string, unknown>,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; docId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const doc = await prisma.document.findFirst({
      where: { id: params.docId, permitId: params.id },
    });
    if (!doc) return notFound('Document not found');

    await prisma.document.delete({ where: { id: params.docId } });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'DOCUMENT_DELETED',
      entityType: 'document',
      entityId: params.docId,
      metadata: { name: doc.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
