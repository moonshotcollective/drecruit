import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Image, Textarea } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
import { useRouter } from "next/router";
// import Image from "next/image";
import modelAliases from "../../model.json";
import { ceramicCoreFactory, CERAMIC_TESTNET, CERAMIC_TESTNET_NODE_URL } from "../../ceramic";
import { Web3Context } from "../../helpers/Web3Context";
import ControllerPlus from "../../components/inputs/ControllerPlus";

const EditTagsPage = () => {
  const { address, targetNetwork, self } = useContext(Web3Context);
  const router = useRouter();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm();

  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "tags", // unique name for your Field Array
    // keyName: "id", default to "id", you can change the key name
  });

  useEffect(() => {
    append("");
    return () => {
      remove();
    };
  }, [append, remove]);

  useEffect(() => {
    // fetch from Ceramic
    (async () => {
      if (address) {
        const core = ceramicCoreFactory();
        let userDID;
        try {
          userDID = await core.getAccountDID(`${address}@eip155:${targetNetwork.chainId}`);
        } catch (error) {
          if (self) {
            userDID = self.id;
          }
        }
        if (userDID) {
          const result = await core.get("tags", userDID);
          console.log({ result });
          if (!result) return;
          setValue("tags", result);
        }
      }
    })();
  }, [address]);

  const onSubmit = async values => {
    console.log(values);
    return router.push("/profile/edit-private-profile");
  };
  return (
    <Box margin="0 auto" maxWidth={1100} transition="0.5s ease-out">
      <Box margin="8">
        <Box as="main" marginY={22}>
          <Stack as="form" onSubmit={handleSubmit(onSubmit)}>
            <FormControl isInvalid={errors.tags}>
              <FormLabel htmlFor="tags">Tags</FormLabel>
              <ControllerPlus
                key={field.id} // important to include key with field's id
                control={control}
                placeholder="React"
                {...register(`tags.${index}.value`)}
              />
              <FormErrorMessage>{errors.tags && errors.tags.message}</FormErrorMessage>
            </FormControl>

            <Button mt={4} colorScheme="purple" isLoading={isSubmitting} type="submit">
              Save
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default EditTagsPage;
