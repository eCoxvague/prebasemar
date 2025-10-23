const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SecurityManager", function () {
  async function deploySecurityManagerFixture() {
    const [owner, admin1, admin2, user1, user2] = await ethers.getSigners();

    const SecurityManager = await ethers.getContractFactory("SecurityManager");
    const securityManager = await SecurityManager.deploy();

    return { securityManager, owner, admin1, admin2, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      expect(await securityManager.owner()).to.equal(owner.address);
    });

    it("Should set owner as admin", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      expect(await securityManager.admins(owner.address)).to.equal(true);
    });

    it("Should not be in emergency mode initially", async function () {
      const { securityManager } = await loadFixture(deploySecurityManagerFixture);
      expect(await securityManager.emergencyMode()).to.equal(false);
    });

    it("Should not be paused initially", async function () {
      const { securityManager } = await loadFixture(deploySecurityManagerFixture);
      expect(await securityManager.paused()).to.equal(false);
    });
  });

  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const { securityManager, owner, admin1 } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).addAdmin(admin1.address)
      ).to.emit(securityManager, "AdminAdded")
        .withArgs(admin1.address);
      
      expect(await securityManager.admins(admin1.address)).to.equal(true);
    });

    it("Should allow owner to remove admin", async function () {
      const { securityManager, owner, admin1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).addAdmin(admin1.address);
      
      await expect(
        securityManager.connect(owner).removeAdmin(admin1.address)
      ).to.emit(securityManager, "AdminRemoved")
        .withArgs(admin1.address);
      
      expect(await securityManager.admins(admin1.address)).to.equal(false);
    });

    it("Should revert if adding zero address as admin", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).addAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should revert if adding existing admin", async function () {
      const { securityManager, owner, admin1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).addAdmin(admin1.address);
      
      await expect(
        securityManager.connect(owner).addAdmin(admin1.address)
      ).to.be.revertedWith("Already an admin");
    });

    it("Should revert if removing non-admin", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).removeAdmin(user1.address)
      ).to.be.revertedWith("Not an admin");
    });

    it("Should revert if trying to remove owner", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).removeAdmin(owner.address)
      ).to.be.revertedWith("Cannot remove owner");
    });

    it("Should revert if non-owner tries to manage admins", async function () {
      const { securityManager, user1, admin1 } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(user1).addAdmin(admin1.address)
      ).to.be.revertedWithCustomError(securityManager, "OwnableUnauthorizedAccount");
    });

    it("Should check if address is admin", async function () {
      const { securityManager, owner, admin1, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).addAdmin(admin1.address);
      
      expect(await securityManager.isAdmin(owner.address)).to.equal(true);
      expect(await securityManager.isAdmin(admin1.address)).to.equal(true);
      expect(await securityManager.isAdmin(user1.address)).to.equal(false);
    });
  });

  describe("Emergency Mode", function () {
    it("Should allow admin to activate emergency mode", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).activateEmergencyMode()
      ).to.emit(securityManager, "EmergencyModeActivated");
      
      expect(await securityManager.emergencyMode()).to.equal(true);
      expect(await securityManager.paused()).to.equal(true);
    });

    it("Should allow owner to deactivate emergency mode", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).activateEmergencyMode();
      
      await expect(
        securityManager.connect(owner).deactivateEmergencyMode()
      ).to.emit(securityManager, "EmergencyModeDeactivated");
      
      expect(await securityManager.emergencyMode()).to.equal(false);
      expect(await securityManager.paused()).to.equal(false);
    });

    it("Should revert if activating emergency mode twice", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).activateEmergencyMode();
      
      await expect(
        securityManager.connect(owner).activateEmergencyMode()
      ).to.be.revertedWith("Already in emergency mode");
    });

    it("Should revert if deactivating when not in emergency mode", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).deactivateEmergencyMode()
      ).to.be.revertedWith("Not in emergency mode");
    });

    it("Should track emergency mode duration", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).activateEmergencyMode();
      
      await time.increase(3600); // 1 hour
      
      const duration = await securityManager.getEmergencyModeDuration();
      expect(duration).to.be.gte(3600);
    });

    it("Should return zero duration when not in emergency mode", async function () {
      const { securityManager } = await loadFixture(deploySecurityManagerFixture);
      
      expect(await securityManager.getEmergencyModeDuration()).to.equal(0);
    });
  });

  describe("Blacklist Management", function () {
    it("Should allow admin to blacklist address", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      const reason = "Suspicious activity";
      
      await expect(
        securityManager.connect(owner).blacklistAddress(user1.address, reason)
      ).to.emit(securityManager, "AddressBlacklisted")
        .withArgs(user1.address, reason);
      
      expect(await securityManager.blacklistedAddresses(user1.address)).to.equal(true);
    });

    it("Should allow admin to whitelist address", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).blacklistAddress(user1.address, "Test");
      
      await expect(
        securityManager.connect(owner).whitelistAddress(user1.address)
      ).to.emit(securityManager, "AddressWhitelisted")
        .withArgs(user1.address);
      
      expect(await securityManager.blacklistedAddresses(user1.address)).to.equal(false);
    });

    it("Should revert if blacklisting zero address", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).blacklistAddress(ethers.ZeroAddress, "Test")
      ).to.be.revertedWith("Invalid address");
    });

    it("Should revert if blacklisting owner", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).blacklistAddress(owner.address, "Test")
      ).to.be.revertedWith("Cannot blacklist owner");
    });

    it("Should revert if blacklisting already blacklisted address", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).blacklistAddress(user1.address, "Test");
      
      await expect(
        securityManager.connect(owner).blacklistAddress(user1.address, "Test")
      ).to.be.revertedWith("Already blacklisted");
    });

    it("Should revert if whitelisting non-blacklisted address", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).whitelistAddress(user1.address)
      ).to.be.revertedWith("Not blacklisted");
    });

    it("Should check if address is blacklisted", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).blacklistAddress(user1.address, "Test");
      
      expect(await securityManager.isBlacklisted(user1.address)).to.equal(true);
    });
  });

  describe("Rate Limiting", function () {
    it("Should enforce minimum action interval", async function () {
      const { securityManager, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      // First action should succeed (tracked internally)
      const timeUntilNext = await securityManager.getTimeUntilNextAction(user1.address);
      expect(timeUntilNext).to.equal(0);
    });

    it("Should allow owner to set minimum action interval", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      const newInterval = 5;
      
      await expect(
        securityManager.connect(owner).setMinActionInterval(newInterval)
      ).to.emit(securityManager, "MinActionIntervalUpdated")
        .withArgs(1, newInterval);
      
      expect(await securityManager.minActionInterval()).to.equal(newInterval);
    });

    it("Should revert if interval is too long", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(owner).setMinActionInterval(61)
      ).to.be.revertedWith("Interval too long");
    });

    it("Should check if action is allowed", async function () {
      const { securityManager, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      expect(await securityManager.isActionAllowed(user1.address)).to.equal(true);
    });

    it("Should block action for blacklisted address", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).blacklistAddress(user1.address, "Test");
      
      expect(await securityManager.isActionAllowed(user1.address)).to.equal(false);
    });

    it("Should block action in emergency mode", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).activateEmergencyMode();
      
      expect(await securityManager.isActionAllowed(user1.address)).to.equal(false);
    });

    it("Should block action when paused", async function () {
      const { securityManager, owner, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).pause();
      
      expect(await securityManager.isActionAllowed(user1.address)).to.equal(false);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).pause();
      expect(await securityManager.paused()).to.equal(true);
    });

    it("Should allow admin to unpause", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).pause();
      await securityManager.connect(owner).unpause();
      expect(await securityManager.paused()).to.equal(false);
    });

    it("Should revert unpause in emergency mode", async function () {
      const { securityManager, owner } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).activateEmergencyMode();
      
      await expect(
        securityManager.connect(owner).unpause()
      ).to.be.revertedWith("Cannot unpause in emergency mode");
    });

    it("Should revert if non-admin tries to pause", async function () {
      const { securityManager, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(user1).pause()
      ).to.be.revertedWith("Not an admin");
    });

    it("Should allow added admin to pause", async function () {
      const { securityManager, owner, admin1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).addAdmin(admin1.address);
      await securityManager.connect(admin1).pause();
      
      expect(await securityManager.paused()).to.equal(true);
    });
  });

  describe("Access Control", function () {
    it("Should allow only admin to activate emergency mode", async function () {
      const { securityManager, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await expect(
        securityManager.connect(user1).activateEmergencyMode()
      ).to.be.revertedWith("Not an admin");
    });

    it("Should allow only owner to deactivate emergency mode", async function () {
      const { securityManager, owner, admin1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).addAdmin(admin1.address);
      await securityManager.connect(admin1).activateEmergencyMode();
      
      await expect(
        securityManager.connect(admin1).deactivateEmergencyMode()
      ).to.be.revertedWithCustomError(securityManager, "OwnableUnauthorizedAccount");
    });

    it("Should allow admin to manage blacklist", async function () {
      const { securityManager, owner, admin1, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).addAdmin(admin1.address);
      
      await securityManager.connect(admin1).blacklistAddress(user1.address, "Test");
      expect(await securityManager.isBlacklisted(user1.address)).to.equal(true);
      
      await securityManager.connect(admin1).whitelistAddress(user1.address);
      expect(await securityManager.isBlacklisted(user1.address)).to.equal(false);
    });
  });

  describe("View Functions", function () {
    it("Should return correct admin status", async function () {
      const { securityManager, owner, admin1, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).addAdmin(admin1.address);
      
      expect(await securityManager.isAdmin(owner.address)).to.equal(true);
      expect(await securityManager.isAdmin(admin1.address)).to.equal(true);
      expect(await securityManager.isAdmin(user1.address)).to.equal(false);
    });

    it("Should return correct blacklist status", async function () {
      const { securityManager, owner, user1, user2 } = await loadFixture(deploySecurityManagerFixture);
      
      await securityManager.connect(owner).blacklistAddress(user1.address, "Test");
      
      expect(await securityManager.isBlacklisted(user1.address)).to.equal(true);
      expect(await securityManager.isBlacklisted(user2.address)).to.equal(false);
    });

    it("Should return correct action allowed status", async function () {
      const { securityManager, user1 } = await loadFixture(deploySecurityManagerFixture);
      
      expect(await securityManager.isActionAllowed(user1.address)).to.equal(true);
    });
  });
});
