import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EyeIcon } from "./EyeIcon";

describe("EyeIcon", () => {
  it("visible=falseのときは斜線を表示しない(非表示中→押すと表示できることを示す)", () => {
    const { container } = render(<EyeIcon visible={false} />);
    expect(container.querySelector("line")).not.toBeInTheDocument();
  });

  it("visible=trueのときは斜線を表示する(表示中→押すと隠せることを示す)", () => {
    const { container } = render(<EyeIcon visible={true} />);
    expect(container.querySelector("line")).toBeInTheDocument();
  });
});
