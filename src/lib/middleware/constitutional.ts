// src/lib/middleware/constitutional.ts
// Constitutional middleware with Custos Charter validation

import type { NextApiRequest, NextApiResponse } from 'next';

interface ConstitutionalScore {
  overall: number;
  clauseScores: Record<string, number>;
  violations: string[];
  recommendations: string[];
}

interface ConstitutionalValidationOptions {
  minScore?: number;
  strictMode?: boolean;
  logViolations?: boolean;
}

// Custos Charter - 7-clause constitutional framework
const CUSTOS_CHARTER = {
  clauses: {
    'human-dignity': {
      name: 'Human Dignity & Autonomy',
      keywords: ['human', 'dignity', 'autonomy', 'rights', 'freedom', 'choice'],
      patterns: [
        /respect.*human/i,
        /preserve.*dignity/i,
        /protect.*autonomy/i,
        /individual.*rights/i
      ],
      weight: 1.0
    },
    'transparency': {
      name: 'Transparency & Accountability',
      keywords: ['transparent', 'accountable', 'open', 'clear', 'audit', 'verification'],
      patterns: [
        /transparent.*process/i,
        /accountable.*action/i,
        /open.*source/i,
        /clear.*communication/i
      ],
      weight: 0.9
    },
    'equity': {
      name: 'Equity & Fairness',
      keywords: ['fair', 'equal', 'equity', 'just', 'unbiased', 'inclusive'],
      patterns: [
        /fair.*treatment/i,
        /equal.*access/i,
        /unbiased.*decision/i,
        /inclusive.*approach/i
      ],
      weight: 0.9
    },
    'safety': {
      name: 'Safety & Harm Prevention',
      keywords: ['safe', 'secure', 'protect', 'prevent', 'harm', 'risk'],
      patterns: [
        /safe.*operation/i,
        /prevent.*harm/i,
        /secure.*system/i,
        /risk.*mitigation/i
      ],
      weight: 1.0
    },
    'privacy': {
      name: 'Privacy & Data Protection',
      keywords: ['privacy', 'confidential', 'data', 'protection', 'consent'],
      patterns: [
        /privacy.*protection/i,
        /data.*security/i,
        /confidential.*information/i,
        /user.*consent/i
      ],
      weight: 0.8
    },
    'civic-integrity': {
      name: 'Civic Integrity',
      keywords: ['civic', 'democratic', 'public', 'community', 'governance'],
      patterns: [
        /civic.*engagement/i,
        /democratic.*process/i,
        /public.*good/i,
        /community.*benefit/i
      ],
      weight: 0.8
    },
    'environmental': {
      name: 'Environmental & Systemic Responsibility',
      keywords: ['environment', 'sustainable', 'systemic', 'long-term', 'future'],
      patterns: [
        /environmental.*impact/i,
        /sustainable.*development/i,
        /systemic.*thinking/i,
        /long.*term.*view/i
      ],
      weight: 0.7
    }
  },
  
  // Harmful patterns to detect and penalize
  harmfulPatterns: [
    /discriminat/i,
    /exclude.*group/i,
    /violate.*rights/i,
    /exploit.*user/i,
    /manipulate.*data/i,
    /deceive.*public/i,
    /harm.*environment/i,
    /undermine.*democracy/i
  ],
  
  // Positive patterns to reward
  positivePatterns: [
    /empower.*user/i,
    /enhance.*transparency/i,
    /promote.*equity/i,
    /ensure.*safety/i,
    /protect.*privacy/i,
    /strengthen.*community/i,
    /sustainable.*approach/i
  ]
};

/**
 * Validate content against Custos Charter
 */
export async function validateConstitutionally(
  content: string,
  options: ConstitutionalValidationOptions = {}
): Promise<ConstitutionalScore> {
  const {
    minScore = 70,
    strictMode = false,
    logViolations = true
  } = options;

  const clauseScores: Record<string, number> = {};
  const violations: string[] = [];
  const recommendations: string[] = [];

  // Score each clause
  for (const [clauseId, clause] of Object.entries(CUSTOS_CHARTER.clauses)) {
    const score = scoreClause(content, clause);
    clauseScores[clauseId] = score;
    
    if (score < 60) {
      violations.push(`Low score on ${clause.name}: ${score}/100`);
      recommendations.push(`Strengthen ${clause.name.toLowerCase()} considerations`);
    }
  }

  // Check for harmful patterns
  for (const pattern of CUSTOS_CHARTER.harmfulPatterns) {
    if (pattern.test(content)) {
      violations.push(`Harmful pattern detected: ${pattern.source}`);
      recommendations.push('Remove or reframe harmful language');
    }
  }

  // Check for positive patterns (bonus points)
  let positiveBonus = 0;
  for (const pattern of CUSTOS_CHARTER.positivePatterns) {
    if (pattern.test(content)) {
      positiveBonus += 5;
    }
  }

  // Calculate overall score
  const weightedSum = Object.entries(clauseScores).reduce((sum, [clauseId, score]) => {
    const clause = CUSTOS_CHARTER.clauses[clauseId as keyof typeof CUSTOS_CHARTER.clauses];
    return sum + (score * clause.weight);
  }, 0);

  const totalWeight = Object.values(CUSTOS_CHARTER.clauses).reduce(
    (sum, clause) => sum + clause.weight, 0
  );

  const overall = Math.min(100, Math.max(0, 
    (weightedSum / totalWeight) + positiveBonus - (violations.length * 10)
  ));

  // Log violations if enabled
  if (logViolations && violations.length > 0) {
    console.warn('Constitutional violations detected:', {
      content: content.substring(0, 100) + '...',
      violations,
      overall
    });
  }

  return {
    overall: Math.round(overall),
    clauseScores,
    violations,
    recommendations
  };
}

/**
 * Score a single clause
 */
function scoreClause(content: string, clause: any): number {
  let score = 50; // Base score

  // Check for keyword matches
  const keywordMatches = clause.keywords.filter((keyword: string) =>
    content.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  score += keywordMatches * 5;

  // Check for pattern matches
  const patternMatches = clause.patterns.filter((pattern: RegExp) =>
    pattern.test(content)
  ).length;
  score += patternMatches * 10;

  // Check for clause-specific content
  score += analyzeClauseContent(content, clause);

  return Math.min(100, Math.max(0, score));
}

/**
 * Analyze clause-specific content
 */
function analyzeClauseContent(content: string, clause: any): number {
  const lowerContent = content.toLowerCase();
  let bonus = 0;

  switch (clause.name) {
    case 'Human Dignity & Autonomy':
      if (lowerContent.includes('respect') && lowerContent.includes('human')) bonus += 10;
      if (lowerContent.includes('choice') && lowerContent.includes('freedom')) bonus += 10;
      break;
    
    case 'Transparency & Accountability':
      if (lowerContent.includes('open') && lowerContent.includes('process')) bonus += 10;
      if (lowerContent.includes('audit') || lowerContent.includes('verification')) bonus += 10;
      break;
    
    case 'Equity & Fairness':
      if (lowerContent.includes('equal') && lowerContent.includes('access')) bonus += 10;
      if (lowerContent.includes('unbiased') || lowerContent.includes('inclusive')) bonus += 10;
      break;
    
    case 'Safety & Harm Prevention':
      if (lowerContent.includes('safe') && lowerContent.includes('operation')) bonus += 10;
      if (lowerContent.includes('prevent') && lowerContent.includes('harm')) bonus += 10;
      break;
    
    case 'Privacy & Data Protection':
      if (lowerContent.includes('privacy') && lowerContent.includes('protect')) bonus += 10;
      if (lowerContent.includes('consent') && lowerContent.includes('data')) bonus += 10;
      break;
    
    case 'Civic Integrity':
      if (lowerContent.includes('civic') && lowerContent.includes('community')) bonus += 10;
      if (lowerContent.includes('public') && lowerContent.includes('good')) bonus += 10;
      break;
    
    case 'Environmental & Systemic Responsibility':
      if (lowerContent.includes('sustainable') && lowerContent.includes('environment')) bonus += 10;
      if (lowerContent.includes('long') && lowerContent.includes('term')) bonus += 10;
      break;
  }

  return bonus;
}

/**
 * Constitutional middleware wrapper
 */
export function withConstitutionalValidation(
  minScore: number = 70,
  options: ConstitutionalValidationOptions = {}
) {
  return function <T extends NextApiRequest, U extends NextApiResponse>(
    handler: (req: T, res: U) => Promise<void>
  ) {
    return async (req: T, res: U) => {
      // Extract content to validate from request body
      const content = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      
      // Validate constitutionally
      const validation = await validateConstitutionally(content, {
        ...options,
        minScore
      });

      // Add constitutional score to response headers
      res.setHeader('X-Constitutional-Score', validation.overall.toString());
      
      if (validation.violations.length > 0) {
        res.setHeader('X-Constitutional-Violations', validation.violations.join('; '));
      }

      // Check if score meets minimum requirement
      if (validation.overall < minScore) {
        return res.status(400).json({
          error: 'constitutional_validation_failed',
          message: 'Content does not meet constitutional standards',
          score: validation.overall,
          violations: validation.violations,
          recommendations: validation.recommendations
        });
      }

      // Add constitutional data to request for handler access
      (req as any).constitutionalScore = validation.overall;
      (req as any).constitutionalData = validation;

      // Call the original handler
      return handler(req, res);
    };
  };
}

/**
 * Batch validate multiple contents
 */
export async function batchValidateConstitutionally(
  contents: string[],
  options: ConstitutionalValidationOptions = {}
): Promise<ConstitutionalScore[]> {
  const validations = await Promise.all(
    contents.map(content => validateConstitutionally(content, options))
  );
  
  return validations;
}

/**
 * Get constitutional compliance report
 */
export async function getConstitutionalReport(
  contents: string[]
): Promise<{
  overallCompliance: number;
  clauseAverages: Record<string, number>;
  commonViolations: string[];
  recommendations: string[];
}> {
  const validations = await batchValidateConstitutionally(contents);
  
  const overallCompliance = validations.reduce((sum, v) => sum + v.overall, 0) / validations.length;
  
  const clauseAverages: Record<string, number> = {};
  for (const clauseId of Object.keys(CUSTOS_CHARTER.clauses)) {
    clauseAverages[clauseId] = validations.reduce(
      (sum, v) => sum + (v.clauseScores[clauseId] || 0), 0
    ) / validations.length;
  }
  
  const allViolations = validations.flatMap(v => v.violations);
  const commonViolations = [...new Set(allViolations)];
  
  const allRecommendations = validations.flatMap(v => v.recommendations);
  const recommendations = [...new Set(allRecommendations)];
  
  return {
    overallCompliance: Math.round(overallCompliance),
    clauseAverages,
    commonViolations,
    recommendations
  };
}