import React from 'react';
import {
  Server,
  ShieldCheck,
  Cpu,
  Lock,
  GitBranch,
  Layers,
  Database,
  Terminal,
  Activity,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

export const ITArchitectureSection: React.FC = () => {
  const pillars = [
    {
      title: 'Full Intellectual Property Ownership',
      desc: 'You receive 100% of the source code, database schemas, Docker containers, and CI/CD pipelines. No vendor lock-in, proprietary licensing traps, or per-seat fees.',
      icon: <Lock className="w-5 h-5 text-blue-600" />,
      badge: '100% Client Owned',
    },
    {
      title: 'Sub-50ms API & Latency SLA',
      desc: 'Engineered with edge compute, Redis in-memory caching, PostgreSQL connection pooling, and optimized query plans to ensure snappy performance even at 10,000+ RPS.',
      icon: <Zap className="w-5 h-5 text-sky-600" />,
      badge: '< 50ms Response',
    },
    {
      title: 'Zero-Trust Cyber Resilience',
      desc: 'Encrypted at rest (AES-256) and in transit (TLS 1.3). Role-based access controls, OWASP Top 10 penetration testing, and automated vulnerability scanning in every pull request.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      badge: 'ISO 27001 / SOC 2 Ready',
    },
    {
      title: 'Zero-Downtime CI/CD Deployments',
      desc: 'Automated blue/green or rolling Kubernetes deployments with canary analysis and instant automated rollback if error rates exceed 0.01%.',
      icon: <GitBranch className="w-5 h-5 text-[#0052FF]" />,
      badge: 'Zero-Downtime Rollouts',
    },
  ];

  const techMatrix = [
    {
      category: 'Frontend & Mobile',
      tools: ['Next.js 15', 'React 19', 'TypeScript', 'Flutter', 'React Native', 'Tailwind CSS', 'WebGL / Three.js'],
    },
    {
      category: 'Backend & APIs',
      tools: ['Node.js', 'Python / FastAPI', 'Go (Golang)', 'Django', 'NestJS', 'GraphQL', 'gRPC / Protocol Buffers'],
    },
    {
      category: 'Databases & Streaming',
      tools: ['PostgreSQL', 'TimescaleDB', 'Redis Enterprise', 'Apache Kafka', 'pgvector', 'Pinecone', 'MongoDB'],
    },
    {
      category: 'Cloud & DevOps',
      tools: ['AWS (EKS, Lambda)', 'Google Cloud (GKE)', 'Docker', 'Kubernetes', 'Terraform', 'Datadog', 'Cloudflare'],
    },
  ];

  return (
    <SectionContainer background="subtle" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Architectural Philosophy & Standards
          </Caption>
          <H2 className="text-slate-900">
            Engineered with Zero Technical Debt and Infinite Scalability
          </H2>
        </ScrollReveal>
      </div>

      {/* 4 Core Engineering Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {pillars.map((p, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {p.icon}
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  {p.badge}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Standard in all client contracts</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Tech Stack Matrix Grid */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
              Enterprise Technology Stack
            </span>
            <h3 className="font-display text-lg font-bold text-white mt-0.5">
              Our Vetted Production Technology Matrix
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Regularly audited for CVEs & end-of-life cycles</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {techMatrix.map((matrix, mIdx) => (
            <div key={mIdx} className="space-y-3">
              <div className="text-xs font-mono font-bold text-[#60A5FA] uppercase tracking-wider">
                {matrix.category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matrix.tools.map((tool, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 text-xs font-mono border border-slate-700/60"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};
