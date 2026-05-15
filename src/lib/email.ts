import emailjs from "@emailjs/browser";

const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const welcomeTemplateId = import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID as string;
const loginTemplateId = import.meta.env.VITE_EMAILJS_LOGIN_TEMPLATE_ID as string;

if (!publicKey || !serviceId || !welcomeTemplateId || !loginTemplateId) {
  throw new Error(
    "Missing EmailJS credentials. Add VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, " +
    "VITE_EMAILJS_WELCOME_TEMPLATE_ID, VITE_EMAILJS_LOGIN_TEMPLATE_ID to .env.local"
  );
}

emailjs.init(publicKey);

/*
 * EmailJS Template Variables:
 *
 * ── Welcome Template (VITE_EMAILJS_WELCOME_TEMPLATE_ID) ──
 *   {{to_name}}   — participant's name
 *   {{to_email}}  — participant's email
 *   {{roll}}      — participant's roll number
 *
 * ── Login Template (VITE_EMAILJS_LOGIN_TEMPLATE_ID) ──
 *   {{to_name}}    — team leader's name
 *   {{to_email}}   — team leader's email
 *   {{team_name}}  — team name
 *   {{login_url}}  — one-click magic login URL
 */

export async function sendWelcomeEmail(name: string, email: string, roll: string): Promise<string | null> {
  try {
    const res = await emailjs.send(serviceId, welcomeTemplateId, {
      to_name: name,
      to_email: email,
      roll,
    });
    if (res.status !== 200) return `EmailJS returned status ${res.status}`;
    return null;
  } catch (err: any) {
    return err?.text || err?.message || "Unknown EmailJS error";
  }
}

export async function sendLoginEmail(
  name: string,
  email: string,
  teamName: string,
  teamCode: string,
  loginUrl: string,
): Promise<string | null> {
  try {
    const res = await emailjs.send(serviceId, loginTemplateId, {
      to_name: name,
      to_email: email,
      team_name: teamName,
      team_code: teamCode,
      login_url: loginUrl,
    });
    if (res.status !== 200) return `EmailJS returned status ${res.status}`;
    return null;
  } catch (err: any) {
    return err?.text || err?.message || "Unknown EmailJS error";
  }
}
