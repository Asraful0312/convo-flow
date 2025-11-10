"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { Doc } from "./_generated/dataModel";

export const send = internalAction({
  args: {
    integration: v.any(),
    form: v.any(),
    response: v.any(),
    answers: v.any(),
  },
  handler: async (ctx, { integration, form, response, answers }) => {
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      recipientEmail,
      senderEmail,
    } = integration.config;

    if (
      !smtpHost ||
      !smtpPort ||
      !smtpUser ||
      !smtpPassword ||
      !recipientEmail
    ) {
      throw new Error("SMTP configuration is incomplete.");
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const answersHtml = answers
      .map(
        (answer: Doc<"answers"> & { questionText: string }) =>
          `<p><strong>${answer.questionText}:</strong> ${answer.value}</p>`
      )
      .join("");

    const mailOptions = {
      from: senderEmail || smtpUser,
      to: recipientEmail,
      subject: `New Response for Form: ${form.title}`,
      html: `
        <h1>New Response Received</h1>
        <p>A new response has been submitted for your form, <strong>${form.title}</strong>.</p>
        <h2>Response Details:</h2>
        <p><strong>Response ID:</strong> ${response._id}</p>
        <p><strong>Status:</strong> ${response.status}</p>
        <p><strong>Submitted At:</strong> ${new Date(
          response.completedAt
        ).toLocaleString()}</p>
        <hr>
        <h2>Answers:</h2>
        ${answersHtml}
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully for response:", response._id);
    } catch (error) {
      console.error("Failed to send email:", error);
      // Optionally, you could add logic to update the integration status in the DB
      throw new Error(`Failed to send email. Please check your SMTP settings.`);
    }
  },
});
