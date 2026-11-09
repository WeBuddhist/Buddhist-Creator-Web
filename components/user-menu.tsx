import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { SignInIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { loginUrl } from "@/lib/auth0";
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
        <Link href={loginUrl(REGISTER)} className={cn(pill, "hidden md:inline-flex")}>
          <SignInIcon className="size-4" weight="bold" aria-hidden />
          Sign in
        </Link>
        <Link href={loginUrl(REGISTER)} className={cn(iconPill, "md:hidden")} aria-label="Sign in">
          <SignInIcon className="size-5" weight="bold" aria-hidden />
        </Link>
      </>
    );
  }

  const firstName = user.name?.split(" ")[0] ?? user.email;

  return (
    <>
      <div className="hidden items-center gap-1 md:flex">
        {hasRole(user, "admin") && (
          <Link href="/admin" className={pill}>
            Admin
          </Link>
        )}
        <Link href={REGISTER} className={pill} title={user.email}>
          <UserCircleIcon className="size-4" weight="bold" aria-hidden />
          {firstName}
        </Link>
        {/* A plain anchor: the SDK serves /auth/logout, so it must not be prefetched. */}
        <a href="/auth/logout" className={pill}>
          <SignOutIcon className="size-4" weight="bold" aria-hidden />
          Sign out
        </a>
      </div>
      <Link href={REGISTER} className={cn(iconPill, "md:hidden")} aria-label={`My application (${user.email})`}>
        <UserCircleIcon className="size-5" weight="bold" aria-hidden />
      </Link>
    </>
  );
}
