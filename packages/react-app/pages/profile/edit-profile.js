import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Image, Textarea } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
// import Image from "next/image";
import modelAliases from "../../model.json";
import { ceramicCoreFactory, CERAMIC_TESTNET, CERAMIC_TESTNET_NODE_URL } from "../../ceramic";
import { useHistory } from "react-router";

const EditProfilePage = () => {
  const history = useHistory();
  const [mySelf, setMySelf] = useState();
  const [did, setDid] = useState();
  const [address, setAddress] = useState();
  const [imageURL, setImageURL] = useState();
  const [backgroundURL, setBackgroundURL] = useState();
  const image = useRef(null);
  const background = useRef(null);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm();

  const init = async () => {
    const addresses = await window.ethereum.enable();
    const self = await SelfID.authenticate({
      authProvider: new EthereumAuthProvider(window.ethereum, addresses[0]),
      ceramic: CERAMIC_TESTNET_NODE_URL,
      connectNetwork: CERAMIC_TESTNET,
      model: modelAliases,
    });
    setMySelf(self);
    setAddress(addresses[0]);
    return self;
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    // fetch from Ceramic
    (async () => {
      if (address) {
        const core = ceramicCoreFactory();
        let userDID;
        try {
          userDID = await core.getAccountDID(address + "@eip155:1");
        } catch (error) {
          console.log(error);
          const profile = await init();
          console.log({ profile });
          userDID = profile.id;
        }
        if (userDID) {
          setDid(userDID);
          const result = await core.get("basicProfile", userDID);
          console.log({ result });
          Object.entries(result).forEach(([key, value]) => {
            console.log({ key, value });
            if (["image", "background"].includes(key)) {
              const {
                original: { src: url },
              } = value;
              const match = url.match(/^ipfs:\/\/(.+)$/);
              if (match) {
                const ipfsUrl = `//ipfs.io/ipfs/${match[1]}`;
                if (key === "image") {
                  setImageURL(ipfsUrl);
                }
                if (key === "background") {
                  setBackgroundURL(ipfsUrl);
                }
              }
            } else {
              setValue(key, value);
            }
          });
        }
      }
    })();
  }, [address]);

  const onFileChange = useCallback(event => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    const img = image.current;
    const bg = background.current;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      console.log(reader.result); // eslint-disable-line no-console
      if (input.name === "image") {
        img.src = reader.result;
      }
      if (input.name === "background") {
        bg.src = reader.result;
      }
    });
    reader.readAsDataURL(file);
  }, []);

  const onSubmit = async values => {
    console.log(values);
    const formData = new FormData();
    const [imageFile] = values.image;
    const [backgroundFile] = values.background;
    if (image && imageFile) {
      formData.append("image", imageFile);
    }
    if (background && backgroundFile) {
      formData.append("background", backgroundFile);
    }
    const cids = await fetch("/api/storage", { method: "POST", body: formData })
      .then(r => r.json())
      .then(response => {
        return response.cids;
      });
    // .finally(() => {
    //   setProgress(false);
    // });
    const refs = { image: image.current, background: background.current };

    ["image", "background"].forEach(key => {
      console.log(cids[key]);
      if (cids[key]) {
        values[key] = {
          original: {
            src: `ipfs://${cids[key]}`,
            mimeType: "image/*",
            // TODO: change hardcoded width & height
            width: 200,
            height: 200,
          },
        };
      } else {
        delete values[key];
      }
    });
    if (!imageFile) {
      delete values["image"];
    }
    if (!backgroundFile) {
      delete values["background"];
    }
    await mySelf.client.dataStore.merge("basicProfile", values);
    return history.push("/profile/edit-private-profile");
  };
  return (
    <Box margin="0 auto" maxWidth={1100} transition="0.5s ease-out">
      <Box margin="8">
        <Box as="main" marginY={22}>
          <Stack as="form" onSubmit={handleSubmit(onSubmit)}>
            <FormControl isInvalid={errors.name}>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input
                placeholder="anon"
                borderColor="purple.500"
                {...register("name", {
                  maxLength: {
                    value: 150,
                    message: "Maximum length should be 150",
                  },
                })}
              />
              <FormErrorMessage>{errors.name && errors.name.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.image}>
              <FormLabel htmlFor="image">Profile Image</FormLabel>
              <Image ref={image} src={imageURL} />
              <Input
                name="image"
                borderColor="purple.500"
                type="file"
                defaultValue=""
                onChange={onFileChange}
                placeholder="image"
                ref={register}
                {...register("image")}
              />
              <FormErrorMessage>{errors.image && errors.image.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.background}>
              <FormLabel htmlFor="background">Header Background</FormLabel>
              <Image ref={background} src={backgroundURL} />
              <Input
                type="file"
                borderColor="purple.500"
                defaultValue=""
                onChange={onFileChange}
                placeholder="background"
                {...register("background")}
              />
              <FormErrorMessage>{errors.background && errors.background.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.description}>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Textarea
                placeholder="Web3 and blockchain enthusiast"
                borderColor="purple.500"
                {...register("description", {
                  maxLength: {
                    value: 420,
                    message: "Maximum length should be 420",
                  },
                })}
              />
              <FormErrorMessage>{errors.description && errors.description.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.emoji}>
              <FormLabel htmlFor="emoji">Emoji</FormLabel>
              <Input
                placeholder="🚀"
                borderColor="purple.500"
                {...register("emoji", {
                  maxLength: 2,
                })}
              />
              <FormErrorMessage>{errors.emoji && errors.emoji.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.birthDate}>
              <FormLabel htmlFor="birthDate">Birthdate</FormLabel>
              <Input type="date" borderColor="purple.500" placeholder="birthDate" {...register("birthDate")} />
              <FormErrorMessage>{errors.birthDate && errors.birthDate.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.url}>
              <FormLabel htmlFor="url">Website</FormLabel>
              <Input
                placeholder="ens-or-website.eth"
                borderColor="purple.500"
                {...register("url", {
                  maxLength: 240,
                })}
              />
              <FormErrorMessage>{errors.url && errors.url.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.homeLocation}>
              <FormLabel htmlFor="homeLocation">Location</FormLabel>
              <Input
                placeholder="London"
                borderColor="purple.500"
                {...register("homeLocation", {
                  maxLength: 140,
                })}
              />
              <FormErrorMessage>{errors.homeLocation && errors.homeLocation.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.residenceCountry}>
              <FormLabel htmlFor="residenceCountry">Country Code</FormLabel>
              <Input
                placeholder="UK"
                borderColor="purple.500"
                {...register("residenceCountry", {
                  maxLength: 2,
                })}
              />
              <FormErrorMessage>{errors.residenceCountry && errors.residenceCountry.message}</FormErrorMessage>
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

export default EditProfilePage;
