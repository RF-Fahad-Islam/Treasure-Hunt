export function welcomeEmailHtml({ name, roll }: { name: string; roll: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Treasure Hunt</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0714;font-family:'Nunito','Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Logo area -->
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

          <!-- Main card -->
          <tr>
            <td style="background:#1A1A1A;border-radius:32px;border:2px solid rgba(255,255,255,0.08);padding:40px 32px;text-align:center;">

              <!-- Celebration icon -->
              <div style="font-size:56px;line-height:1;margin-bottom:16px;">🎉</div>

              <h1 style="font-size:28px;font-weight:900;color:#ffffff;margin:0 0 8px;letter-spacing:-0.5px;">
                Welcome, <span style="color:#58cc02;">${name}</span>!
              </h1>

              <p style="font-size:16px;font-weight:700;color:#888888;margin:0 0 24px;">
                You're now registered for the Treasure Hunt 2026.
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);margin-bottom:24px;"></div>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.03);border-radius:16px;border:1px solid rgba(255,255,255,0.06);padding:20px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="width:50%;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
                          <p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#666666;margin:0 0 4px;">Name</p>
                          <p style="font-size:16px;font-weight:900;color:#ffffff;margin:0;">${name}</p>
                        </td>
                        <td style="width:50%;text-align:center;">
                          <p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#666666;margin:0 0 4px;">Roll</p>
                          <p style="font-size:16px;font-weight:900;color:#ffffff;margin:0;">${roll}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px;font-weight:600;color:#888888;margin:0 0 20px;line-height:1.6;">
                <strong style="color:#ffffff;">What's next?</strong><br>
                Teams will be assigned by your seniors. You'll receive your team code and login instructions before the hunt begins.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#58cc02;border-radius:999px;padding:0;box-shadow:0 4px 0 0 #3a8400;">
                    <a href="${import.meta.env.VITE_INSFORGE_URL ?? 'https://treasure-hunt.app'}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">
                      Go to Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
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
