"""
Script to split the Geneva Tax Guide PDF into chapter-based files.
"""
from pypdf import PdfReader, PdfWriter
import os

# Source PDF
source_pdf = "guidepp-2024-180225.pdf"
output_dir = "knowledge/chapters"

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Chapter definitions: (filename, start_page, end_page)
# Pages are 1-indexed as per the PDF
chapters = [
    ("00_couverture", 1, 1),
    ("01_table_des_matieres", 2, 3),
    ("02_agenda", 4, 4),
    ("03_comment_remplir_ma_declaration", 5, 9),
    ("04_les_justificatifs", 10, 10),
    ("05_principales_deductions_2024", 11, 11),
    ("06_page_de_garde_1", 12, 12),
    ("07_pages_de_garde_2_3_4", 13, 16),
    ("08_activite_dependante", 17, 22),
    ("09_activite_independante", 23, 24),
    ("10_autres_revenus_et_fortune", 25, 27),
    ("11_autres_deductions", 28, 31),
    ("12_immeubles", 32, 36),
    ("13_interets_et_dettes", 37, 37),
    ("14_etat_des_titres_et_imputations", 38, 44),
    ("15_charges_de_famille", 45, 46),
    ("16_calculs_impots", 47, 51),
    ("17_informations", 52, 54),
    ("18_paiement_impot_2024", 55, 56),
    ("19_contribution_religieuse_volontaire", 57, 57),
    ("20_contacts_afc", 58, 58),
    ("21_codes_de_taxation", 59, 59),
    ("22_index", 60, 62),
]

# Read the source PDF
print(f"Reading {source_pdf}...")
reader = PdfReader(source_pdf)
total_pages = len(reader.pages)
print(f"Total pages: {total_pages}")

# Split into chapters
for chapter_name, start_page, end_page in chapters:
    writer = PdfWriter()

    # Add pages (convert to 0-indexed)
    for page_num in range(start_page - 1, end_page):
        if page_num < total_pages:
            writer.add_page(reader.pages[page_num])

    # Save the chapter PDF
    output_path = os.path.join(output_dir, f"{chapter_name}.pdf")
    with open(output_path, "wb") as output_file:
        writer.write(output_file)

    print(f"Created: {output_path} (pages {start_page}-{end_page})")

print(f"\nDone! Created {len(chapters)} chapter files in '{output_dir}/'")
