import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UltronVisionaryMatrix, { EVOLUTION_EPOCHS } from "./UltronVisionaryMatrix";

describe("UltronVisionaryMatrix", () => {
  it("renders presentation canvas and evolutionary epochs correctly", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    const { container } = render(<UltronVisionaryMatrix initialEpoch="SEED_ZERO" />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();

    expect(screen.getByText("FGSE Latent Seed")).toBeTruthy();
    expect(screen.getByText("EPOCH 00")).toBeTruthy();
    expect(screen.getByText("SEED: 0x8F3B_FGSE_GENESIS_ROOT")).toBeTruthy();

    // Test epoch switching
    const epochThreeBtn = screen.getByText("Sovereign Epistemic Matrix");
    fireEvent.click(epochThreeBtn);

    expect(screen.getByText("SEED: 0x00FF_ULTRON_SOVEREIGN_CORE")).toBeTruthy();
    expect(screen.getByText("4096")).toBeTruthy(); // Node count for Epoch 3

    raf.mockRestore();
    cancel.mockRestore();
  });
});
