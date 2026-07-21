import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "components/ui/**", "scripts/analytics/**"],
  },
  {
    rules: {
      // The whole point of Phase 1 is to stop leaking API keys to the browser.
      // Fail the build if anyone reintroduces a NEXT_PUBLIC_ secret.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/^NEXT_PUBLIC_.*(KEY|SECRET|TOKEN|PASSWORD)$/]",
          message:
            "Secrets must not be exposed via NEXT_PUBLIC_. Proxy the request through an app/api route instead.",
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
