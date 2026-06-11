"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dataUrlToBlob } from "./compressImage";
import StepIndicator from "./StepIndicator";
import ImageUpload from "./ImageUpload";
import AIIdentification, {
  type Confidence,
  type IdentifyResult,
} from "./AIIdentification";
import PriceDetails, { type TcgPriceResult } from "./PriceDetails";
import SuccessStep from "./SuccessStep";

type Step = 1 | 2 | 3 | 4;

const INITIAL_STATE = {
  previewUrl: null as string | null,
  cardName: "",
  setName: "",
  cardNumber: "",
  confidence: null as Confidence | null,
  identified: false,
  enriched: false,
  variant: "Regular",
  language: "EN",
  tcgPrice: null as number | null,
  officialImageUrl: null as string | null,
  tcgFetched: false,
  tcgPriceData: null as TcgPriceResult | null,
  isGraded: false,
  grade: null as string | null,
  gradeCompany: null as string | null,
  price: "",
  notes: "",
  cardId: null as string | null,
};

export default function SellFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState(INITIAL_STATE);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const update = useCallback(
    (patch: Partial<typeof INITIAL_STATE>) =>
      setState((s) => ({ ...s, ...patch })),
    []
  );

  const handleImageReady = useCallback((dataUrl: string) => {
    setState((s) => ({
      ...INITIAL_STATE,
      previewUrl: dataUrl,
      price: s.price === "" ? "" : s.price,
    }));
  }, []);

  const handleIdentified = useCallback((result: IdentifyResult) => {
    setState((s) => ({
      ...s,
      cardName: result.card_name ?? s.cardName,
      setName: result.set_name ?? s.setName,
      cardNumber: result.card_number ?? s.cardNumber,
      confidence: result.confidence,
      identified: true,
      enriched: result.enriched ?? false,
      ...(result.variant ? { variant: result.variant } : {}),
      ...(result.official_image_url
        ? { officialImageUrl: result.official_image_url }
        : {}),
    }));
  }, []);

  const handleTcgResult = useCallback(
    (result: TcgPriceResult) => {
      update({
        tcgPrice: result.displayPrice,
        officialImageUrl: result.officialImage,
        tcgFetched: true,
        tcgPriceData: result,
      });
    },
    [update]
  );

  async function handlePublish() {
    if (!state.previewUrl) return;
    setPublishError("");
    setPublishing(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/");
      return;
    }

    // Ensure a public.users row exists before attempting the card insert.
    // The auth trigger creates it on signup, but this is a belt-and-suspenders
    // guard against FK violations if the row is somehow missing.
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
        setPublishError(
          `No se pudo crear tu perfil de usuario: ${profileError.message}`
        );
        setPublishing(false);
        return;
      }
    }

    const path = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("card-images")
      .upload(path, dataUrlToBlob(state.previewUrl), {
        contentType: "image/jpeg",
      });

    if (uploadError) {
      setPublishError(
        "No se pudo subir la imagen. Revisa tu conexión e intenta de nuevo."
      );
      setPublishing(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("card-images")
      .getPublicUrl(path);

    const { data: inserted, error: insertError } = await supabase
      .from("cards")
      .insert({
        seller_id: user.id,
        card_name: state.cardName.trim(),
        set_name: state.setName.trim() || null,
        card_number: state.cardNumber.trim() || null,
        image_url: publicUrl.publicUrl,
        official_image_url: state.officialImageUrl,
        price_usd: parseFloat(state.price),
        tcg_market_price: state.tcgPrice,
        status: "available",
        notes: state.notes.trim() || null,
        variant: state.variant,
        language: state.language,
        is_graded: state.isGraded,
        grade: state.isGraded ? state.grade : null,
        grade_company: state.isGraded ? state.gradeCompany : null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      await supabase.storage.from("card-images").remove([path]);
      setPublishError(
        `No se pudo publicar la carta. ${insertError?.message ?? "Intenta de nuevo."}`
      );
      setPublishing(false);
      return;
    }

    update({ cardId: inserted.id });
    setPublishing(false);
    setStep(4);
    router.refresh();
  }

  function handleReset() {
    setState(INITIAL_STATE);
    setPublishError("");
    setStep(1);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={step} />

      {step === 1 && (
        <ImageUpload
          previewUrl={state.previewUrl}
          onImageReady={handleImageReady}
          onContinue={() => setStep(2)}
        />
      )}

      {step === 2 && state.previewUrl && (
        <AIIdentification
          previewUrl={state.previewUrl}
          cardName={state.cardName}
          setName={state.setName}
          cardNumber={state.cardNumber}
          confidence={state.confidence}
          identified={state.identified}
          enriched={state.enriched}
          variant={state.variant}
          language={state.language}
          onFieldsChange={(fields) =>
            update({
              ...(fields.cardName !== undefined && {
                cardName: fields.cardName,
              }),
              ...(fields.setName !== undefined && { setName: fields.setName }),
              ...(fields.cardNumber !== undefined && {
                cardNumber: fields.cardNumber,
              }),
            })
          }
          onIdentified={handleIdentified}
          onVariantChange={(variant) =>
            update({ variant, tcgFetched: false, tcgPrice: null, officialImageUrl: null, tcgPriceData: null })
          }
          onLanguageChange={(language) =>
            update({ language, tcgFetched: false, tcgPrice: null, officialImageUrl: null, tcgPriceData: null })
          }
          onConfirm={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && state.previewUrl && (
        <PriceDetails
          previewUrl={state.previewUrl}
          cardName={state.cardName}
          setName={state.setName}
          cardNumber={state.cardNumber}
          variant={state.variant}
          language={state.language}
          price={state.price}
          notes={state.notes}
          tcgPrice={state.tcgPrice}
          tcgFetched={state.tcgFetched}
          tcgPriceData={state.tcgPriceData}
          isGraded={state.isGraded}
          grade={state.grade}
          gradeCompany={state.gradeCompany}
          publishing={publishing}
          publishError={publishError}
          onPriceChange={(price) => update({ price })}
          onNotesChange={(notes) => update({ notes })}
          onTcgResult={handleTcgResult}
          onIsGradedChange={(isGraded) => update({ isGraded })}
          onGradeChange={(grade) => update({ grade })}
          onGradeCompanyChange={(gradeCompany) => update({ gradeCompany })}
          onPublish={handlePublish}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && state.previewUrl && (
        <SuccessStep
          previewUrl={state.previewUrl}
          cardName={state.cardName}
          setName={state.setName}
          price={state.price}
          cardId={state.cardId}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
