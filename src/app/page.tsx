'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/Card';
import {
  Zap,
  Users,
  BarChart3,
  Shield,
  Clock,
  Target,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure Testing',
      description: 'Military-grade security for your assessments',
      color: 'text-military-green',
    },
    {
      icon: Clock,
      title: 'Real-time Analytics',
      description: 'Track performance with live dashboards',
      color: 'text-accent-orange',
    },
    {
      icon: Target,
      title: 'Precise Evaluation',
      description: 'Advanced scoring algorithms for accuracy',
      color: 'text-military-green',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Effortlessly manage candidates and teams',
      color: 'text-accent-orange',
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-military-green/5 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-orange/5 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          className="w-full max-w-6xl"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          {/* Main Hero Content */}
          <div className="mb-16 text-center">
            <motion.div variants={fadeInUp} className="mb-6 inline-flex">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-military-green to-accent-orange opacity-50 blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-military-green to-primary-600 shadow-2xl">
                  <Zap className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-7xl"
            >
              Test Platform
              <span className="gradient-text mt-2 block text-3xl md:text-4xl">
                Next Generation Assessment
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl"
            >
              Experience the future of testing with our cutting-edge platform.
              Secure, efficient, and designed for excellence.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  variant="primary"
                  endIcon={<ChevronRight className="h-5 w-5" />}
                  className="min-w-[200px] shadow-lg"
                >
                  Admin Login
                </Button>
              </Link>

              <Button
                size="lg"
                variant="glass"
                disabled
                startIcon={<Sparkles className="h-5 w-5" />}
                className="min-w-[200px]"
              >
                User Portal
                <span className="ml-2 text-xs opacity-75">Coming Soon</span>
              </Button>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            variants={staggerChildren}
            className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card variant="glass" className="h-full">
                  <div className="flex flex-col items-center p-4 text-center">
                    <div
                      className={`mb-3 rounded-xl bg-white/50 p-3 ${feature.color}`}
                    >
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div
            variants={fadeInUp}
            className="gradient-border-green-orange rounded-2xl p-[1px]"
          >
            <div className="rounded-2xl bg-white p-8">
              <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="gradient-text mb-2 text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    10K+
                  </motion.div>
                  <p className="text-gray-600">Tests Conducted</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="gradient-text mb-2 text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    98%
                  </motion.div>
                  <p className="text-gray-600">Success Rate</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="gradient-text mb-2 text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  >
                    500+
                  </motion.div>
                  <p className="text-gray-600">Organizations</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeInUp} className="mt-16 text-center">
            <p className="text-sm text-gray-500">
              For administrators: Access the admin panel to manage tests,
              invitations, and analytics
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
