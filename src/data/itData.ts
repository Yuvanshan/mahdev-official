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

export const IT_SERVICES: ITService[] = [];
export const IT_CASE_STUDIES: ITCaseStudy[] = [];
