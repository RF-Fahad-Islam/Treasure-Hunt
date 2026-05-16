export function magicLoginEmailHtml({
  name,
  loginUrl,
  role,
}: {
  name: string;
  loginUrl: string;
  role: "team" | "spot-leader";
}): string {
  const roleLabel = role === "team" ? "your team dashboard" : "your spot leader dashboard";
  const greeting = role === "team" ? `Ready, ${name}?` : `Hey ${name}, ready to lead?`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to Treasure Hunt</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0714;font-family:'Nunito','Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#120b21;border-radius:20px;padding:16px 24px;border:2px solid rgba(255,255,255,0.08);">
                    <span style="font-size:28px;letter-spacing:-1px;font-weight:900;color:#ffffff;">Treasure</span>
                    <span style="font-size:28px;letter-spacing:-1px;font-weight:900;background:linear-gradient(100deg,#58cc02,#1cb0f6);-webkit-background-clip:text;background-clip:text;color:transparent;">Hunt</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#1A1A1A;border-radius:32px;border:2px solid rgba(255,255,255,0.08);padding:40px 32px;text-align:center;">
              <div style="font-size:56px;line-height:1;margin-bottom:16px;">🔗</div>

              <h1 style="font-size:28px;font-weight:900;color:#ffffff;margin:0 0 8px;letter-spacing:-0.5px;">
                ${greeting}
              </h1>

              <p style="font-size:16px;font-weight:700;color:#888888;margin:0 0 24px;">
                Click the button below to instantly log in to ${roleLabel}.
              </p>

              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);margin-bottom:24px;"></div>

              <p style="font-size:14px;font-weight:600;color:#888888;margin:0 0 24px;line-height:1.6;">
                This link will expire in 7 days. You can use it multiple times, but only one session will be active at a time.
                If you didn't request this, you can safely ignore this email.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#58cc02;border-radius:999px;padding:0;box-shadow:0 4px 0 0 #3a8400;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">
                      Log In Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:12px;font-weight:700;color:#555555;margin:0;">
                University of Dhaka &bull; Department of CSE
              </p>
              <p style="font-size:11px;font-weight:600;color:#444444;margin:8px 0 0;">
                Treasure Hunt 2026 &mdash; Decode the clues. Race across campus.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
