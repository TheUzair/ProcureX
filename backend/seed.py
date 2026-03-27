"""
ProcureX Seed Script — Heavy Realistic 2026 Data
Run: cd backend && ./venv/Scripts/python seed.py
"""

import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import text
from app.database import engine, AsyncSessionLocal, Base
from app.models.user import User
from app.models.vendor import Vendor
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from app.models.audit_log import AuditLog
from app.middleware.auth import hash_password


def rand_date(start: datetime, end: datetime) -> datetime:
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


# ──────────────────────────────────────────────
# USERS (5 realistic team members)
# ──────────────────────────────────────────────
USERS = [
    {"email": "admin@procurex.io", "username": "admin", "password": "Admin@2026", "full_name": "Uzair Ahmed", "mobile": "+923001234567"},
    {"email": "sarah.ops@procurex.io", "username": "sarah.ops", "password": "Sarah@2026", "full_name": "Sarah Chen", "mobile": "+14155551234"},
    {"email": "james.procurement@procurex.io", "username": "james.pro", "password": "James@2026", "full_name": "James O'Brien", "mobile": "+442071234567"},
    {"email": "priya.finance@procurex.io", "username": "priya.fin", "password": "Priya@2026", "full_name": "Priya Sharma", "mobile": "+919876543210"},
    {"email": "carlos.warehouse@procurex.io", "username": "carlos.wh", "password": "Carlos@2026", "full_name": "Carlos Mendoza", "mobile": "+5215512345678"},
]

# ──────────────────────────────────────────────
# VENDORS (20 realistic global suppliers)
# ──────────────────────────────────────────────
VENDORS = [
    {"name": "TechCore Semiconductors", "email": "sales@techcoresemi.com", "phone": "+14085551001", "address": "2890 Zanker Road, Suite 200", "city": "San Jose", "country": "United States"},
    {"name": "Shanghai Precision Parts Co.", "email": "export@shprecision.cn", "phone": "+862151234567", "address": "No. 388 Zhangjiang Road, Pudong", "city": "Shanghai", "country": "China"},
    {"name": "Rhine Industrial GmbH", "email": "vertrieb@rhine-industrial.de", "phone": "+4921145678900", "address": "Industriestraße 45", "city": "Düsseldorf", "country": "Germany"},
    {"name": "Bharat Steel & Alloys", "email": "orders@bharatsteel.in", "phone": "+912240001234", "address": "Plot 12, MIDC Andheri East", "city": "Mumbai", "country": "India"},
    {"name": "Nordic Packaging Solutions AB", "email": "info@nordicpack.se", "phone": "+4687654321", "address": "Sveavägen 164", "city": "Stockholm", "country": "Sweden"},
    {"name": "Sakura Electronics Ltd.", "email": "intl@sakura-elec.co.jp", "phone": "+81345671234", "address": "3-14-1 Hongo, Bunkyo-ku", "city": "Tokyo", "country": "Japan"},
    {"name": "Atlas Logistics & Supply", "email": "procurement@atlaslogistics.ae", "phone": "+97142345678", "address": "Dubai Silicon Oasis, Building A5", "city": "Dubai", "country": "UAE"},
    {"name": "MapleTech Manufacturing Inc.", "email": "sales@mapletech.ca", "phone": "+14165559876", "address": "120 Bloor Street East", "city": "Toronto", "country": "Canada"},
    {"name": "São Paulo Chemical Distributors", "email": "vendas@spchemdist.com.br", "phone": "+551130001234", "address": "Av. Paulista, 1578", "city": "São Paulo", "country": "Brazil"},
    {"name": "EuroFasteners S.r.l.", "email": "commerciale@eurofasteners.it", "phone": "+390245678901", "address": "Via dell'Industria 28", "city": "Milan", "country": "Italy"},
    {"name": "Aussie Raw Materials Pty Ltd", "email": "supply@aussieraw.com.au", "phone": "+61298765432", "address": "55 Clarence Street", "city": "Sydney", "country": "Australia"},
    {"name": "Korea Advanced Components", "email": "global@kac-corp.kr", "phone": "+823456789012", "address": "Gangnam-daero 396", "city": "Seoul", "country": "South Korea"},
    {"name": "Nile Textile Exports", "email": "exports@niletextile.eg", "phone": "+20223456789", "address": "10th of Ramadan City, Block 3", "city": "Cairo", "country": "Egypt"},
    {"name": "Cascadia Timber & Lumber", "email": "orders@cascadiatimber.com", "phone": "+15035551234", "address": "8800 NW St. Helens Road", "city": "Portland", "country": "United States"},
    {"name": "Istanbul Ceramic Works", "email": "ihracat@istanbulceramic.tr", "phone": "+902121234567", "address": "Atatürk Organize Sanayi Bölgesi", "city": "Istanbul", "country": "Turkey"},
    {"name": "Zurich Precision Instruments AG", "email": "sales@zurichprecision.ch", "phone": "+41447654321", "address": "Bahnhofstrasse 72", "city": "Zurich", "country": "Switzerland"},
    {"name": "Lagos Industrial Supplies Ltd", "email": "info@lagosindsupply.ng", "phone": "+2348012345678", "address": "15 Apapa Oshodi Expressway", "city": "Lagos", "country": "Nigeria"},
    {"name": "Warsaw Polymer Solutions Sp. z o.o.", "email": "sprzedaz@warsawpolymer.pl", "phone": "+48221234567", "address": "ul. Żwirki i Wigury 101", "city": "Warsaw", "country": "Poland"},
    {"name": "Santiago Mining Equipment SpA", "email": "ventas@santiagomining.cl", "phone": "+56223456789", "address": "Av. Apoquindo 4700", "city": "Santiago", "country": "Chile"},
    {"name": "Bangkok Rubber & Composites", "email": "export@bkk-rubber.th", "phone": "+6621234567", "address": "789 Sukhumvit Road, Khlong Toei", "city": "Bangkok", "country": "Thailand"},
]

# ──────────────────────────────────────────────
# PRODUCTS (50 realistic procurement items)
# ──────────────────────────────────────────────
PRODUCTS = [
    # Electronics & Components
    {"name": "ARM Cortex-M7 Microcontroller (STM32H7)", "sku": "ELEC-MCU-001", "category": "Electronics", "description": "High-performance 32-bit MCU with 480MHz clock, 2MB Flash, ideal for industrial IoT applications.", "unit_price": "12.45", "stock": 15000},
    {"name": "0805 Ceramic Capacitor 100nF 50V", "sku": "ELEC-CAP-002", "category": "Electronics", "description": "X7R dielectric MLCC capacitor for decoupling and filtering. RoHS compliant, AEC-Q200 qualified.", "unit_price": "0.03", "stock": 500000},
    {"name": "USB-C PD 3.1 Controller IC", "sku": "ELEC-USB-003", "category": "Electronics", "description": "240W EPR capable USB-C power delivery controller with integrated load switch.", "unit_price": "3.78", "stock": 25000},
    {"name": "5G mmWave Antenna Module 28GHz", "sku": "ELEC-ANT-004", "category": "Electronics", "description": "Phased array antenna module for 5G NR FR2 band n257/n258, 12dBi gain.", "unit_price": "45.90", "stock": 3000},
    {"name": "Industrial PoE+ Ethernet Switch 8-Port", "sku": "ELEC-NET-005", "category": "Electronics", "description": "Managed L2+ switch with 8x GbE PoE+ ports, 240W budget, -40°C to 75°C operating range.", "unit_price": "289.00", "stock": 500},
    # Raw Materials
    {"name": "304 Stainless Steel Sheet 4x8ft 16ga", "sku": "RAW-SS-006", "category": "Raw Materials", "description": "2B finish, ASTM A240 certified. 1.2mm thickness, ideal for food-grade fabrication.", "unit_price": "185.00", "stock": 800},
    {"name": "6061-T6 Aluminum Bar Stock 2\" Dia", "sku": "RAW-AL-007", "category": "Raw Materials", "description": "Aircraft-grade aluminum alloy rod, 12ft length. Excellent machinability and corrosion resistance.", "unit_price": "42.50", "stock": 1200},
    {"name": "HDPE Resin Pellets (Blow Molding Grade)", "sku": "RAW-PLY-008", "category": "Raw Materials", "description": "High-density polyethylene pellets, MFI 0.35g/10min, for industrial container blow molding.", "unit_price": "1.85", "stock": 50000},
    {"name": "Copper Wire Rod 8mm Continuous Cast", "sku": "RAW-CU-009", "category": "Raw Materials", "description": "99.99% purity oxygen-free copper rod for electrical conductor manufacturing.", "unit_price": "9.20", "stock": 10000},
    {"name": "Natural Rubber RSS Grade 3", "sku": "RAW-RUB-010", "category": "Raw Materials", "description": "Ribbed smoked sheet rubber, ASTM D2227, for tire and industrial belt manufacturing.", "unit_price": "2.10", "stock": 30000},
    # Fasteners & Hardware
    {"name": "M8x30 Hex Bolt Grade 10.9 Zinc", "sku": "HW-BLT-011", "category": "Fasteners", "description": "DIN 933 full thread hex bolt, class 10.9 high tensile, zinc plated finish.", "unit_price": "0.18", "stock": 200000},
    {"name": "M6 Nylock Nut Stainless A2-70", "sku": "HW-NUT-012", "category": "Fasteners", "description": "DIN 985 self-locking nut with nylon insert, A2 stainless steel.", "unit_price": "0.08", "stock": 350000},
    {"name": "6203-2RS Deep Groove Ball Bearing", "sku": "HW-BRG-013", "category": "Bearings", "description": "17x40x12mm sealed bearing, C3 clearance, 15000 RPM rated speed.", "unit_price": "4.25", "stock": 20000},
    {"name": "Linear Rail Guide MGN12H 400mm", "sku": "HW-LIN-014", "category": "Linear Motion", "description": "Miniature linear guide with carriage block. Preloaded, 0.02mm accuracy class.", "unit_price": "18.90", "stock": 5000},
    {"name": "Pneumatic Cylinder ISO 15552 Ø63 x 200mm", "sku": "HW-PNU-015", "category": "Pneumatics", "description": "Double-acting air cylinder with magnetic piston, cushioned end positions.", "unit_price": "67.50", "stock": 2000},
    # Safety & PPE
    {"name": "3M SecureFit 500 Safety Glasses Anti-Fog", "sku": "PPE-EYE-016", "category": "Safety", "description": "Scotchgard anti-fog coated lens, adjustable temple, ANSI Z87.1+ rated.", "unit_price": "8.50", "stock": 10000},
    {"name": "Cut-Resistant Gloves ANSI A4 Level", "sku": "PPE-GLV-017", "category": "Safety", "description": "HPPE/steel fiber blend with nitrile palm coating. Touchscreen compatible fingertips.", "unit_price": "6.75", "stock": 15000},
    {"name": "Steel Toe Waterproof Work Boots Size Range", "sku": "PPE-BOT-018", "category": "Safety", "description": "ASTM F2413-18 rated, electrical hazard protection, slip-resistant Vibram outsole.", "unit_price": "124.99", "stock": 3000},
    {"name": "Hard Hat Type II Full Brim w/ Ratchet", "sku": "PPE-HAT-019", "category": "Safety", "description": "ANSI Z89.1 Type II Class E, 4-point ratchet suspension, UV-stabilized HDPE shell.", "unit_price": "32.00", "stock": 5000},
    {"name": "Half-Face Respirator with P100 Cartridges", "sku": "PPE-RSP-020", "category": "Safety", "description": "NIOSH-approved silicone facepiece with bayonet-style P100/OV combo filters.", "unit_price": "38.95", "stock": 4000},
    # Office & IT
    {"name": "27\" 4K IPS Monitor USB-C Hub", "sku": "IT-MON-021", "category": "IT Equipment", "description": "3840x2160 IPS panel, 100% sRGB, 65W USB-C PD, built-in KVM switch.", "unit_price": "449.00", "stock": 200},
    {"name": "Mechanical Keyboard Cherry MX Brown", "sku": "IT-KEY-022", "category": "IT Equipment", "description": "Full-size layout, PBT keycaps, USB-C detachable cable, hot-swappable switches.", "unit_price": "89.99", "stock": 500},
    {"name": "Cat6A Shielded Patch Cable 10ft (Pack 24)", "sku": "IT-CBL-023", "category": "IT Equipment", "description": "S/FTP Cat6A snagless cables, 10Gbps rated, LSZH jacket, individually tested.", "unit_price": "72.00", "stock": 1000},
    {"name": "1TB NVMe SSD PCIe Gen4 Enterprise", "sku": "IT-SSD-024", "category": "IT Equipment", "description": "7000MB/s sequential read, 1.4M IOPS random, 1 DWPD endurance, 5-year warranty.", "unit_price": "134.99", "stock": 400},
    {"name": "48V 16A Rack-Mount UPS 2U", "sku": "IT-UPS-025", "category": "IT Equipment", "description": "Online double-conversion 3kVA UPS, hot-swappable batteries, SNMP management.", "unit_price": "1289.00", "stock": 50},
    # Packaging
    {"name": "Corrugated Box 18x14x12\" 32ECT (Bundle 25)", "sku": "PKG-BOX-026", "category": "Packaging", "description": "Single-wall RSC corrugated boxes, kraft, 32 ECT rated for 65lb contents.", "unit_price": "28.50", "stock": 8000},
    {"name": "Stretch Wrap 18\" x 1500ft 80ga (4 rolls)", "sku": "PKG-WRP-027", "category": "Packaging", "description": "Machine-grade cast stretch film, 300% elongation, excellent cling and puncture resistance.", "unit_price": "45.00", "stock": 3000},
    {"name": "Bubble Mailer 10.5x16\" Kraft (Pack 50)", "sku": "PKG-BUB-028", "category": "Packaging", "description": "Self-seal padded mailers with 3/16\" bubble lining, moisture-resistant kraft exterior.", "unit_price": "22.99", "stock": 6000},
    {"name": "Pallet Wrap Corner Boards 2x2x48\" (Pack 50)", "sku": "PKG-CRN-029", "category": "Packaging", "description": "White L-profile edge protectors, 0.160\" caliper, prevent strap crushing.", "unit_price": "34.00", "stock": 4000},
    {"name": "Custom Printed Tape 2\" x 110yd (36 rolls)", "sku": "PKG-TPE-030", "category": "Packaging", "description": "Hot melt adhesive packing tape with 2-color branding print, heavy duty 3.0mil.", "unit_price": "89.00", "stock": 2000},
    # Chemicals & Lubricants
    {"name": "Isopropyl Alcohol 99.9% Electronics Grade 5L", "sku": "CHM-IPA-031", "category": "Chemicals", "description": "Ultra-pure IPA for PCB cleaning and electronics manufacturing. Semiconductor grade.", "unit_price": "24.50", "stock": 5000},
    {"name": "CNC Cutting Fluid Concentrate 20L", "sku": "CHM-CUT-032", "category": "Chemicals", "description": "Semi-synthetic metalworking fluid for ferrous and non-ferrous machining. Bio-stable formula.", "unit_price": "78.00", "stock": 1500},
    {"name": "Industrial Degreaser 5-Gallon Pail", "sku": "CHM-DGR-033", "category": "Chemicals", "description": "Water-based alkaline degreaser, non-flammable, safe on all metals. MIL-PRF-87937 spec.", "unit_price": "42.00", "stock": 2000},
    {"name": "High-Temp Silicone Grease 14oz Cartridge", "sku": "CHM-GRS-034", "category": "Chemicals", "description": "Dielectric silicone compound rated -40°F to 500°F. NSF H1 food-grade certified.", "unit_price": "15.80", "stock": 8000},
    {"name": "Thread Locker Medium Strength 50ml", "sku": "CHM-THL-035", "category": "Chemicals", "description": "Anaerobic threadlocking adhesive for M6-M20 fasteners. Removable with hand tools.", "unit_price": "11.25", "stock": 12000},
    # Electrical & Power
    {"name": "3-Phase VFD 5HP 480V AC Drive", "sku": "PWR-VFD-036", "category": "Electrical", "description": "Variable frequency drive with vector control, built-in EMC filter, Modbus RTU.", "unit_price": "485.00", "stock": 150},
    {"name": "DIN Rail 24V 10A Power Supply", "sku": "PWR-PSU-037", "category": "Electrical", "description": "240W industrial power supply, 93% efficiency, universal input, -25°C to 70°C.", "unit_price": "68.00", "stock": 1000},
    {"name": "3-Phase Energy Meter CT Operated", "sku": "PWR-MTR-038", "category": "Electrical", "description": "MID B+D certified energy meter with Modbus/BACnet, 0.5S accuracy class.", "unit_price": "195.00", "stock": 400},
    {"name": "10AWG THHN Wire 500ft Spool (Black)", "sku": "PWR-WIR-039", "category": "Electrical", "description": "600V rated stranded copper building wire, nylon jacket, UL Listed. 30A capacity.", "unit_price": "142.00", "stock": 600},
    {"name": "Industrial LED High Bay 200W 4000K", "sku": "PWR-LED-040", "category": "Electrical", "description": "30000 lumens, IP65 rated, 0-10V dimmable, DLC 5.1 premium listed. 100K hour L70.", "unit_price": "175.00", "stock": 300},
    # Tools & Equipment
    {"name": "Digital Torque Wrench 1/2\" 25-250 ft-lb", "sku": "TLS-TRQ-041", "category": "Tools", "description": "Electronic preset torque wrench with angle measurement, USB data export, ±2% accuracy.", "unit_price": "345.00", "stock": 200},
    {"name": "Cordless Impact Driver 20V Max Kit", "sku": "TLS-DRL-042", "category": "Tools", "description": "Brushless motor, 1800 in-lb torque, 3-speed, includes 2x 5.0Ah batteries and charger.", "unit_price": "199.00", "stock": 400},
    {"name": "Bench-Top Oscilloscope 200MHz 4-Channel", "sku": "TLS-OSC-043", "category": "Test Equipment", "description": "2 GSa/s sample rate, 100M record length, 8\" touchscreen, LAN/USB/HDMI.", "unit_price": "1450.00", "stock": 30},
    {"name": "Thermal Imaging Camera 320x240", "sku": "TLS-THR-044", "category": "Test Equipment", "description": "-20°C to 650°C range, <40mK NETD, MSX enhancement, Wi-Fi streaming.", "unit_price": "2890.00", "stock": 25},
    {"name": "Hydraulic Floor Jack 3-Ton Low Profile", "sku": "TLS-JCK-045", "category": "Tools", "description": "Dual pump rapid lift, 3.5\" to 19.75\" range, safety bypass valve.", "unit_price": "189.00", "stock": 150},
    # Maintenance & Facilities
    {"name": "HEPA Air Purifier Industrial 2000 sq ft", "sku": "FAC-AIR-046", "category": "Facilities", "description": "True HEPA + activated carbon filtration, 400 CFM, CADR 350, IoT-connected.", "unit_price": "895.00", "stock": 60},
    {"name": "Spill Containment Pallet 4-Drum", "sku": "FAC-SPL-047", "category": "Facilities", "description": "66-gallon sump capacity, HDPE construction, forklift accessible, EPA/SPCC compliant.", "unit_price": "265.00", "stock": 100},
    {"name": "Emergency Eyewash Station Gravity-Fed", "sku": "FAC-EYE-048", "category": "Facilities", "description": "16-gallon portable eyewash with dust covers, ANSI Z358.1 compliant, eye/face wash.", "unit_price": "185.00", "stock": 80},
    {"name": "Anti-Fatigue Mat 3x5ft Industrial", "sku": "FAC-MAT-049", "category": "Facilities", "description": "3/4\" thick diamond-plate nitrile rubber, beveled edges, chemical resistant.", "unit_price": "52.00", "stock": 500},
    {"name": "First Aid Kit OSHA Class B 100-Person", "sku": "FAC-FAK-050", "category": "Facilities", "description": "Metal wall-mount cabinet with 500+ pieces. ANSI Z308.1-2021, refillable modules.", "unit_price": "145.00", "stock": 120},
]

# ──────────────────────────────────────────────
# PO NOTES templates
# ──────────────────────────────────────────────
PO_NOTES = [
    "Urgent order — production line stoppage. Please expedite 2-day shipping.",
    "Quarterly restock per MRP forecast Q1 2026. Standard lead time acceptable.",
    "Replacement parts for preventive maintenance scheduled March 2026.",
    "New project kickoff — Green Energy Initiative. Deliver to Building C dock.",
    "Price locked per contract PRC-2026-0042. Net 45 payment terms apply.",
    "Sample order for qualification testing. Full PO to follow upon approval.",
    "Bulk discount applied per email quotation dated Jan 15, 2026.",
    "Ship to secondary warehouse — 789 Industrial Blvd, Houston, TX 77001.",
    "Annual safety equipment refresh per OSHA compliance audit findings.",
    "R&D prototype build — handle with care, temperature-sensitive components.",
    "Customer project #CP-7821. Bill to cost center 4400-ENG.",
    "Consolidate with PO from last week if not yet shipped.",
    "Vendor confirmed availability and 3-week lead time via email Feb 2, 2026.",
    "Insurance and freight included in quoted unit price (DDP Incoterms 2020).",
    "Partial shipments acceptable. Priority: items 1-3 first, balance within 30 days.",
    None, None, None, None, None,  # Some POs have no notes
]


async def seed():
    print("🌱 Starting ProcureX seed (heavy realistic 2026 data)...\n")

    async with AsyncSessionLocal() as session:
        # Check if data already exists
        result = await session.execute(text("SELECT count(*) FROM users"))
        count = result.scalar()
        if count and count > 0:
            print("⚠️  Database already has data. Clearing all tables...")
            await session.execute(text("DELETE FROM purchase_order_items"))
            await session.execute(text("DELETE FROM purchase_orders"))
            await session.execute(text("DELETE FROM audit_logs"))
            await session.execute(text("DELETE FROM products"))
            await session.execute(text("DELETE FROM vendors"))
            await session.execute(text("DELETE FROM users"))
            await session.commit()
            print("   Tables cleared.\n")

        # ── USERS ──
        print("👤 Creating 5 users...")
        user_objects = []
        for u in USERS:
            user = User(
                id=uuid.uuid4(),
                email=u["email"],
                username=u["username"],
                hashed_password=hash_password(u["password"]),
                full_name=u["full_name"],
                mobile=u["mobile"],
                is_active=True,
                is_deleted=False,
            )
            session.add(user)
            user_objects.append(user)
        await session.flush()
        print(f"   ✓ {len(user_objects)} users created (login: admin@procurex.io / Admin@2026)\n")

        # ── VENDORS ──
        print("🏭 Creating 20 vendors...")
        vendor_objects = []
        for v in VENDORS:
            vendor = Vendor(
                id=uuid.uuid4(),
                name=v["name"],
                email=v["email"],
                phone=v["phone"],
                address=v["address"],
                city=v["city"],
                country=v["country"],
                is_active=True,
                is_deleted=False,
                created_by=random.choice(user_objects).id,
            )
            session.add(vendor)
            vendor_objects.append(vendor)
        await session.flush()
        print(f"   ✓ {len(vendor_objects)} vendors created\n")

        # ── PRODUCTS ──
        print("📦 Creating 50 products...")
        product_objects = []
        for p in PRODUCTS:
            product = Product(
                id=uuid.uuid4(),
                name=p["name"],
                sku=p["sku"],
                category=p["category"],
                description=p["description"],
                unit_price=Decimal(p["unit_price"]),
                stock_quantity=p["stock"],
                is_active=True,
                is_deleted=False,
                created_by=random.choice(user_objects).id,
            )
            session.add(product)
            product_objects.append(product)
        await session.flush()
        print(f"   ✓ {len(product_objects)} products created\n")

        # ── PURCHASE ORDERS (75 POs with varied statuses and dates across Jan–Mar 2026) ──
        print("📋 Creating 75 purchase orders with line items...")
        statuses_weighted = (
            [POStatus.DRAFT] * 12
            + [POStatus.APPROVED] * 25
            + [POStatus.COMPLETED] * 28
            + [POStatus.CANCELLED] * 5
            + [POStatus.PENDING_STOCK] * 5
        )

        start_date = datetime(2026, 1, 1, tzinfo=timezone.utc)
        end_date = datetime(2026, 3, 27, tzinfo=timezone.utc)

        po_objects = []
        total_items = 0

        for i in range(1, 76):
            ref = f"PO-2026-{i:04d}"
            status = random.choice(statuses_weighted)
            vendor = random.choice(vendor_objects)
            creator = random.choice(user_objects)
            created_at = rand_date(start_date, end_date)
            notes = random.choice(PO_NOTES)

            # 2-6 line items per PO
            num_items = random.randint(2, 6)
            selected_products = random.sample(product_objects, min(num_items, len(product_objects)))

            items = []
            subtotal = Decimal("0")
            for prod in selected_products:
                qty = random.choice([1, 2, 3, 5, 10, 15, 20, 25, 50, 100, 200, 500])
                unit_price = prod.unit_price
                line_total = unit_price * qty
                subtotal += line_total
                items.append({
                    "product": prod,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "line_total": line_total,
                })

            tax_rate = Decimal(str(random.choice(["0.00", "0.05", "0.07", "0.10", "0.13", "0.18"])))
            tax_amount = (subtotal * tax_rate).quantize(Decimal("0.01"))
            shipping = Decimal(str(random.choice(["0.00", "25.00", "50.00", "75.00", "125.00", "250.00", "500.00"])))
            discount = Decimal("0")
            if random.random() < 0.3:
                discount_pct = Decimal(str(random.choice(["0.02", "0.05", "0.10"])))
                discount = (subtotal * discount_pct).quantize(Decimal("0.01"))
            total = subtotal + tax_amount + shipping - discount

            po = PurchaseOrder(
                id=uuid.uuid4(),
                reference_number=ref,
                vendor_id=vendor.id,
                status=status,
                subtotal=subtotal,
                tax_amount=tax_amount,
                shipping_cost=shipping,
                discount=discount,
                total=total,
                notes=notes,
                is_deleted=False,
                created_at=created_at,
                updated_at=created_at + timedelta(hours=random.randint(0, 72)),
                created_by=creator.id,
            )
            session.add(po)
            await session.flush()

            for item_data in items:
                poi = PurchaseOrderItem(
                    id=uuid.uuid4(),
                    purchase_order_id=po.id,
                    product_id=item_data["product"].id,
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    line_total=item_data["line_total"],
                    created_at=created_at,
                )
                session.add(poi)
                total_items += 1

            po_objects.append(po)

        await session.flush()
        print(f"   ✓ 75 purchase orders created ({total_items} line items total)\n")

        # ── AUDIT LOGS (realistic trail) ──
        print("📝 Creating audit log entries...")
        actions = ["created", "updated", "status_changed", "approved", "completed"]
        audit_count = 0

        for po in po_objects:
            # Every PO has a "created" log
            log = AuditLog(
                id=uuid.uuid4(),
                entity_type="purchase_order",
                entity_id=po.id,
                action="created",
                new_value={"reference_number": po.reference_number, "status": "draft", "total": str(po.total)},
                user_id=po.created_by,
                created_at=po.created_at,
            )
            session.add(log)
            audit_count += 1

            # Approved/completed POs get extra logs
            if po.status in (POStatus.APPROVED, POStatus.COMPLETED):
                log2 = AuditLog(
                    id=uuid.uuid4(),
                    entity_type="purchase_order",
                    entity_id=po.id,
                    action="approved",
                    old_value={"status": "draft"},
                    new_value={"status": "approved"},
                    user_id=random.choice(user_objects).id,
                    created_at=po.created_at + timedelta(hours=random.randint(1, 48)),
                )
                session.add(log2)
                audit_count += 1

            if po.status == POStatus.COMPLETED:
                log3 = AuditLog(
                    id=uuid.uuid4(),
                    entity_type="purchase_order",
                    entity_id=po.id,
                    action="completed",
                    old_value={"status": "approved"},
                    new_value={"status": "completed"},
                    user_id=random.choice(user_objects).id,
                    created_at=po.created_at + timedelta(hours=random.randint(48, 336)),
                )
                session.add(log3)
                audit_count += 1

            if po.status == POStatus.CANCELLED:
                log4 = AuditLog(
                    id=uuid.uuid4(),
                    entity_type="purchase_order",
                    entity_id=po.id,
                    action="status_changed",
                    old_value={"status": "draft"},
                    new_value={"status": "cancelled"},
                    user_id=random.choice(user_objects).id,
                    created_at=po.created_at + timedelta(hours=random.randint(2, 72)),
                )
                session.add(log4)
                audit_count += 1

        # Add some vendor/product creation audits
        for v in vendor_objects[:10]:
            log = AuditLog(
                id=uuid.uuid4(),
                entity_type="vendor",
                entity_id=v.id,
                action="created",
                new_value={"name": v.name, "country": v.country},
                user_id=v.created_by,
                created_at=rand_date(start_date, end_date),
            )
            session.add(log)
            audit_count += 1

        for p in product_objects[:15]:
            log = AuditLog(
                id=uuid.uuid4(),
                entity_type="product",
                entity_id=p.id,
                action="created",
                new_value={"name": p.name, "sku": p.sku, "unit_price": str(p.unit_price)},
                user_id=p.created_by,
                created_at=rand_date(start_date, end_date),
            )
            session.add(log)
            audit_count += 1

        await session.commit()
        print(f"   ✓ {audit_count} audit log entries created\n")

    print("=" * 55)
    print("✅ SEED COMPLETE!")
    print("=" * 55)
    print(f"   Users:           5")
    print(f"   Vendors:         20")
    print(f"   Products:        50")
    print(f"   Purchase Orders: 75 ({total_items} line items)")
    print(f"   Audit Logs:      {audit_count}")
    print()
    print("   🔐 Login: admin@procurex.io / Admin@2026")
    print("=" * 55)


if __name__ == "__main__":
    asyncio.run(seed())
