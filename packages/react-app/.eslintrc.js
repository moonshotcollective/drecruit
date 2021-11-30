module.exports = {
  env: {
    browser: true,
  },
  extends: ["eslint:recommended", "prettier", "next"],
  rules: {
    "no-console": "warn",
    "no-undef": "warn",
    "react-hooks/rules-of-hooks": "warn",
  },
};
