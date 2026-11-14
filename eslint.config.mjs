import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: ["legacy/**", ".next/**", "node_modules/**", "tests/e2e/**", "scripts/**"] },
  { rules: { "react/no-unescaped-entities": "off", "react-hooks/exhaustive-deps": "warn", "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off", "react-hooks/immutability": "off", "react-hooks/purity": "off" } },
];
export default config;
