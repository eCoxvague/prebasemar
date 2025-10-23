const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AMMLibrary", function () {
  let ammLibraryTest;

  before(async function () {
    // Deploy a test contract that uses AMMLibrary
    const AMMLibraryTestContract = await ethers.getContractFactory("AMMLibraryTest");
    ammLibraryTest = await AMMLibraryTestContract.deploy();
  });

  describe("calculateOdds", function () {
    it("Should calculate equal odds for initial state", async function () {
      const totalPool = 0;
      const outcomeLiquidity = ethers.parseEther("1");
      const numOutcomes = 2;

      const odds = await ammLibraryTest.testCalculateOdds(totalPool, outcomeLiquidity, numOutcomes);
      
      // Equal odds: 2 outcomes = 200 (2.00x)
      expect(odds).to.equal(200);
    });

    it("Should calculate odds correctly with bets", async function () {
      const totalPool = ethers.parseEther("10");
      const outcomeLiquidity = ethers.parseEther("5");
      const numOutcomes = 2;

      const odds = await ammLibraryTest.testCalculateOdds(totalPool, outcomeLiquidity, numOutcomes);
      
      // Odds = (totalPool * 100) / outcomeLiquidity = (10 * 100) / 5 = 200
      expect(odds).to.equal(200);
    });

    it("Should apply minimum odds constraint", async function () {
      const totalPool = ethers.parseEther("1");
      const outcomeLiquidity = ethers.parseEther("100");
      const numOutcomes = 2;

      const odds = await ammLibraryTest.testCalculateOdds(totalPool, outcomeLiquidity, numOutcomes);
      
      // Should be capped at MIN_ODDS (101)
      expect(odds).to.equal(101);
    });

    it("Should apply maximum odds constraint", async function () {
      const totalPool = ethers.parseEther("1000");
      const outcomeLiquidity = ethers.parseEther("0.001");
      const numOutcomes = 2;

      const odds = await ammLibraryTest.testCalculateOdds(totalPool, outcomeLiquidity, numOutcomes);
      
      // Should be capped at MAX_ODDS (10000)
      expect(odds).to.equal(10000);
    });

    it("Should revert if liquidity is zero", async function () {
      const totalPool = ethers.parseEther("10");
      const outcomeLiquidity = 0;
      const numOutcomes = 2;

      await expect(
        ammLibraryTest.testCalculateOdds(totalPool, outcomeLiquidity, numOutcomes)
      ).to.be.revertedWith("Liquidity must be positive");
    });

    it("Should revert if outcome count is zero", async function () {
      const totalPool = ethers.parseEther("10");
      const outcomeLiquidity = ethers.parseEther("5");
      const numOutcomes = 0;

      await expect(
        ammLibraryTest.testCalculateOdds(totalPool, outcomeLiquidity, numOutcomes)
      ).to.be.revertedWith("Invalid outcome count");
    });
  });

  describe("calculateNewLiquidity", function () {
    it("Should increase liquidity with bet", async function () {
      const currentLiquidity = ethers.parseEther("10");
      const betAmount = ethers.parseEther("2");
      const totalPool = ethers.parseEther("20");

      const newLiquidity = await ammLibraryTest.testCalculateNewLiquidity(
        currentLiquidity,
        betAmount,
        totalPool
      );

      expect(newLiquidity).to.equal(ethers.parseEther("12"));
    });

    it("Should revert if current liquidity is zero", async function () {
      const currentLiquidity = 0;
      const betAmount = ethers.parseEther("2");
      const totalPool = ethers.parseEther("20");

      await expect(
        ammLibraryTest.testCalculateNewLiquidity(currentLiquidity, betAmount, totalPool)
      ).to.be.revertedWith("Current liquidity must be positive");
    });

    it("Should revert if bet amount is zero", async function () {
      const currentLiquidity = ethers.parseEther("10");
      const betAmount = 0;
      const totalPool = ethers.parseEther("20");

      await expect(
        ammLibraryTest.testCalculateNewLiquidity(currentLiquidity, betAmount, totalPool)
      ).to.be.revertedWith("Bet amount must be positive");
    });
  });

  describe("calculateSlippage", function () {
    it("Should calculate slippage correctly", async function () {
      const betAmount = ethers.parseEther("1");
      const currentLiquidity = ethers.parseEther("10");

      const slippage = await ammLibraryTest.testCalculateSlippage(betAmount, currentLiquidity);
      
      // Slippage = (1 / 10) * 10000 = 1000 basis points (10%)
      expect(slippage).to.equal(1000);
    });

    it("Should return zero slippage for zero bet", async function () {
      const betAmount = 0;
      const currentLiquidity = ethers.parseEther("10");

      const slippage = await ammLibraryTest.testCalculateSlippage(betAmount, currentLiquidity);
      expect(slippage).to.equal(0);
    });

    it("Should cap slippage at 100%", async function () {
      const betAmount = ethers.parseEther("20");
      const currentLiquidity = ethers.parseEther("1");

      const slippage = await ammLibraryTest.testCalculateSlippage(betAmount, currentLiquidity);
      
      // Should be capped at 10000 (100%)
      expect(slippage).to.equal(10000);
    });

    it("Should revert if liquidity is zero", async function () {
      const betAmount = ethers.parseEther("1");
      const currentLiquidity = 0;

      await expect(
        ammLibraryTest.testCalculateSlippage(betAmount, currentLiquidity)
      ).to.be.revertedWith("Liquidity must be positive");
    });
  });

  describe("calculatePlatformFee", function () {
    it("Should calculate platform fee correctly", async function () {
      const amount = ethers.parseEther("100");
      const feePercentage = 2;

      const fee = await ammLibraryTest.testCalculatePlatformFee(amount, feePercentage);
      
      // 2% of 100 = 2
      expect(fee).to.equal(ethers.parseEther("2"));
    });

    it("Should handle zero fee percentage", async function () {
      const amount = ethers.parseEther("100");
      const feePercentage = 0;

      const fee = await ammLibraryTest.testCalculatePlatformFee(amount, feePercentage);
      expect(fee).to.equal(0);
    });

    it("Should revert if fee percentage exceeds 100", async function () {
      const amount = ethers.parseEther("100");
      const feePercentage = 101;

      await expect(
        ammLibraryTest.testCalculatePlatformFee(amount, feePercentage)
      ).to.be.revertedWith("Fee percentage too high");
    });
  });

  describe("calculatePotentialWinnings", function () {
    it("Should calculate potential winnings correctly", async function () {
      const betAmount = ethers.parseEther("1");
      const odds = 200; // 2.00x

      const winnings = await ammLibraryTest.testCalculatePotentialWinnings(betAmount, odds);
      
      // 1 ETH * 2.00 = 2 ETH
      expect(winnings).to.equal(ethers.parseEther("2"));
    });

    it("Should handle high odds", async function () {
      const betAmount = ethers.parseEther("1");
      const odds = 500; // 5.00x

      const winnings = await ammLibraryTest.testCalculatePotentialWinnings(betAmount, odds);
      expect(winnings).to.equal(ethers.parseEther("5"));
    });

    it("Should revert if bet amount is zero", async function () {
      const betAmount = 0;
      const odds = 200;

      await expect(
        ammLibraryTest.testCalculatePotentialWinnings(betAmount, odds)
      ).to.be.revertedWith("Bet amount must be positive");
    });

    it("Should revert if odds are too low", async function () {
      const betAmount = ethers.parseEther("1");
      const odds = 50; // Below MIN_ODDS

      await expect(
        ammLibraryTest.testCalculatePotentialWinnings(betAmount, odds)
      ).to.be.revertedWith("Odds too low");
    });
  });

  describe("calculateProportionalWinnings", function () {
    it("Should calculate proportional winnings correctly", async function () {
      const betAmount = ethers.parseEther("1");
      const totalWinningBets = ethers.parseEther("10");
      const prizePool = ethers.parseEther("100");

      const winnings = await ammLibraryTest.testCalculateProportionalWinnings(
        betAmount,
        totalWinningBets,
        prizePool
      );
      
      // (1 / 10) * 100 = 10
      expect(winnings).to.equal(ethers.parseEther("10"));
    });

    it("Should handle equal distribution", async function () {
      const betAmount = ethers.parseEther("5");
      const totalWinningBets = ethers.parseEther("10");
      const prizePool = ethers.parseEther("20");

      const winnings = await ammLibraryTest.testCalculateProportionalWinnings(
        betAmount,
        totalWinningBets,
        prizePool
      );
      
      // (5 / 10) * 20 = 10
      expect(winnings).to.equal(ethers.parseEther("10"));
    });

    it("Should revert if total winning bets is zero", async function () {
      const betAmount = ethers.parseEther("1");
      const totalWinningBets = 0;
      const prizePool = ethers.parseEther("100");

      await expect(
        ammLibraryTest.testCalculateProportionalWinnings(betAmount, totalWinningBets, prizePool)
      ).to.be.revertedWith("No winning bets");
    });

    it("Should revert if bet amount exceeds total", async function () {
      const betAmount = ethers.parseEther("11");
      const totalWinningBets = ethers.parseEther("10");
      const prizePool = ethers.parseEther("100");

      await expect(
        ammLibraryTest.testCalculateProportionalWinnings(betAmount, totalWinningBets, prizePool)
      ).to.be.revertedWith("Invalid bet amount");
    });
  });

  describe("validateMarketParams", function () {
    it("Should validate correct parameters", async function () {
      const numOutcomes = 3;
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      const isValid = await ammLibraryTest.testValidateMarketParams(numOutcomes, endTime);
      expect(isValid).to.equal(true);
    });

    it("Should reject too few outcomes", async function () {
      const numOutcomes = 1;
      const endTime = Math.floor(Date.now() / 1000) + 86400;

      const isValid = await ammLibraryTest.testValidateMarketParams(numOutcomes, endTime);
      expect(isValid).to.equal(false);
    });

    it("Should reject too many outcomes", async function () {
      const numOutcomes = 6;
      const endTime = Math.floor(Date.now() / 1000) + 86400;

      const isValid = await ammLibraryTest.testValidateMarketParams(numOutcomes, endTime);
      expect(isValid).to.equal(false);
    });

    it("Should reject past end time", async function () {
      const numOutcomes = 2;
      const endTime = Math.floor(Date.now() / 1000) - 1000; // Past time

      const isValid = await ammLibraryTest.testValidateMarketParams(numOutcomes, endTime);
      expect(isValid).to.equal(false);
    });
  });
});
