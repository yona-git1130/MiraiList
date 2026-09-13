import { useEffect, useRef } from "react";
import type { DependencyList } from "react";

/**
 * 中身(タグボタンなど)を、実際に描画された幅を測って縮小/拡大し、
 * 親要素の幅にぴったり収まる(横スクロールなしの1行)ようにするためのフック。
 * CSS側は `var(--<cssVar>)` を参照する形にしておき、このフックがJSでその値を計算して設定する。
 * 画面リサイズや中身の変化(ResizeObserver)にも追従して再計算する。
 * @param cssVar 倍率を反映するCSSカスタムプロパティ名(先頭の `--` は含めない)
 * @param maxScale 倍率の上限。1にすると「縮むだけ・元のサイズより大きくはしない」(ヘッダーなど)、
 *   Infinityにすると「余った幅があれば埋めるまで拡大もする」(タグの絞り込み行など)
 * @param deps この値が変わるたびに再計算する(タグ一覧が読み込まれたときなど)
 * @returns 対象の要素に渡すref
 */
export function useFitRowScale<T extends HTMLElement = HTMLDivElement>(
  cssVar: string,
  maxScale: number,
  deps: DependencyList = []
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function fit() {
      if (!el) return;
      // 一旦リセットして、基準サイズ(倍率1)での「そのままの幅」を測る
      el.style.removeProperty(cssVar);
      const available = el.clientWidth;
      const natural = el.scrollWidth;
      if (natural === 0 || available === 0) return;

      // 枠線など倍率をかけても変わらない部分があり、一度掛けただけではぴったり
      // 合わないことがあるため、実際に反映された幅を測り直して補正を繰り返す
      let scale = Math.min(available / natural, maxScale);
      for (let i = 0; i < 3; i++) {
        el.style.setProperty(cssVar, String(scale));
        const actual = el.scrollWidth;
        if (actual <= available) break;
        scale *= available / actual;
      }
      // 最後に少しだけ余裕を持たせ、丸め誤差ではみ出さないようにする
      el.style.setProperty(cssVar, String(Math.min(scale * 0.99, maxScale)));
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
