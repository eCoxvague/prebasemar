// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AMMLibrary
 * @notice Library for Automated Market Maker calculations
 * @dev Implements constant product formula for odds calculation
 */
library AMMLibrary {
    uint256 private constant PRECISION = 1e18;
    uint256 private constant MIN_ODDS = 101; // 1.01 in basis points (100 = 1.00)
    uint256 private constant MAX_ODDS = 10000; // 100.00 in basis points

    /**
     * @notice Calculate odds for an outcome using constant product formula
     * @param totalPool Total pool size
     * @param outcomeLiquidity Liquidity for the specific outcome
     * @param numOutcomes Total number of outcomes
     * @return Odds in basis points (100 = 1.00x)
     */
    function calculateOdds(
        uint256 totalPool,
        uint256 outcomeLiquidity,
        uint256 numOutcomes
    ) internal pure returns (uint256) {
        require(outcomeLiquidity > 0, "Liquidity must be positive");
        require(numOutcomes > 0, "Invalid outcome count");

        if (totalPool == 0) {
            // Equal odds for all outcomes initially
            return (100 * numOutcomes);
        }

        // Calculate probability: P = liquidity / totalLiquidity
        // Odds = 1 / P = totalLiquidity / liquidity
        uint256 odds = (totalPool * 100) / outcomeLiquidity;

        // Apply min/max bounds
        if (odds < MIN_ODDS) {
            return MIN_ODDS;
        }
        if (odds > MAX_ODDS) {
            return MAX_ODDS;
        }

        return odds;
    }

    /**
     * @notice Calculate new liquidity after a bet using constant product formula
     * @param currentLiquidity Current liquidity for the outcome
     * @param betAmount Amount being bet
     * @param totalPool Total pool size
     * @return New liquidity value
     */
    function calculateNewLiquidity(
        uint256 currentLiquidity,
        uint256 betAmount,
        uint256 totalPool
    ) internal pure returns (uint256) {
        require(currentLiquidity > 0, "Current liquidity must be positive");
        require(betAmount > 0, "Bet amount must be positive");

        // Simple additive model: liquidity increases with bets
        // More sophisticated AMMs could use bonding curves
        return currentLiquidity + betAmount;
    }

    /**
     * @notice Calculate slippage for a bet
     * @param betAmount Amount being bet
     * @param currentLiquidity Current liquidity for the outcome
     * @return Slippage percentage in basis points (100 = 1%)
     */
    function calculateSlippage(
        uint256 betAmount,
        uint256 currentLiquidity
    ) internal pure returns (uint256) {
        require(currentLiquidity > 0, "Liquidity must be positive");

        if (betAmount == 0) {
            return 0;
        }

        // Slippage = (betAmount / currentLiquidity) * 100
        // Higher bet relative to liquidity = higher slippage
        uint256 slippage = (betAmount * 10000) / currentLiquidity;

        // Cap slippage at 100% (10000 basis points)
        if (slippage > 10000) {
            return 10000;
        }

        return slippage;
    }

    /**
     * @notice Calculate platform fee
     * @param amount Amount to calculate fee on
     * @param feePercentage Fee percentage (e.g., 2 for 2%)
     * @return Fee amount
     */
    function calculatePlatformFee(
        uint256 amount,
        uint256 feePercentage
    ) internal pure returns (uint256) {
        require(feePercentage <= 100, "Fee percentage too high");
        return (amount * feePercentage) / 100;
    }

    /**
     * @notice Calculate potential winnings for a bet
     * @param betAmount Amount being bet
     * @param odds Current odds in basis points
     * @return Potential winnings
     */
    function calculatePotentialWinnings(
        uint256 betAmount,
        uint256 odds
    ) internal pure returns (uint256) {
        require(betAmount > 0, "Bet amount must be positive");
        require(odds >= MIN_ODDS, "Odds too low");

        // Winnings = betAmount * (odds / 100)
        return (betAmount * odds) / 100;
    }

    /**
     * @notice Calculate odds for all outcomes in a market
     * @param outcomeLiquidities Array of liquidity values for each outcome
     * @param totalPool Total pool size
     * @return Array of odds for each outcome
     */
    function calculateAllOdds(
        uint256[] memory outcomeLiquidities,
        uint256 totalPool
    ) internal pure returns (uint256[] memory) {
        uint256 numOutcomes = outcomeLiquidities.length;
        uint256[] memory odds = new uint256[](numOutcomes);

        for (uint256 i = 0; i < numOutcomes; i++) {
            odds[i] = calculateOdds(totalPool, outcomeLiquidities[i], numOutcomes);
        }

        return odds;
    }

    /**
     * @notice Calculate total liquidity from outcome liquidities
     * @param outcomeLiquidities Array of liquidity values
     * @return Total liquidity
     */
    function calculateTotalLiquidity(
        uint256[] memory outcomeLiquidities
    ) internal pure returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < outcomeLiquidities.length; i++) {
            total += outcomeLiquidities[i];
        }
        return total;
    }

    /**
     * @notice Validate market parameters
     * @param numOutcomes Number of outcomes
     * @param endTime Market end time
     * @return True if valid
     */
    function validateMarketParams(
        uint256 numOutcomes,
        uint256 endTime
    ) internal view returns (bool) {
        return numOutcomes >= 2 && 
               numOutcomes <= 5 && 
               endTime > block.timestamp;
    }

    /**
     * @notice Calculate proportional winnings distribution
     * @param betAmount User's bet amount
     * @param totalWinningBets Total bets on winning outcome
     * @param prizePool Total prize pool to distribute
     * @return User's share of winnings
     */
    function calculateProportionalWinnings(
        uint256 betAmount,
        uint256 totalWinningBets,
        uint256 prizePool
    ) internal pure returns (uint256) {
        require(totalWinningBets > 0, "No winning bets");
        require(betAmount <= totalWinningBets, "Invalid bet amount");

        return (betAmount * prizePool) / totalWinningBets;
    }
}
