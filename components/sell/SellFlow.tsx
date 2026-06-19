"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dataUrlToBlob } from "./compressImage";
import StepIndicator from "./StepIndicator";
import CameraScanner from "./CameraScanner";
import ImageUpload from "./ImageUpload";
import AIIdentification, {
  type Confidence,
  type IdentifyResult,
} from "./AIIdentification";
import PriceDetails, { type TcgPriceResult } from "./PriceDetails";
import SuccessStep from "./SuccessStep";

type UploadStage = "idle" | "uploading" | "saving";

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
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");

  // Scanner + batch queue
  const [showScanner, setShowScanner] = useState(false);
  const [cardQueue, setCardQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const update = useCallback(
    (patch: Partial<typeof INITIAL_STATE>) =>
      setState((s) => ({ ...s, ...patch })),
    []
  );

  // Called when gallery image is selected
  const handleImageReady = useCallback((dataUrl: string) => {
    setState((s) => ({
      ...INITIAL_STATE,
      previewUrl: dataUrl,
      price: s.price === "" ? "" : s.price,
    }));
  }, []);

  // Called when scanner returns one or more captures
  function handleScannerCaptures(previewUrls: string[]) {
    setShowScanner(false);
    if (previewUrls.length === 0) return;
    setCardQueue(previewUrls);
    setQueueIndex(0);
    setState({ ...INITIAL_STATE, previewUrl: previewUrls[0] });
    setStep(2);
  }

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
    setUploadStage("uploading");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/");
      return;
    }

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
        setUploadStage("idle");
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
      setUploadStage("idle");
      return;
    }

    setUploadStage("saving");

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
        status: "draft",
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
      setUploadStage("idle");
      return;
    }

    update({ cardId: inserted.id });
    setUploadStage("idle");
    setPublishing(false);
    setStep(4);
    router.refresh();
  }

  function handleNextInQueue() {
    const next = queueIndex + 1;
    if (next < cardQueue.length) {
      setQueueIndex(next);
      setState({ ...INITIAL_STATE, previewUrl: cardQueue[next] });
      setPublishError("");
      setStep(2);
    } else {
      handleReset();
    }
  }

  function handleReset() {
    setState(INITIAL_STATE);
    setPublishError("");
    setCardQueue([]);
    setQueueIndex(0);
    setStep(1);
  }

  const isBatch = cardQueue.length > 1;

  return (
    <>
      {/* Full-screen camera scanner overlay */}
      {showScanner && (
        <CameraScanner
          onCaptures={handleScannerCaptures}
          onCancel={() => setShowScanner(false)}
        />
      )}

      {/* Upload progress overlay */}
      {publishing && uploadStage !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl">
            {state.previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.previewUrl}
                alt=""
                className="w-20 h-28 object-cover rounded-xl border border-gray-700 mx-auto mb-6 shadow-xl"
              />
            )}

            <div className="w-14 h-14 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-7 h-7 text-brand animate-spin" />
            </div>

            <p className="text-base font-black text-white mb-1">
              {uploadStage === "uploading" ? "Subiendo imagen..." : "Guardando carta..."}
            </p>
            <p className="text-xs text-gray-500">
              {uploadStage === "uploading"
                ? "Esto puede tardar unos segundos."
                : "Casi listo, guardando en tu portafolio."}
            </p>

            {/* Progress bar */}
            <div className="flex gap-1.5 mt-6 mx-auto w-fit">
              <div className="h-1 w-12 rounded-full bg-brand transition-all duration-500" />
              <div
                className={`h-1 w-12 rounded-full transition-all duration-500 ${
                  uploadStage === "saving" ? "bg-brand" : "bg-gray-700"
                }`}
              />
            </div>
            <div className="flex gap-4 justify-center mt-1.5">
              <span className="text-[10px] text-gray-500">Imagen</span>
              <span className="text-[10px] text-gray-500">Guardando</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <StepIndicator current={step} />

        {/* Batch progress */}
        {isBatch && step < 4 && (
          <p className="text-center text-xs font-bold text-brand mb-6 -mt-4">
            Carta {queueIndex + 1} de {cardQueue.length}
          </p>
        )}

        {step === 1 && (
          <ImageUpload
            previewUrl={state.previewUrl}
            onImageReady={handleImageReady}
            onContinue={() => setStep(2)}
            onOpenScanner={() => setShowScanner(true)}
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
              update({
                variant,
                tcgFetched: false,
                tcgPrice: null,
                officialImageUrl: null,
                tcgPriceData: null,
              })
            }
            onLanguageChange={(language) =>
              update({
                language,
                tcgFetched: false,
                tcgPrice: null,
                officialImageUrl: null,
                tcgPriceData: null,
              })
            }
            onConfirm={() => setStep(3)}
            onBack={() => (isBatch ? handleReset() : setStep(1))}
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
            hasMore={isBatch && queueIndex < cardQueue.length - 1}
            currentCard={queueIndex + 1}
            totalCards={cardQueue.length}
            onNextCard={handleNextInQueue}
          />
        )}
      </div>
    </>
  );
}
