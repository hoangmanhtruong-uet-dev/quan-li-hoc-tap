import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'CampusOS <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const APP_NAME = 'CampusOS';

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;margin-bottom:12px;">
                <span style="font-size:24px;font-weight:900;color:#fff;">C</span>
              </div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${APP_NAME}</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Student Companion</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
                Nếu bạn không thực hiện hành động này, hãy bỏ qua email này.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

// ─── Send Verification Email ──────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const content = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">Xác minh địa chỉ email</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
      Cảm ơn bạn đã đăng ký <strong style="color:#e2e8f0;">${APP_NAME}</strong>!
      Nhấn nút bên dưới để xác minh địa chỉ email của bạn.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.2px;">
        ✅ Xác minh email
      </a>
    </div>

    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:16px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Hoặc dán code vào trang xác minh:</p>
      <p style="margin:0;color:#60a5fa;font-size:13px;font-family:monospace;word-break:break-all;">${token}</p>
    </div>

    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
      ⏰ Link có hiệu lực trong <strong style="color:#94a3b8;">24 giờ</strong>.<br/>
      Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `[${APP_NAME}] Xác minh địa chỉ email của bạn`,
    html: baseTemplate(content),
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

// ─── Send Password Reset Email ────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const content = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">Đặt lại mật khẩu</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong style="color:#e2e8f0;">${email}</strong>.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.2px;">
        🔑 Đặt lại mật khẩu
      </a>
    </div>

    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
      ⏰ Link có hiệu lực trong <strong style="color:#94a3b8;">24 giờ</strong>.<br/>
      Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `[${APP_NAME}] Đặt lại mật khẩu`,
    html: baseTemplate(content),
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}
