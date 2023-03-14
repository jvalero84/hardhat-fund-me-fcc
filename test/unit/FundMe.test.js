const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          // const sendValue = "1000000000000000000" // 1 ETH
          const sendValue = ethers.utils.parseEther("1") // 1 ETH
          beforeEach(async () => {
              // Deploy our FundMe contract using hardhat-deploy
              deployer = (await getNamedAccounts()).deployer
              // alternatively we could use const accounts = await ethers.getSigners()
              // to get the list of accounts defined on the accounts parameter of the selected network
              // or if using hardhat network, the list of ten fake accounts it provides.
              // Then we could just pick one.. const accountZero = accounts[0]
              await deployments.fixture(["fundme", "mocks"])
              // The fixture function will deploy all the contracts that have been
              // marked with the tag that we specify (remember module.exports.tags...)
              fundMe = await ethers.getContract("FundMe", deployer)
              // The ethers.getContract function will get the most recent deployment
              // of the contract we specify.
              // By adding the named account deployer we are connecting it to our FundMe contract
              // so whenever we call a function on fundme, it will automatically be from the deployer account

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async () => {
              it("Sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async () => {
              it("Fails if you don't send enough ETH", async function () {
                  // Since we want to check for a transaction to fail or revert, we can use expect
                  // instead of assert and check for reverted transactions and even check for specific revert messages
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToamountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a singles founder", async function () {
                  // This is going to be a longer test so lets structure it a bit, we are going to
                  // arrange, act and assert...

                  // Arrange (We need to know the starting balances to compare on the assert step..)
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // We pull out these two properties from the transactionReceipt object
                  // we've seen they are included while using the debugger
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Lets find out gasCost

                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      // We use .add because these values are of type BigNumber
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // When we called withdraw, our deployer spent a little bit of gas
                  )
              })
              it("cheaperwithdraw ETH from a singles founder", async function () {
                  // This is going to be a longer test so lets structure it a bit, we are going to
                  // arrange, act and assert...

                  // Arrange (We need to know the starting balances to compare on the assert step..)
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // We pull out these two properties from the transactionReceipt object
                  // we've seen they are included while using the debugger
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Lets find out gasCost

                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      // We use .add because these values are of type BigNumber
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // When we called withdraw, our deployer spent a little bit of gas
                  )
              })

              it("allows us to withdraw with multiple getFunder", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners() // get a bunch of different accounts..
                  for (let i = 1; i < 6; i++) {
                      // The index 0 would be our deployer account.
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the getFunder are reset properly

                  // After the withdrawal we expect the getFunder array to be empty..
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToamountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[3]
                  )
                  //await expect(attackerConnectedContract.withdraw()).to.be.reverted
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners() // get a bunch of different accounts..
                  for (let i = 1; i < 6; i++) {
                      // The index 0 would be our deployer account.
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the getFunder are reset properly

                  // After the withdrawal we expect the getFunder array to be empty..
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToamountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
