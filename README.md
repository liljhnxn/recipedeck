# RecipeDeck 🍳
> **"Good Food. Shared Stories."**

RecipeDeck is a decentralized culinary archive and recipe-sharing platform where home cooks and professional chefs publish their favourite recipes and explore dishes shared by others on-chain.

Designed with the aesthetic elegance of an artisanal food magazine, RecipeDeck features warm terracotta orange, cream linen textures, deep editorial charcoal, and subtle golden honey accents.

---

## 🌟 Highlights & Architecture

- **Strict Single-Page Architecture**: Exactly one webpage (`app/page.tsx`).
- **Strict Single Smart Contract**: Exactly one Solidity contract (`contracts/RecipeDeck.sol`).
- **Pure Web3 Decentralization**: No backend, no central database, no off-chain APIs.
- **Zero Token Overhead**: No tokens, no NFTs, no paywalls.
- **Permanent On-Chain Storage**: Recipe titles, descriptions, categories, ingredients, step-by-step instructions, and likes are all stored directly on the blockchain.
- **Duplicate Like Protection**: Smart contract strictly prevents multiple likes from the same wallet address while supporting unliking.
- **Author Sovereignty**: Only original authors can remove their recipes from the on-chain directory.

---

## 🌐 Network Configuration: Botchain Testnet

| Parameter | Value |
|---|---|
| **Network Name** | Botchain Testnet (Bohr) |
| **Chain ID** | `968` |
| **Currency Symbol** | `BOHR` (or `BOT`) |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Block Explorer** | `https://scan.bohr.life` |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Web3 Layer**: [wagmi v2](https://wagmi.sh/), [viem](https://viem.sh/), [@tanstack/react-query](https://tanstack.com/query)
- **Smart Contracts**: [Solidity 0.8.20](https://soliditylang.org/), [Hardhat](https://hardhat.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom editorial magazine theme
- **Icons & Polish**: [lucide-react](https://lucide.dev/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 📂 Project Structure

```
Recipedeck/
├── app/
│   ├── globals.css         # Custom typography, magazine paper textures & themes
│   ├── layout.tsx          # Root layout with Wagmi & React Query providers
│   └── page.tsx            # The single-page application (All UI, modals, wallet state)
├── contracts/
│   └── RecipeDeck.sol      # The single Solidity smart contract
├── test/
│   └── RecipeDeck.test.ts  # Comprehensive automated contract test suite
├── scripts/
│   └── deploy.ts           # Hardhat deployment script for Botchain Testnet
├── lib/
│   ├── chains.ts           # Botchain Testnet viem chain definition
│   ├── contract.ts         # Contract ABI, types & default configuration
│   └── wagmi.ts            # Wagmi client configuration
├── hardhat.config.ts       # Hardhat network & compiler configuration
├── .env.example            # Environment variables template
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested up to Node 25)
- npm or pnpm
- MetaMask or any Injected Web3 Wallet

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your deployer private key:
```env
BOTCHAIN_RPC_URL=https://rpc.bohr.life
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_RECIPEDECK_ADDRESS=0x0000000000000000000000000000000000000000
```

---

## 🧪 Smart Contract Testing & Compilation

Compile the contract:
```bash
npm run compile
```

Run the automated test suite (11 unit tests covering all contract requirements):
```bash
npm test
```

### Verified Test Cases:
1. `should publish a recipe successfully and emit RecipePublished event`
2. `should revert if required fields are empty`
3. `should return all active recipes`
4. `should filter by author correctly`
5. `should allow a user to like a recipe and emit RecipeLiked event`
6. `should prevent duplicate likes from the same wallet`
7. `should allow unliking a previously liked recipe and emit RecipeUnliked event`
8. `should revert if unliking when not liked yet`
9. `should allow only the author to remove the recipe and emit RecipeRemoved`
10. `should revert if non-author tries to remove the recipe`
11. `should revert if trying to remove an already deleted recipe`

---

## 🚢 Deploying to Botchain Testnet

Deploy `RecipeDeck.sol` to Botchain Testnet (Chain ID 968):
```bash
npm run deploy
```

Upon successful deployment, the script outputs the deployed contract address and saves the details to `contracts-data/RecipeDeck-address.json`. Update `NEXT_PUBLIC_RECIPEDECK_ADDRESS` in your `.env` or set it directly in the frontend's built-in **Contract Configuration** modal.

---

## 💻 Running the Web Application

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Build for production:
```bash
npm run build
npm start
```

---

## 📖 Key User Journeys

1. **Connect Wallet**: Click "Connect Wallet" to link MetaMask. If connected to another network, an instant banner prompts one-click switching to Botchain Testnet (Chain ID 968).
2. **Publish Recipe**: Click "Publish Recipe", choose a category (Breakfast, Lunch, Dinner, Dessert, Vegetarian, Bakery, Beverages), write ingredients & steps, select a curated cover photo or custom URL, preview your card in real-time, and confirm the on-chain transaction.
3. **Explore & Filter**: Filter by category pills, search across ingredients/titles, toggle between "All Recipes" and "My Recipes", or sort by Newest, Most Liked, and Oldest.
4. **Interactive Cooking Details**: Click any recipe card to open the editorial view with interactive ingredient checkboxes (to check off items while preparing) and numbered step-by-step cooking instructions.
5. **Like / Unlike**: Click the heart button on cards or inside the details modal to appreciate dishes on-chain (duplicate likes prevented).
6. **Author Removal**: Authors can remove their recipes from the on-chain index with one click.

