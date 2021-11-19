import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/moonshotcollective/drecruit" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="👩‍💻 recruiter.party"
        subTitle="get recruited!"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
