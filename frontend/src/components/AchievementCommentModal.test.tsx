import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementCommentModal } from "./AchievementCommentModal";

describe("AchievementCommentModal", () => {
  it("入力した感想で保存すると、その文字列でonSaveが呼ばれる", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AchievementCommentModal onSave={onSave} onClose={() => {}} />);

    await user.type(screen.getByPlaceholderText("感想を入力してください"), "達成できて嬉しい");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSave).toHaveBeenCalledWith("達成できて嬉しい");
  });

  it("何も入力せず保存しても、空文字でonSaveが呼ばれる", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AchievementCommentModal onSave={onSave} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSave).toHaveBeenCalledWith("");
  });

  it("×ボタンを押すとonCloseが呼ばれ、onSaveは呼ばれない", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<AchievementCommentModal onSave={onSave} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "閉じる" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("保存中は「保存中...」と表示し、ボタンが無効になる", async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const onSave = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
    );
    render(<AchievementCommentModal onSave={onSave} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "保存" }));

    const button = screen.getByRole("button", { name: /保存中/ });
    expect(button).toBeDisabled();

    resolveSave();
  });
});
