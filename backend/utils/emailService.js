/**
 * Email Service using Resend API
 * Handles automated triggers for placement status updates, interview schedules,
 * and alumni feedback prompts.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

const getApiKey = () => {
  return process.env.RESEND_KEY || process.env.RESEND_API_KEY || '';
};

/**
 * Base helper to send an email via Resend REST API
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Resend] Warning: RESEND_KEY / RESEND_API_KEY is not set. Skipping email dispatch.');
    return { success: false, reason: 'missing_key' };
  }

  try {
    const payload = {
      from: 'Placement Portal <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || ''
    };

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[Resend] Failed to send email to ${to}:`, data.message || data);
      return { success: false, error: data };
    }

    console.log(`[Resend] Email successfully sent to ${to} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('[Resend] Network error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger: When a student is Shortlisted for a company drive
 */
export const triggerShortlistEmail = async (student, job) => {
  if (!student || !student.email || !job) return;

  const companyName = job.company?.name || job.company || 'Campus Recruiter';
  const jobTitle = job.title || 'Job Opening';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f7f2eb; border-radius: 16px;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eae2d6;">
        <h2 style="color: #2e381f; margin-top: 0; font-size: 22px;">Congratulations, ${student.name}! 🎉</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          You have been <strong>Shortlisted</strong> by <strong>${companyName}</strong> for the role of <strong>${jobTitle}</strong>.
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">
            Package Offered: ${job.ctc ? job.ctc + ' LPA' : 'Competitive CTC'}
          </p>
        </div>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
          Please log in to your Student Dashboard to access the <strong>AI Career Copilot</strong> and prepare with custom mock interview questions matching this role.
        </p>
        <div style="margin-top: 28px; text-align: center;">
          <a href="http://localhost:3000/dashboard" style="background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Open Student Dashboard
          </a>
        </div>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Smart Career Placement Portal • Automated Notification
      </p>
    </div>
  `;

  return sendEmail({
    to: student.email,
    subject: `🎯 Shortlisted for ${jobTitle} at ${companyName}`,
    html,
    text: `Congratulations ${student.name}! You have been shortlisted by ${companyName} for ${jobTitle}. Log in to your student dashboard to prepare.`
  });
};

/**
 * Trigger: When an Interview Slot is Scheduled for a candidate
 */
export const triggerInterviewScheduledEmail = async (student, job, slot) => {
  if (!student || !student.email || !job || !slot) return;

  const companyName = job.company?.name || job.company || 'Campus Recruiter';
  const dateFormatted = new Date(slot.startTime).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeFormatted = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f7f2eb; border-radius: 16px;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eae2d6;">
        <h2 style="color: #1e1b4b; margin-top: 0; font-size: 22px;">Interview Scheduled: ${companyName} 📅</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          Hello <strong>${student.name}</strong>, your interview round for <strong>${job.title}</strong> has been allocated:
        </p>
        <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 18px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #3730a3; font-size: 14px;"><strong>Date:</strong> ${dateFormatted}</p>
          <p style="margin: 0 0 8px 0; color: #3730a3; font-size: 14px;"><strong>Time:</strong> ${timeFormatted}</p>
          <p style="margin: 0; color: #3730a3; font-size: 14px;"><strong>Panel:</strong> ${slot.interviewer || 'Assigned Technical Panel'}</p>
        </div>
        <p style="color: #4b5563; font-size: 14px;">
          Make sure your resume is updated and test your system before the round.
        </p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:3000/dashboard" style="background-color: #4338ca; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            View Interview In Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: student.email,
    subject: `📅 Interview Slot Confirmed: ${companyName} (${dateFormatted} at ${timeFormatted})`,
    html,
    text: `Your interview with ${companyName} for ${job.title} has been scheduled on ${dateFormatted} at ${timeFormatted}.`
  });
};

/**
 * Trigger: When candidate is marked as "Placed"
 * Congratulates student and prompts them to share Alumni Feedback
 */
export const triggerPlacementCongratulationsEmail = async (student, job) => {
  if (!student || !student.email) return;

  const companyName = job?.company?.name || job?.company || 'Company';
  const jobTitle = job?.title || 'Selected Role';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f7f2eb; border-radius: 16px;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eae2d6;">
        <h2 style="color: #065f46; margin-top: 0; font-size: 24px;">Congratulations on your Placement! 🏆</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          Dear <strong>${student.name}</strong>, hearty congratulations on securing your placement offer at <strong>${companyName}</strong> as a <strong>${jobTitle}</strong>!
        </p>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0; color: #047857; font-size: 15px; font-weight: 700;">
            Offer Status: Placed • Package: ${job?.ctc ? job.ctc + ' LPA' : 'Confirmed'}
          </p>
        </div>
        <h3 style="color: #1f2937; font-size: 16px; margin-top: 24px;">Pay It Forward — Guide Your Juniors</h3>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
          Your interview experience and the technical questions you encountered can help future aspirants crack their dream companies. Please take 2 minutes to submit your round details to the <strong>Alumni Experience Hub</strong>.
        </p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:3000/alumni-experience" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Share Your Interview Experience
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: student.email,
    subject: `🏆 Congratulations on your Placement at ${companyName}!`,
    html,
    text: `Congratulations ${student.name} on your placement at ${companyName}! Please share your interview experience at http://localhost:3000/alumni-experience to help juniors.`
  });
};
