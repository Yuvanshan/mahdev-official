import React from 'react';
import {
  ShieldCheck,
  Lock,
  GitBranch,
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
      title: 'Clear Ownership & Handover',
      desc: 'Ownership, source code, and documentation are defined in the project agreement, with handover requirements confirmed before delivery.',
      icon: <Lock className="w-5 h-5 text-blue-600" />,
      badge: 'Defined per project',
    },
    {
      title: 'Performance Built Around Requirements',
      desc: 'Architecture and optimization choices are guided by the product’s expected workload, with measurable targets agreed for each engagement.',
      icon: <Zap className="w-5 h-5 text-sky-600" />,
      badge: 'Targets agreed together',
    },
    {
      title: 'Security Scoped to the Product',
      desc: 'Security controls and verification are selected for the project’s data, risks, and regulatory needs, then documented as part of delivery.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      badge: 'Scope defined per project',
    },
    {
      title: 'Reliable Release Planning',
      desc: 'Testing, monitoring, deployment, and recovery practices are planned to suit the system and the service level agreed for each project.',
      icon: <GitBranch className="w-5 h-5 text-[#861F31]" />,
      badge: 'Planned for each release',
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
          <Caption className="text-[#861F31] mb-2 block font-mono">
            Architectural Philosophy & Standards
          </Caption>
          <H2 className="text-slate-900">
            Maintainable systems designed to grow with your business
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
              <span>Scope agreed for each engagement</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Tech Stack Matrix Grid */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
              Technology Capabilities
            </span>
            <h3 className="font-display text-lg font-bold text-white mt-0.5">
              Tools selected to fit each project
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stack choices depend on project needs</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {techMatrix.map((matrix, mIdx) => (
            <div key={mIdx} className="space-y-3">
              <div className="text-xs font-mono font-bold text-[#DFC070] uppercase tracking-wider">
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
