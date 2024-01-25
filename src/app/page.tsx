"use client";

import { useState } from "react";
import {
  VStack,
  Box,
  Flex,
  Spacer,
  Center,
  Heading,
  Text,
  Stack,
  Table,
  Tbody,
  Tr,
  Td,
  Button,
  useToast,
  Container,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverArrow,
  PopoverFooter,
  PopoverBody,
  ButtonGroup,
} from "@chakra-ui/react";
import { NavBar } from "@/components/NavBar";

import "./app.css";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { parseEther } from "viem";
import LottoPoolABI from "@/utils/abi/LottoPool.json";
import LottoTokenABI from "@/utils/abi/LottoToken.json";

const Page = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isPopoverOpen,
    onOpen: onPopoverOpen,
    onClose: onPopoverClose,
  } = useDisclosure();

  const { address } = useAccount();

  const [selectedNumbers, setNumbers] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [displayedNumbers, setDisplayedNumbers] = useState<number[]>([]);
  const [matchedNumbers, setMatchedNumbers] = useState<number[]>([]);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  const generateNumbers = () => {
    let numbers = [];
    for (let i = 1; i <= 49; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  const numbers = generateNumbers();
  const rows = [];
  while (numbers.length) rows.push(numbers.splice(0, 7));

  const selectNumber = (evt: any, num: number) => {
    if (!address) {
      toast({
        status: "error",
        description: "Connect your wallet",
      });
      return;
    }
    if (selectedNumbers.includes(num) || isChecking) return;
    if (selectedNumbers.length === 6) {
      toast({
        description: "You already selected 6 numbers",
      });
      return;
    }
    if (selectedNumbers.length === 0 && !isPaid) {
      toast({
        status: "warning",
        description: "You have to pay token to start",
      });
      onPopoverOpen();
      return;
    }

    const updatedNumbers = [...selectedNumbers, num];
    setNumbers(updatedNumbers);
    evt.target.classList.add("selected");
  };

  const checkNumbers = () => {
    if (selectedNumbers.length !== 6 || isChecked || isChecking) return;
    setIsChecking(true);
    const machineNums = machineDraw();

    let index = 0;
    const interval = setInterval(() => {
      if (index < machineNums.length) {
        setDisplayedNumbers((current) => [...current, machineNums[index]]);
        index++;
      } else {
        clearInterval(interval);

        // check simiar
        const sameNumbers = selectedNumbers.filter((sn) =>
          machineNums.includes(sn)
        );
        setMatchedNumbers(sameNumbers);
        switch (sameNumbers.length) {
          case 0:
            break;
          case 1:
            setWithdrawAmount(10);
            break;
          case 2:
            setWithdrawAmount(20);
            break;
          case 3:
            setWithdrawAmount(30);
            break;
          case 4:
            setWithdrawAmount(40);
            break;
          case 5:
            setWithdrawAmount(50);
            break;
          case 6:
            setWithdrawAmount(100);
            break;
        }
        setIsChecking(false);
        setIsChecked(true);
        onOpen();
      }
    }, 1000);
  };

  const machineDraw = () => {
    let chosenByMachine = [];
    const numbers = generateNumbers();
    for (let i = 0; i < 6; i++) {
      let idx = Math.floor(Math.random() * numbers.length);
      chosenByMachine.push(numbers[idx]);
      /*a very important line of code which prevents machine from drawing the same number again
       */
      numbers.splice(idx, 1);
      /*this line of code allows to check if numbers are taken out*/
    }
    /* why not remove it entirely? because it might then be accidentally created if for some reason you happen to try to click on board!!! and you may do that*/
    return chosenByMachine;
  };

  const withdraw = () => {
    if (withdrawLoading || withdrawStartLoading) return;
    if (withdrawAmount === 0) {
      resetGame();
      return;
    }
    // withdraw token
    withdrawWrite({
      args: [parseEther(withdrawAmount.toString())],
    });
  };
  const payToken = () => {
    if (isPaid || approveLoading || !address) return;
    approveWrite({
      args: ["0xeeD34b67100150A3C1e0eAC964356f04003D4d92", parseEther("30")],
    });
  };

  const removeClassName = () => {
    // remove selected className
    const selectedEl = document.getElementsByClassName("selected");
    Array.from(selectedEl).forEach((element) => {
      element.classList.remove("selected");
    });
  };

  const {
    write: approveWrite,
    data: approveData,
    isLoading: approveStartLoading,
  } = useContractWrite({
    address: "0xdD08ef4f6b433e578196AA328C8d1F33BD9e28F7",
    abi: LottoTokenABI.abi,
    functionName: "approve",
    onError: (e: any) => {
      console.log("Approve function error: ", e);
      toast({
        status: "error",
        description: "Approve function error",
      });
    },
  });
  const { isLoading: approveLoading } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      console.log("Approve success");
      toast({
        status: "success",
        description: "Approve success",
      });
      depositWrite({
        args: [parseEther("30")],
      });
    },
    onError: (e: any) => {
      console.log("Approve waiting function error: ", e);
    },
  });

  const {
    write: depositWrite,
    data: depositData,
    isLoading: depositStartLoading,
  } = useContractWrite({
    address: "0xeeD34b67100150A3C1e0eAC964356f04003D4d92",
    abi: LottoPoolABI.abi,
    functionName: "deposit",
    onError: (e: any) => {
      console.log("Deposit function error: ", e);
      toast({
        status: "error",
        description: "Deposit function error",
      });
    },
  });
  const { isLoading: depositLoading } = useWaitForTransaction({
    hash: depositData?.hash,
    onSuccess: () => {
      console.log("Deposit success");
      toast({
        status: "success",
        description: "Deposit success",
      });
      setIsPaid(true);
      onPopoverClose();
    },
    onError: (e: any) => {
      console.log("Approve waiting function error: ", e);
    },
  });

  const {
    write: withdrawWrite,
    data: withdrawData,
    isLoading: withdrawStartLoading,
  } = useContractWrite({
    address: "0xeeD34b67100150A3C1e0eAC964356f04003D4d92",
    abi: LottoPoolABI.abi,
    functionName: "withdraw",
    onError: (e: any) => {
      console.log("Withdraw function error: ", e);
      toast({
        status: "error",
        description: "Withdraw function error",
      });
    },
  });
  const { isLoading: withdrawLoading } = useWaitForTransaction({
    hash: withdrawData?.hash,
    onSuccess: () => {
      console.log("Withdraw success");
      toast({
        status: "success",
        description: "Withdraw success",
      });
      resetGame();
    },
    onError: (e: any) => {
      console.log("Approve waiting function error: ", e);
    },
  });

  const resetGame = () => {
    setNumbers([]);
    setDisplayedNumbers([]);
    setIsChecked(false);
    setMatchedNumbers([]);
    setWithdrawAmount(0);
    removeClassName();
    setIsPaid(false);
    onClose();
  };

  const cancelPopover = () => {
    if (
      approveLoading ||
      approveStartLoading ||
      depositStartLoading ||
      depositLoading
    )
      return;
    onPopoverClose();
  };

  return (
    <VStack spacing={10} align="stretch" p={4}>
      <NavBar />
      <Stack spacing={6}>
        <Container maxW="1200px">
          <Box>
            <Center>
              <Heading as="h1" size="xl" className="heading" py={1}>
                GREAT LOTTERY
              </Heading>
            </Center>
            <Center>
              <Heading as="h2" size="lg" className="heading" py={3}>
                WIN A MILLION!
              </Heading>
            </Center>
          </Box>
          <Flex>
            <Box className="number-list lotto">
              <Text className="obj-title">Select 6 numbers:</Text>
              <Table>
                <Tbody>
                  {rows.map((row, i) => (
                    <Tr key={i}>
                      {row.map((num) => (
                        <Td key={num} style={{ textAlign: "center" }}>
                          <div
                            className="tbl-number-box"
                            onClick={(e) => selectNumber(e, num)}
                          >
                            {num}
                          </div>
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
            <Popover
              returnFocusOnClose={false}
              isOpen={isPopoverOpen}
              onClose={onPopoverClose}
              placement="right"
              closeOnBlur={false}
            >
              <PopoverTrigger>
                <Box />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader fontWeight="semibold">
                  Pay Token Modal
                </PopoverHeader>
                <PopoverArrow />
                <PopoverBody>
                  Are you sure you want to start the game by paying 30 LOTTO
                  token?
                </PopoverBody>
                <PopoverFooter display="flex" justifyContent="flex-end">
                  <ButtonGroup size="sm">
                    <Button variant="outline" onClick={cancelPopover}>
                      Cancel
                    </Button>
                    <Button
                      isLoading={
                        approveStartLoading ||
                        approveLoading ||
                        depositStartLoading ||
                        depositLoading
                      }
                      loadingText={
                        approveLoading
                          ? "Approving"
                          : depositLoading || depositStartLoading
                          ? "Paying"
                          : ""
                      }
                      colorScheme="red"
                      onClick={payToken}
                    >
                      Pay
                    </Button>
                  </ButtonGroup>
                </PopoverFooter>
              </PopoverContent>
            </Popover>
            <Spacer />
            {selectedNumbers.length === 6 && (
              <Button
                isLoading={isChecking ? true : false}
                loadingText="Checking"
                variant="outline"
                colorScheme="teal"
                onClick={checkNumbers}
              >
                Check
              </Button>
            )}
            <Spacer />
            <Box className="number-result balls">
              <Text className="obj-title">Result:</Text>
              <Box id="ballContainer">
                {displayedNumbers.map((number, idx) => (
                  <div className="ball" key={idx}>
                    {number}
                  </div>
                ))}
              </Box>
            </Box>
          </Flex>
        </Container>
      </Stack>

      <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Result Modal</ModalHeader>
          <ModalBody pb={6}>
            <Text>
              {matchedNumbers.length === 0 &&
                "Oh, dear! You didn't match any number. Got 0 LOTTO token"}
              {matchedNumbers.length === 1 &&
                "Outta luck, You only matched 1 number. Got 10 LOTTO token"}
              {matchedNumbers.length === 2 &&
                "Outta luck, You only matched 2 numbers. Got 20 LOTTO token"}
              {matchedNumbers.length === 3 &&
                "Not bad, You matched 3 numbers. Got 30 LOTTO token"}
              {matchedNumbers.length === 4 &&
                "Good, You matched 4 numbers. Got 40 LOTTO token"}
              {matchedNumbers.length === 5 &&
                "Very good, You matched 5 numbers. Got 50 LOTTO token"}
              {matchedNumbers.length === 6 &&
                "A true winner!, You matched all numbers. Got 100 LOTTO token"}
            </Text>
            <Text>Matched numbers: {matchedNumbers.join(", ")}</Text>
          </ModalBody>

          <ModalFooter>
            <Button
              isLoading={withdrawStartLoading || withdrawLoading}
              loadingText={"Withdrawing"}
              onClick={withdraw}
            >
              {matchedNumbers.length === 0 ? "Close" : "Withdraw"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default Page;
