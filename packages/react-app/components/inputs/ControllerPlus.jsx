import { Input } from "@chakra-ui/react";
import React from "react";
import { Controller } from "react-hook-form";

const ControllerPlus = ({ control, name, ...props }) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => <Input {...field} {...props} borderColor="purple.500" color="purple.500" />}
  />
);

export default ControllerPlus;
