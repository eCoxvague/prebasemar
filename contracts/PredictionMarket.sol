// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PredictionMarket
 * @notice Main contract for creating and managing prediction markets on Base
 * @dev Implements market creation, betting, resolution, and winnings claim
 */
contract PredictionMarket is Ownable, ReentrancyGuard, Pausable {
    // Market status enum
    enum MarketStatus {
        Active,
        Closed,
        Resolved,
        Cancelled,
        Disputed
    }

    // Market struct
    struct Market {
        uint256 id;
        address creator;
        string title;
        uint256 endTime;
        uint256 totalPool;
        MarketStatus status;
        uint256 winningOutcome;
        uint256 creationFee;
        uint256 outcomeCount;
        uint256 createdAt;
    }

    // Outcome struct
    struct Outcome {
        uint256 id;
        uint256 marketId;
        string name;
        uint256 totalBets;
        uint256 liquidity;
    }

    // Bet struct
    struct Bet {
        uint256 id;
        uint256 marketId;
        uint256 outcomeId;
        address bettor;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }

    // State variables
    uint256 public marketCounter;
    uint256 public betCounter;
    uint256 public creationFee = 0.001 ether;
    uint256 public platformFeePercentage = 2; // 2%
    uint256 public constant MAX_FEE_PERCENTAGE = 5; // 5% max
    uint256 public accumulatedFees;

    // Mappings
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Outcome[]) public marketOutcomes;
    mapping(uint256 => Bet[]) public marketBets;
    mapping(address => uint256[]) public userBets;
    mapping(uint256 => mapping(address => uint256)) public userClaimableWinnings;

    // Events
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string title,
        uint256 endTime,
        uint256 outcomeCount
    );

    event BetPlaced(
        uint256 indexed marketId,
        uint256 indexed outcomeId,
        address indexed bettor,
        uint256 amount,
        uint256 betId
    );

    event MarketResolved(
        uint256 indexed marketId,
        uint256 winningOutcome,
        uint256 totalPool
    );

    event WinningsClaimed(
        address indexed user,
        uint256 amount,
        uint256 marketId
    );

    event MarketCancelled(uint256 indexed marketId);

    event DisputeRaised(
        uint256 indexed marketId,
        address indexed disputer,
        string reason
    );

    event CreationFeeUpdated(uint256 newFee);
    event PlatformFeeUpdated(uint256 newPercentage);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new prediction market
     * @param title Market title
     * @param outcomeNames Array of outcome names
     * @param endTime Market end timestamp
     * @return marketId The ID of the created market
     */
    function createMarket(
        string memory title,
        string[] memory outcomeNames,
        uint256 endTime
    ) external payable whenNotPaused returns (uint256) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(outcomeNames.length >= 2 && outcomeNames.length <= 5, "Must have 2-5 outcomes");
        require(endTime > block.timestamp, "End time must be in future");

        uint256 marketId = marketCounter++;

        // Create market
        markets[marketId] = Market({
            id: marketId,
            creator: msg.sender,
            title: title,
            endTime: endTime,
            totalPool: 0,
            status: MarketStatus.Active,
            winningOutcome: 0,
            creationFee: msg.value,
            outcomeCount: outcomeNames.length,
            createdAt: block.timestamp
        });

        // Create outcomes with initial liquidity
        for (uint256 i = 0; i < outcomeNames.length; i++) {
            marketOutcomes[marketId].push(
                Outcome({
                    id: i,
                    marketId: marketId,
                    name: outcomeNames[i],
                    totalBets: 0,
                    liquidity: 1 ether // Initial liquidity for AMM
                })
            );
        }

        // Add creation fee to accumulated fees
        accumulatedFees += msg.value;

        emit MarketCreated(marketId, msg.sender, title, endTime, outcomeNames.length);

        return marketId;
    }

    /**
     * @notice Place a bet on a market outcome
     * @param marketId The market ID
     * @param outcomeId The outcome ID to bet on
     */
    function placeBet(
        uint256 marketId,
        uint256 outcomeId
    ) external payable nonReentrant whenNotPaused {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market has ended");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(outcomeId < market.outcomeCount, "Invalid outcome ID");

        uint256 betId = betCounter++;

        // Create bet
        Bet memory newBet = Bet({
            id: betId,
            marketId: marketId,
            outcomeId: outcomeId,
            bettor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            claimed: false
        });

        marketBets[marketId].push(newBet);
        userBets[msg.sender].push(betId);

        // Update market and outcome
        market.totalPool += msg.value;
        marketOutcomes[marketId][outcomeId].totalBets += msg.value;
        marketOutcomes[marketId][outcomeId].liquidity += msg.value;

        emit BetPlaced(marketId, outcomeId, msg.sender, msg.value, betId);
    }

    /**
     * @notice Resolve a market with the winning outcome
     * @param marketId The market ID
     * @param winningOutcomeId The winning outcome ID
     */
    function resolveMarket(
        uint256 marketId,
        uint256 winningOutcomeId
    ) external nonReentrant {
        Market storage market = markets[marketId];
        require(msg.sender == market.creator, "Only creator can resolve");
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp >= market.endTime, "Market not ended yet");
        require(winningOutcomeId < market.outcomeCount, "Invalid outcome ID");

        market.status = MarketStatus.Resolved;
        market.winningOutcome = winningOutcomeId;

        // Calculate platform fee
        uint256 platformFee = (market.totalPool * platformFeePercentage) / 100;
        accumulatedFees += platformFee;
        uint256 prizePool = market.totalPool - platformFee;

        // Calculate winnings for each bettor
        uint256 winningOutcomeBets = marketOutcomes[marketId][winningOutcomeId].totalBets;

        if (winningOutcomeBets > 0) {
            Bet[] storage bets = marketBets[marketId];
            for (uint256 i = 0; i < bets.length; i++) {
                if (bets[i].outcomeId == winningOutcomeId) {
                    uint256 winnings = (bets[i].amount * prizePool) / winningOutcomeBets;
                    userClaimableWinnings[marketId][bets[i].bettor] += winnings;
                }
            }
        }

        emit MarketResolved(marketId, winningOutcomeId, market.totalPool);
    }

    /**
     * @notice Claim winnings from a resolved market
     * @param marketId The market ID
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");

        uint256 winnings = userClaimableWinnings[marketId][msg.sender];
        require(winnings > 0, "No winnings to claim");

        userClaimableWinnings[marketId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: winnings}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(msg.sender, winnings, marketId);
    }

    /**
     * @notice Cancel a market (only if no bets placed)
     * @param marketId The market ID
     */
    function cancelMarket(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(msg.sender == market.creator, "Only creator can cancel");
        require(market.status == MarketStatus.Active, "Market not active");
        require(market.totalPool == 0, "Cannot cancel market with bets");

        market.status = MarketStatus.Cancelled;

        emit MarketCancelled(marketId);
    }

    /**
     * @notice Raise a dispute for a market
     * @param marketId The market ID
     * @param reason Dispute reason
     */
    function raiseDispute(uint256 marketId, string memory reason) external {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active || market.status == MarketStatus.Resolved, "Invalid market status");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        market.status = MarketStatus.Disputed;

        emit DisputeRaised(marketId, msg.sender, reason);
    }

    /**
     * @notice Get market details
     * @param marketId The market ID
     * @return Market struct
     */
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    /**
     * @notice Get market outcomes
     * @param marketId The market ID
     * @return Array of outcomes
     */
    function getOutcomes(uint256 marketId) external view returns (Outcome[] memory) {
        return marketOutcomes[marketId];
    }

    /**
     * @notice Get user's bets for a market
     * @param marketId The market ID
     * @param user User address
     * @return Array of bets
     */
    function getUserBetsForMarket(uint256 marketId, address user) external view returns (Bet[] memory) {
        Bet[] storage allBets = marketBets[marketId];
        uint256 count = 0;

        // Count user's bets
        for (uint256 i = 0; i < allBets.length; i++) {
            if (allBets[i].bettor == user) {
                count++;
            }
        }

        // Create result array
        Bet[] memory userMarketBets = new Bet[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < allBets.length; i++) {
            if (allBets[i].bettor == user) {
                userMarketBets[index] = allBets[i];
                index++;
            }
        }

        return userMarketBets;
    }

    /**
     * @notice Get claimable winnings for a user in a market
     * @param marketId The market ID
     * @param user User address
     * @return Claimable amount
     */
    function getClaimableWinnings(uint256 marketId, address user) external view returns (uint256) {
        return userClaimableWinnings[marketId][user];
    }

    /**
     * @notice Set creation fee (owner only)
     * @param newFee New creation fee
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }

    /**
     * @notice Set platform fee percentage (owner only)
     * @param newPercentage New fee percentage
     */
    function setPlatformFeePercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        platformFeePercentage = newPercentage;
        emit PlatformFeeUpdated(newPercentage);
    }

    /**
     * @notice Withdraw accumulated fees (owner only)
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");

        accumulatedFees = 0;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");

        emit FeesWithdrawn(owner(), amount);
    }

    /**
     * @notice Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get accumulated fees
     * @return Fee amount
     */
    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }
}
