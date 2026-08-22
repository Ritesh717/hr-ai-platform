import { render, screen, waitFor } from "@testing-library/react";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import * as insightsApi from "@/lib/api/insights";

jest.mock("@/lib/api/insights");

const mockFetch = insightsApi.fetchInsight as jest.MockedFunction<typeof insightsApi.fetchInsight>;

describe("AIInsightPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders provided initialContent without fetching", () => {
    const content: insightsApi.InsightContent = {
      summary: "You have 14 leave days remaining.",
      actions: [{ label: "Request leave", href: "/time-off" }],
    };
    render(<AIInsightPanel context="leave" initialContent={content} />);

    expect(screen.getByText("You have 14 leave days remaining.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request leave" })).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows skeleton while fetching and then renders content", async () => {
    mockFetch.mockResolvedValueOnce({
      summary: "Team utilisation is at 87% this week.",
    });

    render(<AIInsightPanel context="team" />);

    // Skeleton lines appear during load
    const region = screen.getByRole("region", { name: /ai insight/i });
    expect(region).toBeInTheDocument();

    // Content appears after fetch resolves
    await waitFor(() =>
      expect(screen.getByText("Team utilisation is at 87% this week.")).toBeInTheDocument(),
    );
    expect(mockFetch).toHaveBeenCalledWith("team");
  });

  it("hides the panel gracefully when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { container } = render(<AIInsightPanel context="home" />);

    // Initially shows skeleton
    expect(container.firstChild).not.toBeNull();

    // After fetch failure, component should render nothing
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("renders rail variant with constrained width class", () => {
    render(
      <AIInsightPanel
        context="home"
        initialContent={{ summary: "No anomalies detected." }}
        variant="rail"
      />,
    );
    const panel = screen.getByRole("region", { name: /ai insight/i });
    expect(panel.className).toContain("max-w-[280px]");
  });

  it("renders block variant without width constraint", () => {
    render(
      <AIInsightPanel
        context="home"
        initialContent={{ summary: "No anomalies detected." }}
        variant="block"
      />,
    );
    const panel = screen.getByRole("region", { name: /ai insight/i });
    expect(panel.className).not.toContain("max-w-[280px]");
  });
});
