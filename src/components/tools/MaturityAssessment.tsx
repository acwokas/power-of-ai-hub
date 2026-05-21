import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  Download,
  RotateCcw,
  ShieldCheck,
  Scale,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  dimension: string;
  dimensionIndex: number;
  text: string;
  options: { level: number; label: string }[];
}

const dimensions = [
  'Decision Ownership',
  'Risk Management',
  'Performance Oversight',
  'Ethical Boundaries',
  'Accountability Structures',
];

const questions: Question[] = [
  {
    id: 1,
    dimension: 'Decision Ownership',
    dimensionIndex: 0,
    text: 'Are AI deployment decisions clearly owned by specific individuals or roles?',
    options: [
      { level: 1, label: 'No: AI decisions are made ad hoc by whoever is implementing' },
      { level: 2, label: 'Somewhat: ownership is informal and varies by project' },
      { level: 3, label: 'Yes: ownership is documented but not always followed' },
      { level: 4, label: 'Yes: clear ownership with documented approval processes' },
      { level: 5, label: 'Yes: ownership includes accountability metrics and review' },
    ],
  },
  {
    id: 2,
    dimension: 'Decision Ownership',
    dimensionIndex: 0,
    text: 'Is there a documented process for who approves AI deployments?',
    options: [
      { level: 1, label: 'No: approvals are informal or do not exist' },
      { level: 2, label: 'Partial: some projects require approval, others do not' },
      { level: 3, label: 'Yes: documented but approval criteria are unclear' },
      { level: 4, label: 'Yes: clear approval authority and criteria' },
      { level: 5, label: 'Yes: tiered approval based on risk with audit trail' },
    ],
  },
  {
    id: 3,
    dimension: 'Risk Management',
    dimensionIndex: 1,
    text: 'Are potential AI risks systematically identified before deployment?',
    options: [
      { level: 1, label: 'No: risks are addressed reactively when problems occur' },
      { level: 2, label: 'Sometimes: risks considered informally by teams' },
      { level: 3, label: 'Yes: risk assessment exists but not consistently applied' },
      { level: 4, label: 'Yes: structured risk assessment for all AI projects' },
      { level: 5, label: 'Yes: continuous risk monitoring with quantified metrics' },
    ],
  },
  {
    id: 4,
    dimension: 'Risk Management',
    dimensionIndex: 1,
    text: 'Do you have documented risk mitigation plans for AI deployments?',
    options: [
      { level: 1, label: 'No: we handle issues as they arise' },
      { level: 2, label: 'Informal: teams have their own approaches' },
      { level: 3, label: 'Partial: mitigation plans exist but are not comprehensive' },
      { level: 4, label: 'Yes: documented mitigation for known risks' },
      { level: 5, label: 'Yes: living mitigation plans updated based on monitoring' },
    ],
  },
  {
    id: 5,
    dimension: 'Risk Management',
    dimensionIndex: 1,
    text: 'Is there a process for escalating AI related risks?',
    options: [
      { level: 1, label: 'No: unclear who to escalate to' },
      { level: 2, label: 'Informal: escalation happens through normal channels' },
      { level: 3, label: 'Defined: escalation path exists but rarely used' },
      { level: 4, label: 'Active: clear escalation with defined triggers' },
      { level: 5, label: 'Proactive: risk escalation happens before incidents' },
    ],
  },
  {
    id: 6,
    dimension: 'Performance Oversight',
    dimensionIndex: 2,
    text: 'Are AI outputs reviewed by humans?',
    options: [
      { level: 1, label: 'Rarely: AI runs autonomously without review' },
      { level: 2, label: 'Ad hoc: review happens when someone notices issues' },
      { level: 3, label: 'Sometimes: review processes exist but inconsistently applied' },
      { level: 4, label: 'Regularly: scheduled review on defined cadence' },
      { level: 5, label: 'Continuous: real time monitoring with automated alerts' },
    ],
  },
  {
    id: 7,
    dimension: 'Performance Oversight',
    dimensionIndex: 2,
    text: 'Do you regularly measure how your AI systems perform against business outcomes in production, including accuracy, drift, and impact over time?',
    options: [
      { level: 1, label: 'No: we do not measure AI performance systematically' },
      { level: 2, label: 'Basic: we track some operational metrics' },
      { level: 3, label: 'Yes: metrics defined but not consistently monitored' },
      { level: 4, label: 'Yes: active monitoring with dashboards' },
      { level: 5, label: 'Yes: metrics tied to business outcomes with targets' },
    ],
  },
  {
    id: 8,
    dimension: 'Performance Oversight',
    dimensionIndex: 2,
    text: 'Is there accountability for ongoing AI performance?',
    options: [
      { level: 1, label: 'No: unclear who is responsible after deployment' },
      { level: 2, label: 'Informal: teams monitor their own implementations' },
      { level: 3, label: 'Assigned: someone owns it but accountability is loose' },
      { level: 4, label: 'Clear: defined ownership with regular reporting' },
      { level: 5, label: 'Measured: performance accountability with consequences' },
    ],
  },
  {
    id: 9,
    dimension: 'Ethical Boundaries',
    dimensionIndex: 3,
    text: 'Are ethical principles for AI use documented?',
    options: [
      { level: 1, label: 'No: ethics handled case by case' },
      { level: 2, label: 'Informal: shared understanding but not written' },
      { level: 3, label: 'Documented: principles exist but not operationalised' },
      { level: 4, label: 'Active: principles guide decisions with examples' },
      { level: 5, label: 'Embedded: principles integrated into all processes' },
    ],
  },
  {
    id: 10,
    dimension: 'Ethical Boundaries',
    dimensionIndex: 3,
    text: 'Is there a process for raising ethical concerns about AI?',
    options: [
      { level: 1, label: 'No: unclear how to raise concerns' },
      { level: 2, label: 'Informal: concerns raised through normal channels' },
      { level: 3, label: 'Exists: process documented but rarely used' },
      { level: 4, label: 'Active: clear process with responsive review' },
      { level: 5, label: 'Proactive: regular ethical reviews before issues arise' },
    ],
  },
  {
    id: 11,
    dimension: 'Accountability Structures',
    dimensionIndex: 4,
    text: 'Is it clear who is accountable when AI causes harm or errors?',
    options: [
      { level: 1, label: 'No: accountability is unclear or avoided' },
      { level: 2, label: 'Varies: depends on the situation' },
      { level: 3, label: 'Defined: roles exist but responsibility is diffuse' },
      { level: 4, label: 'Clear: specific accountability with investigation process' },
      { level: 5, label: 'Comprehensive: accountability with remediation and learning' },
    ],
  },
  {
    id: 12,
    dimension: 'Accountability Structures',
    dimensionIndex: 4,
    text: 'Are governance processes for AI documented and accessible?',
    options: [
      { level: 1, label: 'No: processes are informal or do not exist' },
      { level: 2, label: 'Partial: some documentation exists in scattered places' },
      { level: 3, label: 'Documented: processes exist but hard to find or follow' },
      { level: 4, label: 'Accessible: clear documentation that teams reference' },
      { level: 5, label: 'Living: documentation updated based on learnings' },
    ],
  },
];

const maturityLevels: Record<number, { label: string; description: string }> = {
  1: {
    label: 'Reactive',
    description:
      'Governance is ad hoc and reactive. AI decisions lack structure and oversight. High risk of issues.',
  },
  2: {
    label: 'Aware',
    description:
      'Some governance practices exist informally. Teams are aware of needs but processes are not documented. Inconsistent implementation.',
  },
  3: {
    label: 'Defined',
    description:
      'Governance processes are documented but not consistently followed. Good foundation, needs active management.',
  },
  4: {
    label: 'Managed',
    description:
      'Active governance with clear accountability. Processes followed with regular oversight. Best practices in place.',
  },
  5: {
    label: 'Optimised',
    description:
      'Continuous improvement culture. Governance is embedded, measured, and refined. Industry leading practices.',
  },
};

const dimensionCopy: Record<string, { covers: string; nextLevel: string; actions: [string, string] }> = {
  'Decision Ownership': {
    covers:
      'Who has the authority to approve, pause, or kill an AI deployment, and whether that authority is written down. Strong ownership means a named role can be pointed to for every model in production.',
    nextLevel:
      'A documented approval matrix tied to risk tier, with named accountable owners and a published process for raising or appealing decisions. Approvals are auditable and reviewed on a regular cadence.',
    actions: [
      'Publish a one page approval matrix that names the accountable owner for each AI use case, by risk tier.',
      'Add an approval log to every AI project so decisions, approvers, and dates are recoverable.',
    ],
  },
  'Risk Management': {
    covers:
      'How your organisation surfaces, documents, and mitigates AI specific risks across the lifecycle, including bias, model failure, data leakage, and downstream impact on customers or staff.',
    nextLevel:
      'A standard risk assessment template applied to every AI project, with living mitigation plans, defined escalation triggers, and quantified monitoring once systems are live.',
    actions: [
      'Adopt a single AI risk assessment template and run every active model through it within 60 days.',
      'Define and publish escalation triggers, who gets paged, what gets paused, and how decisions are logged.',
    ],
  },
  'Performance Oversight': {
    covers:
      'Whether AI outputs and models are actively measured against business outcomes, with humans in the loop where it matters and clear ownership for ongoing performance after launch.',
    nextLevel:
      'Live dashboards tracking accuracy, drift, and business impact, with named owners for each model in production and scheduled review cycles that change behaviour when metrics slip.',
    actions: [
      'Stand up a shared performance dashboard with three metrics per model: quality, drift, and business outcome.',
      'Assign a named performance owner for every production model and put a monthly review on the calendar.',
    ],
  },
  'Ethical Boundaries': {
    covers:
      'Whether your organisation has explicit principles for what AI should and should not be used for, and whether staff have a real way to raise concerns without friction or fear.',
    nextLevel:
      'Operationalised principles that show up in design reviews, a clearly published channel for raising ethical concerns, and a record of how concerns were handled and what changed as a result.',
    actions: [
      'Publish a short, plain English AI principles document and reference it in every new project brief.',
      'Set up a named channel for ethical concerns about AI, with a response SLA and quarterly summary to leadership.',
    ],
  },
  'Accountability Structures': {
    covers:
      'How clearly responsibility flows when something goes wrong with an AI system, and how discoverable your governance processes are to the people who need to follow them.',
    nextLevel:
      'A documented accountability map, a public process for incident review, and living governance documentation that teams actually use and update based on what they learn.',
    actions: [
      'Run a tabletop exercise on a hypothetical AI failure and document who would do what within the first 24 hours.',
      'Move governance documentation into a single, searchable home and set a quarterly review owner.',
    ],
  },
};

function getLevel(score: number): number {
  if (score >= 5) return 5;
  if (score >= 4) return 4;
  if (score >= 3) return 3;
  if (score >= 2) return 2;
  return 1;
}

function scoreColor(score: number): string {
  if (score >= 4) return 'text-emerald-400';
  if (score >= 3) return 'text-accent';
  if (score >= 2) return 'text-yellow-400';
  return 'text-red-400';
}

function barColor(score: number): string {
  if (score >= 4) return 'bg-emerald-400';
  if (score >= 3) return 'bg-accent';
  if (score >= 2) return 'bg-yellow-400';
  return 'bg-red-400';
}

type Phase = 'intro' | 'assessment' | 'results';

const roadmapLinks: Record<number, { text: string; href: string }> = {
  0: { text: 'Practice in Governance Review Simulator', href: '/tools/governance-review' },
  1: { text: 'Pressure-test risk decisions in the Decision Simulation', href: '/tools/decision-simulation' },
  2: { text: 'Build performance accountability via Governance Review', href: '/tools/governance-review' },
  3: { text: 'Stress-test ethical positions in Red Team Simulation', href: '/tools/red-team-simulation' },
  4: { text: 'Document escalation paths via Governance Review Simulator', href: '/tools/governance-review' },
};

const nextSteps: Record<string, string[]> = {
  foundation: [
    'Document AI decision owners and approval process',
    'Create a basic risk checklist for AI projects',
    'Define minimum review requirements for AI outputs',
    'Schedule the first governance review meeting',
  ],
  consistency: [
    'Audit adherence to documented processes',
    'Establish accountability metrics',
    'Create escalation procedures',
    'Train teams on governance processes',
  ],
  optimisation: [
    'Implement a continuous improvement cycle',
    'Benchmark against industry standards',
    'Develop governance maturity metrics',
    'Share best practices across the organisation',
  ],
};

const brandedLevelLabels: Record<string, string> = {
  Emerging: 'Emerging',
  Developing: 'Developing',
  Established: 'Established',
  Leading: 'Leading',
};

function brandedLevelFromPercent(percent: number): string {
  if (percent >= 76) return 'Leading';
  if (percent >= 51) return 'Established';
  if (percent >= 26) return 'Developing';
  return 'Emerging';
}

const brandedLevelDescription: Record<string, string> = {
  Emerging:
    'Your organisation is at the start of its AI governance journey. Most decisions are made ad hoc, ownership is unclear, and risk management is reactive. This is a normal place to be, and the good news is that even small steps will produce a disproportionate amount of clarity. The priority is to put the basics in writing: who owns what, how decisions get made, and what happens when something goes wrong.',
  Developing:
    'You have begun to put governance scaffolding in place but it is not yet consistent across the organisation. Some teams have processes, others do not, and adherence to documented practice is patchy. The next move is to standardise: pick the practices that work, make them the default, and put light weight oversight in place so that you can see where they are and are not being followed.',
  Established:
    'AI governance is documented, owned, and applied across most of the organisation. You have moved past firefighting and into managing AI as a real operational capability. The opportunity now is to sharpen the feedback loop: measure performance against business outcomes, close gaps quickly, and start to differentiate your approach by risk tier rather than treating every AI use case the same.',
  Leading:
    'You are operating at the top of the maturity curve. Governance is embedded in how the organisation builds, ships, and runs AI, with accountability that is real and measured. The work from here is to keep raising the bar, to share what you have learned externally, and to make sure your governance can flex as the technology and the regulatory environment change underneath you.',
};

const brandedNextSteps: Record<string, [string, string, string]> = {
  Emerging: [
    'Document every AI use case currently live or in pilot, including business owner and data sources.',
    'Appoint a single accountable owner for AI governance with executive sponsorship.',
    'Publish a one page acceptable use statement covering employee use of public AI tools.',
  ],
  Developing: [
    'Stand up a cross functional AI review board that signs off on every new use case.',
    'Build a risk classification rubric that scores AI projects by data sensitivity, decision impact, and customer exposure.',
    'Add AI risk to your existing enterprise risk register with named owners and review cadence.',
  ],
  Established: [
    'Roll out continuous performance monitoring for production AI systems including drift, accuracy, and fairness metrics.',
    'Mature your vendor due diligence to cover model provenance, training data, and exit clauses.',
    'Pilot AI literacy training across leadership and decision making functions, not just data teams.',
  ],
  Leading: [
    'Publish an external AI transparency report covering governance principles, oversight structures, and incident disclosure.',
    'Contribute to industry level standards or regulatory consultations relevant to your sector.',
    'Build a continuous red teaming function to stress test your AI systems against adversarial use and misuse cases.',
  ],
};

const COLOR_NAVY = '#14264C';
const COLOR_CREAM = '#F4ECD8';
const COLOR_GOLD = '#D89A55';

function formatDateLong(d: Date): string {
  const day = d.getDate();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

export default function MaturityAssessment() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answer = (questionId: number, level: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: level }));
  };

  const dimensionScores = useMemo(() => {
    return dimensions.map((_, i) => {
      const qs = questions.filter((q) => q.dimensionIndex === i);
      const answered = qs.filter((q) => answers[q.id] !== undefined);
      if (answered.length === 0) return 0;
      const sum = answered.reduce((acc, q) => acc + (answers[q.id] ?? 1), 0);
      return Math.round((sum / qs.length) * 10) / 10;
    });
  }, [answers]);

  const overallScore = useMemo(() => {
    const valid = dimensionScores.filter((s) => s > 0);
    if (valid.length === 0) return 0;
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
  }, [dimensionScores]);

  const overallLevel = getLevel(overallScore);
  const allAnswered = Object.keys(answers).length === questions.length;
  const q = questions[currentQ];

  const validScores = dimensionScores.filter((s) => s > 0);
  const minScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  const lowestDimIndex = dimensionScores.indexOf(minScore);

  const activeSteps =
    overallLevel <= 2 ? nextSteps.foundation : overallLevel <= 3 ? nextSteps.consistency : nextSteps.optimisation;

  const handleDownload = async () => {
    try {
      const jspdfMod: any = await import('jspdf');
      const JsPDFCtor: any = jspdfMod.jsPDF || jspdfMod.default;
      const doc = new JsPDFCtor({ unit: 'pt', format: 'a4' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const today = new Date();

      const overallPercent = Math.round((overallScore / 5) * 100);
      const brandedLevel = brandedLevelFromPercent(overallPercent);

      const paintPageBackground = () => {
        doc.setFillColor(COLOR_CREAM);
        doc.rect(0, 0, pageW, pageH, 'F');
        doc.setTextColor(COLOR_NAVY);
      };

      const drawFooter = () => {
        const y = pageH - 36;
        const segW = pageW / 3;
        doc.setFillColor(COLOR_NAVY);
        doc.rect(0, y, segW, 4, 'F');
        doc.setFillColor(COLOR_CREAM);
        doc.rect(segW, y, segW, 4, 'F');
        doc.setFillColor(COLOR_GOLD);
        doc.rect(segW * 2, y, segW, 4, 'F');
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLOR_NAVY);
        doc.text('democratising.ai', pageW / 2, y + 22, { align: 'center' });
      };

      const goldRule = (y: number, leftPad = 60, rightPad = 60) => {
        doc.setDrawColor(COLOR_GOLD);
        doc.setLineWidth(1);
        doc.line(leftPad, y, pageW - rightPad, y);
      };

      const wrapText = (text: string, maxWidth: number, fontSize: number, font: 'times' | 'helvetica', style: 'normal' | 'bold' = 'normal') => {
        doc.setFont(font, style);
        doc.setFontSize(fontSize);
        return doc.splitTextToSize(text, maxWidth) as string[];
      };

      // COVER PAGE
      paintPageBackground();

      // Top left wordmark
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLOR_NAVY);
      doc.text('democratising.ai', 60, 60);

      // Title centered
      doc.setFont('times', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(COLOR_NAVY);
      doc.text('AI Governance', pageW / 2, 160, { align: 'center' });
      doc.text('Maturity Assessment', pageW / 2, 200, { align: 'center' });

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(COLOR_NAVY);
      doc.text('Completed ' + formatDateLong(today), pageW / 2, 232, { align: 'center' });

      // Radar chart for the 5 dimensions
      const cx = pageW / 2;
      const cy = 470;
      const radius = 150;
      const n = dimensions.length;
      const angles: number[] = [];
      for (let i = 0; i < n; i++) {
        angles.push(-Math.PI / 2 + (2 * Math.PI * i) / n);
      }

      // Grid rings
      doc.setDrawColor(COLOR_NAVY);
      doc.setLineWidth(0.4);
      for (let ring = 1; ring <= 5; ring++) {
        const r = (radius * ring) / 5;
        const pts: [number, number][] = angles.map((a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
        for (let i = 0; i < n; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % n];
          doc.line(a[0], a[1], b[0], b[1]);
        }
      }

      // Axes
      doc.setDrawColor(COLOR_NAVY);
      doc.setLineWidth(0.6);
      angles.forEach((a) => {
        doc.line(cx, cy, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      });

      // Score polygon
      const scorePts: [number, number][] = angles.map((a, i) => {
        const s = Math.max(dimensionScores[i], 0.2);
        const r = (radius * s) / 5;
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      });

      // Fill polygon with gold at low opacity
      doc.setFillColor(216, 154, 85);
      try {
        doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
      } catch (e) {
        // ignore if GState unsupported
      }
      doc.lines(
        scorePts.map((p, i) => {
          const next = scorePts[(i + 1) % scorePts.length];
          return [next[0] - p[0], next[1] - p[1]];
        }),
        scorePts[0][0],
        scorePts[0][1],
        [1, 1],
        'F',
        true,
      );
      try {
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
      } catch (e) { /* noop */ }

      // Outline polygon in navy
      doc.setDrawColor(COLOR_NAVY);
      doc.setLineWidth(1.5);
      for (let i = 0; i < scorePts.length; i++) {
        const a = scorePts[i];
        const b = scorePts[(i + 1) % scorePts.length];
        doc.line(a[0], a[1], b[0], b[1]);
      }

      // Dimension labels around radar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_NAVY);
      dimensions.forEach((dim, i) => {
        const a = angles[i];
        const lx = cx + Math.cos(a) * (radius + 22);
        const ly = cy + Math.sin(a) * (radius + 22);
        const lines = doc.splitTextToSize(dim, 110) as string[];
        const align: 'left' | 'right' | 'center' = Math.cos(a) > 0.2 ? 'left' : Math.cos(a) < -0.2 ? 'right' : 'center';
        lines.forEach((ln, li) => {
          doc.text(ln, lx, ly + li * 11, { align });
        });
      });

      drawFooter();

      // PAGE 2: Headline result
      doc.addPage();
      paintPageBackground();

      doc.setFont('times', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(COLOR_NAVY);
      const headerLines = wrapText('Your AI Governance Maturity: ' + brandedLevel, pageW - 120, 24, 'times', 'bold');
      let yCursor = 90;
      headerLines.forEach((ln) => {
        doc.text(ln, 60, yCursor);
        yCursor += 30;
      });

      goldRule(yCursor + 4);
      yCursor += 24;

      // Maturity descriptor
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(COLOR_NAVY);
      const summary = brandedLevelDescription[brandedLevel];
      const summaryLines = doc.splitTextToSize(summary, pageW - 120) as string[];
      summaryLines.forEach((ln) => {
        doc.text(ln, 60, yCursor, { align: 'justify', maxWidth: pageW - 120 });
        yCursor += 16;
      });

      yCursor += 12;

      // Also show numeric score callout
      doc.setDrawColor(COLOR_GOLD);
      doc.setLineWidth(1);
      doc.setFillColor(COLOR_CREAM);
      const calloutW = pageW - 120;
      doc.roundedRect(60, yCursor, calloutW, 56, 6, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(COLOR_NAVY);
      doc.text('Overall score: ' + overallScore.toFixed(1) + ' of 5.0 (' + overallPercent + '%)', 72, yCursor + 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Internal maturity tier: Level ' + overallLevel + ', ' + maturityLevels[overallLevel].label, 72, yCursor + 42);
      yCursor += 80;

      // Three next steps
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLOR_GOLD);
      doc.text('Three next steps for you:', 60, yCursor);
      yCursor += 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(COLOR_NAVY);
      const steps = brandedNextSteps[brandedLevel];
      steps.forEach((step, idx) => {
        const label = idx + 1 + '. ';
        const stepLines = doc.splitTextToSize(label + step, pageW - 140) as string[];
        stepLines.forEach((ln, li) => {
          doc.text(ln, 60 + (li === 0 ? 0 : 14), yCursor);
          yCursor += 16;
        });
        yCursor += 6;
      });

      drawFooter();

      // PAGES 3 to 7: Per dimension breakdowns
      dimensions.forEach((dim, i) => {
        doc.addPage();
        paintPageBackground();

        // Dimension name centered top
        doc.setFont('times', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(COLOR_NAVY);
        doc.text(dim, pageW / 2, 90, { align: 'center' });

        // Score callout
        const score = dimensionScores[i];
        const lvl = getLevel(score);
        const calloutY = 110;
        const calloutWidth = 260;
        const calloutX = (pageW - calloutWidth) / 2;
        doc.setDrawColor(COLOR_GOLD);
        doc.setLineWidth(1.5);
        doc.setFillColor(COLOR_CREAM);
        doc.roundedRect(calloutX, calloutY, calloutWidth, 52, 6, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLOR_NAVY);
        doc.text('Your score: ' + score.toFixed(1) + ' / 5.0', pageW / 2, calloutY + 22, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Level ' + lvl + ', ' + maturityLevels[lvl].label, pageW / 2, calloutY + 40, { align: 'center' });

        let yc = calloutY + 90;

        const copy = dimensionCopy[dim];

        // Section header pattern: subtitle, short gold rule under it (same x start), body
        const drawSubhead = (label: string) => {
          doc.setFont('times', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(COLOR_GOLD);
          doc.text(label, 60, yc);
          yc += 4;
          // Short gold rule, starts at x=60 (same as subtitle), 36pt long
          doc.setDrawColor(COLOR_GOLD);
          doc.setLineWidth(1);
          doc.line(60, yc, 96, yc);
          yc += 14;
        };

        drawSubhead('What this covers');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_NAVY);
        const coversLines = doc.splitTextToSize(copy.covers, pageW - 120) as string[];
        coversLines.forEach((ln) => { doc.text(ln, 60, yc); yc += 15; });
        yc += 18;

        drawSubhead('What good looks like at the next level');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_NAVY);
        const nextLines = doc.splitTextToSize(copy.nextLevel, pageW - 120) as string[];
        nextLines.forEach((ln) => { doc.text(ln, 60, yc); yc += 15; });
        yc += 18;

        drawSubhead('Two recommended actions');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_NAVY);
        copy.actions.forEach((act, idx) => {
          const text = (idx + 1) + '. ' + act;
          const actLines = doc.splitTextToSize(text, pageW - 140) as string[];
          actLines.forEach((ln, li) => {
            doc.text(ln, 60 + (li === 0 ? 0 : 14), yc);
            yc += 15;
          });
          yc += 6;
        });

        drawFooter();
      });

      // SUMMARY PAGE: Your next 90 days
      doc.addPage();
      paintPageBackground();

      doc.setFont('times', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(COLOR_NAVY);
      doc.text('Your next 90 days', pageW / 2, 90, { align: 'center' });

      // Pick three sets of actions from brandedNextSteps tiered by horizon.
      // First 30 days = take user's brandedNextSteps for current tier.
      // Next 60 days = take the tier ABOVE current (or same if at top).
      // By day 90 = take Leading-tier actions (or near it).
      const summarySteps = brandedNextSteps[brandedLevel];
      const tierOrder: string[] = ['Emerging', 'Developing', 'Established', 'Leading'];
      const currentIdx = tierOrder.indexOf(brandedLevel);
      const nextIdx = Math.min(currentIdx + 1, tierOrder.length - 1);
      const stretchIdx = Math.min(currentIdx + 2, tierOrder.length - 1);
      const nextSteps60 = brandedNextSteps[tierOrder[nextIdx]];
      const nextSteps90 = brandedNextSteps[tierOrder[stretchIdx]];

      let sy = 140;
      const drawHorizonHead = (label: string) => {
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(COLOR_GOLD);
        doc.text(label, 60, sy);
        sy += 4;
        doc.setDrawColor(COLOR_GOLD);
        doc.setLineWidth(1);
        doc.line(60, sy, 96, sy);
        sy += 14;
      };
      const drawHorizonBody = (items: string[], maxN: number) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_NAVY);
        items.slice(0, maxN).forEach((it, i) => {
          const label = (i + 1) + '. ';
          const lines = doc.splitTextToSize(label + it, pageW - 140) as string[];
          lines.forEach((ln, li) => {
            doc.text(ln, 60 + (li === 0 ? 0 : 14), sy);
            sy += 15;
          });
          sy += 4;
        });
        sy += 8;
      };

      drawHorizonHead('First 30 days');
      drawHorizonBody(summarySteps, 3);

      drawHorizonHead('Next 60 days');
      drawHorizonBody(nextSteps60, 3);

      drawHorizonHead('By day 90');
      drawHorizonBody(nextSteps90, 3);

      // Closing navy callout
      const closingTexts: Record<string, string> = {
        Emerging: 'AI governance is a continuous capability, not a one time audit. Starting from Emerging is a clean slate. The work now is rhythm, not heroics.',
        Developing: 'AI governance is a continuous capability, not a one time audit. The Developing tier you are at means foundations are forming. The work now is rhythm, not heroics.',
        Established: 'AI governance is a continuous capability, not a one time audit. The Established tier you are at is a strong foundation. The work now is rhythm, not heroics.',
        Leading: 'AI governance is a continuous capability, not a one time audit. The Leading tier you are at means you set the bar for others. The work now is rhythm, not heroics.',
      };
      const closingText = closingTexts[brandedLevel];
      const calloutH = 80;
      const calloutY2 = pageH - 60 - calloutH - 36;
      doc.setFillColor(COLOR_NAVY);
      doc.roundedRect(60, calloutY2, pageW - 120, calloutH, 4, 4, 'F');
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(COLOR_CREAM);
      const ctLines = doc.splitTextToSize(closingText, pageW - 160) as string[];
      let cty = calloutY2 + 26;
      ctLines.forEach((ln) => { doc.text(ln, pageW / 2, cty, { align: 'center' }); cty += 16; });

      drawFooter();

      // FINAL PAGE: CTAs
      doc.addPage();
      paintPageBackground();

      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(COLOR_NAVY);
      doc.text('Continue your AI governance journey', pageW / 2, 100, { align: 'center' });

      goldRule(120);

      const ctas: { title: string; url: string; blurb: string }[] = [
        {
          title: 'Apply for the AI Operator Cohort',
          url: 'https://aiacademy.asia/cohort',
          blurb: 'A small group programme for senior leaders putting AI to work in real organisations.',
        },
        {
          title: 'Subscribe to the daily AI briefing',
          url: 'https://withthepowerof.ai',
          blurb: 'Three things you need to know about AI, in your inbox before 9am.',
        },
        {
          title: 'Brief a corporate engagement',
          url: 'https://adrianwatkins.com/contact',
          blurb: 'Workshops, advisory work, and keynote briefings for boards and leadership teams.',
        },
      ];

      let cy2 = 150;
      ctas.forEach((cta) => {
        const cardX = 60;
        const cardW = pageW - 120;
        const cardH = 86;
        doc.setDrawColor(COLOR_GOLD);
        doc.setLineWidth(1);
        doc.setFillColor(COLOR_CREAM);
        doc.roundedRect(cardX, cy2, cardW, cardH, 6, 6, 'FD');

        doc.setFont('times', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COLOR_NAVY);
        doc.text(cta.title, cardX + 16, cy2 + 24);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLOR_NAVY);
        const blurbLines = doc.splitTextToSize(cta.blurb, cardW - 32) as string[];
        let by = cy2 + 42;
        blurbLines.forEach((ln) => { doc.text(ln, cardX + 16, by); by += 13; });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLOR_NAVY);
        const urlY = cy2 + cardH - 12;
        doc.textWithLink(cta.url, cardX + 16, urlY, { url: cta.url });
        // underline
        const urlW = doc.getTextWidth(cta.url);
        doc.setDrawColor(COLOR_NAVY);
        doc.setLineWidth(0.5);
        doc.line(cardX + 16, urlY + 1.5, cardX + 16 + urlW, urlY + 1.5);

        cy2 += cardH + 16;
      });

      // Footer line above standard footer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(COLOR_NAVY);
      doc.text('Democratising AI for the people who actually run things.', pageW / 2, pageH - 60, { align: 'center' });

      drawFooter();

      const filename = 'ai-governance-maturity-' + isoDate(today) + '.pdf';
      doc.save(filename);
    } catch (err) {
      console.error('PDF generation failed', err);
      alert('Sorry, the PDF could not be generated. Please try again or refresh the page.');
    }
  };

  const restart = () => {
    setPhase('intro');
    setCurrentQ(0);
    setAnswers({});
  };

  if (phase === 'intro') {
    const descs = [
      'Clarity about who owns AI decisions',
      'How AI risks are identified and mitigated',
      'How AI outputs are reviewed and measured',
      'How ethical concerns are addressed',
      'How responsibility is established',
    ];
    return (
      <div className="space-y-6">
        <div className="p-6 md:p-8 bg-card border border-border/30 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This 12 question assessment evaluates your organisation's AI governance maturity across five dimensions:
          </p>
          <ol className="space-y-2">
            {dimensions.map((d, i) => (
              <li key={d} className="text-sm text-muted-foreground flex items-start gap-3 pl-4">
                <span className="text-accent/60 font-medium shrink-0">{i + 1}.</span>
                <span>
                  <span className="font-medium text-foreground/80">{d}</span>: {descs[i]}
                </span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Takes 5 to 10 minutes. Results are private and provide a personalised roadmap.
          </p>
          <div className="flex items-start gap-2 text-sm text-muted-foreground/70">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-accent/60" />
            <span>Assessment scores are calculated in your browser and never stored on servers.</span>
          </div>
        </div>
        <Button variant="hero" size="default" onClick={() => setPhase('assessment')}>
          Start assessment <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    );
  }

  if (phase === 'assessment') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {currentQ + 1} of {questions.length}
          </span>
          <span className="text-accent/70">{q.dimension}</span>
        </div>
        <div className="w-full h-1 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8 bg-card border border-border/30 space-y-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-[10px] tracking-wide uppercase font-normal text-muted-foreground border border-border/40 rounded-sm px-2 py-1">
              {q.dimension}
            </span>
          </div>
          <h2 className="text-base md:text-lg font-medium leading-relaxed">{q.text}</h2>
          <div className="space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt.level}
                onClick={() => answer(q.id, opt.level)}
                className={cn(
                  'w-full text-left p-3.5 text-sm border rounded-sm transition-all',
                  answers[q.id] === opt.level
                    ? 'bg-accent/10 border-accent/40 text-foreground'
                    : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground',
                )}
              >
                <span className="font-medium text-accent/60 mr-2">Level {opt.level}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Previous
          </Button>
          <div className="flex gap-2">
            {!answers[q.id] && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  answer(q.id, 1);
                  if (currentQ < questions.length - 1) setCurrentQ((p) => p + 1);
                }}
                className="text-muted-foreground/50"
              >
                Skip
              </Button>
            )}
            {currentQ < questions.length - 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQ((p) => p + 1)}
                disabled={!answers[q.id]}
              >
                Next <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button variant="hero" size="sm" onClick={() => setPhase('results')} disabled={!allAnswered}>
                Calculate maturity score <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-1 justify-center pt-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                i === currentQ ? 'bg-accent scale-125' : answers[questions[i].id] ? 'bg-accent/40' : 'bg-secondary',
              )}
              aria-label={`Jump to question ${i + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="p-6 md:p-8 bg-card border border-border/30 text-center space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Your AI Governance Maturity</p>
        <div className="space-y-1">
          <p className={cn('text-5xl md:text-6xl font-bold', scoreColor(overallScore))}>{overallScore}</p>
          <p className="text-sm text-muted-foreground">out of 5.0</p>
        </div>
        <span className="inline-flex items-center text-sm px-4 py-1 font-medium border border-border/40 rounded-sm">
          Level {overallLevel}: {maturityLevels[overallLevel].label}
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[500px] mx-auto">
          {maturityLevels[overallLevel].description}
        </p>
      </div>

      <div className="p-6 md:p-8 bg-card border border-border/30 space-y-5">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground/50">Dimension Breakdown</h3>
        <div className="space-y-4">
          {dimensions.map((dim, i) => {
            const score = dimensionScores[i];
            const lvl = getLevel(score);
            return (
              <div key={dim} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80 font-medium">{dim}</span>
                  <span className={cn('font-medium', scoreColor(score))}>{score} / 5.0</span>
                </div>
                <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', barColor(score))}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground/50">
                  Level {lvl}: {maturityLevels[lvl].label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 md:p-8 bg-card border border-border/30 space-y-5">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground/50">Personalised Roadmap</h3>

        <div className="p-4 border border-accent/20 bg-accent/5 rounded-sm space-y-2">
          <p className="text-xs uppercase tracking-widest text-accent font-medium">Start here</p>
          <p className="text-sm text-foreground">
            Your weakest area is <span className="font-medium">{dimensions[lowestDimIndex]}</span>{' '}
            <span className="text-muted-foreground">({dimensionScores[lowestDimIndex]} / 5.0)</span>
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={roadmapLinks[lowestDimIndex].href}>
              {roadmapLinks[lowestDimIndex].text} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
        </div>

        {dimensionScores.some((s) => s >= 2 && s < 3) && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Quick wins</p>
            <p className="text-sm text-muted-foreground">
              These dimensions are partially developed and are easiest to improve:
            </p>
            <ul className="space-y-1.5">
              {dimensions.map((d, i) =>
                dimensionScores[i] >= 2 && dimensionScores[i] < 3 ? (
                  <li key={d} className="text-sm text-muted-foreground flex items-start gap-2 pl-4">
                    <span className="w-1 h-1 rounded-full bg-yellow-400 shrink-0 mt-2" />
                    <span>
                      <span className="font-medium text-foreground/80">{d}</span>: {dimensionScores[i]} / 5.0
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

        {dimensionScores.some((s) => s > 0 && s < 2) && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Critical gaps</p>
            <ul className="space-y-1.5">
              {dimensions.map((d, i) =>
                dimensionScores[i] > 0 && dimensionScores[i] < 2 ? (
                  <li key={d} className="text-sm text-muted-foreground flex items-start gap-2 pl-4">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0 mt-2" />
                    <span>
                      <span className="font-medium text-foreground/80">{d}</span>, {dimensionScores[i]} / 5.0, requires investment
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8 bg-card border border-border/30 space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground/50">Recommended Tools</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {(dimensionScores[0] < 3 || dimensionScores[2] < 3 || dimensionScores[4] < 3) && (
            <a
              href="/tools/governance-review"
              className="p-4 border border-border/30 hover:border-accent/30 transition-colors group space-y-2 block"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium group-hover:text-accent transition-colors">
                  Governance Review Simulator
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Practise defending ownership, oversight, and accountability structures.
              </p>
            </a>
          )}
          {(dimensionScores[1] < 3 || dimensionScores[3] < 3) && (
            <a
              href="/tools/red-team-simulation"
              className="p-4 border border-border/30 hover:border-accent/30 transition-colors group space-y-2 block"
            >
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium group-hover:text-accent transition-colors">Red Team Simulation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Stress-test risk and ethical positions before they hit the real world.
              </p>
            </a>
          )}
        </div>
      </div>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left py-3 border-t border-border/20 group">
          <span className="text-sm font-medium">Next steps checklist</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-2 py-4">
            {activeSteps.map((step) => (
              <li key={step} className="text-sm text-muted-foreground flex items-start gap-2 pl-4">
                <span className="w-1 h-1 rounded-full bg-accent/60 shrink-0 mt-2" />
                {step}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-4 border-t border-border/20">
        <div
          role="note"
          className="rounded-sm overflow-hidden"
          style={{
            background: '#F4ECD8',
            borderLeft: '2px solid #D89A55',
            padding: '16px',
            borderRadius: '4px',
            color: '#14264C',
          }}
          data-testid="closing-callout"
        >
          <div className="flex items-start gap-3" style={{ fontSize: '15px', lineHeight: '1.55' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D89A55"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p style={{ margin: 0 }}>
              Your results are not saved between sessions. Download the report below to keep a copy.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4" style={{ marginLeft: '32px' }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                background: '#14264C',
                color: '#F4ECD8',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
              }}
              data-testid="download-report"
            >
              Download Report
            </button>
            <a
              href="https://democratising.ai/edge"
              style={{
                background: 'transparent',
                color: '#14264C',
                padding: '12px 24px',
                borderRadius: '4px',
                border: '2px solid #D89A55',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '14px',
                display: 'inline-block',
                lineHeight: '1.2',
              }}
            >
              Continue your AI governance journey
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake assessment
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/tools">
            Explore EDGE tools <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </a>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground/60 flex items-center gap-2 pt-2">
        <ClipboardCheck className="h-3.5 w-3.5" />
        Results are calculated in your browser. Nothing is sent or stored remotely.
      </p>
    </div>
  );
}
