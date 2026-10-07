import "@testing-library/jest-dom/vitest";

// The player tests exercise the video path; pretend every step has a recorded video
// (the real list is generated from public/avatar and may be empty).
vi.mock("../src/content/videos", async () => {
  const { allSteps } = await vi.importActual<typeof import("../src/content/lessons")>("../src/content/lessons");
  return { STEP_VIDEOS: [...allSteps.map((s) => s.id), "1.1"], MODULE_INTROS: [] };
});
