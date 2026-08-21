import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Loads next.config.js/.env files into the test environment.
  dir: "./",
});

// Custom config layered on top of next/jest's SWC-based transform/CSS/asset mocking.
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};

// Exported this way so next/jest can load the (async) Next.js config first.
export default createJestConfig(config);
