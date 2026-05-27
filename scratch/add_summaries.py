import re
import pathlib
import json
import time
from deep_translator import GoogleTranslator

# The raw english data
data_en = {
    "kepgub-310-2026": {
        "summary": "This Governor Decree provides a 20% reduction on the principal of Certain Goods and Services Tax (PBJT) specifically for the food, beverage, and hotel services sectors in the Special Capital Region of Jakarta to boost purchasing power during Ramadan and Eid al-Fitr 2026.",
        "keyPoints": [
            "Provides 20% principal tax reduction for PBJT on food/beverages.",
            "Provides 20% principal tax reduction for PBJT on hotel services.",
            "Aimed at stimulating the economy during the 2026 Ramadan/Eid season.",
            "Applies to the tax period of March 2026.",
            "Given automatically by virtue of office without application.",
            "Does not require taxpayer to file a specific relief application.",
            "Taxpayers must complete payment by April 30, 2026.",
            "Valid only within the jurisdiction of Jakarta (DKI Jakarta).",
            "Based on Law No. 1 of 2022 and PP No. 35 of 2023.",
            "Designed to support consumer purchasing power in hospitality."
        ]
    },
    "pmk-6-2026": {
        "summary": "This Ministry of Finance Regulation (PMK 6/2026) outlines the procedures for returning Value Added Tax (VAT) to foreign individuals holding overseas passports who purchase taxable goods in Indonesia, simplifying the refund process at designated airports.",
        "keyPoints": [
            "Applies to foreign tourists with an overseas passport.",
            "Regulates the VAT refund (taxback) for purchases in Indonesia.",
            "Applies only to purchases of taxable goods (BKP).",
            "Goods must be carried out of Indonesia as accompanied baggage.",
            "Purchase must meet a minimum threshold amount.",
            "Refund claims must be made within 1 month from the purchase date.",
            "Refund claims are processed at designated international airports.",
            "Tax invoice must be issued specifically for VAT refund purposes.",
            "Simplifies the verification process by customs officials.",
            "Aims to boost international tourism and retail spending."
        ]
    },
    "permenkumham-5-2026": {
        "summary": "This regulation updates the procedures for the registration of fiduciary guarantees, introducing digital and more integrated submission methods through the AHU (General Legal Administration) online system to increase transparency and legal certainty.",
        "keyPoints": [
            "Regulates the registration, alteration, and deregistration of fiduciary guarantees.",
            "Mandates the use of the online AHU system for submissions.",
            "Registration must be done by a Notary.",
            "Provides exact timeframes for processing registrations.",
            "Sets requirements for the form and content of the Fiduciary Deed.",
            "Standardizes the administrative fees (PNBP).",
            "Clarifies rules on multiple or substitute collateral.",
            "Protects creditors by offering immediate electronic certificates.",
            "Requires accurate input of the debtor and creditor identities.",
            "Integrates with the population registry for identity verification."
        ]
    },
    "pmk-5-2026": {
        "summary": "This regulation stipulates the imposition of Value Added Tax (VAT) with specific parameters on Certain Goods and Services, providing explicit calculation bases and specific effective tax rates to simplify compliance for selected industries.",
        "keyPoints": [
            "Focuses on VAT for Certain Goods and Services.",
            "Introduces specific calculation bases (DPP) to simplify VAT.",
            "Defines effective final VAT rates (e.g., 1.1%, 2.2%) for certain sectors.",
            "Applies to freight forwarding, courier services, and travel agencies.",
            "Clarifies that input tax cannot be credited if using specific final rates.",
            "Intended to reduce compliance costs and administrative burden.",
            "Sets clear invoicing requirements (using code 04).",
            "Includes provisions for transition periods.",
            "Mandates accurate reporting in the monthly VAT return.",
            "Aligns with the Harmonized Tax Law (UU HPP)."
        ]
    },
    "kep-71-pj-2026": {
        "summary": "This Decree from the Director General of Taxes offers an elimination of administrative sanctions for the late reporting or amendment of the 2025 Annual Income Tax Returns (SPT Tahunan), provided taxpayers voluntarily comply before a set deadline.",
        "keyPoints": [
            "Removes administrative fines for late filing of the 2025 Annual Tax Return.",
            "Applies to both Individual and Corporate taxpayers.",
            "Voluntary compliance must be made before the audit process begins.",
            "Eliminates interest penalties for late payment related to the 2025 SPT.",
            "Taxpayers must fully pay the principal tax due.",
            "No special application needed; granted automatically upon filing.",
            "Does not cover tax crimes or ongoing tax litigation.",
            "Valid for a specified amnesty window (usually mid-year).",
            "Aims to increase the tax compliance ratio without punishing late filers.",
            "Re-emphasizes the use of e-Filing and e-Form for submission."
        ]
    },
    "peraturan-pemerintah-ri": {
        "summary": "Government Regulation No. 28 of 2025 restructures Risk-Based Business Licensing (PBBR), refining the OSS (Online Single Submission) system, streamlining basic requirements (KKPR, PBG, PL), and tightening supervision for high-risk business sectors.",
        "keyPoints": [
            "Replaces PP No. 5 of 2021 regarding Risk-Based Licensing.",
            "Classifies businesses into Low, Medium-Low, Medium-High, and High Risk.",
            "Low-risk businesses only require a Business Identification Number (NIB).",
            "High-risk businesses require NIB, standard certificates, and formal Licenses.",
            "Streamlines the KKPR (Spatial Planning Conformity) process.",
            "Integrates PBG (Building Approval) directly into the OSS workflows.",
            "Strengthens the post-audit and continuous supervision framework.",
            "Provides faster SLA (Service Level Agreements) for permit issuance.",
            "Mandates integration between Central OSS and Regional systems (DPMPTSP).",
            "Enhances investment climate by reducing bureaucratic red tape."
        ]
    },
    "pmk-4-2026": {
        "summary": "This regulation updates the Value Added Tax (VAT) rules for self-building activities (Kegiatan Membangun Sendiri / KMS), clarifying the tax base, thresholds for building size, and payment procedures to ensure compliance.",
        "keyPoints": [
            "Imposes VAT on self-building activities (KMS).",
            "Applies when building size exceeds 200 square meters.",
            "Effective VAT rate for KMS is set at 2.4% (20% of the 12% standard rate).",
            "Tax Base (DPP) is 20% of the total costs incurred per month.",
            "Land acquisition costs are excluded from the VAT calculation.",
            "Applies to both individuals and corporate entities.",
            "Requires VAT payment by the 15th of the following month.",
            "Filing requires a specific Tax Payment Slip (SSP) mechanism.",
            "Input tax for materials cannot be credited if using the KMS scheme.",
            "Exemptions exist for buildings designated exclusively for religious purposes."
        ]
    },
    "pmk-1-2026": {
        "summary": "This regulation introduces new guidelines and Effective Tax Rates (TER) for the withholding of Article 21 Income Tax on employee salaries, non-employees, and specific honorariums, vastly simplifying the monthly calculation method for employers.",
        "keyPoints": [
            "Introduces the Effective Rate (TER) scheme for Article 21 Income Tax.",
            "TER is divided into Categories A, B, and C based on marital status/dependents.",
            "Greatly simplifies monthly payroll calculations for HR departments.",
            "January-November uses the gross income multiplied by the TER.",
            "December requires a true-up calculation using standard progressive rates.",
            "Updates rules for non-employees, daily workers, and severance pay.",
            "Aims to reduce miscalculations and underpayments during the year.",
            "Maintains the PTKP (Non-Taxable Income) thresholds.",
            "Requires a new standardized withholding tax slip format.",
            "Replaces multiple older PMK regulations regarding Article 21."
        ]
    },
    "permendag-16-2025": {
        "summary": "This Ministry of Trade Regulation details the specific licensing requirements, standards, and obligations for businesses operating in the trade sector, explicitly supporting the integration into the national Risk-Based OSS system.",
        "keyPoints": [
            "Outlines specific business standards for the trade sector (retail, wholesale).",
            "Integrates deeply with the OSS Risk-Based Approach (PBBR).",
            "Details requirements for domestic and international trade permits.",
            "Sets regulations for modern retail markets vs traditional markets.",
            "Mandates regular reporting for large-scale distributors.",
            "Provides guidelines for franchise registrations (STPW).",
            "Regulates multi-level marketing (MLM) operational licenses.",
            "Requires specific warehousing registrations for large inventories.",
            "Defines strict sanctions for trading prohibited goods.",
            "Enhances consumer protection standard requirements."
        ]
    },
    "permenkum-49-2025": {
        "summary": "This regulation by the Ministry of Law dictates the updated procedures for establishing, registering, and altering Limited Liability Companies (PT), including the fast-track process for Individual PTs tailored for micro and small enterprises.",
        "keyPoints": [
            "Updates the procedures for registering a Limited Liability Company (PT).",
            "Streamlines the SABH (Legal Entity Administration System) interface.",
            "Clarifies the rules for Individual PTs (PT Perorangan) for SMEs.",
            "Lowers the administrative barriers for capital declarations.",
            "Requires immediate reporting of Beneficial Ownership (BO).",
            "Accelerates the approval of Articles of Association amendments.",
            "Provides mechanisms for digital notarial deed submissions.",
            "Clarifies merger, acquisition, and dissolution registry protocols.",
            "Integrates company data directly with the tax authority (NPWP generation).",
            "Mandates updating director and commissioner databases within 30 days."
        ]
    },
    "pmk-28-2026": {
        "summary": "This regulation establishes the foundational guidelines for the execution of Motor Vehicle Tax (PKB) and Motor Vehicle Title Transfer Tax (BBNKB), focusing on regional revenue sharing and standardization of tax bases across provinces.",
        "keyPoints": [
            "Provides guidelines for Motor Vehicle Tax (PKB) collection.",
            "Standardizes the formula for determining vehicle sales value (NJKB).",
            "Regulates the Title Transfer Tax (BBNKB) for new and used vehicles.",
            "Sets the maximum tariff thresholds for provincial governments.",
            "Encourages the implementation of progressive tax for multiple vehicles.",
            "Details the revenue-sharing mechanics between Province and Regencies/Cities.",
            "Promotes digitalization in annual tax payments (e-Samsat).",
            "Addresses tax exemptions for government, diplomatic, and emergency vehicles.",
            "Aims to increase regional fiscal independence.",
            "Replaces older, fragmented motor vehicle tax frameworks."
        ]
    }
}

def safe_translate(translator, text, retries=3):
    for i in range(retries):
        try:
            time.sleep(0.5) # Increase sleep to prevent rate limiting
            res = translator.translate(text)
            if res:
                return res
        except Exception as e:
            print(f"Translation failed: {e}. Retrying...")
            time.sleep(1)
    return text # Fallback to English

print("Translating data to id and cn... This might take a minute...")

translator_id = GoogleTranslator(source='en', target='id')
translator_cn = GoogleTranslator(source='en', target='zh-CN')

data_all = {}
for key, content in data_en.items():
    print(f"Translating {key}...")
    
    # Translate to ID
    summary_id = safe_translate(translator_id, content["summary"])
    kp_id = []
    for point in content["keyPoints"]:
        kp_id.append(safe_translate(translator_id, point))
        
    # Translate to CN
    summary_cn = safe_translate(translator_cn, content["summary"])
    kp_cn = []
    for point in content["keyPoints"]:
        kp_cn.append(safe_translate(translator_cn, point))
        
    data_all[key] = {
        "en": content,
        "id": {
            "summary": summary_id,
            "keyPoints": kp_id
        },
        "cn": {
            "summary": summary_cn,
            "keyPoints": kp_cn
        }
    }

print("Translation done. Now patching translations.ts...")

ts_path = pathlib.Path("lib/translations.ts")
ts_content = ts_path.read_text(encoding="utf-8")

# We will parse the file by looking for id: "..." lines.
# Then we will insert summary: "...", and keyPoints: [...],
lines = ts_content.split("\n")
new_lines = []

current_lang = None
in_announcement_items = False

for i, line in enumerate(lines):
    new_lines.append(line)
    
    # Detect language block
    if line.strip() == "en: {":
        current_lang = "en"
    elif line.strip() == "id: {":
        current_lang = "id"
    elif line.strip() == "cn: {":
        current_lang = "cn"
        
    # Detect id line
    match = re.search(r'id:\s*"([^"]+)"', line)
    if match and current_lang:
        reg_id = match.group(1)
        if reg_id in data_all:
            # We found a regulation. Let's insert summary and keyPoints right after it.
            summary_text = data_all[reg_id][current_lang]["summary"]
            # escape quotes
            summary_text = summary_text.replace('"', '\\"').replace('\n', ' ')
            
            # format keypoints
            kp_array_str = "[\n"
            for kp in data_all[reg_id][current_lang]["keyPoints"]:
                kp_safe = kp.replace('"', '\\"').replace('\n', ' ')
                kp_array_str += f'            "{kp_safe}",\n'
            kp_array_str += "          ]"
            
            insert_str = f'          summary: "{summary_text}",\n          keyPoints: {kp_array_str},'
            new_lines.append(insert_str)

ts_path.write_text("\n".join(new_lines), encoding="utf-8")
print("Successfully patched translations.ts with Summaries and Key Points!")
