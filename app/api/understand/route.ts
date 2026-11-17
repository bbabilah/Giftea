import { NO_KEY_MESSAGE, errorResponse, pickProvider, structured } from "@/lib/ai/provider";
import { UNDERSTAND_SYSTEM, UnderstandRequest, UnderstandSchema } from "@/lib/ai/understand";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Turns a free-typed description of a friend into structured details for the chat. */
export async function POST(req: Request) {
  const provider = pickProvider();
  if (!provider) return Response.json({ error: NO_KEY_MESSAGE }, { status: 500 });

  let text: string;
  try {
    text = UnderstandRequest.parse(await req.json()).text;
  } catch {
    return Response.json({ error: "That request didn’t look right." }, { status: 400 });
  }

  try {
    const details = await structured(provider, {
      schema: UnderstandSchema,
      name: "friend_details",
      system: UNDERSTAND_SYSTEM,
      prompt: `The user wrote:\n"""\n${text}\n"""`,
    });
    return Response.json({ details });
  } catch (err) {
    return errorResponse(err);
  }
}
