import { useEffect, useState } from "react";
import type { RefObject } from "react";

export type OnboardingStep = {
  ref: RefObject<HTMLElement | null>;
  text: string;
};

/**
 * ヘッダーのナビゲーションを順番に説明する、初回ログイン向けのツールチップツアー。
 * 各ステップの対象要素をハイライトし、その近くに説明+「次へ/スキップ/完了」ボタンを表示する。
 * @param steps 説明したい要素(ref)と、そこに表示するテキストの配列。順番に表示する
 * @param onFinish 「スキップ」または最後のステップで「完了」を押したときに呼ばれる
 */
export function OnboardingTour({ steps, onFinish }: { steps: OnboardingStep[]; onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // ステップが変わるたび、対象要素の実際の画面上の位置を測り直す。
  // ウィンドウのリサイズでも位置がずれるので、リサイズ時にも測り直す。
  useEffect(() => {
    function measure() {
      setRect(step?.ref.current?.getBoundingClientRect() ?? null);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step]);

  if (!step || !rect) return null;

  const padding = 6;
  const highlightTop = rect.top - padding;
  const highlightLeft = rect.left - padding;
  const highlightWidth = rect.width + padding * 2;
  const highlightHeight = rect.height + padding * 2;

  function handleNext() {
    if (isLastStep) {
      onFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  return (
    <>
      {/* 対象要素を切り抜いたように見せるハイライト枠。
          box-shadowの広がり(9999px)で、対象の周り以外を画面全体薄暗くしている */}
      <div
        className="onboarding-highlight"
        style={{
          top: highlightTop,
          left: highlightLeft,
          width: highlightWidth,
          height: highlightHeight,
        }}
      />
      <div
        className="onboarding-tooltip"
        style={{ top: highlightTop + highlightHeight + 12, left: Math.max(12, highlightLeft) }}
      >
        <p className="onboarding-tooltip-text">{step.text}</p>
        <div className="onboarding-tooltip-actions">
          <button type="button" className="btn-text" onClick={onFinish}>
            スキップ
          </button>
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {isLastStep ? "完了" : "次へ"}
          </button>
        </div>
      </div>
    </>
  );
}
