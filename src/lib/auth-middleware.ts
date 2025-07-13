/**
 * Authentication Middleware
 * Reusable authentication checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { authLogger } from './logger';
import { auth } from './auth';

// Define admin roles
const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
