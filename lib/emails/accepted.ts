import { greeting, type EmailTemplate } from "@/lib/emails/layout";

/* The email for an "accepted" decision, in the organising team's wording
   (supplied 10 November 2026).

   To change it: edit the subject or the paragraphs and bump `version`,
   which is stored with every send. Each string in `body` is one paragraph
   and a line break inside it is kept. `approved: false` stops the live
   site sending this email. */
export const accepted: EmailTemplate = {
  version: "2026-11-10",
  approved: true,
  subject: () => "Congratulations! Your Participation in the Buddhist Creators Convention 2027 is Confirmed",
  body: (vars) => [
    greeting(vars),
    "Thank you for your application to the Buddhist Creators Convention 2027. We are delighted to inform you that you have been selected to participate in this year’s convention.",
    "We received a very high number of applications, and your work and intention stood out to our selection team. We are truly happy to welcome you to a gathering of creators who share a commitment to producing meaningful Buddhist content.",
    "Convention details:\nDate: Feb 18th-21st, 2027\nVenue: Nagarjuna Training Institute, Nagaloka, Nagpur, Maharashtra",
    "To secure your place, please confirm your attendance by replying to this email no later than December 30th, 2026. If we do not hear from you by this date, your seat may be offered to another applicant on our waiting list.",
    "Further information, including the programme schedule, accommodation details, and any preparation required, will be shared with you shortly.",
    "If you have any questions, please feel free to contact us at hello@buddhistcreators.com.",
    "We look forward to welcoming you and to the creativity, insight, and spirit you will bring to the convention.",
    "Warm regards,\nOrganising Team\nBuddhist Creators Convention 2027",
  ],
};
