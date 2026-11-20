import { getCurrentUser } from "@/lib/auth";
import { cardShareImage, isShareFormat } from "@/lib/card-share";
import { getMyCard } from "@/lib/creator-cards";
import { cardHome } from "@/lib/creator-home";
import { forLog } from "@/lib/log-error";

/* The picture of the signed-in creator's own card, to post: /creator-card/
   share/story (9:16) or /creator-card/share/post (4:5), drawn in
   lib/card-share.tsx. Only an approved card has one, since only an
   approved card is public; it is drawn from the card as the creator's own
   page shows it, so the picture never says more than the page does.

   It is the creator's own, so the browser may keep it for a while but no
   shared cache may. The page asks for it with a version (?v=) that changes
   when the card or its counts do, so a kept copy is never out of date. */
export async function GET(_request: Request, ctx: RouteContext<"/creator-card/share/[format]">) {
  const { format } = await ctx.params;
  if (!isShareFormat(format)) return new Response("Not found", { status: 404 });

  const user = await getCurrentUser();
  if (!user) return new Response("Sign in to share your card", { status: 401 });
  const row = await getMyCard(user.id);
  if (!row || row.status !== "approved") return new Response("No approved card to share", { status: 404 });

  try {
    const image = await cardShareImage(await cardHome(row, user), format);
    const body = await image.arrayBuffer();
    return new Response(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="buddhist-creators-card-${format}.png"`,
      },
    });
  } catch (error) {
    console.error("[card-share] could not draw the picture", forLog(error));
    return new Response("Could not draw your card", { status: 500 });
  }
}
