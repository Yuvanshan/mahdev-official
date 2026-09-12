export interface ITService {
  id: string;
  name: string;
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  badge?: string;
  problemsSolved: string[];
  features: string[];
  process: { step: string; title: string; desc: string }[];
  technologies: { name: string; category: string; icon?: string }[];
  caseStudy: {
    title: string;
    client: string;
    impact: string;
    techSummary: string;
    metrics: { label: string; value: string }[];
  };
  startingTimeline: string;
  recommendedFor: string;
}

export interface ITCaseStudy {
  id: string;
  title: string;
  client: string;
  clientIndustry: string;
  year: string;
  serviceId: string;
  summary: string;
  challenge: string;
  architecture: string[];
  results: { metric: string; label: string }[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

export const IT_SERVICES: ITService[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    tagline: 'High-Performance Web Applications & Distributed Platforms',
    shortDescription:
      'Custom full-stack web platforms, progressive web apps (PWAs), and enterprise customer portals engineered with modern frameworks, sub-second load times, and bank-grade security.',
    fullDescription:
      'We engineer bespoke web applications designed for infinite scale, accessibility, and high conversion. Our engineering teams leverage micro-frontend or modular SSR architectures with React, Next.js, and TypeScript, backed by fault-tolerant serverless and containerized APIs.',
    iconName: 'Globe',
    badge: 'Core Competency',
    problemsSolved: [
      'Slow, bloated legacy websites causing high bounce rates and poor search engine rankings',
      'Inability to scale during traffic spikes and promotional campaigns without server crashes',
      'Vulnerable, outdated monolithic CMS platforms with security vulnerabilities',
      'Fragmented user experiences across desktop, tablet, and mobile browsers',
    ],
    features: [
      'Next.js 15 / React 19 Server-Side Rendering (SSR) & Static Edge Generation',
      'Sub-500ms global Core Web Vitals optimization and Google Lighthouse 95+ scores',
      'Headless CMS integration (Strapi, Sanity, Contentful) or custom administrative panels',
      'End-to-end type safety with TypeScript, tRPC, GraphQL, and OpenAPI specifications',
      'Zero-downtime CI/CD automated deployment pipelines with preview environments',
      'WCAG 2.1 AA accessibility and multi-region edge caching with Cloudflare/Fastly',
    ],
    process: [
      { step: '01', title: 'Architecture Discovery', desc: 'Requirements analysis, API schema modeling, and wireframe prototyping.' },
      { step: '02', title: 'Sprint-Based Slicing', desc: 'Bi-weekly component sprints with live staging preview environments.' },
      { step: '03', title: 'Stress & Security Testing', desc: 'Load testing up to 50k concurrent users and OWASP Top 10 penetration audits.' },
      { step: '04', title: 'Global Edge Rollout', desc: 'Automated container deployment with automated DNS failover and monitoring.' },
    ],
    technologies: [
      { name: 'React 19', category: 'Frontend' },
      { name: 'Next.js 15', category: 'Framework' },
      { name: 'TypeScript', category: 'Language' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'Tailwind CSS', category: 'Styling' },
      { name: 'PostgreSQL', category: 'Database' },
      { name: 'Redis', category: 'Caching' },
      { name: 'Docker', category: 'DevOps' },
    ],
    caseStudy: {
      title: 'Pan-Asian Logistics & Customs Clearance Portal',
      client: 'Apex Global Freight Ltd',
      impact: 'Reduced container tracking lookup times from 4.2 seconds to 180ms with 99.99% uptime.',
      techSummary: 'Next.js App Router, Go Microservices, Kafka Event Streaming & TimescaleDB',
      metrics: [
        { label: 'Page Load Speed', value: '0.38s' },
        { label: 'API Response Time', value: '45ms' },
        { label: 'Daily Active Users', value: '38,000+' },
      ],
    },
    startingTimeline: '3 - 8 Weeks',
    recommendedFor: 'Enterprises needing high-traffic web applications, customer portals, or SaaS products.',
  },
  {
    id: 'mobile-development',
    name: 'Mobile Development',
    tagline: 'Native & Cross-Platform iOS and Android Engineering',
    shortDescription:
      'Fluid, offline-first mobile applications built with Flutter and React Native delivering 60 FPS animations, biometrics, hardware integration, and native performance.',
    fullDescription:
      'We craft iOS and Android applications that users love. Whether developing an enterprise field-service tool with Bluetooth sensor synchronization or a consumer e-commerce mobile app, our engineers optimize battery consumption, state management, and biometric security.',
    iconName: 'Smartphone',
    badge: 'iOS & Android',
    problemsSolved: [
      'High development and maintenance costs from maintaining two separate native codebases',
      'Sluggish, janky hybrid apps that fail App Store reviews or frustrate mobile customers',
      'Unreliable offline functionality in areas with spotty cellular connectivity',
      'Cumbersome app update cycles causing fragmented user version adoption',
    ],
    features: [
      'Single codebase deployment across Apple App Store and Google Play Store',
      '60/120 FPS buttery-smooth micro-interactions and custom gesture systems',
      'Offline-first SQLite / WatermelonDB sync with automatic conflict resolution',
      'Native device hardware integration (NFC, Bluetooth LE, Camera LiDAR, GPS, Biometrics)',
      'Push notification orchestration with segment targeting and deep linking',
      'Automated App Store submission, beta testing distribution via TestFlight and Fastlane',
    ],
    process: [
      { step: '01', title: 'UX Flow & Touch Prototyping', desc: 'Mobile-first ergonomics, micro-interactions, and thumb-zone modeling.' },
      { step: '02', title: 'State Architecture', desc: 'Bloc / Riverpod / Redux Toolkit setup with robust local database caching.' },
      { step: '03', title: 'Hardware Integration', desc: 'Rigorous real-device testing on 30+ iOS and Android hardware configurations.' },
      { step: '04', title: 'Store Certification', desc: 'Complete Apple App Store and Google Play publishing and review approvals.' },
    ],
    technologies: [
      { name: 'Flutter', category: 'Framework' },
      { name: 'React Native', category: 'Framework' },
      { name: 'Dart / Swift / Kotlin', category: 'Languages' },
      { name: 'Firebase / Supabase', category: 'BaaS' },
      { name: 'SQLite / Room', category: 'Local DB' },
      { name: 'Fastlane', category: 'CI/CD' },
    ],
    caseStudy: {
      title: 'Omnichannel Grocery & Real-Time Delivery Driver App',
      client: 'QuickMart Supermarkets',
      impact: 'Over 120,000 installs with 4.8-star App Store rating and sub-minute driver dispatch.',
      techSummary: 'Flutter, WebSockets, Google Maps Routes API, Redis Geospatial & Stripe/PayHere',
      metrics: [
        { label: 'Store Rating', value: '4.8 ★' },
        { label: 'Active Installs', value: '120,000+' },
        { label: 'Crash-Free Rate', value: '99.94%' },
      ],
    },
    startingTimeline: '4 - 10 Weeks',
    recommendedFor: 'Consumer brands, on-demand dispatch services, fintech wallets, and field operations.',
  },
  {
    id: 'erp',
    name: 'ERP (Enterprise Resource Planning)',
    tagline: 'Custom ERPs, Financial Engines & Supply Chain Cores',
    shortDescription:
      'Modular enterprise resource planning systems unifying manufacturing, inventory, procurement, human resources, accounting, and executive analytics.',
    fullDescription:
      'Off-the-shelf ERPs force businesses into rigid, foreign workflows with exorbitant annual licensing fees. Mahdev IT develops tailor-made modular ERP architectures mapped directly to your manufacturing pipelines, tax regulations (RAMIS/VAT), and multi-warehouse operations.',
    iconName: 'Building2',
    badge: 'Enterprise Core',
    problemsSolved: [
      'Data silos between purchasing, warehouse inventory, sales invoices, and accounting ledgers',
      'Human data-entry errors leading to phantom stock, stockouts, and financial discrepancies',
      'Exorbitant recurring per-user licensing fees from traditional legacy ERP monoliths',
      'Lack of real-time executive visibility into gross margins and cash flow liquidity',
    ],
    features: [
      'Multi-entity, multi-currency, and multi-warehouse inventory valuation (FIFO, LIFO, Weighted Avg)',
      'Automated purchase order workflows with role-based approval thresholds and e-signatures',
      'Sri Lanka Inland Revenue Department (IRD) & RAMIS compliant invoicing and VAT/SSCL calculations',
      'Manufacturing Bill of Materials (BOM), work orders, and machinery downtime tracking',
      'HRM module with fingerprint biometric attendance, payroll, EPF/ETF and leave management',
      'Role-based granular permissions (RBAC) with immutable audit logging for fraud prevention',
    ],
    process: [
      { step: '01', title: 'Business Process Audit', desc: 'On-site interviews with factory managers, accountants, and supply chain leads.' },
      { step: '02', title: 'Schema & Ledger Modeling', desc: 'Double-entry general ledger architecture and warehouse bin taxonomy.' },
      { step: '03', title: 'Pilot Department Rollout', desc: 'Parallel run alongside legacy systems with live ledger verification.' },
      { step: '04', title: 'Company-Wide Cutover', desc: 'Staff training, documentation, and 24/7 hyper-care support team deployment.' },
    ],
    technologies: [
      { name: 'Python / Django', category: 'Backend' },
      { name: 'PostgreSQL', category: 'Database' },
      { name: 'React Dashboard', category: 'Frontend' },
      { name: 'Apache Kafka', category: 'Streaming' },
      { name: 'Celery / RabbitMQ', category: 'Task Queue' },
      { name: 'PowerBI / Metabase', category: 'Analytics' },
    ],
    caseStudy: {
      title: 'Garment Manufacturing & Export Operations ERP',
      client: 'Lanka Apparel Creations Pvt Ltd',
      impact: 'Automated 14 production lines across 3 factories, cutting fabric wastage by 18.5%.',
      techSummary: 'Custom Django Core, PostgreSQL, Barcode Scanners & Real-Time Production Dashboard',
      metrics: [
        { label: 'Wastage Cut', value: '-18.5%' },
        { label: 'Invoice Gen Time', value: 'Instant' },
        { label: 'Monthly Transactions', value: '450,000+' },
      ],
    },
    startingTimeline: '6 - 16 Weeks',
    recommendedFor: 'Manufacturing plants, distributors, import/export houses, and multi-branch retail conglomerates.',
  },
  {
    id: 'pos',
    name: 'POS (Point of Sale Systems)',
    tagline: 'Touch POS, Multi-Branch Billing & Hardware Integration',
    shortDescription:
      'Lightning-fast point-of-sale software for retail, supermarkets, restaurants, and hotels with offline billing, kitchen display systems (KDS), and cloud sync.',
    fullDescription:
      'When queues form at your counters, every second counts. Our POS solutions feature instant barcode lookup, split billing, table management, thermal receipt printing, weigh-scale integration, and automatic cloud reconciliation when internet reconnects.',
    iconName: 'Receipt',
    badge: 'Retail & Hospitality',
    problemsSolved: [
      'Billing bottlenecks during rush hours causing customer dissatisfaction and abandoned baskets',
      'Total checkout freeze during internet or power outages',
      'Inventory theft and cashier discrepancies due to unmonitored drawer actions',
      'Difficulty syncing prices, promotions, and stock across multiple branch stores',
    ],
    features: [
      'Sub-second billing flow with keyboard shortcuts, touch screens, and barcode scanner auto-focus',
      '100% offline checkout engine with local SQLite database and background cloud sync',
      'Integrated payment gateways (Visa/Mastercard card terminals, LankaQR, loyalty points, cash)',
      'Kitchen Order Ticket (KOT) routing to multi-station Kitchen Display Systems (KDS)',
      'Table floorplan layout with seat management, dish modifiers, and bill splitting',
      'Live owner mobile dashboard for real-time sales monitoring, cash drawer audits, and alerts',
    ],
    process: [
      { step: '01', title: 'Counter Workflow Audit', desc: 'Analyzing cashier ergonomics, item lookup speeds, and hardware compatibility.' },
      { step: '02', title: 'Hardware Driver Integration', desc: 'Pairing thermal printers (ESC/POS), cash drawers, customer displays, and scales.' },
      { step: '03', title: 'Cashier On-Site Training', desc: 'Mock billing drills, shift handover routines, and return/refund protocols.' },
      { step: '04', title: 'Live Store Launch', desc: 'On-site engineer standby during first weekend trading.' },
    ],
    technologies: [
      { name: 'Electron / Flutter Desktop', category: 'Runtime' },
      { name: 'SQLite', category: 'Local DB' },
      { name: 'Node.js & Go', category: 'Cloud API' },
      { name: 'ESC/POS Driver', category: 'Hardware' },
      { name: 'LankaQR API', category: 'Payments' },
    ],
    caseStudy: {
      title: 'Multi-Outlet Restaurant Chain POS & Cloud Central Sync',
      client: 'The Ceylon Heritage Cafes (8 Outlets)',
      impact: 'Average customer checkout time dropped from 72s to 19s with 0 lost orders during internet dropouts.',
      techSummary: 'Flutter Touch POS, ESC/POS Thermal KOT, Cloud Stock Auto-Depletion Engine',
      metrics: [
        { label: 'Checkout Time', value: '19 Seconds' },
        { label: 'Outlets Synced', value: '8 Branches' },
        { label: 'Offline Resilience', value: '100%' },
      ],
    },
    startingTimeline: '2 - 6 Weeks',
    recommendedFor: 'Supermarkets, apparel retail stores, restaurants, cafes, hotels, and pharmacy chains.',
  },
  {
    id: 'cloud-solutions',
    name: 'Cloud Solutions',
    tagline: 'AWS, Google Cloud, Azure Architecture & DevOps',
    shortDescription:
      'Cloud migration, Kubernetes container orchestration, serverless microservices, Terraform infrastructure-as-code, and 99.99% high-availability setups.',
    fullDescription:
      'We modernize infrastructure to eliminate downtime and trim runaway cloud bills. Our certified cloud architects design resilient, multi-region deployments on AWS and Google Cloud Platform, complete with autoscaling, zero-trust security, and continuous delivery.',
    iconName: 'Cloud',
    badge: 'AWS & GCP Certified',
    problemsSolved: [
      'Skyrocketing monthly cloud bills caused by unoptimized compute and unmonitored storage',
      'Catastrophic server outages during peak traffic events with no automated failover',
      'Manual, error-prone deployment procedures leading to broken production builds',
      'Lack of automated offsite backup and disaster recovery mechanisms',
    ],
    features: [
      'Infrastructure as Code (IaC) with Terraform, Pulumi, and AWS CloudFormation',
      'Kubernetes (EKS/GKE) cluster setup with horizontal pod autoscaling and Istio service mesh',
      'Serverless microservices with AWS Lambda, Cloud Run, and API Gateways',
      'Zero-trust network architecture with AWS IAM, VPC peering, and Cloudflare WAF protection',
      'Automated disaster recovery (RTO < 15 mins, RPO < 5 mins) with multi-region replication',
      'Cloud FinOps cost optimization audits guaranteeing 20% to 45% bill reductions',
    ],
    process: [
      { step: '01', title: 'Cloud Infrastructure Audit', desc: 'Architecture review, security vulnerability assessment, and cost breakdown.' },
      { step: '02', title: 'Terraform IaC Blueprinting', desc: 'Writing declarative code for all networks, clusters, databases, and buckets.' },
      { step: '03', title: 'Zero-Downtime Migration', desc: 'Database live replication and phased traffic shifting via DNS weighted routing.' },
      { step: '04', title: '24/7 Telemetry & FinOps', desc: 'Datadog / Prometheus observability dashboards and automated anomaly alerts.' },
    ],
    technologies: [
      { name: 'Amazon Web Services (AWS)', category: 'Cloud' },
      { name: 'Google Cloud Platform (GCP)', category: 'Cloud' },
      { name: 'Kubernetes & Docker', category: 'Containers' },
      { name: 'Terraform', category: 'IaC' },
      { name: 'Prometheus & Grafana', category: 'Monitoring' },
      { name: 'Cloudflare Enterprise', category: 'Security' },
    ],
    caseStudy: {
      title: 'Fintech Cloud Modernization & AWS Cost Optimization',
      client: 'PayPulse Digital Payments',
      impact: 'Cut AWS monthly infrastructure expenditure by 38% while improving API throughput by 3.2x.',
      techSummary: 'AWS EKS, Terraform, Redis Enterprise Cluster, Aurora PostgreSQL Multi-AZ',
      metrics: [
        { label: 'Cloud Cost Cut', value: '-38%' },
        { label: 'Uptime SLA', value: '99.995%' },
        { label: 'Deployment Time', value: '< 4 Mins' },
      ],
    },
    startingTimeline: '2 - 8 Weeks',
    recommendedFor: 'Scale-ups, enterprise SaaS companies, and corporations seeking modernization or cloud cost reduction.',
  },
  {
    id: 'ai-solutions',
    name: 'AI Solutions & GenAI',
    tagline: 'Custom LLMs, Retrieval-Augmented Generation (RAG) & Computer Vision',
    shortDescription:
      'Enterprise generative AI agents, proprietary document intelligence, intelligent conversational concierges, predictive analytics, and edge computer vision.',
    fullDescription:
      'We turn artificial intelligence from an abstract buzzword into tangible ROI. From private LLM deployments running on enterprise knowledge bases to computer vision quality inspection models for assembly lines, Mahdev IT delivers secure, hallucination-free AI software.',
    iconName: 'Cpu',
    badge: 'Next-Gen Intelligence',
    problemsSolved: [
      'Employees wasting hours searching through thousands of PDF manuals, policies, and contracts',
      'Overwhelmed customer support teams unable to handle 24/7 multi-lingual inquiries',
      'Manual quality-control bottlenecks in manufacturing leading to defective product shipments',
      'Security risks of employees pasting confidential enterprise data into public consumer AI tools',
    ],
    features: [
      'Private Retrieval-Augmented Generation (RAG) querying your internal PDFs, ERP, and databases',
      'Gemini 2.5 Flash / Claude 3.5 Sonnet / OpenAI enterprise API pipelines with guardrails',
      'Fine-tuned open-source models (Llama 3, Mistral) hosted in your private cloud for zero data leakage',
      'Autonomous AI agent workflows executing multi-step business logic and database queries',
      'Computer vision models (YOLOv10, OpenCV) for defect detection, object counting, and ANPR',
      'Real-time voice and conversational bots with Sinhala, Tamil, and English multilingual NLP',
    ],
    process: [
      { step: '01', title: 'Data Readiness & Feasibility', desc: 'Evaluating document structure, vector embedding feasibility, and security bounds.' },
      { step: '02', title: 'Vector Pipeline & Guardrails', desc: 'Setting up Pinecone/pgvector, chunking strategies, and hallucination checks.' },
      { step: '03', title: 'Agent Integration', desc: 'Connecting LLM logic to your internal ERP APIs and Slack/WhatsApp channels.' },
      { step: '04', title: 'Evaluation & Continuous Tuning', desc: 'Ragas evaluation framework to track response accuracy and latency.' },
    ],
    technologies: [
      { name: 'Google Gemini Pro', category: 'LLM' },
      { name: 'Python / LangChain', category: 'Framework' },
      { name: 'pgvector / Pinecone', category: 'Vector DB' },
      { name: 'PyTorch / YOLO', category: 'Computer Vision' },
      { name: 'FastAPI', category: 'API' },
      { name: 'HuggingFace', category: 'Models' },
    ],
    caseStudy: {
      title: 'Automated Underwriting & Policy Document Intelligence',
      client: 'Alliance Shield General Insurance',
      impact: 'Automated 70% of routine claims document reviews, reducing turnaround from 4 days to 8 minutes.',
      techSummary: 'Private RAG Architecture, Gemini Multimodal Extraction, pgvector & FastAPI',
      metrics: [
        { label: 'Processing Time', value: '8 Mins' },
        { label: 'Extraction Accuracy', value: '99.2%' },
        { label: 'Cost per Claim', value: '-65%' },
      ],
    },
    startingTimeline: '3 - 8 Weeks',
    recommendedFor: 'Insurance firms, law practices, healthcare providers, manufacturers, and customer-first enterprises.',
  },
  {
    id: 'automation',
    name: 'Workflow & Process Automation',
    tagline: 'Robotic Process Automation (RPA), Zapier/Make & Custom Bots',
    shortDescription:
      'Eliminate repetitive manual tasks, automate cross-platform data synchronization, invoice parsing, and email workflows with custom Python scripts and RPA engines.',
    fullDescription:
      'Free your human talent from copy-pasting spreadsheet data. We map out repetitive operational steps across your organization and build resilient automated pipelines that execute instantly, accurately, and around the clock.',
    iconName: 'Zap',
    badge: 'Operational Speed',
    problemsSolved: [
      'Hundreds of hours wasted monthly on manual data entry across disparate software systems',
      'Inconsistent client onboarding and delayed quote turnaround due to manual approvals',
      'Human oversights resulting in forgotten invoice reminders and delayed accounts receivable',
      'Disorganized lead routing between Facebook ads, web forms, and sales team CRMs',
    ],
    features: [
      'Custom Python & Node.js headless automation bots for legacy desktop and web applications',
      'Automated optical character recognition (OCR) invoice reading and direct ledger booking',
      'Omnichannel lead capture with instant WhatsApp, SMS, and email CRM routing',
      'Scheduled data reconciliation engines detecting anomalies across banking and ERP records',
      'Webhook engineering connecting Stripe, PayHere, QuickBooks, Zoho, and Slack',
      'Audit dashboard with automated retry queues and instant error alerts to DevOps',
    ],
    process: [
      { step: '01', title: 'Workflow Mapping', desc: 'Screen recording and time-study analysis of manual employee routines.' },
      { step: '02', title: 'Bot Scripting & Exception Handling', desc: 'Writing fault-tolerant scripts with fallback handlers for system lag.' },
      { step: '03', title: 'Sandbox Simulation', desc: 'Simulating 1,000 synthetic transaction records to verify 100% data integrity.' },
      { step: '04', title: 'Continuous Execution', desc: 'Cron scheduling on serverless workers with Slack notification webhooks.' },
    ],
    technologies: [
      { name: 'Python / Playwright', category: 'RPA' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'n8n / Make / Zapier', category: 'Integration' },
      { name: 'AWS EventBridge', category: 'Scheduling' },
      { name: 'Tesseract OCR', category: 'Vision' },
    ],
    caseStudy: {
      title: 'Automated Bank Reconciliation & Supplier Payment Pipeline',
      client: 'Metropolitan Hardware Group',
      impact: 'Eliminated 120 manual accounting hours each month while removing 100% of duplicate payment errors.',
      techSummary: 'n8n Self-Hosted, Python Pandas Data Engine, Commercial Bank of Ceylon API',
      metrics: [
        { label: 'Monthly Hours Saved', value: '120+ Hours' },
        { label: 'Duplicate Payments', value: '0 Errors' },
        { label: 'Sync Frequency', value: 'Every 5 Mins' },
      ],
    },
    startingTimeline: '1 - 4 Weeks',
    recommendedFor: 'Finance departments, logistics teams, sales agencies, and growing SMBs.',
  },
  {
    id: 'it-consulting',
    name: 'IT Consulting & Architecture',
    tagline: 'Fractional CTO, Digital Transformation & Cybersecurity Audits',
    shortDescription:
      'Strategic technology roadmaps, legacy software modernization planning, vendor evaluations, and comprehensive ISO 27001 / SOC 2 security compliance advisory.',
    fullDescription:
      'Make technology investments with absolute confidence. Our veteran software architects and fractional CTOs provide objective, vendor-neutral advisory on technology selection, team hiring, disaster recovery, and enterprise cyber resilience.',
    iconName: 'Compass',
    badge: 'Strategic Advisory',
    problemsSolved: [
      'Unclear technology direction resulting in expensive failed software vendor contracts',
      'Fear of ransomware, database breaches, and lack of cybersecurity safeguards',
      'Technical debt paralyzing legacy systems and preventing business innovation',
      'Difficulty assessing engineering candidates and structuring in-house developer teams',
    ],
    features: [
      'Comprehensive Digital Maturity & Technical Debt Assessments with actionable scorecards',
      'Fractional CTO leadership attending board meetings and steering vendor negotiations',
      'Cybersecurity vulnerability scans, penetration testing, and ISO 27001 readiness audits',
      'Disaster Recovery (DR) and Business Continuity Plan (BCP) drafting and stress drills',
      'Software RFP (Request for Proposal) drafting, vendor scoring, and architectural sign-offs',
      'Developer hiring assistance, technical interview screening, and code quality benchmarks',
    ],
    process: [
      { step: '01', title: 'Stakeholder Deep Dive', desc: 'Executive interviews, pain-point mapping, and financial budget alignment.' },
      { step: '02', title: 'Technical Architecture Audit', desc: 'Deep dive into code repos, cloud infrastructure, database schemas, and licenses.' },
      { step: '03', title: 'Strategic Transformation Roadmap', desc: '12-to-36 month phased technology blueprint with Capex/Opex forecasts.' },
      { step: '04', title: 'Quarterly Governance Review', desc: 'Milestone tracking, vendor performance audits, and security re-evaluations.' },
    ],
    technologies: [
      { name: 'TOGAF Architecture', category: 'Framework' },
      { name: 'ISO 27001 / SOC2', category: 'Security' },
      { name: 'OWASP ZAP & BurpSuite', category: 'Auditing' },
      { name: 'LucidChart / C4 Model', category: 'Modeling' },
    ],
    caseStudy: {
      title: 'Digital Banking Transformation & ISO 27001 Certification',
      client: 'Seylan Micro Credit Fund',
      impact: 'Successfully transitioned legacy on-premise core to private cloud with zero security audit findings.',
      techSummary: 'C4 Architecture Blueprint, Zero-Trust Access Policies, Security Penetration Audits',
      metrics: [
        { label: 'Audit Vulnerabilities', value: 'Zero Highs' },
        { label: 'Capex Savings', value: '$140,000' },
        { label: 'Compliance', value: '100% Passed' },
      ],
    },
    startingTimeline: '2 - 6 Weeks Advisory',
    recommendedFor: 'C-suite executives, boards of directors, startups seeking series funding, and banks.',
  },
  {
    id: 'business-software',
    name: 'Custom Business Software',
    tagline: 'Tailored CRMs, Member Portals & Operational Dashboards',
    shortDescription:
      'Bespoke software systems designed from scratch around your specific business logic, customer lifecycle, and proprietary operational workflows.',
    fullDescription:
      'When commercial off-the-shelf software only solves 60% of your needs, Mahdev IT engineers the missing 40% with clean, maintainable, owned intellectual property. We build custom booking engines, member directories, and operational command centers.',
    iconName: 'Layers',
    badge: 'Tailor-Made',
    problemsSolved: [
      'Forcing complex business models into rigid third-party software that doesn’t fit',
      'Paying thousands in recurring monthly SaaS subscriptions for features never used',
      'No ownership or control over proprietary client data and system feature roadmaps',
      'Inability to integrate with custom in-house databases and local third-party APIs',
    ],
    features: [
      '100% custom-built UI/UX mapped directly to your daily employee and client interactions',
      'You own 100% of the source code, intellectual property, and database without recurring user fees',
      'Custom Customer Relationship Management (CRM) with deal stages and communication logs',
      'Client self-service portals for invoices, tickets, document uploads, and project approvals',
      'Interactive business intelligence dashboards with exportable Excel/PDF executive reports',
      'RESTful and GraphQL API layers for future third-party integrations and partner apps',
    ],
    process: [
      { step: '01', title: 'Logic Modeling', desc: 'Translating custom spreadsheets and manual rules into relational schemas.' },
      { step: '02', title: 'Interactive Prototype', desc: 'Figma interactive prototype approved before a single line of code is written.' },
      { step: '03', title: 'Incremental Feature Drops', desc: 'Releasing usable functional modules every 2 weeks for internal user validation.' },
      { step: '04', title: 'IP Handover & Deployment', desc: 'Full repository transfer, documentation wiki, and admin training.' },
    ],
    technologies: [
      { name: 'TypeScript', category: 'Language' },
      { name: 'React / Next.js', category: 'Frontend' },
      { name: 'NestJS / Express', category: 'Backend' },
      { name: 'PostgreSQL / Prisma', category: 'Database' },
      { name: 'Tailwind CSS', category: 'Styling' },
    ],
    caseStudy: {
      title: 'National Membership & License Accreditation Portal',
      client: 'Ceylon Association of Engineers',
      impact: 'Replaced 12 filing cabinets with automated online license renewals for 14,000 professional members.',
      techSummary: 'Next.js, NestJS, PayHere Payment Gateway, Automated PDF Certificate Signer',
      metrics: [
        { label: 'Members Enrolled', value: '14,000+' },
        { label: 'Renewal Turnaround', value: 'Instant' },
        { label: 'Admin Overhead', value: '-80%' },
      ],
    },
    startingTimeline: '4 - 12 Weeks',
    recommendedFor: 'Professional associations, clinics, logistics providers, real estate agencies, and custom businesses.',
  },
  {
    id: 'maintenance-support',
    name: 'Maintenance, SLA & 24/7 Support',
    tagline: 'Guaranteed Uptime, Security Patching & Dedicated DevOps Engineers',
    shortDescription:
      'Continuous uptime monitoring, weekly dependency updates, database optimization, emergency incident response, and ongoing feature enhancements.',
    fullDescription:
      'Software is a living organism. Our enterprise maintenance agreements provide you with dedicated engineers who monitor system performance, apply critical security patches before zero-day exploits strike, and resolve bugs within guaranteed SLA timeframes.',
    iconName: 'ShieldCheck',
    badge: 'Guaranteed SLA',
    problemsSolved: [
      'Websites and servers crashing in the middle of the night with no engineers on call',
      'Software gradually slowing down over time due to un-indexed databases and bloated logs',
      'Hackers exploiting unpatched vulnerabilities in CMS plugins and server packages',
      'Frustration when small bug fixes and text updates take weeks to get done',
    ],
    features: [
      '24/7/365 synthetic ping and uptime monitoring with instant SMS/PagerDuty engineer alerts',
      'Guaranteed 15-minute response SLA for critical production-down emergencies',
      'Weekly automated dependency security patching and regression test suites',
      'Database health indexing, query performance tuning, and automated off-site backups',
      'Dedicated monthly hours for continuous UI improvements, new features, and speed tuning',
      'Monthly executive health reports detailing uptime, security incidents, and traffic metrics',
    ],
    process: [
      { step: '01', title: 'Onboarding & Code Audit', desc: 'Codebase review, monitoring agent installation, and credential vaulting.' },
      { step: '02', title: 'Baseline Hardening', desc: 'Applying all pending security patches and setting up automated offsite backups.' },
      { step: '03', title: '24/7 Sentry & Datadog Monitoring', desc: 'Continuous error tracking with automated ticket generation.' },
      { step: '04', title: 'Monthly Sprint Review', desc: 'Dedicated hours spent implementing your backlog of enhancements.' },
    ],
    technologies: [
      { name: 'Datadog & Sentry', category: 'Monitoring' },
      { name: 'PagerDuty', category: 'Alerting' },
      { name: 'GitHub Actions', category: 'CI/CD' },
      { name: 'AWS Backup', category: 'Disaster Recovery' },
      { name: 'SonarQube', category: 'Code Quality' },
    ],
    caseStudy: {
      title: '24/7 Managed Infrastructure & Zero-Downtime Support',
      client: 'Lanka HealthNet Telemedicine',
      impact: 'Maintained 99.99% uptime over 36 consecutive months during a 600% surge in telemedicine consultations.',
      techSummary: 'Datadog APM, Automated Failover Clusters, 15-Minute Guaranteed Incident Response',
      metrics: [
        { label: '3-Year Uptime', value: '99.99%' },
        { label: 'Avg Incident Response', value: '8.4 Mins' },
        { label: 'Zero-Day Vulnerabilities', value: '0 Breaches' },
      ],
    },
    startingTimeline: 'Immediate Onboarding',
    recommendedFor: 'Any business operating mission-critical web applications, ERPs, or e-commerce stores.',
  },
];

export const IT_CASE_STUDIES: ITCaseStudy[] = [
  {
    id: 'case-1',
    title: 'Pan-Asian Logistics & Customs Clearance Portal',
    client: 'Apex Global Freight Ltd',
    clientIndustry: 'Supply Chain & Logistics',
    year: '2025',
    serviceId: 'web-development',
    summary:
      'Engineered a distributed container tracking and electronic customs clearance platform processing 38,000+ daily lookups across 4 international ports.',
    challenge:
      'Legacy monolith suffered from 4.2-second response delays and periodic database locks during customs manifest batch processing.',
    architecture: ['Next.js 15 App Router', 'Go Microservices', 'Apache Kafka', 'TimescaleDB', 'Docker / AWS EKS'],
    results: [
      { metric: '0.38s', label: 'Average Page Load' },
      { metric: '180ms', label: 'Tracking Lookup' },
      { metric: '99.99%', label: 'Platform Uptime' },
    ],
    testimonial: {
      quote:
        'Mahdev IT transformed our core logistics engine. What used to take our dispatchers 5 minutes of phone calls is now rendered instantly in the browser.',
      author: 'Sunil Wickramasinghe',
      role: 'Chief Operating Officer, Apex Freight',
    },
  },
  {
    id: 'case-2',
    title: 'Garment Manufacturing & Real-Time Production ERP',
    client: 'Lanka Apparel Creations Pvt Ltd',
    clientIndustry: 'Textiles & Export Apparel',
    year: '2024',
    serviceId: 'erp',
    summary:
      'Custom double-entry ERP connecting 14 production lines across 3 factories with computerized fabric cutting optimization and live wage calculations.',
    challenge:
      'Disconnected Excel spreadsheets led to 22% fabric wastage and delayed export shipment documentation.',
    architecture: ['Python / Django Core', 'PostgreSQL', 'Industrial Barcode Scanners', 'Redis Caching', 'Tailwind Dashboard'],
    results: [
      { metric: '-18.5%', label: 'Fabric Wastage Cut' },
      { metric: '450k+', label: 'Monthly Records' },
      { metric: 'Instant', label: 'RAMIS Tax Invoicing' },
    ],
    testimonial: {
      quote:
        'The ERP pays for itself every quarter purely through fabric scrap reduction and automated IRD tax compliance.',
      author: 'Dilshan Samarathunga',
      role: 'Managing Director, Lanka Apparel',
    },
  },
  {
    id: 'case-3',
    title: 'Automated Underwriting & Policy Document Intelligence',
    client: 'Alliance Shield General Insurance',
    clientIndustry: 'Fintech & Insurance',
    year: '2025',
    serviceId: 'ai-solutions',
    summary:
      'Multimodal AI document pipeline parsing handwritten claims, hospital medical bills, and accident police reports into structured JSON for instant adjudications.',
    challenge:
      'Claims adjusters spent an average of 4 business days manually cross-referencing multi-page hospital invoices against policy deductibles.',
    architecture: ['Google Gemini Multimodal API', 'FastAPI Microservice', 'pgvector', 'Next.js Claim Portal'],
    results: [
      { metric: '8 Mins', label: 'Avg Claim Review' },
      { metric: '99.2%', label: 'Extraction Precision' },
      { metric: '-65%', label: 'Cost Per Claim' },
    ],
    testimonial: {
      quote:
        'Our claim turnaround went from days to single-digit minutes. Customer trust in our insurance products has never been higher.',
      author: 'Ruwanthi Fernando',
      role: 'Head of Digital Innovation, Alliance Shield',
    },
  },
];
