// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AMMLibrary.sol";

/**
 * @title AMMLibraryTest
 * @notice Test contract to expose AMMLibrary functions for testing
 */
contract AMMLibraryTest {
    function testCalculateOdds(
        uint256 totalPool,
        uint256 outcomeLiquidity,
        uint256 numOutcomes
    ) external pure returns (uint256) {
        return AMMLibrary.calculateOdds(totalPool, outcomeLiquidity, numOutcomes);
    }

    function testCalculateNewLiquidity(
        uint256 currentLiquidity,
        uint256 betAmount,
        uint256 totalPool
    ) external pure returns (uint256) {
        return AMMLibrary.calculateNewLiquidity(currentLiquidity, betAmount, totalPool);
    }

    function testCalculateSlippage(
        uint256 betAmount,
        uint256 currentLiquidity
    ) external pure returns (uint256) {
        return AMMLibrary.calculateSlippage(betAmount, currentLiquidity);
    }

    function testCalculatePlatformFee(
        uint256 amount,
        uint256 feePercentage
    ) external pure returns (uint256) {
        return AMMLibrary.calculatePlatformFee(amount, feePercentage);
    }

    function testCalculatePotentialWinnings(
        uint256 betAmount,
        uint256 odds
    ) external pure returns (uint256) {
        return AMMLibrary.calculatePotentialWinnings(betAmount, odds);
    }

    function testCalculateProportionalWinnings(
        uint256 betAmount,
        uint256 totalWinningBets,
        uint256 prizePool
    ) external pure returns (uint256) {
        return AMMLibrary.calculateProportionalWinnings(betAmount, totalWinningBets, prizePool);
    }

    function testValidateMarketParams(
        uint256 numOutcomes,
        uint256 endTime
    ) external view returns (bool) {
        return AMMLibrary.validateMarketParams(numOutcomes, endTime);
    }

    function testCalculateAllOdds(
        uint256[] memory outcomeLiquidities,
        uint256 totalPool
    ) external pure returns (uint256[] memory) {
        return AMMLibrary.calculateAllOdds(outcomeLiquidities, totalPool);
    }

    function testCalculateTotalLiquidity(
        uint256[] memory outcomeLiquidities
    ) external pure returns (uint256) {
        return AMMLibrary.calculateTotalLiquidity(outcomeLiquidities);
    }
}
