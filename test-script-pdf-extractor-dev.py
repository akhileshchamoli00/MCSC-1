import pymupdf4llm
import pathlib

# Your file name
pdf_path = "public/AnnouncementDocs/Permenkum No. 5 Tahun 2026 Tentang Pendaftaran Merek.pdf"

print("Extracting and formatting... give it a sec.")

# Extract all pages
md_text = pymupdf4llm.to_markdown(pdf_path)

# Save it out to a clean Markdown file
output_path = pathlib.Path("Permenkum_5_Extracted.md")
output_path.write_bytes(md_text.encode("utf-8"))

print(f"Done! Clean Markdown saved to {output_path.name}")