# RecipeDeck Whitepaper
**"Good Food. Shared Stories."**

*A Decentralized, Immutable Culinary Archive on the Botchain Network*

**Version:** 1.0.0  
**Date:** November 2026  
**Smart Contract:** [`0x18222C792493bb0593bbce49bF3b8CBE77CBe106`](https://scan.bohr.life/address/0x18222C792493bb0593bbce49bF3b8CBE77CBe106#code)  
**Network:** Botchain Testnet (Chain ID `968`)  
**Repository:** [https://github.com/liljhnxn/recipedeck.git](https://github.com/liljhnxn/recipedeck.git)  

---

## 1. Executive Summary

Food is humanity’s most universal cultural artifact. For millennia, recipes were preserved across generations through shared oral traditions, parchment, and family cookbooks. The advent of Web 2.0 digitized cooking but subjected culinary heritage to severe systemic flaws: algorithmic SEO bloat, relentless tracking scripts, intrusive advertising walls, link rot, and centralized platform lock-in.

**RecipeDeck** is a sovereign, decentralized recipe commons designed to restore dignity and permanence to shared cooking. By storing recipes, ingredients, instructions, and community appreciations 100% on-chain on the Botchain network, RecipeDeck establishes an unalterable global digital cookbook. 

With **strictly zero databases, zero proprietary backends, and zero token or NFT paywalls**, RecipeDeck provides an ad-free, censorship-resistant public good presented through an editorial food magazine interface.

---

## 2. The Problem with Centralized Culinary Web

Modern recipe consumption on the internet is fundamentally broken:

1. **SEO Bloat & Algorithmic Incentives**: Commercial search engines prioritize 2,000-word SEO essays and life stories over actual culinary utility just to rank higher.
2. **Aggressive Monetization & Privacy Erosion**: Mainstream cooking sites load dozens of third-party trackers, auto-playing video banners, and aggressive newsletter modals, degrading user experience and privacy.
3. **Link Rot & Ephemeral Availability**: Independent culinary blogs regularly shut down, taking decades of treasured recipes offline forever.
4. **Platform Dependence & Censorship**: Centralized recipe aggregators monetize user-submitted recipes while maintaining unilateral power to edit, hide, or paywall community content.

---

## 3. The RecipeDeck Solution

RecipeDeck replaces fragile, ad-saturated databases with a decentralized, immutable protocol:

* **Permanent On-Chain Preservation**: Titles, stories, categories, complete ingredients, and step-by-step instructions are directly committed to the Botchain blockchain.
* **No Middlemen, No Backend**: The user interacts peer-to-peer with the smart contract through client-side Web3 providers (`viem` / `wagmi`).
* **Zero Token/NFT Friction**: Cooking is universal. RecipeDeck intentionally omits speculative ERC-20 tokens or expensive NFT gating. Anyone with an EVM wallet can publish, like, and explore recipes without financial friction.
* **Sybil-Resistant Appreciations**: Likes and unlikes are recorded on-chain with state tracking to strictly prevent duplicate likes from the same wallet.
* **Author Sovereignty**: Recipes belong to their creators. Only the original author's cryptographic signature can decommission a recipe from the active directory.

---

## 4. Technical Architecture

### 4.1 System Overview
```
+-------------------------------------------------------------+
|                     User Browser (Web3)                     |
|  [Next.js App Router] <-> [Wagmi / Viem] <-> [MetaMask]     |
+-------------------------------------------------------------+
                              |
                     RPC: https://rpc.bohr.life
                              v
+-------------------------------------------------------------+
|                Botchain Testnet (Chain ID: 968)              |
|                                                             |
|   +-----------------------------------------------------+   |
|   |                  RecipeDeck.sol                     |   |
|   |  - publishRecipe()      - likeRecipe() / unlike()   |   |
|   |  - getAllRecipes()      - removeRecipe()            |   |
|   |  - hasUserLiked()       - getPlatformStats()        |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

### 4.2 Data Structures
The core unit of state in `RecipeDeck.sol` is the `Recipe` struct:

```solidity
struct Recipe {
    uint256 id;
    address author;
    string title;
    string description;
    string category;
    string ingredients;
    string instructions;
    string imageUrl;
    uint256 timestamp;
    uint256 likesCount;
    bool exists;
    bool isDeleted;
}
```

### 4.3 On-Chain State & Mapping
* `mapping(uint256 => Recipe) private _recipes`: Primary storage for all recipes.
* `mapping(uint256 => mapping(address => bool)) private _hasLiked`: O(1) duplicate-like prevention mapping ensuring honest community metrics.
* `totalActiveRecipes` & `totalLikesCount`: Global counters enabling real-time macro analytics without expensive off-chain indexers.

### 4.4 Custom Reverts & Gas Efficiency
Instead of gas-heavy `require` strings, the smart contract utilizes custom errors:
- `RecipeNotFound()`
- `RecipeAlreadyDeleted()`
- `NotAuthor()`
- `EmptyTitle()`, `EmptyCategory()`, `EmptyIngredients()`, `EmptyInstructions()`
- `AlreadyLiked()`, `NotLikedYet()`

---

## 5. User Experience & Editorial Philosophy

RecipeDeck is styled like a timeless culinary periodical rather than a generic crypto dashboard:
- **Palette**: Terracotta Orange (`#E05326`), Natural Cream Paper (`#FAF6F0`, `#FFFDF9`), Editorial Charcoal (`#24201D`), and Subtle Golden Honey (`#D3A11C`).
- **Typography**: Playfair Display serif headings paired with clean, accessible sans-serif body type.
- **Interactive Kitchen Checklist**: Cooks can tick off ingredients on their screen in real-time as they prep meals.
- **Live Card Preview**: Authors see an exact visual card representation of their dish before spending gas on-chain.
- **Seamless Network Onboarding**: Automatic detection of chain status with one-click network addition/switching for Botchain Testnet (Chain ID 968).

---

## 6. Verification & Audit Trail

| Field | Detail |
|---|---|
| **Contract Name** | `RecipeDeck` |
| **Contract Address** | `0x18222C792493bb0593bbce49bF3b8CBE77CBe106` |
| **Compiler** | Solidity `0.8.20` with optimizer enabled (200 runs) |
| **EVM Version** | `paris` |
| **Block Explorer** | [BOHR Scan Verified Contract](https://scan.bohr.life/address/0x18222C792493bb0593bbce49bF3b8CBE77CBe106#code) |
| **Test Suite** | 11/11 automated unit tests passing across all functional paths |

---

## 7. Roadmap

### Phase 1: Genesis (Completed)
- [x] Solidity smart contract architecture and Hardhat test suite
- [x] Deployment and verification on Botchain Testnet (Chain ID 968)
- [x] Single-page responsive Next.js frontend with Wagmi v2
- [x] On-chain duplicate-proof liking, categorization, and author management

### Phase 2: Decentralized Media & Community (Q1 2027)
- [ ] Native IPFS / Arweave image uploads for 100% decentralized media storage
- [ ] Forkable recipes (allow cooks to branch a recipe with their own culinary variations while attributing the original author)
- [ ] Exportable printable recipe cards (PDF/Markdown format)

### Phase 3: Ecosystem Growth (Q2 2027)
- [ ] Multi-chain deployment across additional EVM networks
- [ ] Cook along mode with hands-free voice step advancement
- [ ] Community curated recipe collections and seasonal cookbooks
