"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import {
  Search,
  Briefcase,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
  ChevronDown,
  Globe,
  RotateCcw,
} from "lucide-react";
import BorderGlow from "@/components/ui/BorderGlow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Types matching scraped data structure
interface NiceItem {
  name_id: string;
  name_en: string;
  classId?: string; // Attached during global searches
}

interface NiceClass {
  class_id: number;
  description: string;
  items: NiceItem[];
}

export default function BrandClassificationPage() {
  const { language } = useLanguage();

  // Component local states
  const [classesData, setClassesData] = useState<Record<
    string,
    NiceClass
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeClass, setActiveClass] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearch, setGlobalSearch] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Debounce search input to prevent UI freeze on large datasets
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Multilingual local UI translations
  const localUI = {
    en: {
      pageTitle: "Brand Classification",
      pageDesc:
        "Identify and classify for your trademark application. Search across all classes to find the perfect matches.",
      searchPlaceholder: "Search goods or services in Indonesian or English...",
      globalSearchToggle: "Search Across All 45 Classes",
      classDescHeader: "Class Description",
      goodsSection: "Goods (Classes 1 - 34)",
      servicesSection: "Services (Classes 35 - 45)",
      tableColClass: "Class",
      tableColNameId: "Goods/Services Name (ID)",
      tableColNameEn: "Goods/Services Name (EN)",
      noResults: "No matching goods or services found.",
      searchTip:
        "Try typing a different keyword (e.g., 'kopi', 'software', 'hukum', 'delivery').",
      loadingText: "Loading classification database...",
      errorText: "Failed to load database. Please try again.",
      totalResults: "Found {count} matches",
      sourceLabel: "MCS Intellectual Property Services",
      classTab: "Class {id}",
      resultsHeader: "Classification Results",
    },
    id: {
      pageTitle: "Klasifikasi Merek",
      pageDesc:
        "Identifikasi dan klasifikasikan kelas Nice yang tepat untuk permohonan merek Anda. Cari di semua kelas untuk menemukan kecocokan yang sempurna.",
      searchPlaceholder:
        "Cari barang atau jasa dalam Bahasa Indonesia atau Inggris...",
      globalSearchToggle: "Cari di Seluruh 45 Kelas",
      classDescHeader: "Deskripsi Kelas",
      goodsSection: "Barang (Kelas 1 - 34)",
      servicesSection: "Jasa (Kelas 35 - 45)",
      tableColClass: "Kelas",
      tableColNameId: "Nama Barang/Jasa (ID)",
      tableColNameEn: "Nama Barang/Jasa (EN)",
      noResults: "Barang atau jasa tidak ditemukan.",
      searchTip:
        "Coba ketik kata kunci lain (misalnya, 'kopi', 'software', 'hukum', 'pengiriman').",
      loadingText: "Memuat database klasifikasi...",
      errorText: "Gagal memuat database. Silakan coba lagi.",
      totalResults: "Menampilkan {count} kecocokan",
      sourceLabel: "Layanan Kekayaan Intelektual MCS",
      classTab: "Kelas {id}",
      resultsHeader: "Hasil Klasifikasi",
    },
    cn: {
      pageTitle: "商标分类",
      pageDesc:
        "识别并归类您的商标申请所需的尼斯分类。在所有 45 个类别中进行搜索以找到最匹配的类别。",
      searchPlaceholder: "用印尼语或英语搜索商品或服务...",
      globalSearchToggle: "在全部 45 个类别中搜索",
      classDescHeader: "类别描述",
      goodsSection: "商品 (第 1 - 34 类)",
      servicesSection: "服务 (第 35 - 45 类)",
      tableColClass: "类别",
      tableColNameId: "商品/服务名称 (印尼语)",
      tableColNameEn: "商品/服务名称 (英语)",
      noResults: "未找到匹配的商品或服务。",
      searchTip:
        "尝试输入其他关键词（例如：'kopi'、'software'、'hukum'、'delivery'）。",
      loadingText: "正在加载分类数据库...",
      errorText: "加载数据库失败。请重试。",
      totalResults: "找到 {count} 个匹配项",
      sourceLabel: "MCS 知识产权服务",
      classTab: "第 {id} 类",
      resultsHeader: "分类结果",
    },
  };

  // Fallback to active language, otherwise English
  const ui = localUI[language] || localUI.en;

  // Load classification data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const response = await fetch("/nice_classes.json");
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        const data = await response.json();
        setClassesData(data);
      } catch (err: any) {
        console.error("Error fetching Nice classes:", err);
        setError(err.message || "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Reset pagination when active class or search configurations change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeClass, debouncedQuery, globalSearch]);

  const isFirstRender = useRef(true);

  // Scroll to top of table on page switch
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window !== "undefined" && !isLoading) {
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  }, [currentPage]);

  // Split classes list into Goods (1-34) and Services (35-45)
  const classList = useMemo(() => {
    if (!classesData) return { goods: [], services: [] };
    const sortedKeys = Object.keys(classesData).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );

    const goods: { id: string; desc: string }[] = [];
    const services: { id: string; desc: string }[] = [];

    sortedKeys.forEach((key) => {
      const cls = classesData[key];
      const item = { id: key, desc: cls.description };
      if (cls.class_id <= 34) {
        goods.push(item);
      } else {
        services.push(item);
      }
    });

    return { goods, services };
  }, [classesData]);

  // Pre-compute global items pool (only depends on classesData)
  const globalItemsPool = useMemo(() => {
    if (!classesData) return [];
    const pool: NiceItem[] = [];
    Object.keys(classesData).forEach((key) => {
      const cls = classesData[key];
      cls.items.forEach((item) => {
        pool.push({ ...item, classId: key });
      });
    });
    return pool;
  }, [classesData]);

  // Search Engine & Relevance Ranking (uses debounced query)
  const filteredItems = useMemo(() => {
    if (!classesData) return [];
    const query = debouncedQuery.trim().toLowerCase();

    // 1. Gather raw pool of items based on scope
    let itemsPool: NiceItem[];
    if (globalSearch) {
      itemsPool = globalItemsPool;
    } else {
      const cls = classesData?.[activeClass];
      if (cls) {
        itemsPool = cls.items.map((item) => ({ ...item, classId: activeClass }));
      } else {
        itemsPool = [];
      }
    }

    if (!query) return itemsPool;

    // 2. Filter and rank matches
    const filtered = itemsPool.filter((item) => {
      return (
        item.name_id.toLowerCase().includes(query) ||
        item.name_en.toLowerCase().includes(query)
      );
    });

    // 3. Relevancy ranking logic
    // Match Priority:
    // Prio 1: Exact matches or starts with the query in either Indonesian or English
    // Prio 2: Matches on a word boundary (e.g. " kopi" or " coffee")
    // Prio 3: Middle of word match (e.g. "mengopikan")
    return filtered.sort((a, b) => {
      const aId = a.name_id.toLowerCase();
      const aEn = a.name_en.toLowerCase();
      const bId = b.name_id.toLowerCase();
      const bEn = b.name_en.toLowerCase();

      const aStartsId = aId.startsWith(query);
      const aStartsEn = aEn.startsWith(query);
      const bStartsId = bId.startsWith(query);
      const bStartsEn = bEn.startsWith(query);

      // Both start with keyword
      if ((aStartsId || aStartsEn) && !(bStartsId || bStartsEn)) return -1;
      if (!(aStartsId || aStartsEn) && (bStartsId || bStartsEn)) return 1;

      // Word boundary match: e.g. " kopi" or " coffee"
      const wordBoundaryRegex = new RegExp(`\\b${query}`);
      const aWordBoundary =
        wordBoundaryRegex.test(aId) || wordBoundaryRegex.test(aEn);
      const bWordBoundary =
        wordBoundaryRegex.test(bId) || wordBoundaryRegex.test(bEn);

      if (aWordBoundary && !bWordBoundary) return -1;
      if (!aWordBoundary && bWordBoundary) return 1;

      // Default alphabetically or original indexing stability
      return aId.localeCompare(bId);
    });
  }, [classesData, debouncedQuery, globalSearch, activeClass, globalItemsPool]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  return (
    <main className="flex-grow relative z-10 flex flex-col text-foreground min-h-screen">
      {/* Hero Header Section */}
      <section className="pt-8 pb-6 md:pt-12 md:pb-8 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-5xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6 text-sm font-semibold text-primary backdrop-blur-md"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              {ui.sourceLabel}
            </motion.div>
            <h1 className="mb-4 text-4xl md:text-6xl font-extrabold tracking-tight font-sans">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent">
                {ui.pageTitle}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-normal leading-relaxed">
              {ui.pageDesc}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Database & Interface Section */}
      <section className="pb-24 flex-grow container mx-auto px-4">
        {isLoading ? (
          /* Loading State with Skeletal UI */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto h-[600px]">
            <Card className="col-span-1 bg-white/40 dark:bg-background/50 backdrop-blur-md p-6 h-full hidden md:block border border-border/50 dark:border-white/20">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                <div className="space-y-2 pt-4">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="col-span-1 md:col-span-3 bg-white/40 dark:bg-background/50 backdrop-blur-md p-8 h-full flex flex-col justify-center items-center border border-border/50 dark:border-white/20">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-zinc-500 dark:text-muted-foreground font-medium text-lg animate-pulse">
                {ui.loadingText}
              </p>
            </Card>
          </div>
        ) : error || !classesData ? (
          /* Error State */
          <div className="max-w-md mx-auto text-center py-20">
            <RotateCcw
              className="h-12 w-12 text-destructive mx-auto mb-4 cursor-pointer hover:rotate-180 transition-all duration-300"
              onClick={() => window.location.reload()}
            />
            <p className="text-xl font-semibold mb-2">{ui.errorText}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry Loading
            </Button>
          </div>
        ) : (
          /* Main Interactive Workspace Grid */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-start">
            {/* Sidebar Left Column: Nice Classes Nav Tabs */}
            <aside className="lg:col-span-1 hidden lg:block sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="space-y-6">
                {/* Goods Category */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 px-3">
                    {ui.goodsSection}
                  </h3>
                  <div className="space-y-1">
                    {classList.goods.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          setActiveClass(cls.id);
                          setGlobalSearch(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group ${activeClass === cls.id && !globalSearch
                            ? "bg-primary/10 border-l-2 border-primary text-primary font-semibold"
                            : "text-zinc-600 dark:text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-foreground"
                          }`}
                      >
                        <span className="truncate pr-2">
                          {ui.classTab.replace("{id}", cls.id.padStart(2, "0"))}{" "}
                          - {cls.desc}
                        </span>
                        <Package
                          className={`h-4.5 w-4.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${activeClass === cls.id && !globalSearch ? "text-primary opacity-100" : ""}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services Category */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary/80 mb-3 px-3">
                    {ui.servicesSection}
                  </h3>
                  <div className="space-y-1">
                    {classList.services.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          setActiveClass(cls.id);
                          setGlobalSearch(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group ${activeClass === cls.id && !globalSearch
                            ? "bg-primary/10 border-l-2 border-primary text-primary font-semibold"
                            : "text-zinc-600 dark:text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-foreground"
                          }`}
                      >
                        <span className="truncate pr-2">
                          {ui.classTab.replace("{id}", cls.id)} - {cls.desc}
                        </span>
                        <Briefcase
                          className={`h-4.5 w-4.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${activeClass === cls.id && !globalSearch ? "text-primary opacity-100" : ""}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Adaptive Navigation controls */}
            <div className="lg:hidden block space-y-4 col-span-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <select
                    value={activeClass}
                    onChange={(e) => {
                      setActiveClass(e.target.value);
                      setGlobalSearch(false);
                    }}
                    disabled={globalSearch}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 pl-4 pr-10 text-sm font-semibold focus:outline-none focus:border-primary text-zinc-900 dark:text-foreground disabled:opacity-40"
                  >
                    <optgroup label={ui.goodsSection}>
                      {classList.goods.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {ui.classTab.replace("{id}", cls.id.padStart(2, "0"))}{" "}
                          - {cls.desc.substring(0, 50)}...
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={ui.servicesSection}>
                      {classList.services.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {ui.classTab.replace("{id}", cls.id)} -{" "}
                          {cls.desc.substring(0, 50)}...
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Main Interactive Table Column */}
            <div className="col-span-1 lg:col-span-3 space-y-6">
              {/* Active Class Header Card */}
              {!globalSearch && classesData?.[activeClass] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={activeClass}
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor="220 80 80"
                    backgroundColor="transparent"
                    borderRadius={16}
                    glowRadius={120}
                    glowIntensity={0.8}
                  >
                    <Card className="bg-white/50 dark:bg-background/40 border border-border/50 dark:border-white/20 backdrop-blur-md p-6 relative overflow-hidden w-full shadow-sm dark:shadow-none">
                      <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          {parseInt(activeClass) <= 34 ? (
                            <Package className="h-6 w-6 text-primary" />
                          ) : (
                            <Briefcase className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
                            {parseInt(activeClass) <= 34
                              ? ui.goodsSection.split(" (")[0]
                              : ui.servicesSection.split(" (")[0]}
                          </span>
                          <h2 className="text-2xl font-bold font-sans mt-0.5 mb-2">
                            {ui.classTab.replace("{id}", activeClass)}
                          </h2>
                          <h4 className="text-sm font-semibold text-primary/80 mb-1">
                            {ui.classDescHeader}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {classesData?.[activeClass]?.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </BorderGlow>
                </motion.div>
              )}

              {/* Global search activated card */}
              {globalSearch && (
                <BorderGlow
                  edgeSensitivity={30}
                  glowColor="220 80 80"
                  backgroundColor="transparent"
                  borderRadius={16}
                  glowRadius={120}
                  glowIntensity={0.8}
                >
                  <Card className="bg-white/50 dark:bg-background/40 border border-border/50 dark:border-white/20 backdrop-blur-md p-6 relative overflow-hidden w-full shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <Globe className="h-6 w-6 text-primary animate-pulse" />
                      </div>
                      <div>
                        <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
                          {ui.globalSearchToggle}
                        </span>
                        <h2 className="text-2xl font-bold font-sans mt-0.5">
                          {ui.resultsHeader}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          Searching across all 45 Nice classes simultaneously.
                          Results sorted by relevancy.
                        </p>
                      </div>
                    </div>
                  </Card>
                </BorderGlow>
              )}

              {/* Search Bar & Scopes Controls */}
              <BorderGlow
                edgeSensitivity={20}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={12}
                glowRadius={100}
                glowIntensity={0.8}
                colors={["#ef4444", "#3b82f6"]}
              >
                <div className="bg-white/70 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-md rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-xs">
                  {/* Search box input */}
                  <div className="relative w-full flex-grow">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={ui.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary text-zinc-900 dark:text-foreground placeholder:text-zinc-500 dark:placeholder:text-muted-foreground shadow-inner focus:bg-white dark:focus:bg-zinc-900/80 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-3 text-zinc-500 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-foreground"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              </BorderGlow>

              {/* Classification Results Data Table */}
              <BorderGlow
                edgeSensitivity={30}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={16}
                glowRadius={150}
                glowIntensity={0.8}
              >
                <Card className="bg-white/50 dark:bg-background/40 border border-border/50 dark:border-white/20 backdrop-blur-md overflow-hidden w-full shadow-sm dark:shadow-none">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-500 dark:text-muted-foreground">
                      {ui.totalResults.replace(
                        "{count}",
                        filteredItems.length.toLocaleString(),
                      )}
                    </span>
                  </div>

                  {filteredItems.length === 0 ? (
                    /* Zero State Result Display */
                    <div className="text-center py-16 px-4">
                      <Search className="h-12 w-12 text-zinc-300 dark:text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-lg font-bold text-zinc-900 dark:text-foreground mb-1">
                        {ui.noResults}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {ui.searchTip}
                      </p>
                    </div>
                  ) : (
                    /* Responsive Table Content */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-950/40 text-zinc-700 dark:text-muted-foreground font-bold">
                            {globalSearch && (
                              <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs w-16">
                                {ui.tableColClass}
                              </th>
                            )}
                            <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs w-[50%]">
                              {ui.tableColNameId}
                            </th>
                            <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs w-[50%]">
                              {ui.tableColNameEn}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedItems.map((item, index) => {
                            const itemClass = item.classId || activeClass;

                            return (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                  duration: 0.15,
                                  delay: Math.min(index * 0.015, 0.3),
                                }}
                                className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors group"
                              >
                                {globalSearch && (
                                  <td className="py-4 px-4 font-bold shrink-0">
                                    <span
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800/80 text-zinc-900 dark:text-foreground border border-zinc-200 dark:border-zinc-700/50 text-xs shadow-sm font-sans"
                                      title={
                                        classesData?.[itemClass]?.description ||
                                        ""
                                      }
                                    >
                                      {itemClass}
                                    </span>
                                  </td>
                                )}
                                <td className="py-4 px-4 text-zinc-800 dark:text-foreground font-medium max-w-xs md:max-w-md break-words leading-relaxed">
                                  {item.name_id}
                                </td>
                                <td className="py-4 px-4 text-zinc-500 dark:text-muted-foreground italic max-w-xs md:max-w-md break-words leading-relaxed">
                                  {item.name_en || "-"}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Table Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-900/60 flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50/40 dark:bg-zinc-950/20 backdrop-blur-xs">
                      <span className="text-xs text-zinc-600 dark:text-muted-foreground font-semibold uppercase tracking-wider">
                        Page {currentPage} of {totalPages} (Showing{" "}
                        {itemsPerPage * (currentPage - 1) + 1} -{" "}
                        {Math.min(
                          itemsPerPage * currentPage,
                          filteredItems.length,
                        )}{" "}
                        of {filteredItems.length})
                      </span>
                      <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-900/50 backdrop-blur-md p-1.5 border border-zinc-200/60 dark:border-zinc-800/60 rounded-full shadow-inner">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground text-zinc-500 dark:text-muted-foreground disabled:opacity-20 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-300"
                          title="First Page"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground text-zinc-500 dark:text-muted-foreground disabled:opacity-20 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-300"
                          title="Previous Page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Display surrounding page counts */}
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum = currentPage;
                          if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          if (pageNum <= 0 || pageNum > totalPages) return null;

                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={
                                currentPage === pageNum ? "default" : "ghost"
                              }
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 p-0 flex items-center justify-center ${currentPage === pageNum
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110 font-extrabold"
                                  : "text-zinc-600 dark:text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground"
                                }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}

                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground text-zinc-500 dark:text-muted-foreground disabled:opacity-20 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-300"
                          title="Next Page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground text-zinc-500 dark:text-muted-foreground disabled:opacity-20 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-300"
                          title="Last Page"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </BorderGlow>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
