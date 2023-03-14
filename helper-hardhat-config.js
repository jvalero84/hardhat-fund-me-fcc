const networkConfig = {
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
    // 31337 (Hardhat)
}

const developmentChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000 // 2000 with the 8 decimals.
// These 2 are the values for the constructor of our Price Feed mockup.

module.exports = { networkConfig, developmentChains, DECIMALS, INITIAL_ANSWER }
