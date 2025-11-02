export type EmailPayload = { to: string; subject: string; html: string }

export async function sendEmail(_payload: EmailPayload) {
  // Stub for Resend. In production, integrate with Resend API.
  return { id: "stubbed-email-id" }
}



