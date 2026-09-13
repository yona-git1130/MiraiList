import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordField } from "./PasswordField";

describe("PasswordField", () => {
  it("初期状態ではtype=passwordで隠れており、目のボタンで表示に切り替えられる", async () => {
    const user = userEvent.setup();
    render(
      <PasswordField label="パスワード" value="secret123" onChange={() => {}} />
    );

    const input = screen.getByLabelText("パスワード") as HTMLInputElement;
    expect(input.type).toBe("password");

    const toggle = screen.getByRole("button", { name: "パスワードを表示する" });
    await user.click(toggle);

    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: "パスワードを非表示にする" })).toBeInTheDocument();

    // もう一度押すと隠れた状態に戻る
    await user.click(screen.getByRole("button", { name: "パスワードを非表示にする" }));
    expect(input.type).toBe("password");
  });

  it("入力するとonChangeに新しい値が渡される", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordField label="パスワード" value="" onChange={handleChange} />);

    const input = screen.getByLabelText("パスワード");
    await user.type(input, "a");

    expect(handleChange).toHaveBeenCalledWith("a");
  });
});
