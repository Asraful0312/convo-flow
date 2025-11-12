"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const resendApiKey = process.env.AUTH_RESEND_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
        from: "no-reply@imagetotextnow.xyz",
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
