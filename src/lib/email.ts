import nodemailer from 'nodemailer';

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const transporter = gmailUser && gmailAppPassword
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    })
  : null;

const ROLE_LABELS: Record<string, string> = {
  pm: 'Product Manager',
  developer: 'Developer',
  stakeholder: 'Stakeholder',
};

interface InviteEmailParams {
  to: string;
  inviterName: string;
  projectName: string;
  role: string;
  appUrl: string;
}

/** Best-effort: invites still succeed even if email sending fails or isn't configured. */
export async function sendProjectInviteEmail({ to, inviterName, projectName, role, appUrl }: InviteEmailParams): Promise<void> {
  if (!transporter || !gmailUser) {
    console.warn('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping invite email to', to);
    return;
  }

  try {
    await transporter.sendMail({
      from: `AI Business Analyst <${gmailUser}>`,
      to,
      subject: `${inviterName} added you to "${projectName}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #312e81;">You've been added to a project</h2>
          <p><strong>${inviterName}</strong> added you to <strong>${projectName}</strong> as <strong>${ROLE_LABELS[role] ?? role}</strong>.</p>
          <p>
            <a href="${appUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">
              Open the project
            </a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[email] Failed to send invite email:', err);
  }
}
