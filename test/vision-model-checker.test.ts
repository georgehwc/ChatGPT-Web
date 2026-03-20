import {
  VISION_MODEL_REGEXES,
  EXCLUDE_VISION_MODEL_REGEXES,
} from "../app/constant";

/**
 * Mirrors the core logic of isVisionModel from app/utils.ts,
 * without pulling in the store/client dependency chain.
 */
function isVisionModelByRegex(model: string): boolean {
  return (
    !EXCLUDE_VISION_MODEL_REGEXES.some((regex) => regex.test(model)) &&
    VISION_MODEL_REGEXES.some((regex) => regex.test(model))
  );
}

describe("isVisionModel", () => {
  test("should identify vision models using regex patterns", () => {
    const visionModels = [
      "gpt-4-vision",
      "gpt-4.1",
      "gpt-5.4",
      "claude-4-opus",
      "gemini-2.5-pro",
      "gemini-3-flash",
      "gemini-exp-vision",
      "learnlm-vision",
      "qwen-vl-max",
      "qwen2-vl-max",
      "dall-e-3",
      "o3",
      "grok-4",
    ];

    visionModels.forEach((model) => {
      expect(isVisionModelByRegex(model)).toBe(true);
    });
  });

  test("should not identify non-vision models", () => {
    const nonVisionModels = [
      "deepseek-chat",
      "mistral-large",
      "regular-model",
    ];

    nonVisionModels.forEach((model) => {
      expect(isVisionModelByRegex(model)).toBe(false);
    });
  });
});
