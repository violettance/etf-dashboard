import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

/**
 * eslint-config-next 16 ships native flat configs, so the FlatCompat shim that
 * this file used to need is gone. Compat could not resolve the config here and
 * failed with a circular-reference error, which meant `npm run lint` was
 * broken and the CI lint step would never have caught anything.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "components/ui/**",
      "scripts/analytics/**",
      "data/**",
    ],
  },
  {
    rules: {
      // Phase 1 moved every API key server-side. Fail the build if a secret is
      // reintroduced behind a NEXT_PUBLIC_ prefix, which would inline it into
      // the client bundle exactly as before.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/^NEXT_PUBLIC_.*(KEY|SECRET|TOKEN|PASSWORD)$/]",
          message:
            "Secrets must not be exposed via NEXT_PUBLIC_. Read them on the server instead.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]

export default config
