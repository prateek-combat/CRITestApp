import { NextResponse } from 'next/server';
import { Prisma, InvitationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/invitations/{id}:
 *   get:
 *     summary: Retrieve a specific invitation by ID
 *     description: Fetches a single invitation from the database using its ID.
 *     tags:
 *       - Invitations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the invitation to retrieve.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The requested invitation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvitationWithTestInfo'
 *       404:
 *         description: Invitation not found.
 *       500:
 *         description: Failed to fetch invitation.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            questions: {
              select: {
                id: true,
                promptText: true,
                promptImageUrl: true,
                timerSeconds: true,
                answerOptions: true,
                sectionTag: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(invitation);
  } catch (error) {
    console.error(
      `[API /api/invitations/${id} GET] Failed to fetch invitation:`,
      error
    );
    return NextResponse.json(
      { message: 'Failed to fetch invitation', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/invitations/{id}:
 *   put:
 *     summary: Update an existing invitation
 *     description: Modifies an existing invitation (e.g., status, expiry date) by its ID.
 *     tags:
 *       - Invitations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the invitation to update.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInvitationInput'
 *     responses:
 *       200:
 *         description: Invitation updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Bad request (e.g., invalid data, invalid status transition).
 *       404:
 *         description: Invitation not found.
 *       500:
 *         description: Failed to update invitation.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      candidateEmail,
      candidateName,
      expiresAt,
      status, // e.g., PENDING, OPENED, COMPLETED, EXPIRED
    } = body;

    const dataToUpdate: any = {};
    if (candidateEmail !== undefined)
      dataToUpdate.candidateEmail = candidateEmail;
    if (candidateName !== undefined) dataToUpdate.candidateName = candidateName;
    if (expiresAt !== undefined) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { message: 'Invalid expiresAt date.' },
          { status: 400 }
        );
      }
      dataToUpdate.expiresAt = expiryDate;
    }
    if (status !== undefined) {
      // Manually define the valid string values for the enum for runtime check
      // These should match all values in the InvitationStatus enum in schema.prisma
      const validInvitationStatusStrings: string[] = [
        'PENDING',
        'SENT',
        'OPENED',
        'COMPLETED',
        'EXPIRED',
        'CANCELLED',
      ];
      if (!validInvitationStatusStrings.includes(status)) {
        return NextResponse.json(
          {
            message: `Invalid invitation status: ${status}. Must be one of: ${validInvitationStatusStrings.join(', ')}`,
          },
          { status: 400 }
        );
      }
      // If the above passes, status is a valid string. Now cast to the type.
      dataToUpdate.status = status as InvitationStatus;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: 'No fields provided to update.' },
        { status: 400 }
      );
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedInvitation);
  } catch (error: any) {
    console.error(
      `[API /api/invitations/${id} PUT] Failed to update invitation:`,
      error
    );
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to update invitation', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/invitations/{id}:
 *   delete:
 *     summary: Delete an invitation by ID
 *     description: Removes an invitation from the database by its ID.
 *     tags:
 *       - Invitations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the invitation to delete.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invitation deleted successfully.
 *       404:
 *         description: Invitation not found.
 *       409:
 *         description: Conflict (e.g., invitation has an associated test attempt).
 *       500:
 *         description: Failed to delete invitation.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    // Check if a TestAttempt is associated with this invitation
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { invitationId: id },
    });

    if (testAttempt) {
      return NextResponse.json(
        {
          message:
            'Cannot delete invitation: a test attempt has already been started using this invitation. Consider marking it as EXPIRED instead.',
        },
        { status: 409 }
      );
    }

    await prisma.invitation.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Invitation deleted successfully' });
  } catch (error: any) {
    console.error(
      `[API /api/invitations/${id} DELETE] Failed to delete invitation:`,
      error
    );
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      );
    }
    // P2003 can happen if a TestAttempt references it and we didn't catch it above (though the explicit check is better)
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          message:
            'Failed to delete invitation due to existing related records (e.g., test attempts).',
          error: String(error),
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to delete invitation', error: String(error) },
      { status: 500 }
    );
  }
}
