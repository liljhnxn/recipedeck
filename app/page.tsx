"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import {
  ChefHat,
  Heart,
  Share2,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  BookOpen,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Flame,
  Utensils,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Info,
  Calendar,
  Layers,
  Award,
  Wallet,
  Settings,
  ArrowRight,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react";
import confetti from "canvas-confetti";
import { RECIPEDECK_ABI, FormattedRecipe, DEFAULT_CONTRACT_ADDRESS } from "@/lib/contract";
import { botchainMainnet } from "@/lib/chains";

// Curated Category list with thematic styling
const CATEGORIES = [
  { name: "All", label: "All Recipes", icon: Utensils },
  { name: "Breakfast", label: "Breakfast & Brunch", icon: Sparkles },
  { name: "Lunch", label: "Midday & Lunch", icon: Layers },
  { name: "Dinner", label: "Dinner & Feasts", icon: Flame },
  { name: "Dessert", label: "Pastry & Desserts", icon: Award },
  { name: "Vegetarian", label: "Green & Plant-Based", icon: Layers },
  { name: "Bakery", label: "Artisan Bakery", icon: BookOpen },
  { name: "Beverages", label: "Drinks & Elixirs", icon: Sparkles },
];

// Curated photo presets for users who want quick visuals for their recipes
const PHOTO_PRESETS = [
  {
    title: "Artisan Bread",
    url: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Handmade Pasta",
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Woodfired Pizza",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Citrus Garden Salad",
    url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Berry Tart",
    url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Matcha Latte",
    url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1000&q=80",
  },
];

interface ToastNotice {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  txHash?: string;
}

export default function RecipeDeckPage() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Smart Contract state & dynamic contract address
  const [contractAddress, setContractAddress] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recipedeck_contract_address");
      if (saved) return saved;
    }
    return DEFAULT_CONTRACT_ADDRESS;
  });

  const [recipes, setRecipes] = useState<FormattedRecipe[]>([]);
  const [userLikesMap, setUserLikesMap] = useState<Record<number, boolean>>({});
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Platform stats
  const [stats, setStats] = useState<{
    activeRecipes: number;
    totalLikes: number;
    totalPublishedEver: number;
  }>({ activeRecipes: 0, totalLikes: 0, totalPublishedEver: 0 });

  // Filtering & View state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [sortBy, setSortBy] = useState<"newest" | "likes" | "oldest">("newest");

  // Modals state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [selectedRecipe, setSelectedRecipe] = useState<FormattedRecipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  // Action states
  const [actionRecipeId, setActionRecipeId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Notifications
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // New Recipe Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "Dinner",
    description: "",
    ingredients: "",
    instructions: "",
    imageUrl: "",
  });
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  const isWrongNetwork = isConnected && chain?.id !== botchainMainnet.id;

  // Add notification toast
  const addToast = useCallback((type: "success" | "error" | "info", message: string, txHash?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, txHash }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to parse ingredients & instructions
  const parseList = (text: string): string[] => {
    if (!text) return [];
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  // Fetch all recipes & user likes from smart contract
  const fetchRecipesAndStats = useCallback(async () => {
    if (!publicClient || !contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      setIsLoadingRecipes(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setIsRefreshing(true);

      // Call getAllRecipes from smart contract
      const rawRecipes = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: RECIPEDECK_ABI,
        functionName: "getAllRecipes",
      })) as any[];

      // Format retrieved recipes
      const formatted: FormattedRecipe[] = (rawRecipes || []).map((r) => ({
        id: Number(r.id),
        author: r.author as `0x${string}`,
        title: r.title,
        description: r.description,
        category: r.category,
        ingredients: parseList(r.ingredients),
        instructions: parseList(r.instructions),
        rawIngredients: r.ingredients,
        rawInstructions: r.instructions,
        imageUrl: r.imageUrl || "",
        timestamp: Number(r.timestamp),
        likesCount: Number(r.likesCount),
      }));

      setRecipes(formatted);

      // Fetch platform stats
      try {
        const statsData = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: RECIPEDECK_ABI,
          functionName: "getPlatformStats",
        })) as [bigint, bigint, bigint];

        setStats({
          activeRecipes: Number(statsData[0]),
          totalLikes: Number(statsData[1]),
          totalPublishedEver: Number(statsData[2]),
        });
      } catch (err) {
        // Fallback calculation from formatted recipes
        const totalL = formatted.reduce((acc, curr) => acc + curr.likesCount, 0);
        setStats({
          activeRecipes: formatted.length,
          totalLikes: totalL,
          totalPublishedEver: formatted.length,
        });
      }

      // If user is connected, check their like status for each recipe
      if (address) {
        const likesMap: Record<number, boolean> = {};
        await Promise.all(
          formatted.map(async (recipe) => {
            try {
              const hasLiked = (await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: RECIPEDECK_ABI,
                functionName: "hasUserLiked",
                args: [BigInt(recipe.id), address],
              })) as boolean;
              likesMap[recipe.id] = hasLiked;
            } catch (e) {
              likesMap[recipe.id] = false;
            }
          })
        );
        setUserLikesMap(likesMap);
      }
    } catch (error: any) {
      console.warn("Could not fetch recipes from contract:", error);
    } finally {
      setIsLoadingRecipes(false);
      setIsRefreshing(false);
    }
  }, [publicClient, contractAddress, address]);

  // Initial fetch and on account change
  useEffect(() => {
    fetchRecipesAndStats();
  }, [fetchRecipesAndStats]);

  // Check network and switch to Botchain
  const handleSwitchToBotchain = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: botchainMainnet.id });
        addToast("info", "Switched to Botchain Mainnet (Chain ID 677)");
      } else if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${botchainMainnet.id.toString(16)}`,
              chainName: botchainMainnet.name,
              nativeCurrency: botchainMainnet.nativeCurrency,
              rpcUrls: botchainMainnet.rpcUrls.default.http,
              blockExplorerUrls: [botchainMainnet.blockExplorers.default.url],
            },
          ],
        });
      }
    } catch (err: any) {
      addToast("error", err?.message || "Failed to switch network.");
    }
  };

  // Publish a new recipe
  const handlePublishRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletClient || !address) {
      addToast("error", "Please connect your wallet first.");
      return;
    }

    if (isWrongNetwork) {
      addToast("error", "Please switch to Botchain Mainnet (Chain ID 677).");
      return;
    }

    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      addToast("error", "Smart contract address is not configured yet. Please configure it in Settings.");
      setIsConfigModalOpen(true);
      return;
    }

    if (!formData.title.trim()) {
      addToast("error", "Please enter a recipe title.");
      return;
    }
    if (!formData.ingredients.trim()) {
      addToast("error", "Please provide ingredients.");
      return;
    }
    if (!formData.instructions.trim()) {
      addToast("error", "Please provide cooking instructions.");
      return;
    }

    try {
      setIsPublishing(true);
      addToast("info", "Prompting wallet for confirmation...");

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: RECIPEDECK_ABI,
        functionName: "publishRecipe",
        args: [
          formData.title.trim(),
          formData.description.trim(),
          formData.category,
          formData.ingredients.trim(),
          formData.instructions.trim(),
          formData.imageUrl.trim(),
        ],
        account: address,
      });

      addToast("info", "Publishing recipe on Botchain...", hash);

      // Wait for transaction receipt
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#E05326", "#D3A11C", "#FAF1D0", "#3E3833"],
          });
          addToast("success", `"${formData.title}" is now published on-chain!`, hash);
          setIsPublishModalOpen(false);
          setFormData({
            title: "",
            category: "Dinner",
            description: "",
            ingredients: "",
            instructions: "",
            imageUrl: "",
          });
          // Refresh list
          fetchRecipesAndStats();
        } else {
          addToast("error", "Transaction reverted on-chain.");
        }
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      const msg = err?.shortMessage || err?.message || "Failed to publish recipe.";
      addToast("error", msg);
    } finally {
      setIsPublishing(false);
    }
  };

  // Like or Unlike a recipe
  const handleToggleLike = async (recipe: FormattedRecipe) => {
    if (!isConnected || !walletClient || !address) {
      addToast("error", "Connect your wallet to like recipes.");
      return;
    }

    if (isWrongNetwork) {
      addToast("error", "Please switch to Botchain Mainnet to interact.");
      return;
    }

    const hasLiked = userLikesMap[recipe.id] || false;
    const isLiking = !hasLiked;

    try {
      setActionRecipeId(recipe.id);

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: RECIPEDECK_ABI,
        functionName: isLiking ? "likeRecipe" : "unlikeRecipe",
        args: [BigInt(recipe.id)],
        account: address,
      });

      addToast("info", `${isLiking ? "Liking" : "Unliking"} "${recipe.title}"...`, hash);

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
          if (isLiking) {
            confetti({
              particleCount: 40,
              spread: 45,
              origin: { y: 0.7 },
              colors: ["#E05326", "#F97752"],
            });
            addToast("success", `Appreciated "${recipe.title}"! ❤️`, hash);
          } else {
            addToast("info", `Removed appreciation for "${recipe.title}".`, hash);
          }

          // Optimistically update & refetch
          setUserLikesMap((prev) => ({ ...prev, [recipe.id]: isLiking }));
          setRecipes((prev) =>
            prev.map((r) =>
              r.id === recipe.id
                ? {
                    ...r,
                    likesCount: isLiking ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
                  }
                : r
            )
          );
          if (selectedRecipe && selectedRecipe.id === recipe.id) {
            setSelectedRecipe((prev) =>
              prev
                ? {
                    ...prev,
                    likesCount: isLiking ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
                  }
                : null
            );
          }
          fetchRecipesAndStats();
        }
      }
    } catch (err: any) {
      console.error("Like error:", err);
      const msg = err?.shortMessage || err?.message || "Like transaction failed.";
      addToast("error", msg);
    } finally {
      setActionRecipeId(null);
    }
  };

  // Remove recipe (Author only)
  const handleRemoveRecipe = async (recipeId: number) => {
    if (!isConnected || !walletClient || !address) {
      addToast("error", "Connect your wallet.");
      return;
    }

    try {
      setIsDeleting(true);
      setActionRecipeId(recipeId);

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: RECIPEDECK_ABI,
        functionName: "removeRecipe",
        args: [BigInt(recipeId)],
        account: address,
      });

      addToast("info", "Removing recipe from on-chain directory...", hash);

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
          addToast("success", "Recipe successfully removed from RecipeDeck.", hash);
          setDeleteConfirmId(null);
          if (selectedRecipe?.id === recipeId) {
            setSelectedRecipe(null);
          }
          fetchRecipesAndStats();
        }
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      const msg = err?.shortMessage || err?.message || "Could not remove recipe.";
      addToast("error", msg);
    } finally {
      setIsDeleting(false);
      setActionRecipeId(null);
    }
  };

  // Filtered and sorted recipes
  const filteredRecipes = useMemo(() => {
    let result = [...recipes];

    // Author Tab filter
    if (activeTab === "my" && address) {
      result = result.filter(
        (r) => r.author.toLowerCase() === address.toLowerCase()
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (r) => r.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.rawIngredients.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "likes") {
        return b.likesCount - a.likesCount;
      }
      if (sortBy === "oldest") {
        return a.timestamp - b.timestamp;
      }
      return b.timestamp - a.timestamp; // newest
    });

    return result;
  }, [recipes, activeTab, address, selectedCategory, searchQuery, sortBy]);

  // Unique authors count
  const uniqueAuthorsCount = useMemo(() => {
    const authors = new Set(recipes.map((r) => r.author.toLowerCase()));
    return authors.size;
  }, [recipes]);

  // Format timestamp to readable date or relative time
  const formatTime = (ts: number): string => {
    if (!ts) return "Just now";
    const date = new Date(ts * 1000);
    const now = Date.now();
    const diffHours = (now - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Toggle ingredient checkbox in recipe details modal
  const toggleIngredientCheck = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-charcoal-800">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl shadow-magazine paper-card-elevated border-l-4 transition-all duration-300 animate-slide-in ${
              toast.type === "success"
                ? "border-emerald-600 bg-[#FCFDF9]"
                : toast.type === "error"
                ? "border-terracotta-600 bg-[#FFF9F7]"
                : "border-honey-500 bg-[#FCFAF6]"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-honey-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm">
              <p className="font-semibold text-charcoal-900 leading-snug">{toast.message}</p>
              {toast.txHash && (
                <a
                  href={`https://scan.botchain.ai/tx/${toast.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-medium text-terracotta-600 hover:text-terracotta-700 mt-1.5 underline underline-offset-2"
                >
                  View on Botchain Scan <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-charcoal-400 hover:text-charcoal-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Network Alert Banner if connected to wrong chain */}
      {isWrongNetwork && (
        <div className="bg-amber-500 text-charcoal-900 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-charcoal-950" />
              <span>
                You are currently connected to <strong>{chain?.name || "an unsupported network"}</strong>. RecipeDeck requires <strong>Botchain Mainnet (Chain ID 677)</strong>.
              </span>
            </div>
            <button
              onClick={handleSwitchToBotchain}
              className="ml-4 bg-charcoal-900 text-cream-50 hover:bg-charcoal-800 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm flex items-center space-x-1"
            >
              <span>Switch Chain</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Top Editorial Banner */}
      <div className="border-b border-cream-300/80 bg-cream-100/60 text-xs py-1.5 px-4 text-charcoal-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="editorial-badge bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded">
              MAINNET EDITION • VOL. 1
            </span>
            <span className="hidden sm:inline text-charcoal-500">•</span>
            <span className="hidden sm:inline font-medium tracking-wide">
              BOTCHAIN MAINNET (CHAIN ID 677)
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="hover:text-charcoal-900 flex items-center space-x-1 font-mono text-[11px]"
              title="Smart Contract Configuration"
            >
              <Settings className="w-3 h-3 text-terracotta-600" />
              <span>
                Contract:{" "}
                {contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000"
                  ? truncateAddress(contractAddress)
                  : "Not Configured"}
              </span>
            </button>
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-1 hover:text-charcoal-900 text-[11px]"
            >
              <span>botchain.ai</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-1 hover:text-charcoal-900 text-[11px]"
            >
              <span>scan.botchain.ai</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Magazine Header / Navbar */}
      <header className="sticky top-0 z-30 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-cream-300/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Tagline */}
            <div className="flex items-center space-x-4">
              <a href="#" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta-500 to-terracotta-700 flex items-center justify-center text-white shadow-md transform group-hover:scale-105 transition-transform duration-200">
                  <ChefHat className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900 group-hover:text-terracotta-600 transition-colors">
                    RecipeDeck
                  </h1>
                  <p className="text-[11px] sm:text-xs text-charcoal-500 tracking-wider uppercase font-medium">
                    Good Food. Shared Stories.
                  </p>
                </div>
              </a>
            </div>

            {/* Center Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-charcoal-700">
              <a
                href="#explore"
                className="hover:text-terracotta-600 transition-colors uppercase tracking-wider text-xs"
              >
                Explore Recipes
              </a>
              <a
                href="#categories"
                className="hover:text-terracotta-600 transition-colors uppercase tracking-wider text-xs"
              >
                Categories
              </a>
              <button
                onClick={() => {
                  setActiveTab("my");
                  const el = document.getElementById("explore");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`transition-colors uppercase tracking-wider text-xs flex items-center space-x-1 ${
                  activeTab === "my" ? "text-terracotta-600 font-bold" : "hover:text-terracotta-600"
                }`}
              >
                <span>My Recipes</span>
                {isConnected && address && (
                  <span className="bg-terracotta-100 text-terracotta-800 text-[10px] px-1.5 py-0.2 rounded-full">
                    {recipes.filter((r) => r.author.toLowerCase() === address.toLowerCase()).length}
                  </span>
                )}
              </button>
            </nav>

            {/* Actions: Publish Button & Wallet Connection */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (!isConnected) {
                    addToast("info", "Please connect your wallet first.");
                  } else if (isWrongNetwork) {
                    handleSwitchToBotchain();
                  } else {
                    setIsPublishModalOpen(true);
                  }
                }}
                className="hidden sm:inline-flex items-center space-x-2 bg-terracotta-600 hover:bg-terracotta-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Recipe</span>
              </button>

              {/* Wallet Button */}
              {!isConnected ? (
                <button
                  onClick={() => {
                    const injectedConnector = connectors.find((c) => c.name.toLowerCase().includes("metamask")) || connectors[0];
                    if (injectedConnector) {
                      connect({ connector: injectedConnector });
                    }
                  }}
                  disabled={isConnecting}
                  className="inline-flex items-center space-x-2 bg-charcoal-900 hover:bg-charcoal-800 text-cream-50 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-70"
                >
                  <Wallet className="w-4 h-4 text-honey-400" />
                  <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-cream-100 border border-cream-300 rounded-xl p-1.5 shadow-sm">
                  <div
                    onClick={() => copyToClipboard(address!)}
                    className="flex items-center space-x-2 px-2.5 py-1 rounded-lg hover:bg-cream-200 cursor-pointer transition-colors"
                    title="Click to copy address"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-subtle" />
                    <span className="font-mono text-xs font-semibold text-charcoal-800">
                      {truncateAddress(address!)}
                    </span>
                    {copiedAddress ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-charcoal-400" />
                    )}
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="text-charcoal-400 hover:text-terracotta-600 p-1.5 rounded-lg hover:bg-cream-200 transition-colors"
                    title="Disconnect Wallet"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Magazine Masthead */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-cream-300/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-terracotta-50 border border-terracotta-200/60 text-terracotta-800 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-600" />
              <span>Decentralized Culinary Commons</span>
            </div>

            <h2 className="font-serif-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-charcoal-900 leading-[1.15] mb-6">
              Discover Your Next <br />
              <span className="italic font-normal text-terracotta-600">Favourite Meal.</span>
            </h2>

            <p className="text-lg sm:text-xl text-charcoal-600 font-light leading-relaxed mb-8 max-w-2xl mx-auto">
              Good Food. Shared Stories. A community cookbook where recipes and culinary wisdom are permanently inscribed on-chain. Free from algorithms, ads, and lost traditions.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#explore"
                className="inline-flex items-center space-x-2 bg-charcoal-900 hover:bg-charcoal-800 text-cream-50 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4 text-honey-400" />
                <span>Explore Recipes</span>
              </a>
              <button
                onClick={() => {
                  if (!isConnected) {
                    addToast("info", "Connect wallet to publish a recipe.");
                  } else if (isWrongNetwork) {
                    handleSwitchToBotchain();
                  } else {
                    setIsPublishModalOpen(true);
                  }
                }}
                className="inline-flex items-center space-x-2 bg-[#FFFDF9] hover:bg-cream-100 text-charcoal-900 border border-cream-400 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow"
              >
                <Plus className="w-4 h-4 text-terracotta-600" />
                <span>Share a Recipe</span>
              </button>
            </div>
          </div>

          {/* Editorial Counter Stats Bar */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl paper-card">
            <div className="text-center p-3 border-r border-cream-200 last:border-none">
              <p className="font-serif-editorial text-3xl sm:text-4xl font-bold text-charcoal-900">
                {stats.activeRecipes}
              </p>
              <p className="text-xs uppercase tracking-wider text-charcoal-500 font-medium mt-1">
                Recipes On-Chain
              </p>
            </div>

            <div className="text-center p-3 border-r border-cream-200 last:border-none">
              <p className="font-serif-editorial text-3xl sm:text-4xl font-bold text-terracotta-600 flex items-center justify-center space-x-1">
                <span>{stats.totalLikes}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-charcoal-500 font-medium mt-1">
                Total Appreciations
              </p>
            </div>

            <div className="text-center p-3 border-r border-cream-200 last:border-none">
              <p className="font-serif-editorial text-3xl sm:text-4xl font-bold text-honey-600">
                {uniqueAuthorsCount}
              </p>
              <p className="text-xs uppercase tracking-wider text-charcoal-500 font-medium mt-1">
                Community Chefs
              </p>
            </div>

            <div className="text-center p-3">
              <div className="flex items-center justify-center space-x-1.5 text-emerald-600">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-subtle" />
                <span className="font-serif-editorial text-2xl sm:text-3xl font-bold">677</span>
              </div>
              <p className="text-xs uppercase tracking-wider text-charcoal-500 font-medium mt-1">
                Botchain Mainnet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Category Pills Navigation */}
        <section id="categories" className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif-editorial text-xl font-bold text-charcoal-900">
              Browse by Category
            </h3>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-medium">
              Curated Courses
            </span>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;
              const count =
                cat.name === "All"
                  ? recipes.length
                  : recipes.filter((r) => r.category.toLowerCase() === cat.name.toLowerCase()).length;

              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
                    isSelected
                      ? "bg-terracotta-600 text-white border-terracotta-600 shadow-sm"
                      : "bg-[#FFFDF9] text-charcoal-700 border-cream-300 hover:border-terracotta-400 hover:bg-cream-100"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-terracotta-600"}`} />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-terracotta-700 text-cream-100"
                        : "bg-cream-200 text-charcoal-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Explore & Filter Bar */}
        <section id="explore" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-300">
            {/* View Tabs */}
            <div className="flex items-center space-x-2 p-1 bg-cream-200/70 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                  activeTab === "all"
                    ? "bg-[#FFFDF9] text-charcoal-900 shadow-sm"
                    : "text-charcoal-600 hover:text-charcoal-900"
                }`}
              >
                All Recipes ({recipes.length})
              </button>
              <button
                onClick={() => {
                  if (!isConnected) {
                    addToast("info", "Connect your wallet to view your recipes.");
                  }
                  setActiveTab("my");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center space-x-1.5 ${
                  activeTab === "my"
                    ? "bg-[#FFFDF9] text-charcoal-900 shadow-sm"
                    : "text-charcoal-600 hover:text-charcoal-900"
                }`}
              >
                <span>My Recipes</span>
                {isConnected && address && (
                  <span className="text-[10px] bg-terracotta-100 text-terracotta-800 px-1.5 rounded-full font-mono">
                    {recipes.filter((r) => r.author.toLowerCase() === address.toLowerCase()).length}
                  </span>
                )}
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipes, ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#FFFDF9] border border-cream-300 rounded-xl text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center space-x-1.5 text-xs text-charcoal-600">
                <Filter className="w-3.5 h-3.5 text-charcoal-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#FFFDF9] border border-cream-300 rounded-xl px-3 py-2 text-xs font-medium text-charcoal-800 focus:outline-none focus:border-terracotta-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="likes">Most Liked</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchRecipesAndStats}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-[#FFFDF9] border border-cream-300 text-charcoal-600 hover:text-terracotta-600 hover:border-terracotta-400 transition-colors"
                title="Refresh Recipes from Smart Contract"
              >
                <RotateCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-terracotta-600" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Recipes Grid */}
        <section>
          {isLoadingRecipes ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-3 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-serif-editorial text-lg text-charcoal-800 font-medium">
                Reading culinary records from Botchain...
              </p>
              <p className="text-xs text-charcoal-500 mt-1">Accessing decentralized recipe registry</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto paper-card rounded-2xl p-8 border-dashed">
              <ChefHat className="w-12 h-12 text-terracotta-400 mx-auto mb-3" />
              <h4 className="font-serif-editorial text-xl font-bold text-charcoal-900 mb-2">
                {activeTab === "my"
                  ? "You haven't published any recipes yet"
                  : "No recipes found"}
              </h4>
              <p className="text-xs sm:text-sm text-charcoal-600 mb-6 leading-relaxed">
                {activeTab === "my"
                  ? "Share your signature culinary creation with food lovers across the globe."
                  : searchQuery
                  ? `No recipes matched your search for "${searchQuery}". Try a different keyword or category.`
                  : "Be the first pioneer to publish a recipe to this on-chain culinary archive!"}
              </p>
              <button
                onClick={() => {
                  if (!isConnected) {
                    addToast("info", "Connect your wallet to publish.");
                  } else if (isWrongNetwork) {
                    handleSwitchToBotchain();
                  } else {
                    setIsPublishModalOpen(true);
                  }
                }}
                className="inline-flex items-center space-x-2 bg-terracotta-600 hover:bg-terracotta-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Recipe Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRecipes.map((recipe) => {
                const isAuthor =
                  isConnected &&
                  address &&
                  recipe.author.toLowerCase() === address.toLowerCase();
                const hasLiked = userLikesMap[recipe.id] || false;
                const isProcessing = actionRecipeId === recipe.id;

                return (
                  <article
                    key={recipe.id}
                    className="group paper-card hover:paper-card-elevated rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1 relative"
                  >
                    {/* Card Image Banner */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-cream-200">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // fallback on image error
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cream-100 to-cream-200 text-charcoal-400 p-6 text-center">
                          <ChefHat className="w-10 h-10 text-terracotta-400/60 mb-2" />
                          <span className="font-serif-editorial text-sm italic text-charcoal-500">
                            {recipe.category}
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="editorial-badge bg-[#FAF6F0]/95 backdrop-blur-sm text-charcoal-800 px-2.5 py-1 rounded-md shadow-sm border border-cream-300/80">
                          {recipe.category}
                        </span>
                      </div>

                      {/* Author badge if own recipe */}
                      {isAuthor && (
                        <div className="absolute top-3 right-3">
                          <span className="editorial-badge bg-terracotta-600 text-white px-2 py-0.5 rounded shadow-sm">
                            Author (You)
                          </span>
                        </div>
                      )}

                      {/* Like Heart Button Floating */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(recipe);
                        }}
                        disabled={isProcessing}
                        className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md backdrop-blur-sm transition-all duration-200 flex items-center space-x-1 text-xs font-semibold ${
                          hasLiked
                            ? "bg-terracotta-600 text-white"
                            : "bg-[#FFFDF9]/90 hover:bg-white text-charcoal-700 hover:text-terracotta-600"
                        }`}
                        title={hasLiked ? "Unlike Recipe" : "Like Recipe"}
                      >
                        <Heart
                          className={`w-4 h-4 ${hasLiked ? "fill-current text-white" : ""}`}
                        />
                        <span className="font-mono text-[11px]">{recipe.likesCount}</span>
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Meta header: Author and Date */}
                        <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2.5">
                          <div className="flex items-center space-x-1.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-honey-400" />
                            <a
                              href={`https://scan.botchain.ai/address/${recipe.author}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-terracotta-600 transition-colors"
                              title={recipe.author}
                            >
                              {isAuthor ? "You" : truncateAddress(recipe.author)}
                            </a>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-charcoal-400" />
                            <span>{formatTime(recipe.timestamp)}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => {
                            setSelectedRecipe(recipe);
                            setCheckedIngredients({});
                          }}
                          className="font-serif-editorial text-xl font-bold text-charcoal-900 leading-snug group-hover:text-terracotta-600 transition-colors cursor-pointer mb-2 line-clamp-2"
                        >
                          {recipe.title}
                        </h4>

                        {/* Description Preview */}
                        <p className="text-xs sm:text-sm text-charcoal-600 line-clamp-2 leading-relaxed mb-4 font-light">
                          {recipe.description || "A delicious culinary creation prepared with love and shared on-chain."}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
                        <div className="text-xs text-charcoal-500">
                          <span className="font-medium text-charcoal-700">
                            {recipe.ingredients.length}
                          </span>{" "}
                          ingredients
                        </div>

                        <div className="flex items-center space-x-2">
                          {isAuthor && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(recipe.id);
                              }}
                              className="p-1.5 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Recipe"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRecipe(recipe);
                              setCheckedIngredients({});
                            }}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-terracotta-600 hover:text-terracotta-700 tracking-wider uppercase"
                          >
                            <span>Read Recipe</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-3xl paper-card-elevated rounded-3xl overflow-hidden my-8 shadow-2xl animate-scale-up">
            {/* Modal Header Image */}
            <div className="relative aspect-[21/9] sm:aspect-[21/8] bg-cream-300 overflow-hidden">
              {selectedRecipe.imageUrl ? (
                <img
                  src={selectedRecipe.imageUrl}
                  alt={selectedRecipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-cream-200 to-cream-300">
                  <ChefHat className="w-16 h-16 text-terracotta-500/40" />
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 p-2 bg-[#FAF6F0]/90 hover:bg-white rounded-full text-charcoal-800 shadow-md backdrop-blur-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Category chip */}
              <div className="absolute bottom-4 left-6">
                <span className="editorial-badge bg-[#FAF6F0]/95 backdrop-blur-sm text-charcoal-900 px-3 py-1 rounded-md shadow-sm border border-cream-300">
                  {selectedRecipe.category}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-cream-200">
                <div>
                  <h3 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-charcoal-900 leading-tight mb-2">
                    {selectedRecipe.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-500">
                    <span className="flex items-center space-x-1">
                      <span>Shared by</span>
                      <a
                        href={`https://scan.botchain.ai/address/${selectedRecipe.author}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-terracotta-600 hover:underline font-semibold"
                      >
                        {truncateAddress(selectedRecipe.author)}
                      </a>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{new Date(selectedRecipe.timestamp * 1000).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-xs">Recipe #{selectedRecipe.id}</span>
                  </div>
                </div>

                {/* Like Button in Modal */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleLike(selectedRecipe)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm ${
                      userLikesMap[selectedRecipe.id]
                        ? "bg-terracotta-600 text-white"
                        : "bg-cream-100 text-charcoal-800 hover:bg-cream-200 border border-cream-300"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        userLikesMap[selectedRecipe.id] ? "fill-current text-white" : "text-terracotta-600"
                      }`}
                    />
                    <span>{selectedRecipe.likesCount} Likes</span>
                  </button>

                  {/* Author Delete Action */}
                  {isConnected &&
                    address &&
                    selectedRecipe.author.toLowerCase() === address.toLowerCase() && (
                      <button
                        onClick={() => setDeleteConfirmId(selectedRecipe.id)}
                        className="p-2 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove this recipe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>

              {/* Story / Description */}
              {selectedRecipe.description && (
                <div className="mb-8 p-4 bg-cream-100/70 border-l-3 border-terracotta-500 rounded-r-xl italic font-serif-editorial text-charcoal-700 leading-relaxed text-sm sm:text-base">
                  &ldquo;{selectedRecipe.description}&rdquo;
                </div>
              )}

              {/* Two column layout: Ingredients & Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Ingredients Column */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-cream-200">
                    <h4 className="font-serif-editorial text-lg font-bold text-charcoal-900 flex items-center space-x-2">
                      <Utensils className="w-4 h-4 text-terracotta-600" />
                      <span>Ingredients</span>
                    </h4>
                    <span className="text-xs text-charcoal-500 font-medium">
                      {selectedRecipe.ingredients.length} items
                    </span>
                  </div>

                  <ul className="space-y-2.5">
                    {selectedRecipe.ingredients.map((ingr, idx) => {
                      const isChecked = !!checkedIngredients[idx];
                      return (
                        <li
                          key={idx}
                          onClick={() => toggleIngredientCheck(idx)}
                          className={`flex items-start space-x-2.5 text-xs sm:text-sm cursor-pointer select-none p-2 rounded-lg transition-colors ${
                            isChecked
                              ? "bg-cream-100 line-through text-charcoal-400"
                              : "hover:bg-cream-100 text-charcoal-800"
                          }`}
                        >
                          <div className="mt-0.5 text-terracotta-600 flex-shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 text-cream-500" />
                            )}
                          </div>
                          <span>{ingr}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Instructions Column */}
                <div className="md:col-span-3">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-cream-200">
                    <h4 className="font-serif-editorial text-lg font-bold text-charcoal-900 flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-terracotta-600" />
                      <span>Preparation & Cooking</span>
                    </h4>
                    <span className="text-xs text-charcoal-500 font-medium">
                      {selectedRecipe.instructions.length} steps
                    </span>
                  </div>

                  <ol className="space-y-4">
                    {selectedRecipe.instructions.map((step, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm">
                        <div className="w-6 h-6 rounded-full bg-cream-200 text-charcoal-800 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 text-charcoal-700 leading-relaxed font-light">
                          {step}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-cream-100 border-t border-cream-200 flex items-center justify-between">
              <a
                href={`https://scan.botchain.ai/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-charcoal-500 hover:text-charcoal-800 flex items-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-terracotta-600" />
                <span>Verified on Botchain Explorer</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>

              <button
                onClick={() => setSelectedRecipe(null)}
                className="bg-charcoal-900 hover:bg-charcoal-800 text-cream-50 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md paper-card-elevated rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-serif-editorial text-xl font-bold text-charcoal-900 text-center mb-2">
              Remove this Recipe?
            </h4>
            <p className="text-xs sm:text-sm text-charcoal-600 text-center mb-6 leading-relaxed">
              This action will permanently mark recipe #{deleteConfirmId} as removed from the decentralized directory. Only you (the original author) can execute this.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-cream-400 text-xs font-semibold text-charcoal-700 hover:bg-cream-100 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveRecipe(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors uppercase tracking-wider shadow-sm flex items-center justify-center space-x-1"
              >
                {isDeleting ? <span>Removing...</span> : <span>Confirm Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Recipe Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl paper-card-elevated rounded-3xl overflow-hidden my-6 shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="p-6 bg-cream-100 border-b border-cream-200 flex items-center justify-between">
              <div>
                <span className="editorial-badge bg-terracotta-600 text-white px-2 py-0.5 rounded">
                  NEW CONTRIBUTION
                </span>
                <h3 className="font-serif-editorial text-2xl font-bold text-charcoal-900 mt-1">
                  Publish Your Recipe
                </h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-800 rounded-lg hover:bg-cream-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode switch: Form or Live Preview */}
            <div className="px-6 pt-3 bg-cream-50 border-b border-cream-200 flex space-x-4">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  !previewMode
                    ? "border-terracotta-600 text-terracotta-600"
                    : "border-transparent text-charcoal-500 hover:text-charcoal-800"
                }`}
              >
                Edit Recipe
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-1 ${
                  previewMode
                    ? "border-terracotta-600 text-terracotta-600"
                    : "border-transparent text-charcoal-500 hover:text-charcoal-800"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Card Preview</span>
              </button>
            </div>

            {/* Form Body or Preview */}
            <form onSubmit={handlePublishRecipe}>
              <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
                {!previewMode ? (
                  <>
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                        Recipe Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rustic Sourdough Boule with Roasted Garlic"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta-500 cursor-pointer"
                      >
                        {CATEGORIES.filter((c) => c.name !== "All").map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.label} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description / Story */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                        Story or Culinary Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Tell the story behind this dish or special tips for success..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                      />
                    </div>

                    {/* Ingredients */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                          Ingredients *
                        </label>
                        <span className="text-[11px] text-charcoal-500">One per line</span>
                      </div>
                      <textarea
                        rows={4}
                        required
                        placeholder="500g Bread Flour&#10;350ml Warm Filtered Water&#10;100g Active Leaven&#10;10g Sea Salt"
                        value={formData.ingredients}
                        onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm font-mono text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                      />
                    </div>

                    {/* Instructions */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                          Cooking Instructions *
                        </label>
                        <span className="text-[11px] text-charcoal-500">One step per line</span>
                      </div>
                      <textarea
                        rows={4}
                        required
                        placeholder="1. Combine flour and water for a 1-hour autolyse.&#10;2. Fold in active leaven and salt thoroughly.&#10;3. Perform 4 sets of stretch and folds over 3 hours.&#10;4. Shape and bake in a preheated Dutch oven at 230°C."
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                      />
                    </div>

                    {/* Image URL & Quick Presets */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                        Recipe Cover Image (URL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 mb-2"
                      />

                      {/* Quick Photo Presets */}
                      <div className="mt-2">
                        <span className="text-[11px] text-charcoal-500 block mb-1.5">
                          Or click a curated photo suggestion:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PHOTO_PRESETS.map((preset) => (
                            <button
                              type="button"
                              key={preset.title}
                              onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                                formData.imageUrl === preset.url
                                  ? "bg-terracotta-100 border-terracotta-400 text-terracotta-800 font-semibold"
                                  : "bg-cream-100 border-cream-300 text-charcoal-700 hover:bg-cream-200"
                              }`}
                            >
                              {preset.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Live Preview Tab */
                  <div className="max-w-md mx-auto">
                    <p className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold mb-3 text-center">
                      Live Recipe Card Preview
                    </p>
                    <div className="paper-card rounded-2xl overflow-hidden shadow-lg border">
                      <div className="relative aspect-[16/10] bg-cream-200 overflow-hidden">
                        {formData.imageUrl ? (
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-charcoal-400">
                            <ChefHat className="w-12 h-12 text-terracotta-400/60 mb-2" />
                            <span className="font-serif-editorial text-sm italic">
                              {formData.category}
                            </span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 editorial-badge bg-[#FAF6F0]/95 text-charcoal-800 px-2.5 py-1 rounded-md shadow-sm border border-cream-300">
                          {formData.category}
                        </span>
                      </div>
                      <div className="p-5">
                        <h4 className="font-serif-editorial text-xl font-bold text-charcoal-900 mb-2">
                          {formData.title || "Untitled Recipe"}
                        </h4>
                        <p className="text-xs text-charcoal-600 line-clamp-2 mb-4">
                          {formData.description || "No description provided yet."}
                        </p>
                        <div className="text-xs text-charcoal-500 pt-3 border-t border-cream-200 flex justify-between">
                          <span>
                            {parseList(formData.ingredients).length} ingredients
                          </span>
                          <span className="text-terracotta-600 font-semibold">
                            Botchain On-Chain
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="p-6 bg-cream-100 border-t border-cream-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2.5 text-xs uppercase tracking-wider font-semibold text-charcoal-600 hover:text-charcoal-900 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Inscribing On-Chain...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-honey-300" />
                      <span>Publish to RecipeDeck</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Configuration & Settings Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg paper-card-elevated rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-200">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-terracotta-600" />
                <h4 className="font-serif-editorial text-xl font-bold text-charcoal-900">
                  Contract Configuration
                </h4>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-charcoal-700 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                  RecipeDeck Contract Address (Botchain Mainnet)
                </label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value.trim())}
                  className="w-full px-3 py-2 font-mono text-xs bg-white border border-cream-300 rounded-xl text-charcoal-900 focus:outline-none focus:border-terracotta-500"
                  placeholder="0x..."
                />
              </div>

              <div className="p-3 bg-cream-100 rounded-xl space-y-1.5 text-xs text-charcoal-600">
                <div className="flex justify-between">
                  <span className="font-medium">Network:</span>
                  <span>Botchain Mainnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Chain ID:</span>
                  <span>677</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Native Token:</span>
                  <span>BOT</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">RPC Endpoint:</span>
                  <span>https://rpc.botchain.ai</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Block Explorer:</span>
                  <a
                    href="https://scan.botchain.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta-600 underline"
                  >
                    scan.botchain.ai
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("recipedeck_contract_address", contractAddress);
                  }
                  setIsConfigModalOpen(false);
                  addToast("success", "Contract address updated!");
                  fetchRecipesAndStats();
                }}
                className="bg-charcoal-900 hover:bg-charcoal-800 text-cream-50 px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial & BOT Chain Ecosystem Footer */}
      <footer className="border-t border-cream-300 bg-cream-100/90 py-14 mt-20 text-charcoal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-cream-300">
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta-600 flex items-center justify-center text-white shadow-sm">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-serif-editorial text-xl font-bold text-charcoal-900">
                    RecipeDeck
                  </span>
                  <p className="text-xs text-charcoal-500 font-medium">Good Food. Shared Stories.</p>
                </div>
              </div>
              <p className="text-xs text-charcoal-600 leading-relaxed font-light">
                A decentralized, sovereign culinary commons where recipes, ingredients, and appreciations are permanently inscribed on-chain.
              </p>
            </div>

            {/* BOT Chain Ecosystem Column (Official Ecosystem Badge & Links) */}
            <div className="space-y-3 p-4 rounded-2xl bg-cream-50/80 border border-cream-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-xs shadow-sm tracking-wider">
                  BOT
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
                    BOT Chain Ecosystem
                  </h5>
                  <p className="text-[11px] text-charcoal-500">Native Layer-1 Network (Chain ID 677)</p>
                </div>
              </div>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                RecipeDeck operates natively on the BOT Chain blockchain.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 text-xs">
                <a
                  href="https://botchain.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>BOT Chain website</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <a
                  href="https://scan.botchain.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 font-semibold text-terracotta-700 hover:text-terracotta-800 bg-terracotta-50 hover:bg-terracotta-100/80 border border-terracotta-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>BOT Chain explorer</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>

            {/* Smart Contract & Network Verification */}
            <div className="space-y-3 md:text-right flex flex-col md:items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-800 mb-1">
                  On-Chain Provenance
                </p>
                <p className="font-mono text-xs text-charcoal-600">
                  Contract:{" "}
                  <a
                    href={`https://scan.botchain.ai/address/${contractAddress}#code`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta-600 underline font-semibold hover:text-terracotta-700"
                  >
                    {truncateAddress(contractAddress)}
                  </a>
                </p>
                <p className="text-[11px] text-charcoal-500 mt-1">
                  Zero servers • Zero databases • 100% On-Chain
                </p>
              </div>

              <div className="text-xs text-charcoal-500">
                <span>© {new Date().getFullYear()} RecipeDeck. Open Culinary Heritage.</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-500 gap-3">
            <div className="flex items-center space-x-4">
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-charcoal-800 underline underline-offset-2"
              >
                https://botchain.ai
              </a>
              <span>•</span>
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-charcoal-800 underline underline-offset-2"
              >
                https://scan.botchain.ai
              </a>
            </div>
            <div>
              <span>Botchain Mainnet (Chain ID 677)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

