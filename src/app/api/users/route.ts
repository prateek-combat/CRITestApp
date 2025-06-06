import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url, 'http://localhost');
    const searchParams = url.searchParams;
    const email = searchParams.get('email');

    const commonSelect = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    };

    if (email) {
      // Fetch a specific user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: commonSelect,
      });

      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(user);
    } else {
      // Fetch all users if no email is provided
      const users = await prisma.user.findMany({
        select: commonSelect,
        orderBy: {
          createdAt: 'asc',
        },
      });
      return NextResponse.json(users);
    }
  } catch (error) {
    console.error(
      '[API /api/users GET] Failed to fetch user(s):_response',
      error
    );
    return NextResponse.json(
      { message: 'Failed to fetch user(s)', error: String(error) },
      { status: 500 }
    );
  }
}
