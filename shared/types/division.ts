export type DivisionId = 'sws' | 'u1' | 'it' | 'travels' | 'mart';

export interface DivisionStat {
  label: string;
  value: string;
  subtext?: string;
}

export interface CoreServiceFeature {
  title: string;
  description: string;
  iconName?: string;
}

export interface DivisionConfig {
  id: DivisionId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  badge: string;
  isPrimary?: boolean;
  route: string;
  domainUrl?: string;
  logoUrl?: string;
  accentColor: string;
  gradient: string;
  image?: string;
  imageUrl?: string;
  heroHeadline: string;
  heroSubheadline: string;
  coreServices: CoreServiceFeature[];
  stats: DivisionStat[];
  contactEmail: string;
  contactPhone?: string;
  aboutHeading?: string;
  aboutText?: string;
  mission?: string;
  vision?: string;
  iconName: string;
}
