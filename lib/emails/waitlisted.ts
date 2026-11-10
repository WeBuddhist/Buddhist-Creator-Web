import { greeting, type EmailTemplate } from "@/lib/emails/layout";

/* The email for a "waitlisted" decision, in the organising team's wording
   (supplied 10 November 2026).

   To change it: edit the subject or the paragraphs and bump `version`,
   which is stored with every send. Each string in `body` is one paragraph
   and a line break inside it is kept. `approved: false` stops the live
   site sending this email. */
export const waitlisted: EmailTemplate = {
  version: "2026-11-10",
  approved: true,
  subject: () => "Your Application for the Buddhist Creators Convention 2027 – Waiting List",
  body: (vars) => [
    greeting(vars),
    "Thank you very much for your interest in the Buddhist Creators Convention 2027 and for taking the time to submit your application. We truly appreciate the effort and intention behind your work.",
    "Due to a very high number of applications and a limited number of seats, we are unable to offer you a confirmed place at this time. However, we are pleased to inform you that your application has been placed on our waiting list.",
    "Should a seat become available, we will contact you by email as soon as possible, and no later than Jan 10th, 2027. As places may open at short notice, we kindly ask that you respond promptly if you are contacted.",
    "If you no longer wish to remain on the waiting list, please let us know by replying to this email so that we may offer the opportunity to another applicant.",
    "We deeply value your interest in the convention and your commitment to creating meaningful Buddhist content. Thank you for your patience and understanding, and we hope to have the opportunity to welcome you.",
    "Warm regards,\nOrganising Team\nBuddhist Creators Convention 2027",
  ],
};
