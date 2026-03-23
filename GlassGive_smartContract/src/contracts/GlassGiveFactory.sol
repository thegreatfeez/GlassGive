// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IGlassGiveFactory} from "../interfaces/IGlassGiveFactory.sol";
import {IGlassGiveCampaign} from "../interfaces/IGlassGiveCampaign.sol";
import {GlassGiveCampaign} from "./GlassGiveCampaign.sol";

/// @title GlassGiveFactory
/// @notice Deploys and track all GlassGive campaign contracts
/// @dev only verified admins can create campaigns

contract GlassGiveFactory is IGlassGiveFactory {
    address public immutable TREASURY;
    address public immutable NFT_TOKEN;

    address public owner;

    mapping(address => bool) public admins;

    address[] private campaigns;

    /// @notice Restricts function to owner only
    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner, "Not the owner");
    }

    /// @notice Restricts function to admins only
    modifier onlyAdmin() {
        _onlyAdmin();
        _;
    }

    function _onlyAdmin() internal view {
        require(admins[msg.sender], "Not an admin");
    }

    /// @notice Initialise the factory
    /// @param _treasury platform treasury wallet
    /// @param _nftToken HTS NFT collection address

    constructor(address _treasury, address _nftToken) {
        require(_treasury != address(0), "invalid treasury");
        require(_nftToken != address(0), "invalid NFT token");

        TREASURY = _treasury;
        NFT_TOKEN = _nftToken;
        owner = msg.sender;

        // deployer is first admin
        admins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    /// @notice Deploys a new GlassGiveCampaign for a verified cause
    /// @dev Only callable by admins after off-chain verification
    /// @param _requester Charity or grant seeker wallet
    /// @param _deadline Campaign end time as unix timestamp
    /// @param _campaignType 0 = CHARITY, 1 = GRANT
    /// @return campaign Address of the newly deployed campaign

    function createCampaign(
        address _requester, 
        uint256 _deadline, 
        IGlassGiveCampaign.CampaignType _campaignType
    )
        external
        override
        onlyOwner
        returns (address campaign)
    {
        GlassGiveCampaign newCampaign = new GlassGiveCampaign(
            _requester, 
            TREASURY, 
            NFT_TOKEN, 
            _deadline, 
            _campaignType
        );

        campaign = address(newCampaign);
        campaigns.push(campaign);

        emit CampaignCreated(campaign, _requester, _campaignType, _deadline, block.timestamp);
    }

    // admin management

    /// @notice Adds a new admin
    /// @param _account address to grant role

    function addAdmin(address _account) external override onlyOwner {
        require(_account != address(0), "Invalid address");
        require(!admins[_account], "Already an admin");

        admins[_account] = true;
        emit AdminAdded(_account);
    }

    /// @notice rmove an existing admin
    /// @param _account address to revoke admi role
    function removeAdmin(address _account) external override onlyOwner {
        require(admins[_account], "Not an admin");
        require(_account != owner, "Cannot remove owner");

        admins[_account] = false;
        emit AdminRemoved(_account);
    }

    /// @notice Check if an address is an admin
    /// @param _account Address to check

    function isAdmin(address _account) external view override returns(bool){
        return admins[_account];
    }

    /// @notice returns all deployed campaign addresses    
    function getCampaigns() external view override returns (address[] memory){
        return campaigns;
    }
}
