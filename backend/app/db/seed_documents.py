# ==============================================================================
# Layer: Database & File Seeding — Statutory Demo Documents (app/db/seed_documents.py)
# ALLOWED:
#   - Generate realistic demonstration PDF and spreadsheet documents on disk via StorageService.
#   - Insert statutory document database rows linked to cases across the 11-stage workflow.
# ==============================================================================

import io
import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
import openpyxl
from openpyxl.styles import Font as XFont, PatternFill as XFill, Alignment as XAlign, Border as XBorder, Side as XSide

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.storage_service import StorageService
from app.db.session import SessionLocal
from app.models.case import Case
from app.models.user import User
from app.models.document import Document
from app.models.enums import UserRole, CaseStage, DocumentType


def create_placeholder_pdf(
    title: str,
    statutory_citation: str,
    case_ref: str,
    subject: str,
    paragraphs: list[str],
    officer_title: str = "District Collector & District Magistrate",
    officer_jurisdiction: str = "District Gautam Buddha Nagar, Uttar Pradesh"
) -> bytes:
    """Generates a realistic Government of India / State Revenue Department statutory PDF document."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom typography
    header_style = ParagraphStyle(
        "GovHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        alignment=1, # Center
        textColor=colors.HexColor("#0F172A")
    )
    sub_header_style = ParagraphStyle(
        "GovSubHeader",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#475569")
    )
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        alignment=1,
        textColor=colors.HexColor("#1E3A8A"), # Deep Blue
        spaceAfter=10
    )
    meta_style = ParagraphStyle(
        "DocMeta",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=15,
        alignment=4, # Justified
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=10
    )
    sign_style = ParagraphStyle(
        "SignBlock",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        alignment=2, # Right
        textColor=colors.HexColor("#0F172A")
    )
    sign_sub_style = ParagraphStyle(
        "SignBlockSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        alignment=2, # Right
        textColor=colors.HexColor("#64748B")
    )

    story = []

    # Letterhead Emblem & Title
    story.append(Paragraph("GOVERNMENT OF UTTAR PRADESH", header_style))
    story.append(Paragraph("OFFICE OF THE DISTRICT COLLECTOR & COMPETENT AUTHORITY", sub_header_style))
    story.append(Paragraph("DEPARTMENT OF REVENUE & LAND ACQUISITION", sub_header_style))
    story.append(Paragraph(f"RFCTLARR Act, 2013 Statutory Record • {statutory_citation}", sub_header_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=12))

    # Reference bar
    meta_table_data = [
        [
            Paragraph(f"<b>File Ref No:</b> {case_ref}", meta_style),
            Paragraph(f"<b>Date:</b> {datetime.now().strftime('%d %B %Y')}", ParagraphStyle("RMeta", parent=meta_style, alignment=2))
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[300, 205])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Title & Subject
    story.append(Paragraph(title.upper(), title_style))
    story.append(Paragraph(f"<b>SUBJECT:</b> {subject}", ParagraphStyle("Subj", parent=body_style, fontName="Helvetica-Bold")))
    story.append(Spacer(1, 6))

    # Body Paragraphs
    for p_text in paragraphs:
        story.append(Paragraph(p_text, body_style))

    # Digital Signature Box
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    sign_data = [
        [
            Paragraph(
                "<b>[DIGITALLY SIGNED & SEALED]</b><br/>"
                "Certified under Section 3 of Information Technology Act, 2000.<br/>"
                "Tamper-evident verification hash recorded in LandSync National Ledger.",
                ParagraphStyle("DigiNotice", parent=styles["Normal"], fontSize=7.5, leading=10, textColor=colors.HexColor("#059669"))
            ),
            Paragraph(
                f"<b>{officer_title}</b><br/>{officer_jurisdiction}<br/>"
                f"UID: UP-GOV-AUTH-{datetime.now().strftime('%Y%m')}",
                sign_style
            )
        ]
    ]
    sign_table = Table(sign_data, colWidths=[310, 195])
    sign_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#F0FDF4")),
        ('BOX', (0,0), (0,0), 0.5, colors.HexColor("#86EFAC")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sign_table)

    doc.build(story)
    return buffer.getvalue()


def create_placeholder_xlsx() -> bytes:
    """Generates a realistic compensation schedule spreadsheet to demonstrate non-PDF download fallback."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Compensation Schedule"

    headers = [
        "S.No", "Khasra No", "Owner / Khatedar", "Category", "Area (Ha)",
        "Base Rate (₹/Ha)", "Market Value (₹)", "Solatium 100% (₹)",
        "Additional 12% (₹)", "Total Award Value (₹)"
    ]
    ws.append(headers)

    header_fill = XFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = XFont(name="Calibri", size=10, bold=True, color="FFFFFF")
    header_align = XAlign(horizontal="center", vertical="center")
    thin_border = XBorder(
        left=XSide(style="thin", color="CBD5E1"),
        right=XSide(style="thin", color="CBD5E1"),
        top=XSide(style="thin", color="CBD5E1"),
        bottom=XSide(style="thin", color="CBD5E1")
    )

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_align
        cell.border = thin_border
    ws.row_dimensions[1].height = 25

    rows_data = [
        [1, "102/1", "Ramesh Chandra Sharma", "Agricultural", 1.80, 8500000, 15300000, 15300000, 1836000, 32436000],
        [2, "102/2", "Smt. Shakuntala Devi", "Agricultural", 2.20, 8500000, 18700000, 18700000, 2244000, 39644000],
        [3, "103/4", "Mohammed Aslam Khan", "Residential", 0.90, 12000000, 10800000, 10800000, 1296000, 22896000],
        [4, "104/1", "Harish Kumar Verma", "Agricultural", 1.45, 8500000, 12325000, 12325000, 1479000, 26129000],
        [5, "104/2", "Gram Sabha / Community", "Community Land", 0.65, 8500000, 5525000, 5525000, 663000, 11713000],
    ]

    for row_idx, r in enumerate(rows_data, start=2):
        ws.append(r)
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = XFont(name="Calibri", size=9.5)
            cell.border = thin_border
            if col_idx in (1, 2, 4):
                cell.alignment = XAlign(horizontal="center", vertical="center")
            elif col_idx >= 5:
                cell.alignment = XAlign(horizontal="right", vertical="center")
                if col_idx >= 6:
                    cell.number_format = '₹#,##0'

    # Auto fit column widths
    for col in ws.columns:
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        max_len = max(len(str(c.value or "")) for c in col)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def seed_documents(db: Optional[Session] = None):
    """Seeds realistic placeholder statutory documents and database rows."""
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        # Resolve target collector / state approver user for attribution
        collector_user = db.query(User).filter_by(role=UserRole.DISTRICT_COLLECTOR.value).first()
        collector_id = collector_user.id if collector_user else 1

        # Fetch seeded cases
        cases = db.query(Case).all()
        if not cases:
            print("[LandSync] No cases found to attach documents to. Seed cases first.")
            return

        case1 = cases[0]
        case2 = cases[1] if len(cases) > 1 else case1
        case3 = cases[2] if len(cases) > 2 else case1

        doc_specs = [
            # Case 1 Documents
            {
                "case": case1,
                "title": "Social Impact Assessment & Appraisal Study — Village Chhapraula",
                "filename": "SIA_Report_Village_Chhapraula.pdf",
                "storage_key": f"cases/{case1.id}/SIA_Report_Village_Chhapraula.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.SIA_COMPLETE.value,
                "doc_type": DocumentType.SIA_REPORT.value,
                "document_type": DocumentType.SIA_REPORT.value,
                "statutory_citation": "Section 4 & Section 7(1) RFCTLARR Act, 2013",
                "subject": "Comprehensive Social Impact Assessment (SIA) and Appraisal Report for Dadri Dedicated Freight Corridor.",
                "paragraphs": [
                    "This Social Impact Assessment report has been prepared in accordance with Section 4 of the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement (RFCTLARR) Act, 2013. The proposed acquisition comprises 12.5 hectares of land across Mauza Chhapraula, Tehsil Dadri, District Gautam Buddha Nagar for the execution of the multi-modal freight corridor.",
                    "Public consultations and Gram Sabha hearings conducted between 10th January 2026 and 28th January 2026 recorded unanimous consensus regarding public purpose necessity. A total of 42 project-affected families were enumerated, with mitigation measures integrated into the draft Rehabilitation and Resettlement scheme matrix.",
                    "The independent Expert Group appraised the social costs against the overarching public utility infrastructure benefits and unanimously recommended proceeding with the acquisition under Section 7(4) of the statutory Act."
                ]
            },
            {
                "case": case1,
                "title": "Section 11(1) Preliminary Gazette Notification",
                "filename": "Section_11_Preliminary_Gazette_Notification.pdf",
                "storage_key": f"cases/{case1.id}/Section_11_Preliminary_Gazette_Notification.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.NOTIFICATION_PUBLISHED.value,
                "doc_type": DocumentType.NOTIFICATION.value,
                "document_type": DocumentType.NOTIFICATION.value,
                "statutory_citation": "Section 11(1) RFCTLARR Act, 2013",
                "subject": "Preliminary notification declaring intention to acquire land for statutory public purpose.",
                "paragraphs": [
                    "Whereas it appears to the Appropriate Government that land in the locality specified in the schedule hereto is required for a public purpose, namely the development and operational expansion of the Dadri Industrial Freight Corridor.",
                    "Notice is hereby given to all persons interested that under Section 11(1) of the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013, the Government of Uttar Pradesh intends to acquire the specified parcel boundaries totaling 12.50 hectares.",
                    "Under Section 11(4), no person shall make any transaction or cause any encumbrances on the scheduled land parcels from the date of publication of this gazette notification without the prior written sanction of the District Collector."
                ]
            },
            {
                "case": case1,
                "title": "Cadastral Land Verification Certificate — UP-GB-10024",
                "filename": "Land_Verification_Certificate_UP_GB_10024.pdf",
                "storage_key": f"cases/{case1.id}/Land_Verification_Certificate_UP_GB_10024.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.PROPOSAL_SUBMITTED.value,
                "doc_type": DocumentType.NOTIFICATION.value,
                "document_type": DocumentType.NOTIFICATION.value,
                "statutory_citation": "Section 12 Cadastral Survey Standards",
                "subject": "Joint field inspection, geo-referencing, and revenue title verification of Khasra parcels.",
                "paragraphs": [
                    "Certified that joint field inspection and cadastral boundary verification was conducted by the Tehsildar, Dadri along with the designated Revenue Lekhpal on 18th January 2026. The boundaries have been cross-matched with the District Geoportal GIS database.",
                    "The parcels are confirmed free from unrecorded civil court injunctions, protected forest classification, and sacred grove restrictions. Total net unencumbered area cleared for statutory requisition stands at 12.50 hectares."
                ]
            },
            {
                "case": case1,
                "title": "Section 15 Objection Hearing Record & Minutes",
                "filename": "Section_15_Objection_Hearing_Minutes.pdf",
                "storage_key": f"cases/{case1.id}/Section_15_Objection_Hearing_Minutes.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.OBJECTIONS_WINDOW.value,
                "doc_type": DocumentType.HEARING_MINUTES.value,
                "document_type": DocumentType.HEARING_MINUTES.value,
                "statutory_citation": "Section 15(2) RFCTLARR Act, 2013",
                "subject": "Summary of public objections filed by landowners and Collector determination proceedings.",
                "paragraphs": [
                    "In pursuance of Section 15 of the RFCTLARR Act, 2013, written objections were invited within 60 days from the publication of Section 11(1) notification. Four formal objection petitions were registered regarding alignment modification and compensation multiplier factors.",
                    "Personal hearings were conducted at the Collectorate Conference Hall on 22nd February 2026. All petitioners were afforded opportunity of being heard. Engineering revisions to preserve irrigation canal structures were accepted, and objections were formally disposed of on statutory merit."
                ]
            },
            {
                "case": case1,
                "title": "Section 19 Declaration & Land Acquisition Award Order",
                "filename": "Section_19_Signed_Award_Order.pdf",
                "storage_key": f"cases/{case1.id}/Section_19_Signed_Award_Order.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.AWARD_DECLARED.value,
                "doc_type": DocumentType.AWARD.value,
                "document_type": DocumentType.AWARD.value,
                "statutory_citation": "Section 19(1) & Section 23 RFCTLARR Act, 2013",
                "subject": "Statutory award order determining market value, solatium, and interest under First Schedule.",
                "paragraphs": [
                    "Whereas a declaration under Section 19(1) was published in the official gazette, the Collector has made an inquiry into the respective interests of persons claiming compensation and has formulated the final statutory award under Section 23 of the Act.",
                    "The aggregate compensation determined stands at ₹4,85,00,000 (Rupees Four Crore Eighty-Five Lakhs only), inclusive of 100% solatium mandated under Section 30(1) and 12% per annum additional market value computed from Section 11 notification date.",
                    "Disbursement of compensation shall proceed through Public Financial Management System (PFMS) direct benefit transfer directly to Aadhaar-verified bank accounts of title holders."
                ]
            },
            {
                "case": case1,
                "title": "Rehabilitation & Resettlement Scheme Matrix",
                "filename": "Section_31_RR_Scheme_Matrix.pdf",
                "storage_key": f"cases/{case1.id}/Section_31_RR_Scheme_Matrix.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.RR_IN_PROGRESS.value,
                "doc_type": DocumentType.RR_SCHEME.value,
                "document_type": DocumentType.RR_SCHEME.value,
                "statutory_citation": "Section 31 & Second Schedule RFCTLARR Act, 2013",
                "subject": "Approved R&R entitlements, alternative housing allotment, and skill training provisions.",
                "paragraphs": [
                    "The Rehabilitation and Resettlement Administrator has formulated this statutory scheme in consultation with the Project Affected Families (PAFs) as mandated under Section 31 of the Act.",
                    "Every displaced family is allotted an alternative constructed housing unit of 50 sq.m in the designated resettlement sector, Dadri, accompanied by a one-time subsistence allowance of ₹3,000 per month for 12 months.",
                    "Infrastructure provisions including internal paved roads, drainage, primary health sub-center, and drinking water supply stand sanctioned under the development budget."
                ]
            },
            {
                "case": case2,
                "title": "Gram Sabha Resolution & Free Prior Informed Consent — Pali",
                "filename": "Gram_Sabha_Resolution_Pali.pdf",
                "storage_key": f"cases/{case2.id}/Gram_Sabha_Resolution_Pali.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.SIA_IN_PROGRESS.value,
                "doc_type": DocumentType.OTHER.value,
                "document_type": DocumentType.OTHER.value,
                "statutory_citation": "Section 4(2) RFCTLARR Act, 2013",
                "subject": "Resolution adopted at special Gram Sabha meeting regarding public infrastructure project.",
                "paragraphs": [
                    "A special meeting of the Gram Sabha of Village Pali was convened under the chairmanship of the Gram Pradhan on 5th February 2026. Representatives of the Requiring Body presented the project blueprint and social welfare commitments.",
                    "Following open floor discussions, the Gram Sabha unanimously passed a resolution in favor of the project, subject to timely disbursement of rehabilitation grants and employment preference for local youth in ancillary services."
                ]
            },
            {
                "case": case2,
                "title": "Environmental Clearance Certificate — MoEFCC",
                "filename": "Environmental_Clearance_Certificate_MoEFCC.pdf",
                "storage_key": f"cases/{case2.id}/Environmental_Clearance_Certificate_MoEFCC.pdf",
                "mime_type": "application/pdf",
                "stage": CaseStage.STATE_REVIEW.value,
                "doc_type": DocumentType.DEVELOPMENT_PLAN.value,
                "document_type": DocumentType.DEVELOPMENT_PLAN.value,
                "statutory_citation": "EIA Notification 2006 / EP Act 1986",
                "subject": "Grant of statutory Environmental Clearance for linear infrastructure expansion.",
                "paragraphs": [
                    "The Ministry of Environment, Forest and Climate Change (MoEFCC), Government of India hereby grants Environmental Clearance for the linear infrastructure acquisition alignment in District Gautam Buddha Nagar.",
                    "The clearance is subject to rigorous adherence to the Environmental Management Plan (EMP), mandatory compensatory afforestation at a ratio of 1:3 for all cleared canopy trees, and real-time particulate matter monitoring during earthmoving."
                ]
            },
            # Edge Case Non-PDF File: To deliberately test the HTTP 415 preview fallback!
            {
                "case": case1,
                "title": "Comprehensive Land Valuation & Solatium Calculation Sheet",
                "filename": "Compensation_Estimation_Schedule_Dadri.xlsx",
                "storage_key": f"cases/{case1.id}/Compensation_Estimation_Schedule_Dadri.xlsx",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "stage": CaseStage.AWARD_DECLARED.value,
                "doc_type": DocumentType.AWARD.value,
                "document_type": DocumentType.AWARD.value,
                "is_xlsx": True
            }
        ]

        seeded_count = 0
        for spec in doc_specs:
            case = spec["case"]
            storage_key = spec["storage_key"]
            filename = spec["filename"]
            mime_type = spec["mime_type"]
            title = spec["title"]

            # Generate binary payload
            if spec.get("is_xlsx"):
                file_bytes = create_placeholder_xlsx()
            else:
                file_bytes = create_placeholder_pdf(
                    title=spec["title"],
                    statutory_citation=spec["statutory_citation"],
                    case_ref=f"UP-SEC11-2026-00{case.id}-E",
                    subject=spec["subject"],
                    paragraphs=spec["paragraphs"]
                )

            # Save to disk via StorageService
            StorageService.save(file_bytes, storage_key)

            # Persist or update database record
            existing_doc = db.query(Document).filter(
                (Document.case_id == case.id) & (Document.filename == filename)
            ).first()

            if not existing_doc:
                new_doc = Document(
                    case_id=case.id,
                    stage=spec["stage"],
                    doc_type=spec["doc_type"],
                    document_type=spec["document_type"],
                    title=title,
                    filename=filename,
                    storage_key=storage_key,
                    mime_type=mime_type,
                    file_size_bytes=len(file_bytes),
                    file_url=f"/api/v1/documents/{storage_key}",
                    uploaded_by_user_id=collector_id,
                    uploaded_at=datetime.now(timezone.utc) - timedelta(days=5)
                )
                db.add(new_doc)
                seeded_count += 1
            else:
                existing_doc.storage_key = storage_key
                existing_doc.mime_type = mime_type
                existing_doc.file_size_bytes = len(file_bytes)
                existing_doc.title = title

        db.commit()
        print(f"[LandSync] Successfully seeded {seeded_count} realistic statutory documents across cases.")
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    seed_documents()
