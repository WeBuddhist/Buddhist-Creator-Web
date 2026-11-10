import { greeting, type EmailTemplate } from "@/lib/emails/layout";

/* The email for a "rejected" decision, in the organising team's wording
   (supplied 10 November 2026).

   To change it: edit the subject or the paragraphs and bump `version`,
   which is stored with every send. Each string in `body` is one paragraph
   and a line break inside it is kept. `approved: false` stops the live
   site sending this email. */
export const rejected: EmailTemplate = {
  version: "2026-11-10",
  approved: true,
  subject: () => "Your Application for the Buddhist Creators Convention 2027",
  body: (vars) => [
    greeting(vars),
    "Thank you very much for your interest in the Buddhist Creators Convention 2027 and for taking the time to submit your application. We truly appreciate the effort and intention behind your work.",
    "Due to a very high number of applications and a limited number of seats, we regret to inform you that we are unable to offer you a place at this year’s convention. Participants were selected based on our internal selection criteria, and unfortunately, we could not accommodate all applicants.",
    "Please do not be discouraged by this outcome. We deeply value your interest in the convention and your commitment to creating meaningful Buddhist content. We plan to organise the Buddhist Creators Convention again in the future, and we warmly encourage you to apply next time.",
    "Thank you once again for your understanding. We wish you continued growth and success in your creative journey and hope to stay connected.",
    "Warm regards,\nOrganising Team\nBuddhist Creators Convention 2027",
  ],
};
