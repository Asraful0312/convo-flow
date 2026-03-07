"use node";
import { v } from "convex/values";
import { Resend } from "resend";
import { internalAction } from "./_generated/server";

const resendApiKey = process.env.AUTH_RESEND_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM =
  process.env.NODE_ENV === "prod"
    ? "no-reply@imagetotextnow.xyz"
    : "onboarding@resend.dev";

export const sendInviteEmail = internalAction({
  args: {
    email: v.string(),
    workspaceName: v.string(),
    inviterName: v.string(),
    inviteUrl: v.string(),
  },
  handler: async (ctx, { email, workspaceName, inviterName, inviteUrl }) => {
    if (!resend) {
      console.warn(
        "Resend client not initialized. Set AUTH_RESEND_KEY to send emails.",
      );
      return;
    }

    try {
      await resend.emails.send({
        from: FROM,
        to: [email],
        subject: `You're invited to join ${workspaceName} on Candid`,
        html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h1 style="font-size: 24px;">You're invited!</h1>
                        <p>${inviterName} has invited you to join the <strong>${workspaceName}</strong> workspace on Candid.</p>
                        <p>Click the button below to accept the invitation:</p>
                        <a 
                            href="${inviteUrl}" 
                            style="display: inline-block; padding: 12px 24px; background-color: #F56A4D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;"
                        >
                            Accept Invitation
                        </a>
                        <p style="font-size: 12px; color: #999; margin-top: 20px;">
                            If you're not expecting this invitation, you can ignore this email.
                        </p>
                    </div>
                `,
      });
    } catch (error) {
      console.error("Failed to send invite email:", error);
      // Don't throw error to prevent the whole action from failing,
      // as the invite is already created in the DB.
    }
  },
});

export const sendResumeLink = internalAction({
  args: {
    email: v.string(),
    formTitle: v.string(),
    resumeUrl: v.string(),
  },
  handler: async (ctx, { email, formTitle, resumeUrl }) => {
    if (!resend) {
      console.warn(
        "Resend client not initialized. Set AUTH_RESEND_KEY to send emails.",
      );
      return;
    }

    try {
      await resend.emails.send({
        from: FROM,
        to: [email],
        subject: `Continue your form: ${formTitle}`,
        html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h1 style="font-size: 24px;">Your form progress has been saved</h1>
                  <p>You can continue filling out the <strong>${formTitle}</strong> form by clicking the button below.</p>
                  <a 
                      href="${resumeUrl}" 
                      style="display: inline-block; padding: 12px 24px; background-color: #F56A4D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;"
                  >
                      Resume Form
                  </a>
                  <p style="font-size: 12px; color: #999; margin-top: 20px;">
                      If you didn't request this, you can ignore this email.
                  </p>
              </div>
          `,
      });
    } catch (error) {
      console.error("Failed to send resume link email:", error);
    }
  },
});

export const sendCompletionEmail = internalAction({
  args: {
    to: v.union(v.string(), v.array(v.string())),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { to, subject, html }) => {
    if (!resend) {
      console.warn(
        "Resend client not initialized. Set AUTH_RESEND_KEY to send emails.",
      );
      return;
    }

    try {
      await resend.emails.send({
        from: FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Failed to send completion email:", error);
    }
  },
});
