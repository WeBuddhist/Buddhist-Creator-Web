"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { loginUrl } from "@/lib/login-url";

/* The header's sign-in link. It points at /login with the page it sits on
   as the way back, so signing in returns the reader to where they clicked,
   never to a page they did not ask for. Client-side because the header is
   shared by every page and only the browser knows which one this is. */
export function SignInLink({ className, children, ...rest }: Omit<React.ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return (
    <Link href={loginUrl(search ? `${pathname}?${search}` : pathname)} className={className} {...rest}>
      {children}
    </Link>
  );
}
