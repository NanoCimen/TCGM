import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichCard } from "@/lib/api/enrich-card";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are an expert Pokemon TCG card identifier with 20 years of experience grading and identifying cards. You can identify cards even in challenging conditions: sleeves, protective cases, glare, reflections, angles, and low lighting.

Your identification process:
1. First locate the Pokemon name — always at the TOP in large bold text
2. Find the HP number next to the name (confirms you found the right area)
3. Look for the card number at the BOTTOM — format is XXX/XXX or XXX/YYY
   CRITICAL: Return the FULL card number including the total after the slash.
   If you see "106/130" return "106/130", not just "106".
   The number after the slash identifies the exact set — never omit it.
4. Identify the set symbol (small icon bottom left or right)
5. Look for rarity symbol (circle=common, diamond=uncommon, star=rare)
6. Check for special art indicators: full bleed art, illustration style, gold border, rainbow foil pattern

Common challenges you handle:
- Holographic glare: look at the text areas which don't reflect
- Sleeves/cases: focus on text not affected by plastic reflection
- Angles: the card name is always readable even at slight angles
- Partial visibility: identify from visible elements

Confidence rules:
- 'high': you can clearly read name AND card number
- 'medium': you can read the name but number is partially obscured
- 'low': only partial information visible

ALWAYS attempt identification. Never return empty fields if ANY text is visible. If unsure between two cards, pick the most likely one and set confidence to 'medium'.

Return ONLY valid JSON, no markdown, no explanation:
{ card_name: string, set_name: string, card_number: string, confidence: 'high'|'medium'|'low' }
card_number must be the full "XXX/YYY" format, e.g. "106/130".`;

const SUPPORTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

interface ClaudeCardResult {
  card_name: string | null;
  set_name: string | null;
  card_number: string | null;
  confidence: "high" | "medium" | "low";
}

function parseDataUrl(image: string): {
  mediaType: SupportedMediaType;
  data: string;
} | null {
  const prefix = ";base64,";
  const prefixIndex = image.indexOf(prefix);
  if (!image.startsWith("data:") || prefixIndex === -1) return null;

  const mediaType = image.slice(5, prefixIndex) as SupportedMediaType;
  if (!SUPPORTED_MEDIA_TYPES.includes(mediaType)) return null;

  const data = image.slice(prefixIndex + prefix.length);
  if (!data) return null;

  return { mediaType, data };
}

function parseClaudeResult(text: string): ClaudeCardResult | null {
  try {
    const parsed = JSON.parse(text.trim()) as ClaudeCardResult;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("confidence" in parsed) ||
      !["high", "medium", "low"].includes(parsed.confidence)
    ) {
      return null;
    }

    return {
      card_name: parsed.card_name ?? null,
      set_name: parsed.set_name ?? null,
      card_number: parsed.card_number ?? null,
      confidence: parsed.confidence,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Safety net: ensure a public.users row exists so card inserts never fail
  // with a foreign-key violation. The auth trigger handles this on signup,
  // but this catches edge cases (trigger failure, legacy accounts, etc.).
  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!userRow) {
    const { error: profileError } = await supabase.from("users").insert({
      id: user.id,
      display_name: user.email?.split("@")[0] ?? "Usuario",
    });
    if (profileError) {
      console.error("[identify-card] could not create user profile:", profileError.message);
    }
  }

  let body: { image?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { image } = body;

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const parsed = parseDataUrl(image);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid image format. Expected a base64 data URL." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API key is not configured" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  let claudeResult: ClaudeCardResult;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.mediaType,
                data: parsed.data,
              },
            },
            {
              type: "text",
              text: "Identify this Pokemon TCG card.",
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from card identification service" },
        { status: 502 }
      );
    }

    const result = parseClaudeResult(textBlock.text);
    if (!result) {
      return NextResponse.json(
        { error: "Invalid JSON response from card identification service" },
        { status: 502 }
      );
    }

    claudeResult = result;
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Card identification service unavailable" },
      { status: 502 }
    );
  }

  // Enrichment step — attempt to verify and correct via Pokemon TCG API
  let enriched = false;
  let setName = claudeResult.set_name;
  let cardNumber = claudeResult.card_number;
  let variant = "Regular";
  let officialImageUrl: string | null = null;

  if (claudeResult.card_name && claudeResult.card_number) {
    const enrichedData = await enrichCard(
      claudeResult.card_name,
      claudeResult.card_number
    );

    if (enrichedData) {
      setName = enrichedData.setName;
      cardNumber = enrichedData.cardNumber;
      variant = enrichedData.variant;
      officialImageUrl = enrichedData.officialImageUrl || null;
      enriched = true;
    }
  }

  return NextResponse.json({
    card_name: claudeResult.card_name,
    set_name: setName,
    card_number: cardNumber,
    variant,
    official_image_url: officialImageUrl,
    confidence: claudeResult.confidence,
    enriched,
  });
}
