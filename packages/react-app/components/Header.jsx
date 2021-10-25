import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/moonshotcollective/drecruit" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="🔥 dRecruit"
        subTitle="A decentralized recruiting platform built by the Moonshot Collective"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
