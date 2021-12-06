module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ["eslint:recommended", "prettier", "next"],
  rules: {
    "no-console": "warn",
    "no-undef": "error",
    "react-hooks/rules-of-hooks": "warn",
  },
};
