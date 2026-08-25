import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UltronNeuralField from "./UltronNeuralField";

describe("UltronNeuralField", () => {
  it("renders a presentation-only canvas", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const { container } = render(<UltronNeuralField status="ANALYZING" particleCount={4} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    raf.mockRestore();
    cancel.mockRestore();
  });
});
