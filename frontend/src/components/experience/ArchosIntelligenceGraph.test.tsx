import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ArchosIntelligenceGraph from "./ArchosIntelligenceGraph";

describe("ArchosIntelligenceGraph", () => {
  it("renders the fabric and exposes all analysis modes", () => {
    render(<ArchosIntelligenceGraph />);

    expect(screen.getByRole("heading", { name: "INTELLIGENCE FABRIC" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "AGENT FLOW" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "CAUSAL FABRIC" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "EVIDENCE PATH" })).toBeTruthy();
  });

  it("switches analysis mode and filters inactive links", () => {
    render(<ArchosIntelligenceGraph />);

    const causalTab = screen.getByRole("tab", { name: "CAUSAL FABRIC" });
    fireEvent.click(causalTab);
    expect(causalTab.getAttribute("aria-selected")).toBe("true");

    const filter = screen.getByRole("button", { name: "ALL LINKS" });
    fireEvent.click(filter);
    expect(screen.getByRole("button", { name: "ACTIVE ONLY" })).toBeTruthy();
  });

  it("updates the inspector when a node is selected", () => {
    render(<ArchosIntelligenceGraph />);

    fireEvent.click(screen.getByRole("button", { name: "Select Evidence Ledger" }));

    expect(screen.getByRole("heading", { name: "Evidence Ledger" })).toBeTruthy();
    expect(screen.getByText("EVIDENCE")).toBeTruthy();
    expect(screen.getByText("98%")).toBeTruthy();
  });
});
