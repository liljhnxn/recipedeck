# RecipeDeck 🍳
> **"Good Food. Shared Stories."**

RecipeDeck is a decentralized culinary archive and recipe-sharing platform where home cooks and professional chefs publish their favourite recipes and explore dishes shared by others on-chain on **Botchain Mainnet**.

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

## 🌐 Network Configuration: Botchain Mainnet

| Parameter | Value |
|---|---|
| **Network Name** | Botchain Mainnet |
| **Chain ID** | `677` |
| **Currency Symbol** | `BOT` |
| **Total Supply** | 150 Million |
| **BOT Chain Website** | [https://botchain.ai](https://botchain.ai) |
| **BOT Chain Explorer** | [https://scan.botchain.ai](https://scan.botchain.ai) |
| **Verified Contract** | [`0xE9cD49688af28A3DA5A33e30EcEe2D4A581B47BA`](https://scan.botchain.ai/address/0xE9cD49688af28A3DA5A33e30EcEe2D4A581B47BA#code) |
| **RPC Endpoint** | `https://rpc.botchain.ai` |

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
│   └── deploy.ts           # Hardhat deployment script for Botchain Mainnet
├── lib/
│   ├── chains.ts           # Botchain Mainnet viem chain definition
│   ├── contract.ts         # Contract ABI, types & default configuration
│   └── wagmi.ts            # Wagmi client configuration
├── hardhat.config.ts       # Hardhat network & compiler configuration
├── .env.example            # Environment variables template
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
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

Configure `.env`:
```env
BOTCHAIN_MAINNET_RPC_URL=https://rpc.botchain.ai
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_RECIPEDECK_ADDRESS=0xE9cD49688af28A3DA5A33e30EcEe2D4A581B47BA
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

---

## 🚢 Deploying to Botchain Mainnet

Deploy `RecipeDeck.sol` to Botchain Mainnet (Chain ID 677):
```bash
npm run deploy
```

---

## 💻 Running the Web Application

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
