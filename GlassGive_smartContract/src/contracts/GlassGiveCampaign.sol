// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IGlassGiveCampaign} from "../interfaces/IGlassGiveCampaign.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {HederaTokenService} from "hedera-smart-contracts/contracts/system-contracts/hedera-token-service/HederaTokenService.sol";
import {HederaResponseCodes} from "hedera-smart-contracts/contracts/system-contracts/HederaResponseCodes.sol";

/// @title GlassGiveCampaign
/// @notice Manages donations for a single verified charity or grant cause
/// @dev Deployed by GlassGiveFactory. Inherits HederaTokenService for HTS precompile access.

contract GlassGiveCampaign is IGlassGiveCampaign, HederaTokenService, ReentrancyGuard {
    uint256 public constant FEE_BPS = 300; // 3%
    uint256 public constant BPS_DENOM = 10_000;

    // state
    /// @notice Wallet address of the charity or grant seeker
    address public immutable REQUESTER;

    /// @notice Platform treasury — receives 3% fee on release
    address public immutable TREASURY;

    /// @notice HTS NFT collection address — passed in from factory
    address public nftToken;

    /// @notice Campaign end time as unix timestamp
    uint256 public immutable DEADLINE;

    /// @notice Total HBAR raised in tinybars
    uint256 public totalRaised;

    /// @notice Whether funds have been released
    bool public released;

    /// @notice Campaign type — CHARITY or GRANT
    CampaignType public campaignType;

    /// @notice List of all donor addresses
    address[] public donors;

    /// @notice Total donated per address in tinybars
    mapping(address => uint256) public donations;

    // Constructor

    /// @notice Initialises the campaign — called by GlassGiveFactory
    /// @param _requester  Charity or grant seeker wallet
    /// @param _treasury   Platform treasury wallet
    /// @param _nftToken   HTS NFT collection address for receipt minting
    /// @param _deadline   Campaign end time as unix timestamp
    /// @param _campaignType  0 = CHARITY, 1 = GRANT

    constructor(
        address _requester,
        address _treasury,
        address _nftToken,
        uint256 _deadline,
        CampaignType _campaignType
    ) {
        require(_requester != address(0), "Invalid requester");
        require(_treasury != address(0), "Invalid treasury");
        require(_nftToken != address(0), "Invalid NFT token");
        require(_deadline > block.timestamp, "Deadline must be in future");

        REQUESTER = _requester;
        TREASURY = _treasury;
        nftToken = _nftToken;
        DEADLINE = _deadline;
        campaignType = _campaignType;
    }

    // Donate
    /// @notice donate HBAR to this campaign
    /// @dev Emits DonationReceived - backend logs this HCS
    /// @dev Calls _mintReceip to associate and mint NFT to donor

    function donate() external payable override nonReentrant {
        require(block.timestamp < DEADLINE, "Campaign has ended");
        require(msg.value > 0, "Must send HBAR");

        // track new donors, only push to array on first donation
        if (donations[msg.sender] == 0) {
            donors.push(msg.sender);
        }
        donations[msg.sender] += msg.value;
        totalRaised += msg.value;

        emit DonationReceieved(msg.sender, msg.value, block.timestamp);

        // mint NFT receipt to donor
        _mintReceipt(msg.sender, msg.value);
    }

    // mint Receipt
    /// @notice Associates donot wallet with NFT token then mints and transfers receipt
    /// @dev associateToken return 22 (SUCCESS) or 167 (ALREADY_ASSOCIATED) - both are fine
    /// @param _donor The donor's wallet address
    /// @param _amount The amount donated in tinybars

    function _mintReceipt(address _donor, uint256 _amount) internal {
        // Associate donor wallet with NFT token
        int256 responseCode = associateToken(_donor, nftToken);
        require(
            responseCode == HederaResponseCodes.SUCCESS
                || responseCode == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
            "HTS: association failed"
        );
        // pack donation metadata into NFT (hashed, fixed-size)
        require(_amount <= type(uint64).max, "too large");
        bytes32 metadataHash = keccak256(
            abi.encodePacked(_donor, uint64(_amount), uint48(block.timestamp), uint8(campaignType))
        );
        bytes[] memory metadata = new bytes[](1);
        metadata[0] = abi.encodePacked(metadataHash);
        require(metadata[0].length <= 100, "HTS: metadata too long");

        // mint NFT into trasury account
        (int256 mintResponse,, int64[] memory serialNumbers) = mintToken(nftToken, 0, metadata);
        require(mintResponse == HederaResponseCodes.SUCCESS, "HTS: mint failed");

        // transfer NFT from treasury to donor
        int256 transferResponse = transferNFT(nftToken, TREASURY, _donor, serialNumbers[0]);

        require(transferResponse == HederaResponseCodes.SUCCESS, "HTS: transfer failed");
    }

    // release funds
    /// @notice Releases all raised funds to requester minus 3% fee
    /// @dev Callable by anyone after deadline — backend cron job recommended
    /// @dev Emits FundsReleased — backend logs this to HCS

    mapping(address => uint256) public pendingWithdrawals;

    function releaseFunds() external override nonReentrant {
        require(block.timestamp >= DEADLINE, "Campaign still active");
        require(!released, "Funds already released");
        require(totalRaised > 0, "Nothing to release");

        released = true;

        uint256 fee = (totalRaised * FEE_BPS) / BPS_DENOM;
        uint256 payout = totalRaised - fee;

        // stage withdrawals, no external calls yet
        pendingWithdrawals[TREASURY] = fee;
        pendingWithdrawals[REQUESTER] = payout;

        emit FundsReleased(REQUESTER, payout, fee, block.timestamp);
    }

    function withdraw() external override nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "withdrawal failed");
    }
}
