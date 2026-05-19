import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { DocumentCategory } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';
import { createClient as createSupabase } from '@supabase/supabase-js';

function getAdminClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({
      where: { id: params.id, orgId: auth.orgId },
    });
    if (!permit) return notFound('Permit not found');

    const documents = await prisma.document.findMany({
      where: { permitId: params.id },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({
      where: { id: params.id, orgId: auth.orgId },
    });
    if (!permit) return notFound('Permit not found');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const name = (formData.get('name') as string) || file.name;
    const category = (formData.get('category') as DocumentCategory) || DocumentCategory.OTHER;
    const expirationDate = formData.get('expirationDate') as string | null;
    const notes = formData.get('notes') as string | null;

    // Upload to Supabase Storage
    const supabase = getAdminClient();
    const ext = file.name.split('.').pop() ?? 'bin';
    const storagePath = `${auth.orgId}/${params.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, bytes, { contentType: file.type });

    if (uploadError) {
      console.error('[Upload] Supabase storage error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', message: uploadError.message },
        { status: 500 },
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    const document = await prisma.document.create({
      data: {
        orgId: auth.orgId,
        permitId: params.id,
        name,
        fileName: file.name,
        fileUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        category,
        uploadedById: auth.userId,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        notes,
      },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'document',
      entityId: document.id,
      metadata: { name: document.name, category: document.category },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
