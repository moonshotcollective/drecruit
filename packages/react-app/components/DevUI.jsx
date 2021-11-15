import React from "react";
import { Row, Col, Button } from "antd";
import { Account, Ramp, GasGauge, Faucet, ThemeSwitch } from ".";
import { NETWORKS } from "../constants";
import { Web3Consumer } from "../helpers/Web3Context";

function DevUI({ web3 }) {
  return (
    <>
      {web3.networkDisplay}
      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10, zIndex: 2000 }}>
        <Account {...web3} />
        {web3.faucetHint}
      </div>

      <ThemeSwitch />
    </>
  );
}

export default Web3Consumer(DevUI);
