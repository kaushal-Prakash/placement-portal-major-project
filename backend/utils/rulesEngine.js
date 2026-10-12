/**
 * Rules Engine for evaluating student applications against campus placement policies.
 */
export const evaluateApplicationRules = (user, job) => {
  const rules = [
    {
      name: 'Blacklist-Check',
      check: (u) => !u.isBlacklisted,
      errorMessage: 'You are currently blacklisted from applying for placements by the administration.'
    },
    {
      name: 'One-Student-One-Job-Dream-Company',
      check: (u, j) => {
        // If not placed, they can apply
        if (!u.isPlaced) return true;
        // If placed, they can only apply if the new job's CTC is >= 1.5 * currentCTC
        const threshold = (u.currentCTC || 0) * 1.5;
        return (j.ctc || 0) >= threshold;
      },
      errorMessage: `You are already placed. You can only apply to Dream Companies offering at least 1.5x your current package (${user.currentCTC ? (user.currentCTC * 1.5).toFixed(1) + ' LPA' : ''}).`
    },
    {
      name: 'CGPA-Eligibility',
      check: (u, j) => {
        if (!j.minCgpa || j.minCgpa <= 0) return true;
        return u.cgpa !== null && u.cgpa !== undefined && u.cgpa >= j.minCgpa;
      },
      errorMessage: `Your CGPA (${user.cgpa ?? 'N/A'}) is below the minimum required (${job.minCgpa}) for this job.`
    },
    {
      name: 'Backlog-Eligibility',
      check: (u, j) => {
        if (j.maxBacklogs === undefined || j.maxBacklogs === null) return true;
        return (u.activeBacklogs || 0) <= j.maxBacklogs;
      },
      errorMessage: `You have ${user.activeBacklogs || 0} active backlog(s), which exceeds the company limit of ${job.maxBacklogs}.`
    },
    {
      name: 'Branch-Eligibility',
      check: (u, j) => {
        if (!j.allowedBranches || j.allowedBranches.length === 0) return true;
        if (!u.branch) return false;
        const userBranchId = (u.branch._id || u.branch).toString();
        return j.allowedBranches.some(b => (b._id || b).toString() === userBranchId);
      },
      errorMessage: 'Your academic branch is not eligible for this job opening.'
    },
    {
      name: 'Batch-Eligibility',
      check: (u, j) => {
        if (!j.allowedBatches || j.allowedBatches.length === 0) return true;
        if (!u.batch) return false;
        const userBatchId = (u.batch._id || u.batch).toString();
        return j.allowedBatches.some(b => (b._id || b).toString() === userBatchId);
      },
      errorMessage: 'Your graduation batch is not eligible for this job opening.'
    }
  ];

  for (const rule of rules) {
    if (!rule.check(user, job)) {
      return { allowed: false, reason: rule.errorMessage };
    }
  }

  return { allowed: true };
};
