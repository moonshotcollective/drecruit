import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import React, { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Web3Context } from "../../helpers/Web3Context";
import { loadDRecruitV1Contract } from "../../helpers";
import axios from "axios";
import { useRouter } from "next/router";

const EditPrivateProfilePage = () => {
  const router = useRouter();
  const { address, targetNetwork, injectedProvider, self } = useContext(Web3Context);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm();

  useEffect(() => {
    // fetch from Ceramic
    (async () => {
      if (address && self) {
        const result = await self.get("privateProfile");
        if (result) {
          const decrypted = await self.client.ceramic.did?.decryptDagJWE(JSON.parse(result.encrypted));
          if (decrypted) {
            Object.entries(decrypted).forEach(([key, value]) => {
              console.log({ key, value });
              if (["image"].includes(key)) {
                // const {
                //   original: { src: url },
                // } = value;
                // const match = url.match(/^ipfs:\/\/(.+)$/);
                // if (match) {
                //   const ipfsUrl = `//ipfs.io/ipfs/${match[1]}`;
                //   if (key === "image") {
                //     setImageURL(ipfsUrl);
                //   }
                // }
              } else {
                setValue(key, value);
              }
            });
          }
        }
      }
    })();
  }, [address, self]);

  const onSubmit = async values => {
    const { data: appDid } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/did`);
    const encryptedData = await self.client.ceramic.did?.createDagJWE(values, [
      // logged-in user,
      self.id,
      // backend ceramic did
      appDid,
    ]);

    const developerTokenURI = await fetch("/api/json-storage", {
      method: "POST",
      body: JSON.stringify({
        did: self.id,
      }),
    })
      .then(r => r.json())
      .then(({ cid, fileName }) => {
        console.log({ cid, fileName });
        return `ipfs://${cid}/${fileName}`;
      });
    console.log({ developerTokenURI });
    try {
      const contract = await loadDRecruitV1Contract(targetNetwork, injectedProvider.getSigner());
      const tx = await contract.mint(developerTokenURI, 0);
      const receipt = await tx.wait();
      console.log({ receipt });
      const tokenId = receipt.events[0].args.id.toString();
      await self.client.dataStore.set("privateProfile", {
        tokenURI: developerTokenURI,
        tokenId: parseInt(tokenId, 10),
        encrypted: JSON.stringify(encryptedData),
      });
      return router.push("/profile/edit-public-profile");
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
