// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IGlassGiveCampaign {
    enum CampaignType {
        CHARITY,
        GRANT
    }

    // events
    event DonationReceieved(address indexed donor, uint256 amount, uint256 timestamp);

    event FundsReleased(address indexed requester, uint256 payout, uint256 fee, uint256 timestamp);

    //core-functions
    function donate() external payable;
    function releaseFunds() external;
    function withdraw() external;

    // view-functions
    function REQUESTER() external view returns (address);
    function TREASURY() external view returns (address);
    function DEADLINE() external view returns (uint256);
    function totalRaised() external view returns (uint256);
    function released() external view returns (bool);
    function campaignType() external view returns (CampaignType);
    function donations(address _donor) external view returns (uint256);
    function pendingWithdrawals(address _account) external view returns (uint256);
}
