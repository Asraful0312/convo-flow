"use node";
"use action";

import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import Papa from "papaparse";
import ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const exportResponses = action({
  args: {
    formId: v.id("forms"),
    responseIds: v.array(v.id("responses")),
    format: v.union(v.literal("csv"), v.literal("xlsx"), v.literal("pdf"), v.literal("json")),
  },
  handler: async (ctx, { formId, responseIds, format }): Promise<any> => {
    const form = await ctx.runQuery(api.forms.getSingleForm, { formId });
    if (!form) {
      throw new ConvexError("Form not found");
    }

    const responses = await Promise.all(
        responseIds.map(responseId => ctx.runQuery(api.responses.getResponseWithAnswers, { responseId }))
    );

    const questions = form.questions.sort((a, b) => a.order - b.order);
    const headers = ["Response ID", "Status", "Started At", "Completed At", ...questions.map(q => q.text)];

    let fileContent: string | Buffer = "";
    let contentType = "";

    if (format === "csv") {
      const data = await Promise.all(responses.map(async (response: any) => {
          if (!response) return [];
          const row: (string | number | null | undefined)[] = [
              response._id,
              response.status,
              new Date(response.startedAt).toISOString(),
              response.completedAt ? new Date(response.completedAt).toISOString() : "",
          ];
          for (const q of questions) {
              const answer = response.answers.find((a: any) => a.questionId === q._id);
              if (answer) {
                  if (q.type === "file") {
                       if (answer.value && typeof answer.value === 'string' && answer.fileSize) {
                          const url = await ctx.storage.getUrl(answer.value);
                          row.push(url ?? `Invalid storage ID: ${answer.value}`);
                      } else {
                          row.push(String(answer.value));
                      }
                  } else {
                      row.push(String(answer.value));
                  }
              } else {
                  row.push("");
              }
          }
          return row;
      }));
      fileContent = Papa.unparse({ fields: headers, data });
      contentType = "text/csv";
    } else if (format === "xlsx") {
        const data = await Promise.all(responses.map(async (response: any) => {
            if (!response) return [];
            const row: (string | number | null | undefined)[] = [
                response._id,
                response.status,
                new Date(response.startedAt).toISOString(),
                response.completedAt ? new Date(response.completedAt).toISOString() : "",
            ];
            for (const q of questions) {
                const answer = response.answers.find((a: any) => a.questionId === q._id);
                if (answer) {
                    if (q.type === "file") {
                         if (answer.value && typeof answer.value === 'string' && answer.fileSize) {
                            const url = await ctx.storage.getUrl(answer.value);
                            row.push(url ?? `Invalid storage ID: ${answer.value}`);
                        } else {
                            row.push(String(answer.value));
                        }
                    } else {
                        row.push(String(answer.value));
                    }
                } else {
                    row.push("");
                }
            }
            return row;
        }));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Responses');
        worksheet.columns = headers.map(header => ({ header, key: header, width: 30 }));
        worksheet.addRows(data);
        const buffer = await workbook.xlsx.writeBuffer();
        fileContent = Buffer.from(buffer);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (format === "pdf") {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pageMargin = 50;

        for (const response of responses) {
            if (!response) continue;
            const page = pdfDoc.addPage();
            let y = page.getHeight() - pageMargin;

            page.drawText(`Response ID: ${response._id}`, { x: pageMargin, y, font: boldFont, size: 14 });
            y -= 30;

            const details = [
                { label: "Status", value: response.status },
                { label: "Started At", value: new Date(response.startedAt).toLocaleString() },
                { label: "Completed At", value: response.completedAt ? new Date(response.completedAt).toLocaleString() : "N/A" },
            ];

            details.forEach(detail => {
                page.drawText(`${detail.label}:`, { x: pageMargin, y, font: boldFont, size: 10 });
                page.drawText(detail.value, { x: pageMargin + 100, y, font, size: 10 });
                y -= 20;
            });

            y -= 10; // Extra space before answers
            page.drawText("Answers:", { x: pageMargin, y, font: boldFont, size: 12 });
            y -= 20;

            for (const q of questions) {
                if (y < pageMargin) {
                    const newPage = pdfDoc.addPage();
                    y = newPage.getHeight() - pageMargin;
                }
                const answer = response.answers.find(a => a.questionId === q._id);
                page.drawText(q.text, { x: pageMargin, y, font: boldFont, size: 10 });
                y -= 15;

                let answerText = "No answer";
                if (answer) {
                    if (q.type === "file") {
                         if (answer.value && typeof answer.value === 'string' && answer.fileName) {
                            const url = await ctx.storage.getUrl(answer.value);
                            answerText = url || `Invalid storage ID: ${answer.value}`;
                        } else {
                            answerText = String(answer.value);
                        }
                    } else {
                        answerText = String(answer.value);
                    }
                }
                page.drawText(answerText, { x: pageMargin + 10, y, font, size: 10, color: rgb(0.2, 0.2, 0.2) });
                y -= 25;
            }
        }

        const pdfBytes = await pdfDoc.save();
        fileContent = Buffer.from(pdfBytes);
        contentType = "application/pdf";
    } else if (format === "json") {
        const jsonResponses = await Promise.all(responses.map(async (response: any) => {
            if (!response) return {};
            const answersMap: { [key: string]: any } = {};
            for (const q of questions) {
                const answer = response.answers.find((a: any) => a.questionId === q._id);
                if (answer) {
                    if (q.type === "file" && answer.value && typeof answer.value === 'string' && answer.fileSize) {
                        const url = await ctx.storage.getUrl(answer.value);
                        answersMap[q.text] = url ?? `Invalid storage ID: ${answer.value}`;
                    } else {
                        answersMap[q.text] = answer.value;
                    }
                } else {
                    answersMap[q.text] = null;
                }
            }
            return {
                _id: response._id,
                status: response.status,
                startedAt: new Date(response.startedAt).toISOString(),
                completedAt: response.completedAt ? new Date(response.completedAt).toISOString() : null,
                metadata: response.metadata,
                contactInfo: response.contactInfo,
                answers: answersMap,
            };
        }));
        fileContent = JSON.stringify(jsonResponses, null, 2);
        contentType = "application/json";
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: fileContent as any,
    });

    const { storageId } = await result.json();
    const url = await ctx.storage.getUrl(storageId);

    return url;
  },
});
