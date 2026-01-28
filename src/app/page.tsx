'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '@/components/ui/button/Button';
import {
  ShieldCheck,
  Radar,
  LineChart,
  Target,
  ChevronRight,
  ArrowUpRight,
  ScanEye,
  Shield,
} from 'lucide-react';

export default function HomePage() {
  const shouldReduceMotion = useReducedMotion();

  const fadeInUp = {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Security that feels invisible',
      description:
        'Identity checks, browser lockdown, and audit trails without slowing candidates down.',
      meta: 'Integrity layer',
    },
    {
      icon: LineChart,
      title: 'Scoring you can defend',
      description:
        'Weighted rubrics and variance tracking keep results fair, explainable, and consistent.',
      meta: 'Evidence based',
    },
    {
      icon: Target,
      title: 'Built for hiring velocity',
      description:
        'Invite, monitor, and decide in hours, not days, with a workflow tuned for busy teams.',
      meta: 'Speed without risk',
    },
    {
      icon: Radar,
      title: 'Live signal clarity',
      description:
        'Real-time anomaly flags and cohort benchmarks surface issues before they spread.',
      meta: 'Operational control',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-archive-wash absolute inset-0" />
        <div className="bg-archive-grid absolute inset-0 opacity-40" />
        <div className="noise-overlay absolute inset-0 opacity-20 mix-blend-multiply" />
        <motion.div
          className="absolute -right-32 -top-24 h-72 w-72 rounded-full bg-copper/15 blur-[90px]"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
          }
        />
        <motion.div
          className="absolute -bottom-24 -left-28 h-80 w-80 rounded-full bg-moss/20 blur-[100px]"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, -25, 0],
                  y: [0, 25, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 22, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-16 pt-8"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink/20 bg-parchment/80 shadow-sm">
              <ScanEye className="h-6 w-6 text-ink" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-ink/60">
                Assessment Control
              </p>
              <p className="font-display text-xl text-ink">CRITest Platform</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-ink/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-ink/60">
              Admin Access Only
            </span>
            <Link href="/login">
              <Button
                size="sm"
                variant="primary"
                endIcon={<ChevronRight className="h-4 w-4" />}
              >
                Admin Login
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.section variants={fadeInUp} className="space-y-8">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-parchment/80 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-ink/60">
                <Shield className="h-4 w-4 text-moss" />
                Trusted exam security
              </div>
              <h1 className="font-display text-5xl leading-[1.02] text-ink md:text-6xl">
                Make every test decision defensible, fast, and fair.
              </h1>
              <p className="text-lg leading-relaxed text-ink/70">
                CRITest is the assessment command center for hiring teams that
                need integrity without friction. Lead with evidence, not gut
                feel, and ship results the same day.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="primary"
                  endIcon={<ChevronRight className="h-5 w-5" />}
                  className="min-w-[220px]"
                >
                  Enter Admin Console
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                disabled
                endIcon={<ArrowUpRight className="h-5 w-5" />}
                className="min-w-[220px]"
              >
                Candidate Portal
                <span className="ml-2 text-xs text-ink/50">Soon</span>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { label: 'Avg. decision time', value: '3.2 hrs' },
                { label: 'Integrity score', value: '98.4%' },
                { label: 'Invite completion', value: '91%' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/45">
                    {stat.label}
                  </p>
                  <p className="font-display text-2xl text-ink">{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.aside variants={fadeInUp} className="space-y-6">
            <div className="rounded-3xl border border-ink/10 bg-parchment/80 p-6 shadow-[0_20px_50px_rgba(20,24,30,0.08)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
                  Integrity board
                </p>
                <span className="rounded-full bg-moss/15 px-3 py-1 text-xs font-semibold text-moss">
                  Live
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  {
                    label: 'Proctoring compliance',
                    value: '98.7%',
                    note: 'Stable',
                    tone: 'text-moss',
                  },
                  {
                    label: 'Anomaly flags',
                    value: '0.6%',
                    note: 'Below threshold',
                    tone: 'text-copper',
                  },
                  {
                    label: 'Score variance',
                    value: '1.4 pts',
                    note: 'Within range',
                    tone: 'text-slateblue',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-ink/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {item.label}
                      </p>
                      <p
                        className={`text-xs uppercase tracking-[0.2em] ${item.tone}`}
                      >
                        {item.note}
                      </p>
                    </div>
                    <p className="font-display text-xl text-ink">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-ink/95 p-6 text-parchment shadow-[0_20px_40px_rgba(20,24,30,0.18)]">
              <p className="text-xs uppercase tracking-[0.3em] text-parchment/60">
                Workflow map
              </p>
              <div className="mt-5 space-y-5">
                {[
                  {
                    step: '01',
                    title: 'Invite & verify',
                    detail: 'ID + environment checks before launch.',
                  },
                  {
                    step: '02',
                    title: 'Monitor & annotate',
                    detail: 'Real-time flags, notes, and reviewer swaps.',
                  },
                  {
                    step: '03',
                    title: 'Score & defend',
                    detail: 'Weighted rubrics with audit-ready output.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <span className="font-mono text-xs text-parchment/50">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-parchment">
                        {item.title}
                      </p>
                      <p className="text-sm text-parchment/70">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>

        <motion.section
          variants={fadeInUp}
          className="mt-16 grid gap-8 border-t border-ink/10 pt-12 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
              Why teams stick
            </p>
            <h2 className="mt-4 font-display text-3xl text-ink">
              Less guesswork, more evidence.
            </h2>
            <p className="mt-4 text-lg text-ink/70">
              We built CRITest for real hiring pressure: limited time, high
              stakes, and accountability. The platform keeps attention on the
              decision, not the tool.
            </p>
          </div>
          <div className="space-y-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="flex items-start gap-4 border-l border-ink/20 pl-5"
              >
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-parchment shadow-sm ring-1 ring-ink/10">
                  <pillar.icon className="h-5 w-5 text-ink" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
                    {pillar.meta}
                  </p>
                  <h3 className="text-lg font-semibold text-ink">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-ink/70">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          variants={fadeInUp}
          className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-8 text-sm text-ink/60 md:flex-row"
        >
          <p>
            For administrators: manage tests, invitations, and analytics from a
            single console.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-ink"
          >
            Go to admin login <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
