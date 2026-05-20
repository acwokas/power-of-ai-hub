export type Pillar = 'Evaluate' | 'Define' | 'Govern' | 'Elevate';

export interface Tool {
  slug: string;
  title: string;
  pillar: Pillar;
  description: string;
  status: 'live' | 'coming-soon';
}

export const tools: Tool[] = [
  {
    slug: 'maturity-assessment',
    title: 'Maturity Assessment',
    pillar: 'Evaluate',
    description: 'Diagnose where your organisation sits on the AI maturity curve.',
    status: 'live',
  },
  {
    slug: 'decision-simulation',
    title: 'Decision Simulation',
    pillar: 'Evaluate',
    description: 'Pressure-test a decision before you make it.',
    status: 'live',
  },
  {
    slug: 'before-you-send',
    title: 'Before You Send',
    pillar: 'Evaluate',
    description: 'Sharpen a message before it leaves your hands.',
    status: 'live',
  },
  {
    slug: 'brand-palette',
    title: 'Brand Palette',
    pillar: 'Define',
    description: 'Lock the visual language of your brand into one source of truth.',
    status: 'live',
  },
  {
    slug: 'brand-profile-generator',
    title: 'Brand Profile Generator',
    pillar: 'Define',
    description: 'Define how your brand thinks, sounds, and behaves.',
    status: 'live',
  },
  {
    slug: 'conversation-simulator',
    title: 'Conversation Simulator',
    pillar: 'Define',
    description: 'Rehearse a difficult conversation before it happens for real.',
    status: 'live',
  },
  {
    slug: 'governance-review',
    title: 'Governance Review',
    pillar: 'Govern',
    description: 'Surface gaps in how AI is being used inside your organisation.',
    status: 'live',
  },
  {
    slug: 'ethical-dilemma',
    title: 'Ethical Dilemma',
    pillar: 'Govern',
    description: 'Work through a values-driven tradeoff with structured prompts.',
    status: 'live',
  },
  {
    slug: 'red-team-simulation',
    title: 'Red Team Simulation',
    pillar: 'Govern',
    description: 'Stress-test a plan from the perspective of someone trying to break it.',
    status: 'live',
  },
  {
    slug: 'prompt-engineer',
    title: 'Prompt Engineer',
    pillar: 'Elevate',
    description: 'Generate, optimise, and adapt prompts for better AI results.',
    status: 'live',
  },
  {
    slug: 'content-sprint-generator',
    title: 'Content Sprint Generator',
    pillar: 'Elevate',
    description: 'Plan a focused content sprint with a clear narrative spine.',
    status: 'live',
  },
  {
    slug: 'negotiation-simulator',
    title: 'Negotiation Simulator',
    pillar: 'Elevate',
    description: 'Run a negotiation drill against a structured counterpart.',
    status: 'live',
  },
];
