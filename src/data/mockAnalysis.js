/**
 * NORTHSTAR Mock Analysis Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates structured, contextually-aware mock results for Phase 1B.
 * Parses plan text for key signals (timelines, budgets, domain, team, goals)
 * to produce analysis that feels tailored to the actual plan entered.
 *
 * NOTE: This is a local mock. No AI/API calls are made here.
 * Replace generation functions with Gemini calls in Phase 2.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Signal Extraction ───────────────────────────────────────────────────────

function extractSignals(planText) {
  const text = planText.toLowerCase();

  const timelineMatch = planText.match(/(\d+)\s*(month|week|year|day)/i);
  const timeline = timelineMatch ? `${timelineMatch[1]} ${timelineMatch[2]}s` : null;

  const budgetMatch = planText.match(/[₹$£€][\d,]+[kKlL]?|\d+[kK]\s*(usd|eur|inr|gbp|rupee|dollar)/i);
  const budget = budgetMatch ? budgetMatch[0] : null;

  const domains = {
    career:      /career|job|role|switch|transition|engineer|developer|promotion|hire|salary/i,
    startup:     /startup|launch|saas|product|mvp|founder|vc|funding|investor|revenue|customer/i,
    education:   /study|degree|masters|phd|university|college|exam|certification|ielts|gre|gmat/i,
    finance:     /invest|portfolio|saving|retirement|financial|debt|loan|stock|crypto|fund/i,
    health:      /health|fitness|weight|training|diet|marathon|exercise|medical/i,
    relocation:  /relocat|move|city|country|visa|abroad|london|berlin|dubai|canada/i,
    creative:    /book|write|music|film|design|art|brand|content|creator|podcast/i,
    operations:  /team|hire|scale|process|operations|pipeline|workflow|system|infrastructure/i,
  };

  const detectedDomains = Object.entries(domains)
    .filter(([, regex]) => regex.test(text))
    .map(([domain]) => domain);

  const primaryDomain = detectedDomains[0] || 'general';

  const isSolo    = /solo|self|myself|alone|individual|freelance|just me/i.test(text);
  const hasTeam   = /team|co-founder|partner|colleague|staff|hire/i.test(text);
  const teamSize  = planText.match(/team of (\d+)/i);

  const hasDeadline   = /deadline|by [a-z]+ \d{4}|intake|semester|launch date/i.test(text);
  const hasConstraint = /without|no vc|no funding|bootstrap|limited|only|just/i.test(text);
  const hasHighStakes = /life saving|critical|urgent|must|need to|have to/i.test(text);

  const sentences = planText.split(/[.!?]/);
  const planSummary = sentences[0]?.trim().slice(0, 160) || planText.slice(0, 160);

  return {
    timeline,
    budget,
    primaryDomain,
    detectedDomains,
    isSolo,
    hasTeam,
    teamSize: teamSize ? parseInt(teamSize[1]) : (hasTeam ? 2 : 1),
    hasDeadline,
    hasConstraint,
    hasHighStakes,
    planSummary,
    rawText: planText,
  };
}

// ─── Domain Content Library ───────────────────────────────────────────────────

const DOMAIN_CONTENT = {
  career: {
    strengths: [
      { title: 'Clear Objective Defined', body: 'Your plan articulates a specific role transition target — far more actionable than a vague aspiration. This gives both progress metrics and a clear hiring filter to optimise for.' },
      { title: 'Structured Weekly Commitment', body: 'Allocating defined weekly study hours signals genuine intentionality. Consistent compounded effort outperforms bursty intensity over 6+ month timelines.' },
      { title: 'Budget-Backed Seriousness', body: 'Having real financial commitment behind the plan creates accountability and filters out half-measures. It also unlocks higher-leverage learning resources.' },
    ],
    weaknesses: [
      { title: 'Market Signal Validation Gap', body: 'There is no explicit market-audit phase built into this plan. Without regular job description analysis every 4–6 weeks, you risk over-investing in skills that the current market no longer prizes.' },
      { title: 'Certifications vs. Production Credentials', body: 'Certificates register very differently from production code or public contributions with technical hiring managers. The plan needs a proof-of-work artifact strategy.' },
      { title: 'Linear Timeline Assumption', body: 'Career transitions routinely plateau at Month 4–5 before a second acceleration. The plan appears to assume steady linear progress, which creates morale risk when the plateau arrives.' },
    ],
    assumptions: [
      { title: 'Stable Current Employment Workload', body: 'Assumes the current employer will not significantly increase demands during the study period — a fragile assumption in most full-time roles.' },
      { title: 'Market Stability in Target Role', body: 'Assumes the target role category will maintain or grow hiring volumes throughout the plan period.' },
      { title: 'Budget Available Upfront', body: 'Assumes financial resources are accessible at the start of the plan rather than needing to be accumulated during execution.' },
    ],
    improvements: [
      { title: 'Build a Public Proof-of-Work Artifact', body: 'Publish one production-grade project on GitHub within the first 60 days. It bypasses most resume-screening friction and creates an external accountability anchor.' },
      { title: 'Schedule Monthly Market Audits', body: 'Spend 2 hours every 4 weeks scanning 30 recent job descriptions in the target role. Adjust skill priority list accordingly — this is the most important recurring activity in the plan.' },
      { title: 'Contact 3 Practitioners in the Target Role', body: 'Arrange informational interviews early in the process. Real insiders surface shortcuts and failure modes that no curriculum captures.' },
    ],
    priorities: [
      { rank: 1, label: 'CRITICAL', title: 'Validate target role skill map against live JDs', action: 'Do this in Week 1 before spending any budget.' },
      { rank: 2, label: 'HIGH', title: 'Define and start the flagship proof-of-work project', action: 'Choose the project by end of Month 1.' },
      { rank: 3, label: 'MEDIUM', title: 'Schedule 3-month and 6-month go/no-go checkpoints', action: 'Set these calendar blocks now, before starting.' },
    ],
    dependencyChain: [
      { type: 'BASE OBJECTIVE', label: 'Role Transition', nodeClass: 'node-start' },
      { type: 'CRITICAL PATH', label: 'Skill Acquisition', nodeClass: 'node-critical' },
      { type: 'VULNERABILITY', label: 'Market Validation Gap', nodeClass: 'node-risk' },
      { type: 'SAFEGUARD', label: 'Public Proof-of-Work', nodeClass: 'node-safe' },
    ],
    alternatives: [
      {
        id: 'A',
        title: 'Internal Transition at Current Employer',
        tags: ['LOWER RISK', 'PRESERVES SENIORITY'],
        description: 'Volunteer for or propose internal projects in the target domain. Many large organisations have active AI, product, or data transformation initiatives that desperately need domain-literate contributors — often more than they need senior external specialists.',
        tradeoffs: 'Preserves salary and institutional trust. Depends entirely on the employer\'s internal project roadmap and political capital.',
        bestWhen: 'Your current employer is large, technically progressive, and you have an accessible manager who can facilitate the transition.',
      },
      {
        id: 'B',
        title: 'Freelance Bridge Strategy',
        tags: ['FASTER VALIDATION', 'INCOME PRESERVED'],
        description: 'Take 2–3 small paid freelance projects in the target domain rather than completing coursework first. Real client problems produce 3–5× more learning density than structured curricula and generate portfolio artifacts that hiring teams trust far more than certificates.',
        tradeoffs: 'Requires finding early clients with accessible bars. Expect below-market rates initially to build credibility.',
        bestWhen: 'You can identify client leads through your existing network within 30 days and can already deliver basic value in the target domain.',
      },
      {
        id: 'C',
        title: 'Structured Cohort Programme',
        tags: ['PEER NETWORK EFFECT', 'STRUCTURED ACCOUNTABILITY'],
        description: 'Replace self-directed learning with a part-time intensive cohort programme. The primary ROI is the peer cohort and instructor network — cohort alumni surfaces hiring opportunities months before public job postings.',
        tradeoffs: 'Higher upfront cost per outcome and less schedule flexibility. Programme quality variance is extreme — vetting the alumni hiring track record is essential.',
        bestWhen: 'You struggle with self-directed accountability or have found a programme with a verifiable, strong alumni hiring track record in your specific target role.',
      },
    ],
    stressScenarios: [
      {
        title: 'Primary Employment Disruption at Month 3–5',
        severity: 'high',
        trigger: 'Layoff, mandatory leave, or employer workload surge that eliminates study time.',
        cascade: ['Study hours drop below effective threshold', 'Budget pressure compounds', 'Momentum collapse risk at the exact midpoint'],
        earlyWarning: 'Industry layoff signals in your sector appearing in Month 1–2, or workload consistently exceeding planned load.',
        contingency: 'Pre-build a 3-month emergency runway fund before starting. Identify a "reduced mode" curriculum variant that costs under a minimal monthly amount and takes only 5 hrs/week.',
        cascadeLabel: 'FINANCIAL + PSYCHOLOGICAL PRESSURE CASCADE',
      },
      {
        title: 'Target Role Market Contraction',
        severity: 'medium',
        trigger: 'Hiring in target domain slows significantly or role requirements shift mid-plan.',
        cascade: ['Existing certifications become less relevant', 'Competition ratio increases sharply', 'Timeline assumptions break as employers raise bars'],
        earlyWarning: 'Monthly JD audit (Month 2–3) shows fewer open roles or new required qualifications not in the current study plan.',
        contingency: 'Identify one adjacent role requiring 70% overlapping skills as a pre-mapped pivot option. Maintain optionality without abandoning the primary path.',
        cascadeLabel: 'MARKET SIGNAL SHIFT CASCADE',
      },
      {
        title: 'Burnout at Month 4–6',
        severity: 'medium',
        trigger: 'Sustained dual-load (full-time work + intensive study) exceeds sustainable recovery capacity.',
        cascade: ['Weekly hours drop below minimum effective threshold', 'Output quality degrades', 'Two-week breaks become permanent stops'],
        earlyWarning: 'Two consecutive weeks below 60% of planned study hours. Track this metric weekly.',
        contingency: 'Pre-plan a 2-week "consolidation sprint" at Month 4 with zero new material — only review and application. Schedule it as a planned phase, not a failure mode.',
        cascadeLabel: 'ENERGY AND CONSISTENCY CASCADE',
      },
    ],
    resilienceScore: 58,
    resilienceLabel: 'MODERATE',
  },

  startup: {
    strengths: [
      { title: 'Focused Market Niche', body: 'Targeting a specific segment dramatically increases the probability of achieving early product-market fit signals compared to broad "everyone" positioning.' },
      { title: 'Defined Financial Runway', body: 'A concrete runway figure creates a natural forcing function for decision-making and prevents the indefinite deferral of hard go/no-go decisions.' },
      { title: 'Lean Team Velocity', body: 'Small founding teams move 3–5× faster than funded teams with process overhead. This is a genuine structural competitive advantage pre-PMF.' },
    ],
    weaknesses: [
      { title: 'No Customer Discovery Phase', body: 'There is no explicit problem-validation phase in this plan. Building before validating is the single most common cause of startup failure.' },
      { title: 'Single Revenue Model Bet', body: 'A single pricing and GTM model means any pricing assumption error propagates into full runway burn before the error is detected and corrected.' },
      { title: 'Distribution Strategy Absent', body: 'Most plans overweight product and underweight distribution. The plan must answer: who sells, to whom, through which channel, at what customer acquisition cost.' },
    ],
    assumptions: [
      { title: 'Customers Will Pay the Assumed Price', body: 'B2B buyers have complex approval chains. Pricing assumptions before first contracts are extremely fragile.' },
      { title: 'MVP Scope Deliverable in Timeline', body: 'Engineering timelines for first-time builders run 2–3× longer than initial estimates. Buffer is required.' },
      { title: 'Target Customers Are Accessible', body: 'Assumes the founding team can reach the first 10 customers without a built cold outbound machine or paid acquisition budget.' },
    ],
    improvements: [
      { title: 'Run 20 Discovery Calls Before Building', body: 'Conduct 20 structured problem-discovery interviews with target customers before writing a single line of product code. Validate the problem is real, frequent, and urgent.' },
      { title: 'Define the Unfair Access to First 10 Customers', body: 'Map exactly how the first 10 customers will be reached. Warm introductions from existing networks outperform cold outbound by an order of magnitude at this stage.' },
      { title: 'Set a Hard Pivot or Kill Trigger', body: 'Define in advance: "If we do not have X paying customers by Month Y, we will reassess the model." Prevents sunk cost drift.' },
    ],
    priorities: [
      { rank: 1, label: 'CRITICAL', title: 'Validate problem urgency before building MVP', action: 'Complete 10 discovery calls in the first 2 weeks.' },
      { rank: 2, label: 'HIGH', title: 'Lock in primary GTM channel hypothesis', action: 'Choose ONE channel and commit to it for 60 days minimum.' },
      { rank: 3, label: 'MEDIUM', title: 'Write explicit pivot or kill trigger criteria', action: 'Do this now while you are still objective.' },
    ],
    dependencyChain: [
      { type: 'BASE OBJECTIVE', label: 'Product Launch', nodeClass: 'node-start' },
      { type: 'CRITICAL PATH', label: 'Customer Validation', nodeClass: 'node-critical' },
      { type: 'VULNERABILITY', label: 'Distribution Gap', nodeClass: 'node-risk' },
      { type: 'SAFEGUARD', label: 'Hard Kill Trigger', nodeClass: 'node-safe' },
    ],
    alternatives: [
      {
        id: 'A',
        title: 'Services-First to Product Transition',
        tags: ['IMMEDIATE REVENUE', 'LOWER BURN'],
        description: 'Start as a boutique consultancy delivering the outcome manually. Charge for outcomes, not software. Productize only the genuinely repetitive components after Month 3–4 of real client delivery.',
        tradeoffs: 'Slower scalability ceiling, but generates real revenue immediately and surfaces exactly what to automate from actual usage data.',
        bestWhen: 'You can deliver value to early customers manually using existing tools and domain expertise without building product first.',
      },
      {
        id: 'B',
        title: 'White-Label Existing Infrastructure',
        tags: ['FASTER TO MARKET', 'LOWER TECHNICAL RISK'],
        description: 'Rather than building from scratch, white-label an existing compliant platform and focus all energy on distribution, branding, and customer relationships.',
        tradeoffs: 'Lower technical differentiation and vendor dependency risk. Dramatically faster to first revenue with less required technical depth.',
        bestWhen: 'The differentiation is in customer relationships and domain expertise rather than in the underlying technology stack.',
      },
      {
        id: 'C',
        title: 'Partnership-Led GTM',
        tags: ['NETWORK LEVERAGE', 'ACCELERATED TRUST'],
        description: 'Partner with 2–3 established players (agencies, consultancies, or platforms) who already serve your target customers. Position the product as an enhancement to their existing offering.',
        tradeoffs: 'Revenue share reduces unit economics, but dramatically lowers CAC and trust barrier for enterprise deals.',
        bestWhen: 'The founding team has existing relationships with potential distribution partners in the target segment.',
      },
    ],
    stressScenarios: [
      {
        title: 'No Paying Customers at Month 3',
        severity: 'high',
        trigger: 'MVP launches but early adopter conversion fails across multiple outreach attempts.',
        cascade: ['Runway burns without revenue signal', 'Team morale degrades', 'Pressure to cut scope further extends the problem'],
        earlyWarning: 'Zero paid commitments or LOIs after 20 outreach attempts by Month 2.',
        contingency: 'Immediately pivot to services-first model to generate cash while continuing product development at reduced pace.',
        cascadeLabel: 'REVENUE VALIDATION FAILURE CASCADE',
      },
      {
        title: 'Founding Team Bandwidth Collapse',
        severity: 'high',
        trigger: 'One or both founders face unexpected personal, health, or employment obligations.',
        cascade: ['Build velocity drops significantly', 'Launch timeline slips', 'Momentum dissipates as competitors advance'],
        earlyWarning: 'Two consecutive sprint milestones missed by more than 50% of planned scope.',
        contingency: 'Pre-negotiate each founder\'s minimum viable weekly commitment at which a formal renegotiation of equity or terms is triggered.',
        cascadeLabel: 'TEAM CAPACITY CASCADE',
      },
      {
        title: 'Regulatory or Compliance Blocker',
        severity: 'medium',
        trigger: 'Target customer segment faces new regulation that blocks or delays procurement.',
        cascade: ['Sales cycles extend from weeks to quarters', 'Runway assumptions break', 'Unplanned legal budget required'],
        earlyWarning: 'Any regulatory news affecting the target segment in Months 1–2.',
        contingency: 'Identify one adjacent non-regulated segment as a fallback that can generate revenue while the primary segment stabilises.',
        cascadeLabel: 'REGULATORY FRICTION CASCADE',
      },
    ],
    resilienceScore: 52,
    resilienceLabel: 'FRAGILE',
  },

  education: {
    strengths: [
      { title: 'Specific Destination and Intake Defined', body: 'Having a concrete target program, institution tier, and intake deadline is far more actionable than a vague "study abroad" aspiration.' },
      { title: 'Financial Requirements Acknowledged', body: 'Recognising the exact financial requirements upfront enables realistic preparation rather than discovering blockers mid-process.' },
      { title: 'Sequential Prerequisite Awareness', body: 'Understanding that language tests, transcripts, and visa applications must be sequenced carefully reduces critical path collision risk.' },
    ],
    weaknesses: [
      { title: 'Single Intake or Institution Basket Risk', body: 'Applying to only one country, one intake, or a narrow tier of institutions creates fragility. Admission outcomes are probabilistic, not deterministic.' },
      { title: 'Parallel Document Processing Bottleneck', body: 'Language test preparation, transcript procurement, and SOP drafting running in parallel creates a Month 2–3 crunch that most applicants significantly underestimate.' },
      { title: 'Post-Admission Financial Gap', body: 'Most plans account for the blocked account requirement but underestimate health insurance, housing deposits, and initial setup costs.' },
    ],
    assumptions: [
      { title: 'Document Procurement Will Be Straightforward', body: 'University transcripts, attestations, and employer letters frequently take 4–6 weeks longer than expected — especially cross-institution or cross-state.' },
      { title: 'Test Scores Will Meet Threshold on First Attempt', body: 'A significant percentage of applicants require 2+ test attempts. Budget and timeline for a second attempt must be pre-planned, not treated as a fallback.' },
      { title: 'Financial Documents Will Satisfy Embassy Requirements', body: 'Visa financial documentation standards vary by embassy and change without notice. First-attempt visa approval should not be assumed.' },
    ],
    improvements: [
      { title: 'Apply to a Portfolio of 5+ Institutions', body: 'Spread applications across 2 reach, 2 target, and 1 safety institution. The application cost is negligible relative to the risk of a single-basket strategy.' },
      { title: 'Initiate All Document Procurement in Week 1', body: 'Start all official document requests immediately — before applications open. Processing delays are the most common plan derailment.' },
      { title: 'Pre-Plan and Book a Second Test Attempt', body: 'Book the test date AND a backup date simultaneously. This eliminates the panicked scramble if first attempt scores fall below threshold.' },
    ],
    priorities: [
      { rank: 1, label: 'CRITICAL', title: 'Start all document procurement immediately', action: 'Contact all institutions for official documents in Week 1.' },
      { rank: 2, label: 'HIGH', title: 'Diversify application portfolio to 5+ institutions', action: 'Research and shortlist by end of Week 2.' },
      { rank: 3, label: 'MEDIUM', title: 'Budget for second test attempt and visa contingency', action: 'Set aside 15–20% additional contingency budget.' },
    ],
    dependencyChain: [
      { type: 'BASE OBJECTIVE', label: 'Admission Secured', nodeClass: 'node-start' },
      { type: 'CRITICAL PATH', label: 'Document Procurement', nodeClass: 'node-critical' },
      { type: 'VULNERABILITY', label: 'Single Intake Target', nodeClass: 'node-risk' },
      { type: 'SAFEGUARD', label: 'Portfolio Applications', nodeClass: 'node-safe' },
    ],
    alternatives: [
      {
        id: 'A',
        title: 'Work-and-Study Deferred Pathway',
        tags: ['STRONGER APPLICATION', 'SLOWER TIMELINE'],
        description: 'Defer the intake by one cycle and build domain work experience in the target field. Many competitive programs actively prefer applicants with 2+ years of relevant experience — creating a stronger application for better programs.',
        tradeoffs: 'Delays the goal by 6–12 months but produces a materially stronger application and may qualify for merit-based scholarships.',
        bestWhen: 'You can acquire meaningful domain experience at your current or a new employer in the next 12 months.',
      },
      {
        id: 'B',
        title: 'Accredited Online Master\'s Programme',
        tags: ['LOWER COST', 'IMMEDIATE START'],
        description: 'Enrol in an accredited online Master\'s programme while continuing to work. Depending on the field, these carry increasing employer recognition and cost a fraction of on-campus programmes.',
        tradeoffs: 'Lower visa and relocation costs, but reduced in-person network effects and some employer contexts still prefer on-campus credentials.',
        bestWhen: 'The primary goal is the credential and knowledge transfer, not the international living experience or in-person cohort network.',
      },
      {
        id: 'C',
        title: 'Alternative Country Pivot',
        tags: ['LOWER BARRIERS', 'SIMILAR OUTCOME'],
        description: 'Research programmes in countries with simpler visa processes, lower financial requirements, and English-medium instruction — Ireland, Netherlands, Nordic countries, or Canada often deliver the same career outcome with significantly less friction.',
        tradeoffs: 'Requires research investment into programme quality, post-study work rights, and recalibrated location preferences.',
        bestWhen: 'The primary target country is generating friction (visa, cost, test requirements) that puts the entire timeline at risk.',
      },
    ],
    stressScenarios: [
      {
        title: 'Test Score Below Threshold on First Attempt',
        severity: 'high',
        trigger: 'Language or aptitude test result falls below the program\'s minimum requirement.',
        cascade: ['Application window closes before re-test results arrive', 'Must defer to next intake', 'Financial and psychological cost of 6-12 month delay'],
        earlyWarning: 'Practice test scores consistently borderline 4+ weeks before the exam date.',
        contingency: 'Pre-book a second test date within 6 weeks of the first attempt. Identify one safety institution with a lower score threshold.',
        cascadeLabel: 'ELIGIBILITY GATE CASCADE',
      },
      {
        title: 'Document Procurement Delay',
        severity: 'high',
        trigger: 'An official document required for application takes significantly longer than expected.',
        cascade: ['Application submitted incomplete', 'Risk of missing application deadline', 'Forced to defer to next intake'],
        earlyWarning: 'Any document request unacknowledged within 2 weeks of submission.',
        contingency: 'Track every document request with escalation dates. Initiate all requests simultaneously in Week 1, not sequentially.',
        cascadeLabel: 'DOCUMENT PIPELINE CASCADE',
      },
      {
        title: 'Visa Application Rejection',
        severity: 'medium',
        trigger: 'Embassy rejects visa due to documentation, financial proof, or intention concerns.',
        cascade: ['Admission offer may expire before re-application resolves', 'Re-application consumes time and additional cost', 'Intake deferral required'],
        earlyWarning: 'Any uncertainty or inconsistency in financial documents or employment letter wording before submission.',
        contingency: 'Use a registered immigration consultant for pre-submission document review. The cost is negligible relative to rejection risk.',
        cascadeLabel: 'VISA REJECTION CASCADE',
      },
    ],
    resilienceScore: 61,
    resilienceLabel: 'MODERATE',
  },

  general: {
    strengths: [
      { title: 'Goal Clarity', body: 'Your plan articulates a concrete desired outcome — the prerequisite for all meaningful progress assessment and course correction.' },
      { title: 'Commitment to Specifics', body: 'The willingness to state real constraints (timelines, resources) distinguishes actionable plans from aspirational thinking.' },
      { title: 'Self-Awareness of Constraints', body: 'Acknowledging real-world limitations upfront prevents optimistic planning bias — the primary cause of plan collapse at first friction.' },
    ],
    weaknesses: [
      { title: 'No Explicit Milestone Structure', body: 'Without defined intermediate milestones and go/no-go checkpoints, it is difficult to detect deviation early enough to course-correct before sunk costs accumulate.' },
      { title: 'External Dependencies Unmapped', body: 'Most plans underestimate how many dependencies exist outside the planner\'s direct control. These are typically where plans break.' },
      { title: 'Contingency Absence', body: 'No explicit "if X fails, then Y" contingency structure means the first unexpected event creates reactive scrambling rather than pre-planned adaptation.' },
    ],
    assumptions: [
      { title: 'Resources Will Remain Stable', body: 'Budget, time, and attention assumptions are typically optimistic. Real execution introduces competing demands and unexpected costs.' },
      { title: 'External Stakeholders Will Cooperate', body: 'Anyone whose cooperation is required but not fully under your control introduces fragility to the plan.' },
      { title: 'The Problem Definition Is Correct', body: 'Well-constructed plans can still be solving the wrong problem. Periodic re-validation of the core goal remains essential.' },
    ],
    improvements: [
      { title: 'Define 3–5 Explicit Milestones', body: 'Break the overall goal into measurable intermediate states with clear criteria for achieved or not-achieved. These become your early warning system.' },
      { title: 'Map All External Dependencies', body: 'List every person, institution, or system whose behaviour is required but outside your direct control.' },
      { title: 'Write One Contingency Per Critical Dependency', body: 'For each key external dependency, write one sentence: "If this fails, I will ___." Do this now while you are still objective.' },
    ],
    priorities: [
      { rank: 1, label: 'CRITICAL', title: 'Define measurable milestone criteria', action: 'Complete before beginning execution.' },
      { rank: 2, label: 'HIGH', title: 'Map external dependencies and their owners', action: 'Do this in the first week.' },
      { rank: 3, label: 'MEDIUM', title: 'Establish a regular progress review cadence', action: 'Monthly or bi-weekly review of progress vs. milestones.' },
    ],
    dependencyChain: [
      { type: 'BASE OBJECTIVE', label: 'Goal Achievement', nodeClass: 'node-start' },
      { type: 'CRITICAL PATH', label: 'Key Milestones', nodeClass: 'node-critical' },
      { type: 'VULNERABILITY', label: 'External Dependencies', nodeClass: 'node-risk' },
      { type: 'SAFEGUARD', label: 'Pre-planned Contingencies', nodeClass: 'node-safe' },
    ],
    alternatives: [
      {
        id: 'A',
        title: 'Phased Minimum Viable Approach',
        tags: ['LOWER RISK', 'FASTER LEARNING'],
        description: 'Reduce initial scope to the absolute minimum required to achieve the first validation signal. Commit to a larger next phase only after the minimum version succeeds and confirms core assumptions.',
        tradeoffs: 'Slower to full outcome, but dramatically reduces wasted effort if core assumptions prove incorrect.',
        bestWhen: 'There is genuine uncertainty about whether the plan\'s core assumptions are valid.',
      },
      {
        id: 'B',
        title: 'Parallel Path Exploration',
        tags: ['OPTIONALITY PRESERVED', 'COMPARATIVE DATA'],
        description: 'Run a lightweight parallel exploration of one alternative approach for 30 days before fully committing. This generates comparative data and preserves optionality at relatively low cost.',
        tradeoffs: 'Requires bandwidth for parallel exploration, which may dilute focus. Best when the cost of choosing the wrong path significantly exceeds 30 days of additional exploration.',
        bestWhen: 'The cost of committing to the wrong path is high and the decision is reversible within 30 days.',
      },
      {
        id: 'C',
        title: 'Expert Shortcut Strategy',
        tags: ['KNOWLEDGE LEVERAGE', 'COMPRESSED TIMELINE'],
        description: 'Before full execution, invest a small amount of time or money to consult 2–3 practitioners who have already successfully executed a very similar plan. Their pattern recognition surfaces the most common failure modes and hidden shortcuts.',
        tradeoffs: 'Requires finding and engaging the right advisors, which itself takes effort. Quality of advice varies significantly.',
        bestWhen: 'The plan type is common enough that experienced practitioners exist and are accessible through your network.',
      },
    ],
    stressScenarios: [
      {
        title: 'Primary Resource Constraint at Critical Phase',
        severity: 'high',
        trigger: 'Time, budget, or attention becomes significantly more constrained than planned during the most critical execution phase.',
        cascade: ['Execution quality degrades under pressure', 'Shortcuts create downstream rework', 'Timeline extends beyond acceptable range'],
        earlyWarning: 'Resource utilisation exceeding 80% of planned allocation by Month 2.',
        contingency: 'Define the minimum viable execution standard for each phase in advance. When constrained, scope down to the minimum rather than compromising quality across everything.',
        cascadeLabel: 'RESOURCE COMPRESSION CASCADE',
      },
      {
        title: 'Key External Dependency Failure',
        severity: 'high',
        trigger: 'A person, institution, or system the plan depends on fails to deliver as expected.',
        cascade: ['Blocking dependency stalls execution', 'Workaround search consumes planned execution time', 'Confidence in the overall plan erodes'],
        earlyWarning: 'No progress signal from any external dependency after more than 2× the expected response time.',
        contingency: 'For each critical external dependency, identify an alternative provider or workaround in advance — before the failure happens.',
        cascadeLabel: 'DEPENDENCY FAILURE CASCADE',
      },
      {
        title: 'Scope Creep and Distraction',
        severity: 'medium',
        trigger: 'New opportunities or problems emerge that compete with the plan\'s focus.',
        cascade: ['Attention dilutes across multiple priorities', 'Core milestones slip', 'None of the concurrent efforts fully succeeds'],
        earlyWarning: 'Weekly review shows more than 30% of time allocated to activities outside the core plan.',
        contingency: 'Maintain a "not now" list for compelling opportunities that arise during execution. Review only at quarterly milestones.',
        cascadeLabel: 'FOCUS DILUTION CASCADE',
      },
    ],
    resilienceScore: 55,
    resilienceLabel: 'MODERATE',
  },
};

DOMAIN_CONTENT.finance    = DOMAIN_CONTENT.general;
DOMAIN_CONTENT.health     = DOMAIN_CONTENT.general;
DOMAIN_CONTENT.relocation = DOMAIN_CONTENT.education;
DOMAIN_CONTENT.creative   = DOMAIN_CONTENT.general;
DOMAIN_CONTENT.operations = DOMAIN_CONTENT.startup;


// ─── Public API ───────────────────────────────────────────────────────────────

export function generateImproveAnalysis(planText) {
  const signals = extractSignals(planText);
  const content = DOMAIN_CONTENT[signals.primaryDomain] || DOMAIN_CONTENT.general;
  const timelineNote = signals.timeline ? ` — particularly given the ${signals.timeline} constraint.` : '.';

  return {
    mode: 'improve',
    generatedAt: new Date().toISOString(),
    planSummary: signals.planSummary,
    signals,
    dependencyChain: content.dependencyChain,
    strengths: content.strengths,
    weaknesses: content.weaknesses.map((w, i) =>
      i === 0 ? { ...w, body: w.body + timelineNote } : w
    ),
    assumptions: content.assumptions,
    improvements: content.improvements,
    priorities: content.priorities,
  };
}

export function generateAlternativesAnalysis(planText) {
  const signals = extractSignals(planText);
  const content = DOMAIN_CONTENT[signals.primaryDomain] || DOMAIN_CONTENT.general;

  return {
    mode: 'alternatives',
    generatedAt: new Date().toISOString(),
    planSummary: signals.planSummary,
    signals,
    originalApproach: {
      summary: signals.planSummary,
      characterisation: signals.hasConstraint
        ? 'Bootstrap / resource-constrained direct execution approach'
        : signals.isSolo
        ? 'Independent, self-directed execution approach'
        : 'Structured multi-stakeholder execution approach',
    },
    alternatives: content.alternatives,
  };
}

export function generateStressTestAnalysis(planText) {
  const signals = extractSignals(planText);
  const content = DOMAIN_CONTENT[signals.primaryDomain] || DOMAIN_CONTENT.general;

  let score = content.resilienceScore;
  if (signals.hasDeadline)    score -= 5;
  if (signals.hasConstraint)  score -= 4;
  if (signals.hasHighStakes)  score -= 6;
  if (signals.hasTeam)        score += 5;
  score = Math.max(20, Math.min(88, score));

  const label =
    score >= 75 ? 'RESILIENT' :
    score >= 55 ? 'MODERATE' :
    score >= 35 ? 'FRAGILE' : 'CRITICAL';

  return {
    mode: 'stresstest',
    generatedAt: new Date().toISOString(),
    planSummary: signals.planSummary,
    signals,
    resilienceScore: score,
    resilienceLabel: label,
    scenarios: content.stressScenarios,
    criticalFailurePoints: content.stressScenarios.map(s => s.title),
  };
}

export function generateAnalysis(mode, planText) {
  switch (mode) {
    case 'improve':      return generateImproveAnalysis(planText);
    case 'alternatives': return generateAlternativesAnalysis(planText);
    case 'stresstest':   return generateStressTestAnalysis(planText);
    default:             return generateImproveAnalysis(planText);
  }
}
