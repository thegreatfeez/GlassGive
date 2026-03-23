# GlassGive — Smart Contract Integration Guide

This document defines the contract between the smart contract layer and the backend team.
Read this before writing any Hedera SDK or backend code.

---

## 1. Contract Events to Listen To

These events are emitted by the contracts and must be indexed by the backend into HCS topics.
Use the Mirror Node REST API to poll for these.

### GlassGiveCampaign.sol

```solidity
event DonationReceived(
    address indexed donor,
    uint256 amount,
    uint256 timestamp
);

event FundsReleased(
    address indexed requester,
    uint256 payout,
    uint256 fee,
    uint256 timestamp
);
```

### GlassGiveFactory.sol

```solidity
event CampaignCreated(
    address indexed campaign,
    address indexed requester,
    uint8 campaignType,        // 0 = CHARITY, 1 = GRANT
    uint256 deadline,
    uint256 timestamp
);

event AdminAdded(address indexed admin);
event AdminRemoved(address indexed admin);
```

---

## 2. What Backend Passes INTO the Contracts

### Deploying GlassGiveFactory (one time only)

| Parameter   | Type      | Description                                                                       |
| ----------- | --------- | --------------------------------------------------------------------------------- |
| `_treasury` | `address` | Platform wallet that receives 3% fee                                              |
| `_nftToken` | `address` | HTS NFT collection address — backend creates this via Hedera SDK before deploying |

### Calling `factory.createCampaign()` (once per verified cause)

| Parameter       | Type      | Description                                                 |
| --------------- | --------- | ----------------------------------------------------------- |
| `_requester`    | `address` | Wallet address of the charity or grant seeker               |
| `_deadline`     | `uint256` | Unix timestamp — backend converts date picker value to this |
| `_campaignType` | `uint8`   | `0` = CHARITY, `1` = GRANT                                  |

> **Note:** Backend must upload cause documents to HFS and obtain a File ID
> before calling `createCampaign()`. The File ID is stored off-contract
> and referenced in the HCS topic message for the cause.

---

## 3. Readable State Per Campaign Contract

The backend and frontend can read these directly via Mirror Node
or by calling the contract view functions.

| Function             | Return Type | Description                                     |
| -------------------- | ----------- | ----------------------------------------------- |
| `requester()`        | `address`   | Charity or grant seeker wallet                  |
| `treasury()`         | `address`   | Platform treasury wallet                        |
| `deadline()`         | `uint256`   | Campaign end time as unix timestamp             |
| `totalRaised()`      | `uint256`   | Total HBAR raised so far in tinybars            |
| `released()`         | `bool`      | Whether funds have been released                |
| `campaignType()`     | `uint8`     | `0` = CHARITY, `1` = GRANT                      |
| `donations(address)` | `uint256`   | Total donated by a specific address in tinybars |

> **Tinybar note:** 1 HBAR = 100,000,000 tinybars. Divide by `1e8` for display.

---

## 4. Mirror Node Endpoints to Use

```
# Get all events emitted by a campaign contract
GET /api/v1/contracts/{contractAddress}/results/logs

# Verify a donor's NFT receipt
GET /api/v1/tokens/{nftTokenId}/nfts?account.id={donorAccountId}

# Monitor all contract call results
GET /api/v1/contracts/results?contract.id={contractAddress}

# Get HCS messages for a cause topic
GET /api/v1/topics/{topicId}/messages
```

---

## 5. What Backend Owns Completely

These are NOT the smart contract team's responsibility.
The backend team handles these independently:

```
→ Creating the HTS NFT collection via Hedera SDK (before factory deploy)
→ Uploading cause metadata and documents to HFS
→ Storing and referencing HFS File IDs
→ Creating HCS topics per cause
→ Listening to contract events and logging them to HCS
→ Querying Mirror Node for the dashboard
→ Magic.link + HashConnect wallet integration and account abstraction
→ Multi-signature admin verification flow
→ Storing { magicUserId → hederaAccountId } mapping in the database
```

---

## 6. Integration Sequence — Exact Order of Operations

Follow this sequence to avoid integration errors:

```
STEP 1 — Backend: Create HTS NFT collection via Hedera SDK
         → obtain: nftTokenAddress

STEP 2 — Smart contract team: Deploy GlassGiveFactory
         → input:  treasury address, nftTokenAddress
         → output: factoryContractAddress

STEP 3 — Smart contract team: Share with backend
         → factoryContractAddress
         → ABI files from /contracts/out/

STEP 4 — Admin verifies a cause (charity or grant)
         → Backend uploads docs to HFS → obtains fileId
         → Backend calls factory.createCampaign()
           with: requester, deadline, campaignType
         → Factory deploys GlassGiveCampaign
         → CampaignCreated event emitted
         → Backend creates HCS topic for cause
         → Backend logs CampaignCreated to HCS topic

STEP 5 — Donor donates via frontend
         → Frontend calls campaign.donate() with HBAR value
         → DonationReceived event emitted
         → Backend logs DonationReceived to HCS topic
         → NFT receipt minted to donor wallet automatically

STEP 6 — Deadline passes
         → Anyone (backend cron job recommended) calls campaign.releaseFunds()
         → FundsReleased event emitted
         → Backend logs FundsReleased to HCS topic
         → 97% sent to requester wallet automatically
         → 3% sent to treasury wallet automatically
```

---

## 7. ABI Files Location

After running `forge build`, ABI files are auto-generated here:

```
contracts/out/GlassGiveCampaign.sol/GlassGiveCampaign.json
contracts/out/GlassGiveFactory.sol/GlassGiveFactory.json
```

The backend uses these ABIs to encode and decode contract calls
via the Hedera JS SDK or ethers.js.

---

## 8. Network Details

| Network        | Chain ID | RPC URL                         |
| -------------- | -------- | ------------------------------- |
| Hedera Testnet | 296      | `https://testnet.hashio.io/api` |
| Hedera Mainnet | 295      | `https://mainnet.hashio.io/api` |

> All development and testing happens on **testnet** until final deployment.

---

## Questions?

Reach out to the smart contract team or open an issue on the repo.
