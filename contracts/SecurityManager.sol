// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SecurityManager
 * @notice Provides security features and emergency controls
 * @dev Implements circuit breaker pattern and emergency functions
 */
contract SecurityManager is Ownable, Pausable, ReentrancyGuard {
    // Emergency state
    bool public emergencyMode;
    uint256 public emergencyActivatedAt;

    // Access control
    mapping(address => bool) public admins;
    mapping(address => bool) public blacklistedAddresses;

    // Rate limiting
    mapping(address => uint256) public lastActionTimestamp;
    uint256 public minActionInterval = 1; // 1 second minimum between actions

    // Events
    event EmergencyModeActivated(address indexed activator, uint256 timestamp);
    event EmergencyModeDeactivated(address indexed deactivator, uint256 timestamp);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event AddressBlacklisted(address indexed account, string reason);
    event AddressWhitelisted(address indexed account);
    event MinActionIntervalUpdated(uint256 oldInterval, uint256 newInterval);

    // Modifiers
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not an admin");
        _;
    }

    modifier notBlacklisted(address account) {
        require(!blacklistedAddresses[account], "Address is blacklisted");
        _;
    }

    modifier notInEmergency() {
        require(!emergencyMode, "Emergency mode active");
        _;
    }

    modifier rateLimited() {
        require(
            block.timestamp >= lastActionTimestamp[msg.sender] + minActionInterval,
            "Action too frequent"
        );
        lastActionTimestamp[msg.sender] = block.timestamp;
        _;
    }

    constructor() Ownable(msg.sender) {
        admins[msg.sender] = true;
    }

    /**
     * @notice Activate emergency mode
     * @dev Pauses all contract operations
     */
    function activateEmergencyMode() external onlyAdmin {
        require(!emergencyMode, "Already in emergency mode");
        emergencyMode = true;
        emergencyActivatedAt = block.timestamp;
        _pause();
        emit EmergencyModeActivated(msg.sender, block.timestamp);
    }

    /**
     * @notice Deactivate emergency mode
     * @dev Resumes contract operations
     */
    function deactivateEmergencyMode() external onlyOwner {
        require(emergencyMode, "Not in emergency mode");
        emergencyMode = false;
        _unpause();
        emit EmergencyModeDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @notice Add an admin
     * @param admin Address to add as admin
     */
    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid address");
        require(!admins[admin], "Already an admin");
        admins[admin] = true;
        emit AdminAdded(admin);
    }

    /**
     * @notice Remove an admin
     * @param admin Address to remove from admins
     */
    function removeAdmin(address admin) external onlyOwner {
        require(admins[admin], "Not an admin");
        require(admin != owner(), "Cannot remove owner");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    /**
     * @notice Blacklist an address
     * @param account Address to blacklist
     * @param reason Reason for blacklisting
     */
    function blacklistAddress(address account, string memory reason) external onlyAdmin {
        require(account != address(0), "Invalid address");
        require(account != owner(), "Cannot blacklist owner");
        require(!blacklistedAddresses[account], "Already blacklisted");
        blacklistedAddresses[account] = true;
        emit AddressBlacklisted(account, reason);
    }

    /**
     * @notice Remove address from blacklist
     * @param account Address to whitelist
     */
    function whitelistAddress(address account) external onlyAdmin {
        require(blacklistedAddresses[account], "Not blacklisted");
        blacklistedAddresses[account] = false;
        emit AddressWhitelisted(account);
    }

    /**
     * @notice Set minimum action interval for rate limiting
     * @param interval New interval in seconds
     */
    function setMinActionInterval(uint256 interval) external onlyOwner {
        require(interval <= 60, "Interval too long");
        uint256 oldInterval = minActionInterval;
        minActionInterval = interval;
        emit MinActionIntervalUpdated(oldInterval, interval);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyAdmin {
        require(!emergencyMode, "Cannot unpause in emergency mode");
        _unpause();
    }

    /**
     * @notice Check if address is admin
     * @param account Address to check
     * @return True if admin
     */
    function isAdmin(address account) external view returns (bool) {
        return admins[account] || account == owner();
    }

    /**
     * @notice Check if address is blacklisted
     * @param account Address to check
     * @return True if blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return blacklistedAddresses[account];
    }

    /**
     * @notice Get time until next allowed action
     * @param account Address to check
     * @return Seconds until next action allowed
     */
    function getTimeUntilNextAction(address account) external view returns (uint256) {
        uint256 nextAllowedTime = lastActionTimestamp[account] + minActionInterval;
        if (block.timestamp >= nextAllowedTime) {
            return 0;
        }
        return nextAllowedTime - block.timestamp;
    }

    /**
     * @notice Check if action is allowed for address
     * @param account Address to check
     * @return True if action is allowed
     */
    function isActionAllowed(address account) external view returns (bool) {
        if (blacklistedAddresses[account]) return false;
        if (emergencyMode) return false;
        if (paused()) return false;
        if (block.timestamp < lastActionTimestamp[account] + minActionInterval) return false;
        return true;
    }

    /**
     * @notice Get emergency mode duration
     * @return Duration in seconds, 0 if not in emergency mode
     */
    function getEmergencyModeDuration() external view returns (uint256) {
        if (!emergencyMode) return 0;
        return block.timestamp - emergencyActivatedAt;
    }
}
