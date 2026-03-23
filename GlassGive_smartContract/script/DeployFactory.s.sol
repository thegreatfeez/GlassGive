// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {GlassGiveFactory} from "../src/contracts/GlassGiveFactory.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address nftToken = vm.envAddress("NFT_TOKEN_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        new GlassGiveFactory(treasury, nftToken);

        vm.stopBroadcast();
        
        // The factory address will be logged in the terminal and stored in broadcast/
    }
}
