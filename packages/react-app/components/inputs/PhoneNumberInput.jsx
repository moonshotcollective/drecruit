import React, { useState, useEffect } from "react";
import { Box, Flex, Icon, Input, Select, InputGroup, InputLeftElement } from "@chakra-ui/react";
import Flag from "react-world-flags";
import { AsYouType } from "libphonenumber-js";
import { getCountryTelCode } from "../../helpers/countries";

export default function PhoneNumberInput({ size, value, country, options, onChange, setValue, placeholder, ...rest }) {
  let [number, setNumber] = useState(value || "");
  let [selectedCountry, setSelectedCountry] = useState(country || "");
  let [countryCode, setCountryCode] = useState(getCountryTelCode(country) || "");

  useEffect(() => {
    setSelectedCountry(country);
    setCountryCode(getCountryTelCode(country));
  }, [country]);

  const onCountryChange = e => {
    console.log({ e });
    let value = e.target.value;
    console.log({ value });
    let code = getCountryTelCode(value);
    console.log({ code });
    let parsedNumber = new AsYouType().input(`${code}${number}`);

    console.log({ parsedNumber });
    setCountryCode(code);
    setSelectedCountry(value);
    onChange({
      ...e,
      target: {
        ...e.target,
        value: parsedNumber,
      },
    });
  };

  const onPhoneNumberChange = e => {
    let value = e.target.value;
    let parsedNumber = new AsYouType().input(`${countryCode}${value}`);

    setNumber(value);
    onChange({
      ...e,
      target: {
        ...e.target,
        value: parsedNumber,
      },
    });
  };

  return (
    <InputGroup size={size} {...rest}>
      <InputLeftElement width="4rem">
        <Select
          top="0"
          left="0"
          zIndex={1}
          bottom={0}
          opacity={0}
          height="100%"
          position="absolute"
          value={selectedCountry}
          onChange={onCountryChange}
        >
          <option value="" />
          {options.map(option => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Flex pl={2} width="100%" alignItems="center">
          {selectedCountry ? (
            <Box mr="4px" width="50%" flex={1}>
              <Flag height="1rem" code={selectedCountry || ""} />
            </Box>
          ) : (
            <Icon name="phone" />
          )}
          <Icon name="chevron-down" />
        </Flex>
      </InputLeftElement>
      <Input pl="4rem" type="tel" value={number} placeholder={placeholder} onChange={onPhoneNumberChange} />
    </InputGroup>
  );
}

PhoneNumberInput.defaultProps = {
  options: [],
  size: "md",
};
