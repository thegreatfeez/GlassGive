// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IGlassGiveCampaign} from "./IGlassGiveCampaign.sol";

interface IGlassGiveFactory {
    // events
    event CampaignCreated(
        address indexed campaign,
        address indexed requester,
        IGlassGiveCampaign.CampaignType campaignType,
        uint256 deadline,
        uint256 timestamp
    );

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    // core-function
    function createCampaign(
        address _requester, 
        uint256 _deadline, 
        IGlassGiveCampaign.CampaignType _campaignType
    )
        external
        returns (address campaign);

    // admin-management
    function addAdmin(address _account) external;
    function removeAdmin(address _account) external;

    function isAdmin(address _account) external view returns (bool);
    function getCampaigns() external view returns (address[] memory);
    function TREASURY() external view returns (address);
    function NFT_TOKEN() external view returns (address);
}
