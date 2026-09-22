/**
 * Rules Engine for evaluating student applications against campus placement policies.
 * You can add, remove, or modify rules in the `rules` array.
 */
export const evaluateApplicationRules = (user, job) => {
  const rules = [
    {
      name: 'One-Student-One-Job-Dream-Company',
      check: (u, j) => {
        // If not placed, they can apply
        if (!u.isPlaced) return true;
        // If placed, they can only apply if the new job's CTC is >= 1.5 * currentCTC
        return j.ctc >= (u.currentCTC * 1.5);
      },
      errorMessage: 'You are already placed. You can only apply to Dream Companies offering at least 1.5x your current CTC.'
    },
    {
      name: 'CGPA-Eligibility',
      check: (u, j) => (u.cgpa !== null && u.cgpa >= j.minCgpa),
      errorMessage: `Your CGPA (${u.cgpa}) is below the minimum requirement (${j.minCgpa}) for this job.`
    }
  ];

  for (const rule of rules) {
    if (!rule.check(user, job)) {
      return { allowed: false, reason: rule.errorMessage };
    }
  }

  return { allowed: true };
};
