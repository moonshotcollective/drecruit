import React from "react";
import { Box } from "@chakra-ui/react";

export const Layout = ({ children }) => {
  return (
    <Box margin="0 auto" maxWidth={1920} transition="0.5s ease-out">
      <Box margin="8">
        <Box as="main" marginY={22}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
