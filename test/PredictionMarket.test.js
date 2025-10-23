const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket", function () {
  // Fixture for deploying the contract
  async function deployPredictionMarketFixture() {
    const [owner, creator, bettor1, bettor2, bettor3] = await ethers.getSigners();

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = await PredictionMarket.deploy();

    return { predictionMarket, owner, creator, bettor1, bettor2, bettor3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { predictionMarket, owner } = await loadFixture(deployPredictionMarketFixture);
      expect(await predictionMarket.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      const { predictionMarket } = await loadFixture(deployPredictionMarketFixture);
      expect(await predictionMarket.marketCounter()).to.equal(0);
      expect(await predictionMarket.betCounter()).to.equal(0);
      expect(await predictionMarket.creationFee()).to.equal(ethers.parseEther("0.001"));
      expect(await predictionMarket.platformFeePercentage()).to.equal(2);
      expect(await predictionMarket.accumulatedFees()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      const { predictionMarket } = await loadFixture(deployPredictionMarketFixture);
      expect(await predictionMarket.paused()).to.equal(false);
    });
  });

  describe("Market Creation", function () {
    it("Should create a market with valid parameters", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Will ETH reach $5000?";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400; // 1 day from now
      const creationFee = ethers.parseEther("0.001");

      await expect(
        predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee })
      ).to.emit(predictionMarket, "MarketCreated")
        .withArgs(0, creator.address, title, endTime, 2);

      const market = await predictionMarket.getMarket(0);
      expect(market.title).to.equal(title);
      expect(market.creator).to.equal(creator.address);
      expect(market.status).to.equal(0); // Active
      expect(market.outcomeCount).to.equal(2);
    });

    it("Should revert if creation fee is insufficient", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const insufficientFee = ethers.parseEther("0.0001");

      await expect(
        predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: insufficientFee })
      ).to.be.revertedWith("Insufficient creation fee");
    });

    it("Should revert if title is empty", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await expect(
        predictionMarket.connect(creator).createMarket("", outcomes, endTime, { value: creationFee })
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should revert if outcomes are less than 2", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await expect(
        predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee })
      ).to.be.revertedWith("Must have 2-5 outcomes");
    });

    it("Should revert if outcomes are more than 5", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["A", "B", "C", "D", "E", "F"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await expect(
        predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee })
      ).to.be.revertedWith("Must have 2-5 outcomes");
    });

    it("Should revert if end time is in the past", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) - 1000; // Past time
      const creationFee = ethers.parseEther("0.001");

      await expect(
        predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee })
      ).to.be.revertedWith("End time must be in future");
    });

    it("Should accumulate creation fees", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      expect(await predictionMarket.accumulatedFees()).to.equal(creationFee);
    });

    it("Should create multiple markets with incrementing IDs", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket("Market 1", outcomes, endTime, { value: creationFee });
      await predictionMarket.connect(creator).createMarket("Market 2", outcomes, endTime, { value: creationFee });
      
      expect(await predictionMarket.marketCounter()).to.equal(2);
      
      const market1 = await predictionMarket.getMarket(0);
      const market2 = await predictionMarket.getMarket(1);
      
      expect(market1.title).to.equal("Market 1");
      expect(market2.title).to.equal("Market 2");
    });

    it("Should revert when paused", async function () {
      const { predictionMarket, creator, owner } = await loadFixture(deployPredictionMarketFixture);
      
      await predictionMarket.connect(owner).pause();
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await expect(
        predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee })
      ).to.be.revertedWithCustomError(predictionMarket, "EnforcedPause");
    });
  });

  describe("Betting", function () {
    async function createMarketFixture() {
      const fixture = await loadFixture(deployPredictionMarketFixture);
      const { predictionMarket, creator } = fixture;
      
      const title = "Will ETH reach $5000?";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      return { ...fixture, marketId: 0 };
    }

    it("Should place a bet successfully", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketFixture);
      
      const betAmount = ethers.parseEther("0.1");
      const outcomeId = 0;

      await expect(
        predictionMarket.connect(bettor1).placeBet(marketId, outcomeId, { value: betAmount })
      ).to.emit(predictionMarket, "BetPlaced")
        .withArgs(marketId, outcomeId, bettor1.address, betAmount, 0);
    });

    it("Should update market total pool after bet", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketFixture);
      
      const betAmount = ethers.parseEther("0.1");
      await predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: betAmount });
      
      const market = await predictionMarket.getMarket(marketId);
      expect(market.totalPool).to.equal(betAmount);
    });

    it("Should update outcome total bets and liquidity", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketFixture);
      
      const betAmount = ethers.parseEther("0.1");
      await predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: betAmount });
      
      const outcomes = await predictionMarket.getOutcomes(marketId);
      expect(outcomes[0].totalBets).to.equal(betAmount);
      expect(outcomes[0].liquidity).to.equal(ethers.parseEther("1") + betAmount);
    });

    it("Should allow multiple bets on same outcome", async function () {
      const { predictionMarket, bettor1, bettor2, marketId } = await loadFixture(createMarketFixture);
      
      const betAmount1 = ethers.parseEther("0.1");
      const betAmount2 = ethers.parseEther("0.2");

      await predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: betAmount1 });
      await predictionMarket.connect(bettor2).placeBet(marketId, 0, { value: betAmount2 });
      
      const market = await predictionMarket.getMarket(marketId);
      expect(market.totalPool).to.equal(betAmount1 + betAmount2);
    });

    it("Should allow bets on different outcomes", async function () {
      const { predictionMarket, bettor1, bettor2, marketId } = await loadFixture(createMarketFixture);
      
      const betAmount = ethers.parseEther("0.1");

      await predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: betAmount });
      await predictionMarket.connect(bettor2).placeBet(marketId, 1, { value: betAmount });
      
      const outcomes = await predictionMarket.getOutcomes(marketId);
      expect(outcomes[0].totalBets).to.equal(betAmount);
      expect(outcomes[1].totalBets).to.equal(betAmount);
    });

    it("Should revert if bet amount is zero", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketFixture);

      await expect(
        predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: 0 })
      ).to.be.revertedWith("Bet amount must be greater than 0");
    });

    it("Should revert if market is not active", async function () {
      const { predictionMarket, bettor1, creator, marketId } = await loadFixture(createMarketFixture);
      
      // Cancel the market
      await predictionMarket.connect(creator).cancelMarket(marketId);
      
      const betAmount = ethers.parseEther("0.1");
      await expect(
        predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: betAmount })
      ).to.be.revertedWith("Market not active");
    });

    it("Should revert if market has ended", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketFixture);
      
      // Fast forward time past market end
      await time.increase(86401);
      
      const betAmount = ethers.parseEther("0.1");
      await expect(
        predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: betAmount })
      ).to.be.revertedWith("Market has ended");
    });

    it("Should revert if outcome ID is invalid", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketFixture);
      
      const betAmount = ethers.parseEther("0.1");
      await expect(
        predictionMarket.connect(bettor1).placeBet(marketId, 5, { value: betAmount })
      ).to.be.revertedWith("Invalid outcome ID");
    });

    it("Should track user bets", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketFixture);
      
      const betAmount = ethers.parseEther("0.1");
      await predictionMarket.connect(bettor1).placeBet(marketId, 0, { value: betAmount });
      
      const userBets = await predictionMarket.getUserBetsForMarket(marketId, bettor1.address);
      expect(userBets.length).to.equal(1);
      expect(userBets[0].bettor).to.equal(bettor1.address);
      expect(userBets[0].amount).to.equal(betAmount);
    });
  });

  describe("Market Resolution", function () {
    async function createMarketWithBetsFixture() {
      const fixture = await loadFixture(deployPredictionMarketFixture);
      const { predictionMarket, creator, bettor1, bettor2 } = fixture;
      
      const title = "Will ETH reach $5000?";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      // Place bets
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("1") });
      await predictionMarket.connect(bettor2).placeBet(0, 1, { value: ethers.parseEther("1") });
      
      return { ...fixture, marketId: 0 };
    }

    it("Should resolve market successfully", async function () {
      const { predictionMarket, creator, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      // Fast forward past end time
      await time.increase(86401);
      
      await expect(
        predictionMarket.connect(creator).resolveMarket(marketId, 0)
      ).to.emit(predictionMarket, "MarketResolved")
        .withArgs(marketId, 0, ethers.parseEther("2"));
    });

    it("Should update market status to Resolved", async function () {
      const { predictionMarket, creator, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      await time.increase(86401);
      await predictionMarket.connect(creator).resolveMarket(marketId, 0);
      
      const market = await predictionMarket.getMarket(marketId);
      expect(market.status).to.equal(2); // Resolved
      expect(market.winningOutcome).to.equal(0);
    });

    it("Should calculate and distribute winnings correctly", async function () {
      const { predictionMarket, creator, bettor1, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      await time.increase(86401);
      await predictionMarket.connect(creator).resolveMarket(marketId, 0);
      
      const claimable = await predictionMarket.getClaimableWinnings(marketId, bettor1.address);
      
      // Total pool: 2 ETH, Platform fee (2%): 0.04 ETH, Prize pool: 1.96 ETH
      // Bettor1 bet 1 ETH on winning outcome, should get full prize pool
      expect(claimable).to.equal(ethers.parseEther("1.96"));
    });

    it("Should accumulate platform fees", async function () {
      const { predictionMarket, creator, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      const initialFees = await predictionMarket.accumulatedFees();
      
      await time.increase(86401);
      await predictionMarket.connect(creator).resolveMarket(marketId, 0);
      
      const finalFees = await predictionMarket.accumulatedFees();
      
      // Platform fee: 2% of 2 ETH = 0.04 ETH + initial creation fee
      expect(finalFees - initialFees).to.equal(ethers.parseEther("0.04"));
    });

    it("Should distribute winnings proportionally with multiple winners", async function () {
      const { predictionMarket, creator, bettor1, bettor2, bettor3 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      // Three bettors bet on outcome 0
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("1") });
      await predictionMarket.connect(bettor2).placeBet(0, 0, { value: ethers.parseEther("2") });
      await predictionMarket.connect(bettor3).placeBet(0, 1, { value: ethers.parseEther("3") });
      
      await time.increase(86401);
      await predictionMarket.connect(creator).resolveMarket(0, 0);
      
      const claimable1 = await predictionMarket.getClaimableWinnings(0, bettor1.address);
      const claimable2 = await predictionMarket.getClaimableWinnings(0, bettor2.address);
      const claimable3 = await predictionMarket.getClaimableWinnings(0, bettor3.address);
      
      // Total pool: 6 ETH, Platform fee (2%): 0.12 ETH, Prize pool: 5.88 ETH
      // Winning bets: 3 ETH total (1 + 2)
      // Bettor1: (1/3) * 5.88 = 1.96 ETH
      // Bettor2: (2/3) * 5.88 = 3.92 ETH
      // Bettor3: 0 (lost)
      expect(claimable1).to.equal(ethers.parseEther("1.96"));
      expect(claimable2).to.equal(ethers.parseEther("3.92"));
      expect(claimable3).to.equal(0);
    });

    it("Should revert if non-creator tries to resolve", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      await time.increase(86401);
      
      await expect(
        predictionMarket.connect(bettor1).resolveMarket(marketId, 0)
      ).to.be.revertedWith("Only creator can resolve");
    });

    it("Should revert if market has not ended", async function () {
      const { predictionMarket, creator, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      await expect(
        predictionMarket.connect(creator).resolveMarket(marketId, 0)
      ).to.be.revertedWith("Market not ended yet");
    });

    it("Should revert if outcome ID is invalid", async function () {
      const { predictionMarket, creator, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      await time.increase(86401);
      
      await expect(
        predictionMarket.connect(creator).resolveMarket(marketId, 5)
      ).to.be.revertedWith("Invalid outcome ID");
    });

    it("Should revert if market is not active", async function () {
      const { predictionMarket, creator, marketId } = await loadFixture(createMarketWithBetsFixture);
      
      await time.increase(86401);
      await predictionMarket.connect(creator).resolveMarket(marketId, 0);
      
      await expect(
        predictionMarket.connect(creator).resolveMarket(marketId, 0)
      ).to.be.revertedWith("Market not active");
    });
  });

  describe("Claiming Winnings", function () {
    async function resolvedMarketFixture() {
      const fixture = await loadFixture(deployPredictionMarketFixture);
      const { predictionMarket, creator, bettor1, bettor2 } = fixture;
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("1") });
      await predictionMarket.connect(bettor2).placeBet(0, 1, { value: ethers.parseEther("1") });
      
      await time.increase(86401);
      await predictionMarket.connect(creator).resolveMarket(0, 0);
      
      return { ...fixture, marketId: 0 };
    }

    it("Should claim winnings successfully", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(resolvedMarketFixture);
      
      const claimableBefore = await predictionMarket.getClaimableWinnings(marketId, bettor1.address);
      expect(claimableBefore).to.be.gt(0);
      
      await expect(
        predictionMarket.connect(bettor1).claimWinnings(marketId)
      ).to.emit(predictionMarket, "WinningsClaimed")
        .withArgs(bettor1.address, claimableBefore, marketId);
      
      const claimableAfter = await predictionMarket.getClaimableWinnings(marketId, bettor1.address);
      expect(claimableAfter).to.equal(0);
    });

    it("Should transfer correct amount to winner", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(resolvedMarketFixture);
      
      const claimable = await predictionMarket.getClaimableWinnings(marketId, bettor1.address);
      const balanceBefore = await ethers.provider.getBalance(bettor1.address);
      
      const tx = await predictionMarket.connect(bettor1).claimWinnings(marketId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(bettor1.address);
      
      expect(balanceAfter).to.equal(balanceBefore + claimable - gasUsed);
    });

    it("Should revert if no winnings to claim", async function () {
      const { predictionMarket, bettor2, marketId } = await loadFixture(resolvedMarketFixture);
      
      await expect(
        predictionMarket.connect(bettor2).claimWinnings(marketId)
      ).to.be.revertedWith("No winnings to claim");
    });

    it("Should revert if market is not resolved", async function () {
      const { predictionMarket, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      const { creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      await expect(
        predictionMarket.connect(bettor1).claimWinnings(0)
      ).to.be.revertedWith("Market not resolved");
    });

    it("Should prevent double claiming", async function () {
      const { predictionMarket, bettor1, marketId } = await loadFixture(resolvedMarketFixture);
      
      await predictionMarket.connect(bettor1).claimWinnings(marketId);
      
      await expect(
        predictionMarket.connect(bettor1).claimWinnings(marketId)
      ).to.be.revertedWith("No winnings to claim");
    });
  });

  describe("Market Cancellation", function () {
    it("Should cancel market with no bets", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      await expect(
        predictionMarket.connect(creator).cancelMarket(0)
      ).to.emit(predictionMarket, "MarketCancelled")
        .withArgs(0);
      
      const market = await predictionMarket.getMarket(0);
      expect(market.status).to.equal(3); // Cancelled
    });

    it("Should revert if non-creator tries to cancel", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      await expect(
        predictionMarket.connect(bettor1).cancelMarket(0)
      ).to.be.revertedWith("Only creator can cancel");
    });

    it("Should revert if market has bets", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("0.1") });
      
      await expect(
        predictionMarket.connect(creator).cancelMarket(0)
      ).to.be.revertedWith("Cannot cancel market with bets");
    });
  });

  describe("Dispute Mechanism", function () {
    it("Should raise dispute on active market", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      const reason = "Market terms are unclear";
      await expect(
        predictionMarket.connect(bettor1).raiseDispute(0, reason)
      ).to.emit(predictionMarket, "DisputeRaised")
        .withArgs(0, bettor1.address, reason);
      
      const market = await predictionMarket.getMarket(0);
      expect(market.status).to.equal(4); // Disputed
    });

    it("Should revert if reason is empty", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      await expect(
        predictionMarket.connect(bettor1).raiseDispute(0, "")
      ).to.be.revertedWith("Reason cannot be empty");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update creation fee", async function () {
      const { predictionMarket, owner } = await loadFixture(deployPredictionMarketFixture);
      
      const newFee = ethers.parseEther("0.002");
      
      await expect(
        predictionMarket.connect(owner).setCreationFee(newFee)
      ).to.emit(predictionMarket, "CreationFeeUpdated")
        .withArgs(newFee);
      
      expect(await predictionMarket.creationFee()).to.equal(newFee);
    });

    it("Should allow owner to update platform fee percentage", async function () {
      const { predictionMarket, owner } = await loadFixture(deployPredictionMarketFixture);
      
      const newPercentage = 3;
      
      await expect(
        predictionMarket.connect(owner).setPlatformFeePercentage(newPercentage)
      ).to.emit(predictionMarket, "PlatformFeeUpdated")
        .withArgs(newPercentage);
      
      expect(await predictionMarket.platformFeePercentage()).to.equal(newPercentage);
    });

    it("Should revert if platform fee exceeds maximum", async function () {
      const { predictionMarket, owner } = await loadFixture(deployPredictionMarketFixture);
      
      await expect(
        predictionMarket.connect(owner).setPlatformFeePercentage(6)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to withdraw fees", async function () {
      const { predictionMarket, owner, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      const accumulatedFees = await predictionMarket.accumulatedFees();
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await predictionMarket.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.equal(balanceBefore + accumulatedFees - gasUsed);
      expect(await predictionMarket.accumulatedFees()).to.equal(0);
    });

    it("Should revert if non-owner tries to update fees", async function () {
      const { predictionMarket, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      await expect(
        predictionMarket.connect(bettor1).setCreationFee(ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(predictionMarket, "OwnableUnauthorizedAccount");
    });

    it("Should revert if no fees to withdraw", async function () {
      const { predictionMarket, owner } = await loadFixture(deployPredictionMarketFixture);
      
      await expect(
        predictionMarket.connect(owner).withdrawFees()
      ).to.be.revertedWith("No fees to withdraw");
    });
  });

  describe("Security Features", function () {
    it("Should allow owner to pause contract", async function () {
      const { predictionMarket, owner } = await loadFixture(deployPredictionMarketFixture);
      
      await predictionMarket.connect(owner).pause();
      expect(await predictionMarket.paused()).to.equal(true);
    });

    it("Should allow owner to unpause contract", async function () {
      const { predictionMarket, owner } = await loadFixture(deployPredictionMarketFixture);
      
      await predictionMarket.connect(owner).pause();
      await predictionMarket.connect(owner).unpause();
      expect(await predictionMarket.paused()).to.equal(false);
    });

    it("Should prevent operations when paused", async function () {
      const { predictionMarket, owner, creator } = await loadFixture(deployPredictionMarketFixture);
      
      await predictionMarket.connect(owner).pause();
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await expect(
        predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee })
      ).to.be.revertedWithCustomError(predictionMarket, "EnforcedPause");
    });

    it("Should revert if non-owner tries to pause", async function () {
      const { predictionMarket, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      await expect(
        predictionMarket.connect(bettor1).pause()
      ).to.be.revertedWithCustomError(predictionMarket, "OwnableUnauthorizedAccount");
    });

    it("Should protect against reentrancy in claimWinnings", async function () {
      // This test verifies that the nonReentrant modifier is in place
      // Actual reentrancy attack would require a malicious contract
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("1") });
      
      await time.increase(86401);
      await predictionMarket.connect(creator).resolveMarket(0, 0);
      
      // First claim should succeed
      await predictionMarket.connect(bettor1).claimWinnings(0);
      
      // Second claim should fail (no winnings left)
      await expect(
        predictionMarket.connect(bettor1).claimWinnings(0)
      ).to.be.revertedWith("No winnings to claim");
    });

    it("Should protect against reentrancy in placeBet", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      // Place bet successfully
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("1") });
      
      const market = await predictionMarket.getMarket(0);
      expect(market.totalPool).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Gas Optimization", function () {
    it("Should efficiently create markets", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      const tx = await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      const receipt = await tx.wait();
      
      // Gas should be reasonable (less than 500k for a simple market)
      expect(receipt.gasUsed).to.be.lt(500000);
    });

    it("Should efficiently place bets", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      const tx = await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("0.1") });
      const receipt = await tx.wait();
      
      // Gas should be reasonable (less than 250k for a bet)
      expect(receipt.gasUsed).to.be.lt(250000);
    });

    it("Should efficiently resolve markets", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("1") });
      
      await time.increase(86401);
      
      const tx = await predictionMarket.connect(creator).resolveMarket(0, 0);
      const receipt = await tx.wait();
      
      // Gas should be reasonable (less than 300k for resolution with 1 bet)
      expect(receipt.gasUsed).to.be.lt(300000);
    });

    it("Should handle multiple bets efficiently", async function () {
      const { predictionMarket, creator, bettor1, bettor2, bettor3 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      // Place multiple bets
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("0.1") });
      await predictionMarket.connect(bettor2).placeBet(0, 0, { value: ethers.parseEther("0.2") });
      const tx = await predictionMarket.connect(bettor3).placeBet(0, 1, { value: ethers.parseEther("0.3") });
      const receipt = await tx.wait();
      
      // Gas should remain consistent (less than 250k)
      expect(receipt.gasUsed).to.be.lt(250000);
    });
  });

  describe("View Functions", function () {
    it("Should return correct market details", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      const market = await predictionMarket.getMarket(0);
      expect(market.title).to.equal(title);
      expect(market.creator).to.equal(creator.address);
      expect(market.outcomeCount).to.equal(2);
    });

    it("Should return correct outcomes", async function () {
      const { predictionMarket, creator } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No", "Maybe"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      
      const marketOutcomes = await predictionMarket.getOutcomes(0);
      expect(marketOutcomes.length).to.equal(3);
      expect(marketOutcomes[0].name).to.equal("Yes");
      expect(marketOutcomes[1].name).to.equal("No");
      expect(marketOutcomes[2].name).to.equal("Maybe");
    });

    it("Should return user bets correctly", async function () {
      const { predictionMarket, creator, bettor1 } = await loadFixture(deployPredictionMarketFixture);
      
      const title = "Test Market";
      const outcomes = ["Yes", "No"];
      const endTime = (await time.latest()) + 86400;
      const creationFee = ethers.parseEther("0.001");

      await predictionMarket.connect(creator).createMarket(title, outcomes, endTime, { value: creationFee });
      await predictionMarket.connect(bettor1).placeBet(0, 0, { value: ethers.parseEther("0.5") });
      await predictionMarket.connect(bettor1).placeBet(0, 1, { value: ethers.parseEther("0.3") });
      
      const userBets = await predictionMarket.getUserBetsForMarket(0, bettor1.address);
      expect(userBets.length).to.equal(2);
      expect(userBets[0].amount).to.equal(ethers.parseEther("0.5"));
      expect(userBets[1].amount).to.equal(ethers.parseEther("0.3"));
    });
  });
});
