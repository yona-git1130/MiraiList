import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ClipboardEvent } from "react";
import { resyncAfterPaste } from "./pasteSync";

describe("resyncAfterPaste", () => {
  beforeEach(() => {
    // requestAnimationFrameは即座にコールバックを実行するようにして、
    // テスト内で非同期を待たずに検証できるようにする
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("貼り付け後の実際の入力欄の値でonChangeを呼び直す", () => {
    const onChange = vi.fn();
    const handler = resyncAfterPaste(onChange);

    const fakeEvent = {
      currentTarget: { value: "貼り付け後の値" },
    } as unknown as ClipboardEvent<HTMLInputElement>;

    handler(fakeEvent);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("貼り付け後の値");
  });

  it("呼び出すたびに新しいハンドラを返す(状態を共有しない)", () => {
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    const handlerA = resyncAfterPaste(onChangeA);
    const handlerB = resyncAfterPaste(onChangeB);

    handlerA({ currentTarget: { value: "A" } } as unknown as ClipboardEvent<HTMLInputElement>);
    handlerB({ currentTarget: { value: "B" } } as unknown as ClipboardEvent<HTMLInputElement>);

    expect(onChangeA).toHaveBeenCalledWith("A");
    expect(onChangeB).toHaveBeenCalledWith("B");
  });
});
