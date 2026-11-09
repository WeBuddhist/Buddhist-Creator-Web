/* Content for the Buddhist Creators Convention 2027 page. The flyer at the
   top of the page is the one on the homepage; what follows it is the
   announcement copy below. */

export const CONVENTION_2027 = {
  year: 2027,
  title: "Buddhist Creators Convention 2027",
  shortTitle: "BCC 2027",
  location: "Nagaloka, Nagpur, India",
  dates: { label: "18 – 21 February 2027", start: "2027-02-18", end: "2027-02-21" },
  /** The line in the flyer's status pill. */
  status: "Registration open",
} as const;

export const HOSTS = [
  { name: "WeBuddhist", href: "https://webuddhist.com/" },
  { name: "Nagarjuna Training Institute, Nagaloka", href: "https://www.nagarjunatraininginstitute.org/" },
] as const;

export const WELCOME = {
  eyebrow: "The next convention",
  title: "Welcome to the 2027 Buddhist Creators Convention",
  paragraphs: [
    "We are delighted to announce that the 2027 Buddhist Creators Convention will be co-hosted by WeBuddhist and the Nagarjuna Training Institute, Nagaloka.",
    "By uniting our shared vision and communities, this collaboration brings together a rich tradition of learning, digital connection, and leadership development to create a deeply inspiring experience for all participants. We look forward to having Buddhist creators with us again soon!",
  ],
} as const;

export const REGISTRATION = {
  eyebrow: "Registration",
  title: "Registration is open",
  /** Flip to false to take the form offline: the register button is then
      shown disabled. Keep `status` above in step with this. */
  open: true,
  /** The registration form. Signing in is required, see proxy.ts. */
  href: "/convention/2027/register",
  label: "Register for the convention",
  note: "Applying takes about ten minutes and needs a short intro video. You can save a draft and come back. Sign in with Google or email first so we can reach you.",
  previous: { label: "Read the 2026 report", href: "/convention/2026" },
} as const;
