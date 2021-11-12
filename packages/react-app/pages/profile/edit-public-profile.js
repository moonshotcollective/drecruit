import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Divider,
  Input,
  Stack,
  Image,
  Textarea,
  Tag,
  TagLabel,
  SimpleGrid,
  TagCloseButton,
  Box,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
import { useRouter } from "next/router";

import modelAliases from "../../model.json";
import { ceramicCoreFactory, CERAMIC_TESTNET, CERAMIC_TESTNET_NODE_URL } from "../../ceramic";
import { Web3Context } from "../../helpers/Web3Context";

const EditPublicProfilePage = () => {
  const { address, targetNetwork, self } = useContext(Web3Context);
  const router = useRouter();
  const [imageURL, setImageURL] = useState();
  const [backgroundURL, setBackgroundURL] = useState();
  const image = useRef(null);
  const background = useRef(null);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useForm();

  // using aliases to avoid naming conflicts between the two field arrays
  const {
    fields: xpFields,
    append: xpAppend,
    remove: xpRemove,
  } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "experiences", // unique name for your Field Array
    // keyName: "id", default to "id", you can change the key name
  });

  const {
    fields: skillFields,
    append: skillAppend,
    remove: skillRemove,
  } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "skillTags", // unique name for your Field Array
    // keyName: "id", default to "id", you can change the key name
  });

  useEffect(() => {
    // get initial state from Ceramic
    (async () => {
      if (self) {
        const publicProfile = await self.client.dataStore.get("publicProfile");
        console.log({ publicProfile });
        if (!publicProfile) return;
        Object.entries(publicProfile).forEach(([key, value]) => {
          setValue(
            key,
            value.map(val => ({ value: val })),
          );
        });
      }
    })();
  }, [self]);

  useEffect(() => {
    xpAppend("");
    skillAppend("");
    return () => {
      xpRemove();
      skillRemove();
    };
  }, [xpAppend, xpRemove, skillAppend, skillRemove]);

  const onSubmit = async values => {
    const skillTags = values.skillTags.map(skill => skill.value);
    const experiences = values.experiences.map(xp => xp.value);
    await self.client.dataStore.set("publicProfile", {
      skillTags,
      experiences,
    });
    const me = await self.client.dataStore.get("publicProfile");
    console.log({ me });
    // return router.push("/");
  };
  return (
    <Box margin="0 auto" maxWidth={1100} transition="0.5s ease-out">
      <Box margin="8">
        <Box marginY={22}>
          <Stack as="form" onSubmit={handleSubmit(onSubmit)}>
            <FormControl isInvalid={errors.skillTags}>
              <HStack justifyContent="space-between">
                <FormLabel htmlFor="skillTags" fontWeight="bold">
                  Skills:
                </FormLabel>
                <Button bg="green.200" my="5" onClick={() => skillAppend("")}>
                  + Add new skill
                </Button>
              </HStack>
              <SimpleGrid columns={4} spacing={4}>
                {skillFields.map((item, index) => (
                  <Tag size="md" key={item.id} borderRadius="full" variant="solid">
                    <TagLabel>
                      <Input
                        placeholder="TypeScript"
                        border="none"
                        _focus={{
                          border: "none",
                        }}
                        {...register(`skillTags.${index}.value`, {
                          maxLength: {
                            value: 450,
                            message: "Maximum length should be 450",
                          },
                        })}
                      />
                    </TagLabel>
                    <TagCloseButton onClick={() => skillRemove(index)} />
                  </Tag>
                ))}
              </SimpleGrid>
              <FormErrorMessage>{errors.skillTags && errors.skillTags.message}</FormErrorMessage>
            </FormControl>
            <Divider />
            <FormControl isInvalid={errors.experiences}>
              <HStack justifyContent="space-between">
                <FormLabel htmlFor="experiences" fontWeight="bold">
                  Experiences:
                </FormLabel>
                <Button bg="green.200" my="5" onClick={() => xpAppend("")}>
                  + Add new experience
                </Button>
              </HStack>
              {xpFields.map((item, index) => (
                <HStack key={item.id} spacing={4} my="5">
                  <Textarea
                    placeholder="Contributor for Quadratic Diplomacy"
                    borderColor="purple.500"
                    {...register(`experiences.${index}.value`, {
                      maxLength: {
                        value: 150,
                        message: "Maximum length should be 150",
                      },
                    })}
                  />
                  <Button bg="red.200" onClick={() => xpRemove()}>
                    Remove XP
                  </Button>
                </HStack>
              ))}
              <FormErrorMessage>{errors.experiences && errors.experiences.message}</FormErrorMessage>
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

export default EditPublicProfilePage;
