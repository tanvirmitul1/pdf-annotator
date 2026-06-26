export interface EmailBaseOptions {
  title: string
  previewText: string
  icon: string       // emoji rendered in the icon badge
  iconBg: string     // badge background color, e.g. "#eef2ff"
  iconColor: string  // badge border/glow color, e.g. "#c7d2fe"
  heading: string
  greeting: string   // e.g. "Hi Tanvir,"
  body: string       // HTML paragraph(s) between greeting and CTA
  ctaText: string
  ctaUrl: string
  notice: string     // HTML — expiry / security note below CTA
}

export function emailBase(opts: EmailBaseOptions): string {
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>${opts.title} — WorkHub</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2ff;-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Inbox preview text (hidden) -->
  <span style="display:none;font-size:1px;line-height:1px;color:#eef2ff;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2ff;">
    <tr>
      <td align="center" style="padding:48px 16px 56px;">

        <!-- ═══════════════ EMAIL CARD ═══════════════ -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(79,70,229,0.14),0 2px 8px rgba(0,0,0,0.06);">

          <!-- ─── HEADER ─── -->
          <tr>
            <td style="background:linear-gradient(140deg,#1e1b4b 0%,#2d2a6e 40%,#4338ca 100%);padding:32px 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Logo mark + wordmark -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Icon box -->
                        <td style="width:42px;height:42px;background:rgba(255,255,255,0.13);border:1.5px solid rgba(255,255,255,0.22);border-radius:11px;text-align:center;vertical-align:middle;">
                          <span style="display:block;font-size:21px;font-weight:900;color:#ffffff;line-height:42px;letter-spacing:-1px;">W</span>
                        </td>
                        <!-- Wordmark -->
                        <td style="padding-left:11px;vertical-align:middle;">
                          <span style="display:block;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;line-height:1;">WorkHub</span>
                          <span style="display:block;font-size:11px;color:rgba(199,210,254,0.75);letter-spacing:0.4px;margin-top:2px;">Productivity Platform</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <!-- Decorative dots -->
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);margin-left:4px;"></span>
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15);margin-left:4px;"></span>
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.08);margin-left:4px;"></span>
                  </td>
                </tr>
              </table>

              <!-- Header bottom accent line -->
              <div style="margin-top:24px;height:1px;background:linear-gradient(to right,rgba(255,255,255,0.25),rgba(255,255,255,0.05),transparent);border-radius:1px;"></div>
            </td>
          </tr>

          <!-- ─── BODY ─── -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">

              <!-- Icon badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:60px;height:60px;background:${opts.iconBg};border:2px solid ${opts.iconColor};border-radius:16px;text-align:center;vertical-align:middle;">
                    <span style="display:block;font-size:26px;line-height:60px;">${opts.icon}</span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.25;letter-spacing:-0.6px;">${opts.heading}</h1>

              <!-- Greeting -->
              <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.7;">${opts.greeting}</p>

              <!-- Body paragraphs -->
              ${opts.body}

              <!-- ── CTA Button ── -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 28px;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#4f46e5 0%,#6d28d9 100%);box-shadow:0 6px 20px rgba(99,102,241,0.42);">
                    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:50px;" arcsize="24%" strokecolor="#4f46e5" fillcolor="#4f46e5"><w:anchorlock/><center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${opts.ctaText}</center></v:roundrect><![endif]-->
                    <a href="${opts.ctaUrl}" target="_blank" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">${opts.ctaText} &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Security / expiry notice card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #6366f1;border-radius:0 10px 10px 0;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.65;">${opts.notice}</p>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #f1f5f9;padding-top:20px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;">Button not working?</p>
                    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">Copy and paste this link into your browser:</p>
                    <a href="${opts.ctaUrl}" style="font-size:12px;color:#6366f1;word-break:break-all;text-decoration:none;">${opts.ctaUrl}</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ─── FOOTER ─── -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.6;">
                      &copy; ${year} WorkHub. All rights reserved.
                    </p>
                    <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.6;">
                      You received this email because your account is registered at WorkHub.<br>
                      If you have questions, reply to this email or contact our support.
                    </p>
                  </td>
                  <td align="right" style="vertical-align:bottom;">
                    <span style="display:inline-block;width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#6d28d9);border-radius:7px;text-align:center;line-height:28px;font-size:13px;font-weight:800;color:#ffffff;">W</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- ═══════════════ END CARD ═══════════════ -->

      </td>
    </tr>
  </table>
</body>
</html>`
}
