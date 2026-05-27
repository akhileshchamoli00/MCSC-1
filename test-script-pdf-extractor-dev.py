import pymupdf4llm
import pathlib

# Your file name
pdf_path = "public/AnnouncementDocs/PMK NOMOR 28 TAHUN 2026.pdf"

print("Extracting and formatting... give it a sec.")

# Extract pages 1 to 35 (0-indexed: 0 to 34)
md_text = pymupdf4llm.to_markdown(pdf_path, pages=list(range(35)))

# Save it out to a clean Markdown file
output_path = pathlib.Path("PMK_28_Extracted.md")
output_path.write_bytes(md_text.encode("utf-8"))

print(f"Done! Clean Markdown saved to {output_path.name}")