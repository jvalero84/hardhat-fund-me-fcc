// import
// main function
// calling of main function.
// Previously when deploying our contracts without hh, we used to have a main function and call that main function
// With hh, we are we going to create a function and then indicate to hh (via module.exports.default)
// that that function is the default function that should be invoked when we run the hardhat deploy command

// We are only able to do this (pull out the networkConfig because on the helper-hardhat-config we are exporting it - module.exports..)
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
// The above is equivalent to :
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig
const { network } = require("hardhat")
const { verify } = require("../utils/verify")
require("dotenv").config()

/* async function deployFunc(hre) {
    console.log("Heya!")
}

module.exports.default = deployFunc */

// The above code is similar to this one (more commonly used):

/* module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    // This is the equivalent of pulling this variables out of hre (hardhat runtime environment):
    // hre.getNamedAccounts
    // hre.getDeployments
// All the above thanks to js syntactic sugar can be done all in one line: */
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts() // See deployer namedAccount on hardhat.config file
    const chainId = network.config.chainId
    log(`chainId: ${chainId}`)

    // if chainId is X use address Y
    // if chainId is Z use address A

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") // deployments.get gets the most recent deployment..
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // If the contract doesn't exist (the price feed one), we deploy a minimal version
    // for our local testing

    // Well, what happens then when we want to change chains?? We would need a way to parameterize contract addresses, etc
    // So that when we change chains we do not have to keep changing our code

    // When going for localhost or hardhat network we want to use a mock for price feeds for instance, because
    // Our blockchains get destroyed and recreated on each deployment.
    log(`priceFeedAddress: ${ethUsdPriceFeedAddress}`)
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, // We can set here the number of confirmations to wait before
        // the deployment considered complete (see blockConfirmations on hardhat.config.js).
        // In this case if not specified on the network config, wait for 1 block.
    })

    // Lets verify the deployment of our contract if we are not in a local network!
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    log("---------------------------------------------------------------")
}

// Everytime we start a new local blockchain node (yarn hardhat node) it will run the scripts on the deploy folder
// So we will have our contracts already deployed in our local blockchain when we start it.

module.exports.tags = ["all", "fundme"]
