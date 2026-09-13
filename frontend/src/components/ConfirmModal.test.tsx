import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "./ConfirmModal";

describe("ConfirmModal", () => {
  it("メッセージを表示する", () => {
    render(<ConfirmModal message="削除しますか？" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("削除しますか？")).toBeInTheDocument();
  });

  it("「はい」を押すとonConfirmが呼ばれる", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmModal message="確認" onConfirm={onConfirm} onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: "はい" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("「いいえ」を押すとonCancelが呼ばれる", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmModal message="確認" onConfirm={() => {}} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "いいえ" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("背景(オーバーレイ)をクリックしてもonCancelが呼ばれる", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmModal message="確認" onConfirm={() => {}} onCancel={onCancel} />
    );

    const overlay = container.querySelector(".modal-overlay") as HTMLElement;
    await user.click(overlay);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("モーダル内側のクリックではonCancelが呼ばれない(オーバーレイへの伝播を止めている)", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmModal message="確認" onConfirm={() => {}} onCancel={onCancel} />);

    await user.click(screen.getByText("確認"));

    expect(onCancel).not.toHaveBeenCalled();
  });
});
