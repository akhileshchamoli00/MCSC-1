import pymupdf4llm
import pathlib

# Your file name
pdf_path = "public/AnnouncementDocs/PERATURAN PEMERINTAH Nomor 28 Tahun 2025 tentang Perizinan Berusaha Berbasis Risiko.pdf"

print("Extracting and formatting... give it a sec.")

# Extract pages 0 to 309
md_text = pymupdf4llm.to_markdown(pdf_path, pages=list(range(310)))

# Save it out to a clean Markdown file
output_path = pathlib.Path("PP_28_Extracted.md")
output_path.write_bytes(md_text.encode("utf-8"))

print(f"Done! Clean Markdown saved to {output_path.name}")