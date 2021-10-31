import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Image, Textarea } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
// import Image from "next/image";
import modelAliases from "../../model.json";
import { ceramicCoreFactory, CERAMIC_TESTNET, CERAMIC_TESTNET_NODE_URL } from "../../ceramic";
import { useHistory } from "react-router";
import PhoneNumberInput from "../../components/inputs/PhoneNumberInput";
import { COUNTRIES } from "../../helpers/countries";
import { Web3Context } from "../../helpers/Web3Context";
import { getNetwork, loadDRecruitV1Contract } from "../../helpers";

const EditPrivateProfilePage = () => {
  const context = useContext(Web3Context);
  const [mySelf, setMySelf] = useState();
  const [did, setDid] = useState();
  const [address, setAddress] = useState();
  const [imageURL, setImageURL] = useState();
  const image = useRef(null);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm();
  const countryOptions = COUNTRIES.map(({ name, iso }) => ({
    label: name,
    value: iso,
  }));

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
          userDID = await core.getAccountDID(`${address}@eip155:${context.targetNetwork.chainId}`);
        } catch (error) {
          console.log(error);
          const profile = await init();
          console.log({ profile });
          userDID = profile.id;
        }
        if (userDID) {
          setDid(userDID);
          const result = await core.get("privateProfile", userDID);
          if (result) {
            const decrypted = await mySelf.client.ceramic.did?.decryptDagJWE(JSON.parse(result.encrypted));
            if (decrypted) {
              Object.entries(decrypted).forEach(([key, value]) => {
                console.log({ key, value });
                if (["image"].includes(key)) {
                  const {
                    original: { src: url },
                  } = value;
                  const match = url.match(/^ipfs:\/\/(.+)$/);
                  if (match) {
                    const ipfsUrl = `//ipfs.io/ipfs/${match[1]}`;
                    if (key === "image") {
                      setImageURL(ipfsUrl);
                    }
                  }
                } else {
                  setValue(key, value);
                }
              });
            }
          }
        }
      }
    })();
  }, [address]);

  const onFileChange = useCallback(event => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    const img = image.current;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      console.log(reader.result); // eslint-disable-line no-console
      if (input.name === "image") {
        img.src = reader.result;
      }
    });
    reader.readAsDataURL(file);
  }, []);

  const onSubmit = async values => {
    console.log({ values });
    const encryptedData = await mySelf.client.ceramic.did?.createDagJWE(values, [
      // logged-in user,
      mySelf.id,
    ]);
    // TODO: close connection on account change
    // await mySelf.client.ceramic.close();

    const developerTokenURI = await fetch("/api/json-storage", {
      method: "POST",
      body: JSON.stringify({
        did: mySelf.id,
      }),
    })
      .then(r => r.json())
      .then(({ cid, fileName }) => {
        console.log({ cid, fileName });
        return `ipfs://${cid}/${fileName}`;
      });
    console.log({ developerTokenURI });
    try {
      const contract = await loadDRecruitV1Contract(context.targetNetwork, context.injectedProvider.getSigner());
      const tx = await contract.mint(developerTokenURI, 0);
      const receipt = await tx.wait();
      console.log({ receipt });
      const tokenId = receipt.events[0].args.id.toString();
      return mySelf.client.dataStore.set("privateProfile", {
        tokenURI: developerTokenURI,
        tokenId: parseInt(tokenId, 10),
        encrypted: JSON.stringify(encryptedData),
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  return (
    <Box margin="0 auto" maxWidth={1100} transition="0.5s ease-out">
      <Box margin="8">
        <Box as="main" marginY={22}>
          <Stack as="form" onSubmit={handleSubmit(onSubmit)}>
            <FormControl isInvalid={errors.firstname}>
              <FormLabel htmlFor="firstname">Firstname</FormLabel>
              <Input
                placeholder="V"
                borderColor="purple.500"
                {...register("firstname", {
                  maxLength: {
                    value: 150,
                    message: "Maximum length should be 150",
                  },
                })}
              />
              <FormErrorMessage>{errors.firstname && errors.firstname.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.lastname}>
              <FormLabel htmlFor="lastname">Lastname</FormLabel>
              <Input
                placeholder="Vendetta"
                borderColor="purple.500"
                {...register("lastname", {
                  maxLength: {
                    value: 150,
                    message: "Maximum length should be 150",
                  },
                })}
              />
              <FormErrorMessage>{errors.lastname && errors.lastname.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.email}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                placeholder="my.email@e-corp.com"
                borderColor="purple.500"
                {...register("email", {
                  maxLength: {
                    value: 150,
                    message: "Maximum length should be 150",
                  },
                })}
              />
              <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.phone}>
              <FormLabel htmlFor="phone">Phone number</FormLabel>
              <Input type="tel" placeholder="Enter phone number" borderColor="purple.500" {...register("phone")} />
              <FormErrorMessage>{errors.phone && errors.phone.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.physicalAddress}>
              <FormLabel htmlFor="physicalAddress">Location</FormLabel>
              <Input
                placeholder="Quadratic Lands Avenue, 1337"
                borderColor="purple.500"
                {...register("physicalAddress", {
                  maxLength: 140,
                })}
              />
              <FormErrorMessage>{errors.physicalAddress && errors.physicalAddress.message}</FormErrorMessage>
            </FormControl>

            {/* <FormControl isInvalid={errors.image}>
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
            </FormControl> */}
            {/* <FormControl isInvalid={errors.bio}>
              <FormLabel htmlFor="bio">Biography</FormLabel>
              <Textarea
                placeholder="Web3 and blockchain enthusiast"
                borderColor="purple.500"
                {...register("bio", {
                  maxLength: {
                    value: 420,
                    message: "Maximum length should be 420",
                  },
                })}
              />
              <FormErrorMessage>{errors.bio && errors.bio.message}</FormErrorMessage>
            </FormControl> */}

            <Button mt={4} colorScheme="purple" isLoading={isSubmitting} type="submit">
              Save
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default EditPrivateProfilePage;
