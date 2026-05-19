import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { buildPermitContext, streamChat } from '@permitpro/ai';
import type { ChatMessage } from '@permitpro/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({
      where: { id: params.id, orgId: auth.orgId },
      include: {
        project: true,
        documents: true,
        checklistItems: true,
        inspections: true,
        fees: true,
        deadlines: true,
      },
    });
    if (!permit) return notFound('Permit not found');

    const body = await request.json() as { messages: ChatMessage[] };
    const { messages } = body;

    const permitContext = buildPermitContext(
      permit as Parameters<typeof buildPermitContext>[0],
      permit.documents as Parameters<typeof buildPermitContext>[1],
      permit.checklistItems as Parameters<typeof buildPermitContext>[2],
      permit.inspections as Parameters<typeof buildPermitContext>[3],
      permit.fees as Parameters<typeof buildPermitContext>[4],
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChat({
            messages,
            permitContext,
            onChunk: (chunk) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`),
              );
            },
          });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
