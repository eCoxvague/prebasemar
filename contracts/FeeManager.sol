// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FeeManager
 * @notice Manages platform fees for the prediction market
 * @dev Handles fee configuration and withdrawal with owner-only access
 */
contract FeeManager is Ownable, ReentrancyGuard {
    // Fee configuration
    uint256 public creationFee;
    uint256 public platformFeePercentage;
    uint256 public constant MAX_FEE_PERCENTAGE = 5; // 5% maximum
    uint256 public accumulatedFees;

    // Fee tracking
    mapping(address => uint256) public creatorFees;
    mapping(uint256 => uint256) public marketFees;

    // Events
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeUpdated(uint256 oldPercentage, uint256 newPercentage);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event FeeCollected(uint256 indexed marketId, uint256 amount, string feeType);

    /**
     * @notice Constructor to initialize fee manager
     * @param initialCreationFee Initial market creation fee
     * @param initialPlatformFee Initial platform fee percentage
     */
    constructor(
        uint256 initialCreationFee,
        uint256 initialPlatformFee
    ) Ownable(msg.sender) {
        require(initialPlatformFee <= MAX_FEE_PERCENTAGE, "Fee percentage too high");
        creationFee = initialCreationFee;
        platformFeePercentage = initialPlatformFee;
    }

    /**
     * @notice Set the market creation fee
     * @param newFee New creation fee amount
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = newFee;
        emit CreationFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Set the platform fee percentage
     * @param newPercentage New fee percentage (0-5)
     */
    function setPlatformFeePercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= MAX_FEE_PERCENTAGE, "Fee percentage exceeds maximum");
        uint256 oldPercentage = platformFeePercentage;
        platformFeePercentage = newPercentage;
        emit PlatformFeeUpdated(oldPercentage, newPercentage);
    }

    /**
     * @notice Collect creation fee for a market
     * @param marketId Market ID
     * @param creator Market creator address
     */
    function collectCreationFee(
        uint256 marketId,
        address creator
    ) external payable {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        accumulatedFees += msg.value;
        creatorFees[creator] += msg.value;
        marketFees[marketId] += msg.value;

        emit FeeCollected(marketId, msg.value, "creation");
    }

    /**
     * @notice Collect platform fee from market resolution
     * @param marketId Market ID
     * @param totalPool Total pool amount
     * @return feeAmount The calculated fee amount
     */
    function collectPlatformFee(
        uint256 marketId,
        uint256 totalPool
    ) external returns (uint256 feeAmount) {
        feeAmount = calculatePlatformFee(totalPool);
        
        accumulatedFees += feeAmount;
        marketFees[marketId] += feeAmount;

        emit FeeCollected(marketId, feeAmount, "platform");
        
        return feeAmount;
    }

    /**
     * @notice Calculate platform fee for a given amount
     * @param amount Amount to calculate fee on
     * @return Fee amount
     */
    function calculatePlatformFee(uint256 amount) public view returns (uint256) {
        return (amount * platformFeePercentage) / 100;
    }

    /**
     * @notice Withdraw accumulated fees to owner
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");

        accumulatedFees = 0;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Fee withdrawal failed");

        emit FeesWithdrawn(owner(), amount);
    }

    /**
     * @notice Withdraw specific amount of fees
     * @param amount Amount to withdraw
     */
    function withdrawFeesAmount(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= accumulatedFees, "Insufficient fees");

        accumulatedFees -= amount;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Fee withdrawal failed");

        emit FeesWithdrawn(owner(), amount);
    }

    /**
     * @notice Get accumulated fees
     * @return Total accumulated fees
     */
    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    /**
     * @notice Get fees collected from a specific creator
     * @param creator Creator address
     * @return Total fees from creator
     */
    function getCreatorFees(address creator) external view returns (uint256) {
        return creatorFees[creator];
    }

    /**
     * @notice Get fees collected from a specific market
     * @param marketId Market ID
     * @return Total fees from market
     */
    function getMarketFees(uint256 marketId) external view returns (uint256) {
        return marketFees[marketId];
    }

    /**
     * @notice Get current fee configuration
     * @return _creationFee Current creation fee
     * @return _platformFeePercentage Current platform fee percentage
     * @return _maxFeePercentage Maximum allowed fee percentage
     */
    function getFeeConfiguration() external view returns (
        uint256 _creationFee,
        uint256 _platformFeePercentage,
        uint256 _maxFeePercentage
    ) {
        return (creationFee, platformFeePercentage, MAX_FEE_PERCENTAGE);
    }

    /**
     * @notice Check if creation fee is sufficient
     * @param amount Amount to check
     * @return True if sufficient
     */
    function isCreationFeeSufficient(uint256 amount) external view returns (bool) {
        return amount >= creationFee;
    }

    /**
     * @notice Calculate net amount after platform fee
     * @param grossAmount Gross amount before fee
     * @return Net amount after fee deduction
     */
    function calculateNetAmount(uint256 grossAmount) external view returns (uint256) {
        uint256 fee = calculatePlatformFee(grossAmount);
        return grossAmount - fee;
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @dev Only for emergency situations
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        accumulatedFees = 0;

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit FeesWithdrawn(owner(), balance);
    }

    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {
        accumulatedFees += msg.value;
    }

    /**
     * @notice Fallback function
     */
    fallback() external payable {
        accumulatedFees += msg.value;
    }
}
