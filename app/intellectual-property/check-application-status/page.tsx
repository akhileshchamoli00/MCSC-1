"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar, HelpCircle, ChevronDown, Check
} from "lucide-react"
import BorderGlow from "@/components/ui/BorderGlow"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Multilingual Calendar dictionaries
const MONTHS_LOCALIZED = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  cn: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
}

const DAYS_OF_WEEK_LOCALIZED = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  cn: ["日", "一", "二", "三", "四", "五", "六"]
}

// Multilingual local UI translation dictionary
const localUI = {
  en: {
    pageTitle: "Check Application Status",
    pageDesc: "Track and monitor the current filing and registration status of your trademark applications at the official registry.",
    checkStatusBtn: "Submit",
    statusSubmitHeader: "Submit your request using the form below. Our team will review your submission and respond via email within 2–3 business days with an update on its status.",
    clearFilters: "Clear Filters",
    submitting: "Submitting...",
    statusFilterHeading: "Based on Status",
    numberFilterHeading: "Based on Number",
    textFilterHeading: "Based on Text",
    periodFilterHeading: "Based on Period",
    sourceLabel: "MCS Intellectual Property Services",
    // Field Labels & Tooltips
    appNo: "Application Number",
    appNoTip: "The official number assigned when filing (e.g., DID2023089123).",
    regNo: "Registration Number",
    regNoTip: "The registration certificate number issued after approval (e.g., IDM000984321).",
    prioNo: "Priority Number",
    prioNoTip: "Number assigned if filed under Paris Convention priority claims.",
    brmNo: "BRM Number",
    brmNoTip: "Official Berita Resmi Merek (BRM) publication identifier.",
    goodsType: "Type of Goods / Services",
    brandName: "Brand Name *",
    classification: "Classification",
    classificationTip: "Nice international classification classes (1 to 45). Click to toggle classes.",
    consultant: "Consultant Name",
    owner: "Owner Name *",
    emailAddress: "Email Address *",
    ownerTip: "The company or individual holding legal rights to the trademark.",
    province: "Province",
    appYear: "Application Year",
    pubDate: "Publication Date",
    pubDateTip: "The date of trademark publication in the Berita Resmi Merek.",
    regDate: "Registration Date",
    regDateTip: "The date the official certificate was issued by the registry.",
    receiptDate: "Filing Date",
    receiptDateTip: "The date the application was formally accepted and received.",
    expiryDate: "Protection Expiry Date",
    expiryDateTip: "The date trademark protection ends (10 years from filing date).",
    allProvinces: "All Provinces",
    allYears: "All Years",
    selectedItems: "{count} selected items",
    toastSuccess: "Status check request submitted successfully!",
    toastError: "Failed to submit request. Please try again.",
    validationError: "Please fill in all mandatory fields: Brand Name, Owner Name, and Email Address.",
    formTooltip: "Query trademark registration details using official filter specifications.",
    // Placeholders
    appNoPlaceholder: "e.g., DID2023089123",
    regNoPlaceholder: "e.g., IDM000984321",
    prioNoPlaceholder: "Enter priority number",
    brmNoPlaceholder: "Enter BRM number",
    goodsTypePlaceholder: "Enter goods or services description",
    brandNamePlaceholder: "Enter trademark brand name",
    consultantPlaceholder: "Enter consultant representative name",
    ownerPlaceholder: "Enter owner name / legal entity",
    emailPlaceholder: "Enter your email address",
    dateSelectPlaceholder: "Select date"
  },
  id: {
    pageTitle: "Cek Status Permohonan",
    pageDesc: "Lacak dan pantau status pengajuan serta pendaftaran merek Anda secara real-time di registri resmi.",
    checkStatusBtn: "Kirim",
    statusSubmitHeader: "Kirimkan permintaan Anda menggunakan formulir di bawah ini. Tim kami akan meninjau kiriman Anda dan merespons melalui email dalam 2-3 hari kerja dengan pembaruan statusnya.",
    clearFilters: "Bersihkan Filter",
    submitting: "Mengirim...",
    statusFilterHeading: "Berdasarkan Status",
    numberFilterHeading: "Berdasarkan Nomor",
    textFilterHeading: "Berdasarkan Teks",
    periodFilterHeading: "Berdasarkan Periode",
    sourceLabel: "Layanan Kekayaan Intelektual MCS",
    // Field Labels & Tooltips
    appNo: "Nomor Permohonan",
    appNoTip: "Nomor resmi yang diberikan saat mengajukan permohonan merek (misal: DID2023089123).",
    regNo: "Nomor Pendaftaran",
    regNoTip: "Nomor sertifikat merek resmi yang diterbitkan setelah disetujui (misal: IDM000984321).",
    prioNo: "Nomor Prioritas",
    prioNoTip: "Nomor prioritas jika diajukan menggunakan klaim prioritas Konvensi Paris.",
    brmNo: "Nomor BRM",
    brmNoTip: "Nomor Berita Resmi Merek sebagai bukti publikasi resmi.",
    goodsType: "Jenis Barang / Jasa",
    brandName: "Nama Merek *",
    classification: "Klasifikasi",
    classificationTip: "Kelas klasifikasi Nice Internasional (1 sampai 45). Klik untuk memilih kelas.",
    consultant: "Nama Konsultan",
    owner: "Nama Pemilik *",
    emailAddress: "Alamat Email *",
    ownerTip: "Perusahaan atau perorangan yang memegang hak hukum atas merek tersebut.",
    province: "Provinsi",
    appYear: "Tahun Permohonan",
    pubDate: "Tanggal Publikasi",
    pubDateTip: "Tanggal pengumuman merek di Berita Resmi Merek resmi.",
    regDate: "Tanggal Pendaftaran",
    regDateTip: "Tanggal penerbitan sertifikat resmi oleh kantor merek.",
    receiptDate: "Tanggal Penerimaan",
    receiptDateTip: "Tanggal permohonan diterima secara formal oleh registri.",
    expiryDate: "Tanggal Berakhir Perlindungan",
    expiryDateTip: "Tanggal berakhirnya perlindungan merek hukum (10 tahun sejak penerimaan).",
    allProvinces: "Semua Provinsi",
    allYears: "Semua Tahun",
    selectedItems: "{count} item terpilih",
    toastSuccess: "Permintaan cek status berhasil dikirim!",
    toastError: "Gagal mengirimkan permintaan. Silakan coba lagi.",
    validationError: "Silakan isi semua bidang wajib: Nama Merek, Nama Pemilik, dan Alamat Email.",
    formTooltip: "Cari detail pendaftaran merek menggunakan spesifikasi filter resmi.",
    // Placeholders
    appNoPlaceholder: "Contoh: DID2023089123",
    regNoPlaceholder: "Contoh: IDM000984321",
    prioNoPlaceholder: "Masukkan Nomor Prioritas",
    brmNoPlaceholder: "Masukkan Nomor BRM",
    goodsTypePlaceholder: "Masukkan deskripsi barang atau jasa",
    brandNamePlaceholder: "Masukkan nama merek dagang",
    consultantPlaceholder: "Masukkan nama konsultan perwakilan",
    ownerPlaceholder: "Masukkan nama pemilik merek / badan usaha",
    emailPlaceholder: "Masukkan alamat email Anda",
    dateSelectPlaceholder: "Pilih tanggal"
  },
  cn: {
    pageTitle: "查询申请状态",
    pageDesc: "实时跟踪并监控您在官方印尼商标注册处提交的申请和注册进度。",
    checkStatusBtn: "提交",
    statusSubmitHeader: "请使用下方表单提交您的请求。我们的团队将审核您的提交，并在 2-3 个工作日内通过电子邮件回复其状态更新。",
    clearFilters: "清除筛选",
    submitting: "正在提交...",
    statusFilterHeading: "按状态",
    numberFilterHeading: "按编号",
    textFilterHeading: "按文本",
    periodFilterHeading: "按时期",
    sourceLabel: "MCS 知识产权服务",
    // Field Labels & Tooltips
    appNo: "Nomor Permohonan (申请编号)",
    appNoTip: "提交申请时分配的官方编号（例如：DID2023089123）。",
    regNo: "Nomor Pendaftaran (注册编号)",
    regNoTip: "批准后颁发的官方注册证书编号（例如：IDM000984321）。",
    prioNo: "Nomor Prioritas (优先权编号)",
    prioNoTip: "根据巴黎公约优先权声明提交时分配的编号。",
    brmNo: "Nomor BRM (BRM 编号)",
    brmNoTip: "官方商标公报 (Berita Resmi Merek) 出版标识符。",
    goodsType: "Jenis Goods/Services (商品/服务类型)",
    brandName: "Nama Merek (商标名称) *",
    classification: "Klasifikasi (尼斯分类)",
    classificationTip: "尼斯国际分类类别（1 至 45 类）。点击进行选择分类。",
    consultant: "Nama Konsultan (代理人/顾问姓名)",
    owner: "Nama Pemilik (所有人姓名) *",
    emailAddress: "Alamat Email (电子邮件地址) *",
    ownerTip: "拥有商标合法权利的公司或个人。",
    province: "Provinsi (省份)",
    appYear: "Tahun Permohonan (申请年度)",
    pubDate: "Tanggal Publikasi (公告日期)",
    pubDateTip: "在官方商标公报上公告的日期。",
    regDate: "Tanggal Pendaftaran (注册日期)",
    regDateTip: "官方注册处颁发证书的日期。",
    receiptDate: "Tanggal Penerimaan (受理日期)",
    receiptDateTip: "申请获得正式受理并接收的日期。",
    expiryDate: "Tanggal Berakhir Perlindungan (保护截止日期)",
    expiryDateTip: "商标法律保护结束日期（自受理之日起10年）。",
    allProvinces: "所有省份",
    allYears: "所有年份",
    selectedItems: "已选择 {count} 项",
    toastSuccess: "状态检查申请提交成功！",
    toastError: "提交申请失败。请重试。",
    validationError: "请填写所有必填字段：商标名称、所有人姓名和电子邮件地址。",
    formTooltip: "使用官方筛选规范查询商标注册详情。",
    // Placeholders
    appNoPlaceholder: "例如：DID2023089123",
    regNoPlaceholder: "例如：IDM000984321",
    prioNoPlaceholder: "输入优先权编号",
    brmNoPlaceholder: "输入 BRM 编号",
    goodsTypePlaceholder: "输入商品或服务描述",
    brandNamePlaceholder: "输入注册商标名称",
    consultantPlaceholder: "输入代理人/顾问姓名",
    ownerPlaceholder: "输入所有人姓名/企业名称",
    emailPlaceholder: "输入您的电子邮件地址",
    dateSelectPlaceholder: "选择日期"
  }
}

// Reusable custom Popover calendar date picker component
interface CustomDatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder: string
  language: "en" | "id" | "cn"
}

function CustomDatePicker({ value, onChange, placeholder, language }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dateObj = value ? new Date(value) : null

  const [viewDate, setViewDate] = useState(dateObj && !isNaN(dateObj.getTime()) ? dateObj : new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const selected = new Date(year, month, day)
    const formatted = `${selected.getFullYear()}-${(selected.getMonth() + 1).toString().padStart(2, "0")}-${selected.getDate().toString().padStart(2, "0")}`
    onChange(formatted)
    setIsOpen(false)
  }

  const getDisplayDate = () => {
    if (!value) return placeholder
    const d = new Date(value)
    if (isNaN(d.getTime())) return placeholder

    const day = d.getDate()
    const monthName = MONTHS_LOCALIZED[language][d.getMonth()]
    const yearNum = d.getFullYear()
    return `${day} ${monthName} ${yearNum}`
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-zinc-800 dark:text-foreground font-semibold flex items-center justify-between hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 focus:outline-none focus:ring-1.5 focus:ring-primary/40 focus:border-primary relative cursor-pointer"
      >
        <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
        <span>{getDisplayDate()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 w-full z-50 mt-2 p-4 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md"
            >
              {/* Header controls */}
              <div className="flex items-center justify-between mb-3.5 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer text-xs font-bold font-mono"
                >
                  &larr;
                </button>
                <span className="text-xs font-extrabold text-zinc-800 dark:text-foreground font-sans">
                  {MONTHS_LOCALIZED[language][month]} {year}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer text-xs font-bold font-mono"
                >
                  &rarr;
                </button>
              </div>

              {/* Days label header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {DAYS_OF_WEEK_LOCALIZED[language].map(d => (
                  <span key={d} className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider flex items-center justify-center aspect-square">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-1 justify-items-stretch">
                {[...Array(firstDay)].map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square" />
                ))}

                {[...Array(daysInMonth)].map((_, idx) => {
                  const dayNum = idx + 1
                  const isSelected = dateObj &&
                    dateObj.getDate() === dayNum &&
                    dateObj.getMonth() === month &&
                    dateObj.getFullYear() === year

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={(e) => handleSelectDay(dayNum, e)}
                      className={`aspect-square w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${isSelected
                          ? "bg-primary text-primary-foreground font-black shadow-md scale-105"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                    >
                      {dayNum}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CheckApplicationStatusPage() {
  const { language } = useLanguage()
  const ui = localUI[language] || localUI.en

  // Input selection dropdown status
  const [isClassGridOpen, setIsClassGridOpen] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Submission & loading/error states
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Status Filter checklist states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Text & Number Filter input states
  const [appNoInput, setAppNoInput] = useState("")
  const [regNoInput, setRegNoInput] = useState("")
  const [prioNoInput, setPrioNoInput] = useState("")
  const [brmNoInput, setBrmNoInput] = useState("")
  const [goodsInput, setGoodsInput] = useState("")
  const [brandInput, setBrandInput] = useState("")
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [consultantInput, setConsultantInput] = useState("")
  const [ownerInput, setOwnerInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("all")

  // Period Filter states
  const [selectedYear, setSelectedYear] = useState("all")
  const [pubDateInput, setPubDateInput] = useState("")
  const [regDateInput, setRegDateInput] = useState("")
  const [receiptDateInput, setReceiptDateInput] = useState("")
  const [expiryDateInput, setExpiryDateInput] = useState("")

  // Reset filters
  const handleClearFilters = () => {
    setSelectedStatuses([])
    setAppNoInput("")
    setRegNoInput("")
    setPrioNoInput("")
    setBrmNoInput("")
    setGoodsInput("")
    setBrandInput("")
    setSelectedClasses([])
    setConsultantInput("")
    setOwnerInput("")
    setEmailInput("")
    setSelectedProvince("all")
    setSelectedYear("all")
    setPubDateInput("")
    setRegDateInput("")
    setReceiptDateInput("")
    setExpiryDateInput("")
    setShowSuccessToast(false)
    setStatus("idle")
    setErrorMessage(null)
  }

  // Handle submit action
  const handleApplyFilters = async () => {
    // Validate mandatory fields
    if (!brandInput.trim() || !ownerInput.trim() || !emailInput.trim()) {
      setStatus("error")
      setErrorMessage(ui.validationError)
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      const payload = {
        selectedStatuses,
        appNoInput,
        regNoInput,
        prioNoInput,
        brmNoInput,
        goodsInput,
        brandInput,
        selectedClasses,
        consultantInput,
        ownerInput,
        emailInput,
        selectedProvince,
        selectedYear,
        pubDateInput,
        regDateInput,
        receiptDateInput,
        expiryDateInput
      }

      const response = await fetch("/api/status-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus("success")
        setShowSuccessToast(true)
        setTimeout(() => {
          setShowSuccessToast(false)
        }, 5000)
        // Clear all fields on success
        setSelectedStatuses([])
        setAppNoInput("")
        setRegNoInput("")
        setPrioNoInput("")
        setBrmNoInput("")
        setGoodsInput("")
        setBrandInput("")
        setSelectedClasses([])
        setConsultantInput("")
        setOwnerInput("")
        setEmailInput("")
        setSelectedProvince("all")
        setSelectedYear("all")
        setPubDateInput("")
        setRegDateInput("")
        setReceiptDateInput("")
        setExpiryDateInput("")
      } else {
        setStatus("error")
        setErrorMessage(data.error || ui.toastError)
      }
    } catch (err: any) {
      console.error("Status check query submission error:", err)
      setStatus("error")
      setErrorMessage(ui.toastError)
    }
  }

  // Toggle status checklist helper
  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  // Toggle class selection helper
  const toggleClass = (cls: string) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    )
  }

  return (
    <main className="relative z-10 flex flex-col text-foreground">
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

      {/* Main Interactive Workspace Section */}
      <section className="pb-12 flex-grow container mx-auto px-4 max-w-5xl">
        <div className="space-y-8">

          {/* Inline Form Container inside BorderGlow */}
          <BorderGlow
            edgeSensitivity={20}
            glowColor="59 130 246"
            backgroundColor="transparent"
            borderRadius={16}
            glowRadius={150}
            glowIntensity={0.8}
            colors={['#3b82f6', '#1d4ed8']}
          >
            <Card className="border border-zinc-200/40 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md overflow-hidden shadow-sm dark:shadow-none p-6 md:px-8 md:pt-8 md:pb-6">

              {/* Form Title */}
              <div className="flex items-center gap-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 mb-8">
                <h2 className="text-base font-semibold font-sans bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent leading-relaxed max-w-2xl">
                  {ui.statusSubmitHeader}
                </h2>
              </div>

              {/* Inline Banners for Status Messages */}
              {status === "success" && (
                <div className="p-4 mb-8 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-lg shadow-emerald-500/5 flex items-center gap-2">
                  <span>✨</span>
                  <span>{ui.toastSuccess}</span>
                </div>
              )}
              {status === "error" && (
                <div className="p-4 mb-8 text-sm rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 font-semibold shadow-lg shadow-red-500/5">
                  <div className="font-bold flex items-center gap-2">
                    <span>❌</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Form Fields Responsive Grid structured in exact user sequence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">

                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-4">
                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{ui.emailAddress}</label>
                      <input
                        type="email"
                        placeholder={ui.emailPlaceholder}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        disabled={status === "submitting"}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:ring-1.5 focus:ring-primary/40 focus:border-primary text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 disabled:opacity-50"
                      />
                    </div>

                    {/* Nomor Permohonan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{ui.appNo}</label>
                      <input
                        type="text"
                        placeholder={ui.appNoPlaceholder}
                        value={appNoInput}
                        onChange={(e) => setAppNoInput(e.target.value)}
                        disabled={status === "submitting"}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:ring-1.5 focus:ring-primary/40 focus:border-primary text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 disabled:opacity-50"
                      />
                    </div>

                    {/* Nomor Pendaftaran */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{ui.regNo}</label>
                      <input
                        type="text"
                        placeholder={ui.regNoPlaceholder}
                        value={regNoInput}
                        onChange={(e) => setRegNoInput(e.target.value)}
                        disabled={status === "submitting"}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:ring-1.5 focus:ring-primary/40 focus:border-primary text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-4">
                    {/* Nama Merek */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{ui.brandName}</label>
                      <input
                        type="text"
                        placeholder={ui.brandNamePlaceholder}
                        value={brandInput}
                        onChange={(e) => setBrandInput(e.target.value)}
                        disabled={status === "submitting"}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:ring-1.5 focus:ring-primary/40 focus:border-primary text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 disabled:opacity-50"
                      />
                    </div>

                    {/* Nama Pemilik */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{ui.owner}</label>
                      <input
                        type="text"
                        placeholder={ui.ownerPlaceholder}
                        value={ownerInput}
                        onChange={(e) => setOwnerInput(e.target.value)}
                        disabled={status === "submitting"}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:ring-1.5 focus:ring-primary/40 focus:border-primary text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Action Buttons in Footer Card */}
              <div className="mt-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-end gap-4 w-full md:max-w-md ml-auto">
                <Button
                  onClick={handleApplyFilters}
                  disabled={status === "submitting"}
                  className="flex-grow font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-75 disabled:hover:scale-100"
                >
                  {status === "submitting" ? ui.submitting : ui.checkStatusBtn}
                </Button>
              </div>

            </Card>
          </BorderGlow>

          {/* Animated Success Toast Indicator */}
          <AnimatePresence>
            {showSuccessToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 backdrop-blur-md text-sm font-bold shadow-lg shadow-emerald-500/5 font-sans"
              >
                <Check className="h-4.5 w-4.5 shrink-0" />
                {ui.toastSuccess}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  )
}
