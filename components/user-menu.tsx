import { unstable_rethrow } from "next/navigation";
import { SignInIcon } from "@phosphor-icons/react/dist/ssr";
import { AccountMenu } from "@/components/account-menu";
import { SignInLink } from "@/components/sign-in-link";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

/* The header's account corner. It reads the session, so it renders inside
   a <Suspense> boundary in the header and streams in after the static
   shell. If the database or Auth0 is unreachable the public site must not
   go down with it: any failure falls back to the sign-in link. */

const pill = cn(
  "inline-flex h-9 select-none items-center gap-1.5 rounded-full px-3.5 text-sm font-medium",
  "text-(--header-fg-muted) transition-[color,background-color,transform] duration-150 ease-hover",
  "hover:bg-(--header-hover) hover:text-(--header-fg) active:scale-[0.97]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--header-ring)",
);

const iconPill = cn(
  "inline-flex size-10 select-none items-center justify-center rounded-full",
  "text-(--header-fg) transition-[background-color,transform] duration-150 ease-hover",
  "hover:bg-(--header-hover) active:scale-[0.95]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--header-ring)",
);

const REGISTER = "/convention/2027/register";

export async function UserMenu() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Redirects and prerender interruptions are Next's, not ours.
    unstable_rethrow(error);
    console.error("UserMenu: could not read the session", error);
  }

  if (!user) {
    return (
      <>
        <SignInLink className={cn(pill, "hidden md:inline-flex")}>
          <SignInIcon className="size-4" weight="bold" aria-hidden />
          Sign in
        </SignInLink>
        <SignInLink className={cn(iconPill, "md:hidden")} aria-label="Sign in">
          <SignInIcon className="size-5" weight="bold" aria-hidden />
        </SignInLink>
      </>
    );
  }

  return (
    <AccountMenu
      name={user.name}
      email={user.email}
      picture={user.picture}
      applicationHref={REGISTER}
      adminHref={hasRole(user, "admin") ? "/admin" : undefined}
    />
  );
}
