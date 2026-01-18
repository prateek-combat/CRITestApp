'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  FileText,
  Mail,
  Trophy,
  Users,
  LayoutDashboard,
  Zap,
  Brain,
  LogOut,
  Settings,
  ChevronDown,
  User,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import Button from '@/components/ui/button/Button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router, pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-2 border-military-green border-t-transparent"
        />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (session && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tests', href: '/admin/tests', icon: FileText },
    { name: 'Job Profiles', href: '/admin/job-profiles', icon: Building2 },
    { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Compact Top Navigation with Glass Effect */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 shadow-sm backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="flex h-12 justify-between">
            {/* Logo - Compact with Animation */}
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/admin/dashboard"
                className="group flex items-center space-x-2"
              >
                <motion.div
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-military-green to-primary-600 shadow-md transition-shadow group-hover:shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Zap className="h-3.5 w-3.5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">
                    Test Platform
                  </h1>
                </div>
              </Link>
            </motion.div>

            {/* Navigation Links - Compact with Animations */}
            <div className="hidden items-center space-x-0.5 md:flex">
              {navigation.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={item.href} className="group relative">
                      <motion.div
                        className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-military-green/10 to-accent-orange/10 text-military-green'
                            : 'text-gray-600 hover:text-military-green'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        <span>{item.name}</span>
                      </motion.div>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-military-green to-accent-orange"
                          initial={false}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* User Menu - Compact with Animation */}
            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 md:hidden"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {session?.user && (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="glass flex items-center space-x-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                  >
                    <motion.div
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-military-green to-accent-orange shadow-sm"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <User className="h-3 w-3 text-white" />
                    </motion.div>
                    <div className="hidden text-left lg:block">
                      <p className="text-xs font-medium text-gray-900">
                        {session.user.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {session.user.role}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                      >
                        <div className="py-1">
                          <div className="border-b border-gray-100 px-3 py-2 lg:hidden">
                            <p className="text-xs font-medium text-gray-900">
                              {session.user.name}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {session.user.email}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ x: 2 }}
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              signOut({ callbackUrl: '/login' });
                            }}
                            className="flex w-full items-center px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            <LogOut className="mr-2 h-3.5 w-3.5" />
                            Logout
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-gray-200 md:hidden"
            >
              <div className="space-y-0.5 px-2 pb-2 pt-2">
                {navigation.map((item, index) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center space-x-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-military-green/10 to-accent-orange/10 text-military-green'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main content - Compact padding */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl px-3 py-3 sm:px-4 lg:px-6"
      >
        {children}
      </motion.main>
    </div>
  );
}
