import os
import sys
import re
import json
from datetime import datetime
import urllib.request
import urllib.parse
import pandas as pd

# Set stdout to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Helper to read .env manually to avoid dotenv dependency
def load_env():
    env_data = {}
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_data[key.strip()] = val.strip()
    return env_data

env = load_env()
supabase_url = env.get("SUPABASE_URL")
supabase_key = env.get("SUPABASE_KEY")
is_supabase = bool(supabase_url and supabase_key)

excel_path = "27-02-2026 .xlsx"

if not os.path.exists(excel_path):
    print(f"Error: Excel file '{excel_path}' not found in the project root.")
    sys.exit(1)

print("--- Step 1: Loading Excel File ---")
try:
    xls = pd.ExcelFile(excel_path)
    print("Sheets found:", xls.sheet_names)
except Exception as e:
    print(f"Error reading Excel file: {e}")
    sys.exit(1)

# -------------------------------------------------------------
# STEP 2: PARSE CONFIGURATION RULES (DADOS SHEET)
# -------------------------------------------------------------
print("\n--- Step 2: Parsing Config & Rules (Dados Sheet) ---")
try:
    df_dados = pd.read_excel(excel_path, sheet_name="Dados", header=None)
    
    # Defaults
    min_houses = 8
    op_cpa = 3.12
    op_bonus = 25.00
    lead_cpa = 6.00
    lead_bonus = 100.00
    
    # Read rules from Col E (index 4) and Col F (index 5)
    for r in range(df_dados.shape[0]):
        label = str(df_dados.iloc[r, 4]).strip()
        val = df_dados.iloc[r, 5]
        
        if "Casas p/ Bônus" in label:
            min_houses = int(val)
        elif "CPA p/ OP" in label:
            op_cpa = float(val)
        elif "Bônus OP:" in label:
            op_bonus = float(val)
        elif "CPA p/ Lead" in label:
            lead_cpa = float(val)
        elif "Bônus Lead:" in label:
            lead_bonus = float(val)
            
    print(f"Rules parsed:")
    print(f"  Min Houses for Bonus: {min_houses}")
    print(f"  OP CPA Value: R$ {op_cpa}")
    print(f"  OP Bonus: R$ {op_bonus}")
    print(f"  Lead CPA Value: R$ {lead_cpa}")
    print(f"  Lead Bonus: R$ {lead_bonus}")

    # Read operators from Col B (index 1)
    operators_list = []
    for r in range(1, df_dados.shape[0]):
        op_name = str(df_dados.iloc[r, 1]).strip()
        if op_name and op_name != "nan" and op_name != "Operadores":
            operators_list.append(op_name)
    operators_str = ", ".join(operators_list)
    print(f"Operators found: {operators_str}")

    # Read status list from Col C (index 2)
    status_list = []
    for r in range(1, df_dados.shape[0]):
        status_name = str(df_dados.iloc[r, 2]).strip()
        if status_name and status_name != "nan" and status_name != "Status":
            status_list.append(status_name)
    statuses_str = ", ".join(status_list)
    print(f"Statuses found: {statuses_str}")

except Exception as e:
    print(f"Warning: Could not parse Dados sheet, using defaults. Error: {e}")
    min_houses = 8
    op_cpa = 3.12
    op_bonus = 25.00
    lead_cpa = 6.00
    lead_bonus = 100.00
    operators_str = 'Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca'
    statuses_str = '⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu'

# -------------------------------------------------------------
# STEP 3: PARSE LEADS (MAIN SHEET)
# -------------------------------------------------------------
print("\n--- Step 3: Parsing Leads (Main Sheet) ---")
try:
    df_main = pd.read_excel(excel_path, sheet_name="Main", header=None)
    
    # Row 2 (index 2) has the names of the houses for columns 6 to 40
    house_mapping = {}
    for col in range(6, 41):
        house_name = str(df_main.iloc[2, col]).strip()
        if house_name and house_name != "nan":
            house_mapping[col] = house_name
            
    print(f"Mapped {len(house_mapping)} houses columns:")
    print(list(house_mapping.values()))

    leads = []
    
    # Data rows start at index 3 (Row 4 in Excel)
    for r in range(3, df_main.shape[0]):
        # Check if Date is null, indicating an empty/unused row
        raw_date = df_main.iloc[r, 1]
        if pd.isna(raw_date) or str(raw_date).strip() == "nan":
            continue
            
        # Parse Date
        date_str = ""
        if isinstance(raw_date, datetime):
            date_str = raw_date.strftime("%Y-%m-%d")
        else:
            try:
                # Try parsing string date
                date_str = pd.to_datetime(raw_date).strftime("%Y-%m-%d")
            except:
                date_str = datetime.now().strftime("%Y-%m-%d")
                
        name = str(df_main.iloc[r, 2]).strip()
        if not name or name == "nan":
            name = "Sem Nome"
            
        whatsapp = str(df_main.iloc[r, 3]).strip()
        if whatsapp == "nan":
            whatsapp = ""
            
        operator = str(df_main.iloc[r, 4]).strip()
        if operator == "nan":
            operator = "Desconhecido"
            
        status = str(df_main.iloc[r, 5]).strip()
        if status == "nan":
            status = "⏳ Em Andamento"
            
        # Completed houses (where value is True)
        completed_houses = []
        for col_idx, house in house_mapping.items():
            cell_val = df_main.iloc[r, col_idx]
            # Convert to boolean check
            if cell_val is True or str(cell_val).strip().upper() in ["TRUE", "VERDADEIRO", "1", "1.0"]:
                completed_houses.append(house)
                
        # Losses/Perdas
        raw_losses = df_main.iloc[r, 42]
        losses = 0.0
        if pd.notna(raw_losses) and str(raw_losses).strip() != "nan":
            try:
                # Clean currency symbol or text
                clean_val = re.sub(r'[^\d\.\,]', '', str(raw_losses))
                clean_val = clean_val.replace(',', '.')
                losses = float(clean_val)
            except:
                losses = 0.0
                
        # Is Closed (Col 46)
        raw_closed = df_main.iloc[r, 46]
        is_closed = False
        if pd.notna(raw_closed) and str(raw_closed).strip() != "nan":
            val_str = str(raw_closed).strip().upper()
            is_closed = val_str in ["TRUE", "1", "1.0", "VERDADEIRO", "SIM"]
        else:
            # Fallback to status match
            is_closed = "Concluído" in status or "Desistiu" in status or "Golpe" in status
            
        # Indication (Col 48)
        raw_ind = df_main.iloc[r, 48]
        indication = ""
        if pd.notna(raw_ind) and str(raw_ind).strip() != "nan":
            indication = str(raw_ind).strip()
            
        lead_record = {
            "date": date_str,
            "name": name,
            "whatsapp": whatsapp,
            "operator": operator,
            "status": status,
            "completed_houses": completed_houses,
            "losses": losses,
            "is_closed": is_closed,
            "indication": indication
        }
        leads.append(lead_record)
        
    print(f"Successfully parsed {len(leads)} leads from Excel.")

except Exception as e:
    print(f"Error parsing leads: {e}")
    sys.exit(1)

# -------------------------------------------------------------
# STEP 4: IMPORT DATA INTO TARGET DATABASE
# -------------------------------------------------------------
if is_supabase:
    print(f"\n--- Step 4: Importing to Supabase ({supabase_url}) ---")
    
    # 1. Update Config Row
    print("Updating configuration row in Supabase...")
    config_payload = {
        "whatsapp_url": "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
        "admin_password": "admin",
        "headline_value": 300,
        "min_houses_for_bonus": min_houses,
        "op_value_per_cpa": op_cpa,
        "op_bonus": op_bonus,
        "lead_value_per_cpa": lead_cpa,
        "lead_bonus": lead_bonus,
        "operators": operators_str,
        "statuses": statuses_str
    }
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    try:
        # Patch / Update config
        req_url = f"{supabase_url.rstrip('/')}/rest/v1/configs?id=eq.1"
        req = urllib.request.Request(
            req_url,
            data=json.dumps(config_payload).encode("utf-8"),
            headers=headers,
            method="PATCH"
        )
        with urllib.request.urlopen(req) as resp:
            print("Configuration row updated successfully in Supabase.")
    except Exception as e:
        print(f"Error updating config in Supabase: {e}")
        print("Continuing to leads import...")

    # 2. Upload Leads in batches
    print(f"Uploading {len(leads)} leads to Supabase in batches of 100...")
    batch_size = 100
    inserted_count = 0
    
    for i in range(0, len(leads), batch_size):
        batch = leads[i : i + batch_size]
        
        # Map python keys to Supabase database column names
        supabase_batch = []
        for lead in batch:
            supabase_batch.append({
                "date": lead["date"],
                "name": lead["name"],
                "whatsapp": lead["whatsapp"],
                "operator": lead["operator"],
                "status": lead["status"],
                "completed_houses": lead["completed_houses"], # handled as JSONB
                "losses": lead["losses"],
                "is_closed": lead["is_closed"],
                "indication": lead["indication"]
            })
            
        try:
            req_url = f"{supabase_url.rstrip('/')}/rest/v1/leads"
            req = urllib.request.Request(
                req_url,
                data=json.dumps(supabase_batch).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req) as resp:
                inserted_count += len(batch)
                print(f"  Uploaded {inserted_count}/{len(leads)} leads...")
        except Exception as e:
            print(f"Error uploading batch at index {i}: {e}")
            if hasattr(e, 'read'):
                print("  Response error details:", e.read().decode('utf-8'))
            print("Aborting import.")
            sys.exit(1)
            
    print(f"\nSUCCESS: Imported {inserted_count} leads and configuration rules into Supabase!")

else:
    print("\n--- Step 4: Importing to local db/data.json file ---")
    local_db_path = "db/data.json"
    
    local_data = {
        "whatsappUrl": "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
        "adminPassword": "admin",
        "headlineValue": 300,
        "minHousesForBonus": min_houses,
        "opValuePerCpa": op_cpa,
        "opBonus": op_bonus,
        "leadValuePerCpa": lead_cpa,
        "leadBonus": lead_bonus,
        "operators": operators_list,
        "statuses": status_list,
        "houses": [
            { "id": "1", "name": "SUPERBET", "emoji": "🔘", "color": "#f15a24", "value": 50, "active": true },
            { "id": "2", "name": "SPORTINGBET", "emoji": "🔴", "color": "#0055a5", "value": 50, "active": true },
            { "id": "3", "name": "Betboom", "emoji": "💥", "color": "#ffdd00", "value": 60, "active": true },
            { "id": "4", "name": "Donald Bet", "emoji": "🦆", "color": "#ff9900", "value": 50, "active": true },
            { "id": "5", "name": "BETBET", "emoji": "🟣", "color": "#8a2be2", "value": 70, "active": true }
        ],
        "leads": leads
    }
    
    try:
        os.makedirs(os.path.dirname(local_db_path), exist_ok=True)
        with open(local_db_path, "w", encoding="utf-8") as f:
            json.dump(local_data, f, indent=2, ensure_ascii=False)
        print(f"SUCCESS: Local file database '{local_db_path}' updated with {len(leads)} leads and configuration rules!")
    except Exception as e:
        print(f"Error saving local JSON database: {e}")
        sys.exit(1)
