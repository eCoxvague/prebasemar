const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FeeManager", function () {
  async function deployFeeManagerFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const initialCreationFee = ethers.parseEther("0.001");
    const initialPlatformFee = 2;

    const FeeManager = await ethers.getContractFactory("FeeManager");
    const feeManager = await FeeManager.deploy(initialCreationFee, initialPlatformFee);

    return { feeManager, owner, user1, user2, initialCreationFee, initialPlatformFee };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      expect(await feeManager.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct fee values", async function () {
      const { feeManager, initialCreationFee, initialPlatformFee } = await loadFixture(deployFeeManagerFixture);
      expect(await feeManager.creationFee()).to.equal(initialCreationFee);
      expect(await feeManager.platformFeePercentage()).to.equal(initialPlatformFee);
    });

    it("Should revert if initial platform fee exceeds maximum", async function () {
      const FeeManager = await ethers.getContractFactory("FeeManager");
      
      await expect(
        FeeManager.deploy(ethers.parseEther("0.001"), 6)
      ).to.be.revertedWith("Fee percentage too high");
    });
  });

  describe("Fee Configuration", function () {
    it("Should allow owner to set creation fee", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      const newFee = ethers.parseEther("0.002");
      
      await expect(
        feeManager.connect(owner).setCreationFee(newFee)
      ).to.emit(feeManager, "CreationFeeUpdated")
        .withArgs(ethers.parseEther("0.001"), newFee);
      
      expect(await feeManager.creationFee()).to.equal(newFee);
    });

    it("Should allow owner to set platform fee percentage", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      const newPercentage = 3;
      
      await expect(
        feeManager.connect(owner).setPlatformFeePercentage(newPercentage)
      ).to.emit(feeManager, "PlatformFeeUpdated")
        .withArgs(2, newPercentage);
      
      expect(await feeManager.platformFeePercentage()).to.equal(newPercentage);
    });

    it("Should revert if platform fee exceeds maximum", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(owner).setPlatformFeePercentage(6)
      ).to.be.revertedWith("Fee percentage exceeds maximum");
    });

    it("Should revert if non-owner tries to set fees", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(user1).setCreationFee(ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(feeManager, "OwnableUnauthorizedAccount");
      
      await expect(
        feeManager.connect(user1).setPlatformFeePercentage(3)
      ).to.be.revertedWithCustomError(feeManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Fee Collection", function () {
    it("Should collect creation fee", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await expect(
        feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee })
      ).to.emit(feeManager, "FeeCollected")
        .withArgs(marketId, creationFee, "creation");
      
      expect(await feeManager.accumulatedFees()).to.equal(creationFee);
    });

    it("Should revert if creation fee is insufficient", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const insufficientFee = ethers.parseEther("0.0001");
      
      await expect(
        feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: insufficientFee })
      ).to.be.revertedWith("Insufficient creation fee");
    });

    it("Should collect platform fee", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const totalPool = ethers.parseEther("100");
      
      const tx = await feeManager.connect(user1).collectPlatformFee(marketId, totalPool);
      const receipt = await tx.wait();
      
      // 2% of 100 = 2 ETH
      const expectedFee = ethers.parseEther("2");
      
      expect(await feeManager.accumulatedFees()).to.equal(expectedFee);
    });

    it("Should track creator fees", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee });
      
      expect(await feeManager.getCreatorFees(user1.address)).to.equal(creationFee);
    });

    it("Should track market fees", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee });
      
      expect(await feeManager.getMarketFees(marketId)).to.equal(creationFee);
    });
  });

  describe("Fee Calculation", function () {
    it("Should calculate platform fee correctly", async function () {
      const { feeManager } = await loadFixture(deployFeeManagerFixture);
      
      const amount = ethers.parseEther("100");
      const fee = await feeManager.calculatePlatformFee(amount);
      
      // 2% of 100 = 2
      expect(fee).to.equal(ethers.parseEther("2"));
    });

    it("Should calculate net amount correctly", async function () {
      const { feeManager } = await loadFixture(deployFeeManagerFixture);
      
      const grossAmount = ethers.parseEther("100");
      const netAmount = await feeManager.calculateNetAmount(grossAmount);
      
      // 100 - 2% = 98
      expect(netAmount).to.equal(ethers.parseEther("98"));
    });

    it("Should check if creation fee is sufficient", async function () {
      const { feeManager } = await loadFixture(deployFeeManagerFixture);
      
      const sufficientAmount = ethers.parseEther("0.001");
      const insufficientAmount = ethers.parseEther("0.0001");
      
      expect(await feeManager.isCreationFeeSufficient(sufficientAmount)).to.equal(true);
      expect(await feeManager.isCreationFeeSufficient(insufficientAmount)).to.equal(false);
    });
  });

  describe("Fee Withdrawal", function () {
    it("Should allow owner to withdraw fees", async function () {
      const { feeManager, owner, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await feeManager.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.equal(balanceBefore + creationFee - gasUsed);
      expect(await feeManager.accumulatedFees()).to.equal(0);
    });

    it("Should allow owner to withdraw specific amount", async function () {
      const { feeManager, owner, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee });
      
      const withdrawAmount = ethers.parseEther("0.0005");
      
      await expect(
        feeManager.connect(owner).withdrawFeesAmount(withdrawAmount)
      ).to.emit(feeManager, "FeesWithdrawn")
        .withArgs(owner.address, withdrawAmount);
      
      expect(await feeManager.accumulatedFees()).to.equal(creationFee - withdrawAmount);
    });

    it("Should revert if no fees to withdraw", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(owner).withdrawFees()
      ).to.be.revertedWith("No fees to withdraw");
    });

    it("Should revert if withdrawal amount exceeds accumulated fees", async function () {
      const { feeManager, owner, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee });
      
      await expect(
        feeManager.connect(owner).withdrawFeesAmount(ethers.parseEther("0.002"))
      ).to.be.revertedWith("Insufficient fees");
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(user1).withdrawFees()
      ).to.be.revertedWithCustomError(feeManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Withdraw", function () {
    it("Should allow owner to emergency withdraw", async function () {
      const { feeManager, owner, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await feeManager.connect(owner).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.be.gt(balanceBefore - gasUsed);
      expect(await feeManager.accumulatedFees()).to.equal(0);
    });

    it("Should revert if no balance to withdraw", async function () {
      const { feeManager, owner } = await loadFixture(deployFeeManagerFixture);
      
      await expect(
        feeManager.connect(owner).emergencyWithdraw()
      ).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("Receive and Fallback", function () {
    it("Should accept ETH via receive function", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const amount = ethers.parseEther("1");
      
      await user1.sendTransaction({
        to: await feeManager.getAddress(),
        value: amount
      });
      
      expect(await feeManager.accumulatedFees()).to.equal(amount);
    });

    it("Should accept ETH via fallback function", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const amount = ethers.parseEther("1");
      
      await user1.sendTransaction({
        to: await feeManager.getAddress(),
        value: amount,
        data: "0x1234"
      });
      
      expect(await feeManager.accumulatedFees()).to.equal(amount);
    });
  });

  describe("View Functions", function () {
    it("Should return fee configuration", async function () {
      const { feeManager, initialCreationFee, initialPlatformFee } = await loadFixture(deployFeeManagerFixture);
      
      const [creationFee, platformFee, maxFee] = await feeManager.getFeeConfiguration();
      
      expect(creationFee).to.equal(initialCreationFee);
      expect(platformFee).to.equal(initialPlatformFee);
      expect(maxFee).to.equal(5);
    });

    it("Should return accumulated fees", async function () {
      const { feeManager, user1 } = await loadFixture(deployFeeManagerFixture);
      
      const marketId = 1;
      const creationFee = ethers.parseEther("0.001");
      
      await feeManager.connect(user1).collectCreationFee(marketId, user1.address, { value: creationFee });
      
      expect(await feeManager.getAccumulatedFees()).to.equal(creationFee);
    });
  });
});
