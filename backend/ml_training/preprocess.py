import sys
sys.stdout.reconfigure(encoding="utf-8")
import re
import pandas as pd
import numpy as np

def clean_miles(val):
    if pd.isna(val):
        return np.nan
    s = str(val).replace(",", "").replace(".", "").replace("Km", "").strip()
    match = re.search(r'\d+', s)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return np.nan
    return np.nan

def clean_engine(val):
    if pd.isna(val):
        return "UNKNOWN", np.nan
    s = str(val).strip().lower()

    # Fuel type
    if "dầu" in s or "diesel" in s:
        fuel = "DIESEL"
    elif "hybrid" in s:
        fuel = "HYBRID"
    elif "điện" in s or "electric" in s:
        fuel = "ELECTRIC"
    elif "xăng" in s or "gasoline" in s:
        fuel = "GASOLINE"
    else:
        fuel = "GASOLINE"

    # Displacement
    match = re.search(r'(\d+(?:\.\d+)?)\s*l', s)
    if match:
        try:
            disp = float(match.group(1))
        except ValueError:
            disp = np.nan
    else:
        disp = np.nan

    return fuel, disp

def clean_body_type(val):
    if pd.isna(val):
        return "OTHER"
    s = str(val).strip().lower()
    if "suv" in s or "crossover" in s:
        return "SUV"
    elif "sedan" in s:
        return "SEDAN"
    elif "hatchback" in s:
        return "HATCHBACK"
    elif "bán tải" in s or "pickup" in s:
        return "PICKUP"
    elif "van" in s or "minivan" in s or "mpv" in s:
        return "MPV"
    elif "coupe" in s:
        return "COUPE"
    return "OTHER"

def clean_seats(val):
    if pd.isna(val):
        return np.nan
    match = re.search(r'\d+', str(val))
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return np.nan
    return np.nan

def clean_doors(val):
    if pd.isna(val):
        return np.nan
    match = re.search(r'\d+', str(val))
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return np.nan
    return np.nan

def clean_location(val):
    if pd.isna(val):
        return "Khác"
    s = str(val).strip()
    top_locations = ["Hà Nội", "TP HCM", "Hải Phòng", "Bình Dương", "Đà Nẵng", "Đăk Lăk", "Hải Dương", "Lâm Đồng", "Đồng Nai", "Thái Nguyên"]
    for loc in top_locations:
        if loc.lower() in s.lower():
            return loc
    return "Khác"

def normalize_brand(brand):
    if pd.isna(brand):
        return "Other"
    b = str(brand).strip()
    bl = b.lower()
    if "mercedes" in bl:
        return "Mercedes-Benz"
    if "bmw" in bl:
        return "BMW"
    if "rolls" in bl and "royce" in bl:
        return "Rolls-Royce"
    if "land" in bl and "rover" in bl:
        return "Land Rover"
    if "aston" in bl and "martin" in bl:
        return "Aston Martin"
    if "vinfast" in bl:
        return "VinFast"
    if "kia" in bl:
        return "Kia"
    return b.title()

def extract_model(brand_norm, name):
    if pd.isna(name):
        return "Other"
    s = str(name).strip()
    
    # Strip brand prefixes
    prefixes = [
        "Mercedes-Benz", "Mercedes Benz", "Mercedes",
        "Rolls-Royce", "Rolls Royce",
        "Land Rover", "LandRover",
        "Aston Martin", "AstonMartin",
        brand_norm
    ]
    for p in prefixes:
        s = re.sub(r'^' + re.escape(p) + r'\s*', '', s, flags=re.IGNORECASE).strip()
        
    s_lower = s.lower()
    
    # 1. Mercedes-Benz special patterns
    if brand_norm == "Mercedes-Benz":
        if re.search(r'\bmaybach\b', s_lower):
            return "Maybach"
        if re.search(r'\bc\s*class\b|\bc\d{2,3}\b|^c\b', s_lower):
            return "C-Class"
        if re.search(r'\be\s*class\b|\be\d{2,3}\b|^e\b', s_lower):
            return "E-Class"
        if re.search(r'\bs\s*class\b|\bs\d{2,3}\b|^s\b', s_lower):
            return "S-Class"
        if re.search(r'\bglc\b', s_lower):
            return "GLC"
        if re.search(r'\bgle\b', s_lower):
            return "GLE"
        if re.search(r'\bgls\b', s_lower):
            return "GLS"
        if re.search(r'\bgla\b', s_lower):
            return "GLA"
        if re.search(r'\bglb\b', s_lower):
            return "GLB"
        if re.search(r'\bcla\b', s_lower):
            return "CLA"
        if re.search(r'\bg\s*class\b|\bg63\b|\bg500\b', s_lower):
            return "G-Class"
            
    # 2. BMW special patterns
    if brand_norm == "BMW":
        for series in [1, 2, 3, 4, 5, 6, 7, 8]:
            if re.search(rf'^{series}\s*series\b|^{series}\d\d[a-z]?\b|\b{series}\s*series\b', s_lower):
                return f"{series} Series"
        for x in [1, 2, 3, 4, 5, 6, 7]:
            if re.search(rf'^x{x}\b|\bx{x}\b', s_lower):
                return f"X{x}"
                
    # 3. Audi special patterns
    if brand_norm == "Audi":
        for a in [1, 2, 3, 4, 5, 6, 7, 8]:
            if re.search(rf'^a{a}\b|\ba{a}\b', s_lower):
                return f"A{a}"
        for q in [2, 3, 5, 7, 8]:
            if re.search(rf'^q{q}\b|\bq{q}\b', s_lower):
                return f"Q{q}"
        if "tt" in s_lower:
            return "TT"
            
    # 4. Lexus special patterns
    if brand_norm == "Lexus":
        for m in ['rx', 'lx', 'nx', 'gx', 'es', 'is', 'ls', 'lm', 'ux', 'rc', 'lc']:
            if re.search(rf'^{m}\b|^{m}\d+\b|\b{m}\b|\b{m}\d+\b', s_lower):
                return m.upper()

    # 5. Land Rover special patterns
    if brand_norm == "Land Rover":
        if "velar" in s_lower:
            return "Range Rover Velar"
        if "evoque" in s_lower:
            return "Range Rover Evoque"
        if "sport" in s_lower:
            return "Range Rover Sport"
        if "autobiography" in s_lower or "range rover" in s_lower:
            return "Range Rover"
        if "defender" in s_lower:
            return "Defender"
        if "discovery" in s_lower:
            return "Discovery"

    # 6. Mazda patterns
    if brand_norm == "Mazda":
        if re.search(r'^cx\s*5\b|^cx-5\b|^cx5\b', s_lower): return "CX-5"
        if re.search(r'^cx\s*8\b|^cx-8\b|^cx8\b', s_lower): return "CX-8"
        if re.search(r'^cx\s*30\b|^cx-30\b|^cx30\b', s_lower): return "CX-30"
        if re.search(r'^cx\s*3\b|^cx-3\b|^cx3\b', s_lower): return "CX-3"
        if re.search(r'^bt\s*50\b|^bt-50\b|^bt50\b', s_lower): return "BT-50"
        if re.search(r'^2\b|^mazda\s*2\b', s_lower): return "Mazda 2"
        if re.search(r'^3\b|^mazda\s*3\b', s_lower): return "Mazda 3"
        if re.search(r'^6\b|^mazda\s*6\b', s_lower): return "Mazda 6"

    # 7. VinFast patterns
    if brand_norm == "VinFast":
        if "lux sa" in s_lower: return "Lux SA2.0"
        if "lux a" in s_lower: return "Lux A2.0"
        if "fadil" in s_lower: return "Fadil"
        if "e34" in s_lower: return "VF e34"
        for vf in [3, 5, 6, 7, 8, 9]:
            if re.search(rf'vf\s*{vf}\b', s_lower): return f"VF {vf}"

    # 8. Common multi-word models across other brands
    compounds = [
        'land cruiser prado', 'land cruiser', 'corolla cross', 'veloz cross', 'corolla altis',
        'pajero sport', 'xpander cross', 'ranger raptor', 'grand i10', 'i10 grand'
    ]
    for c in compounds:
        if c in s_lower:
            if c in ['grand i10', 'i10 grand']: return "Grand i10"
            if c == 'corolla altis': return "Corolla Altis"
            if c == 'corolla cross': return "Corolla Cross"
            if c == 'veloz cross': return "Veloz Cross"
            if c == 'land cruiser prado': return "Land Cruiser Prado"
            if c == 'land cruiser': return "Land Cruiser"
            if c == 'pajero sport': return "Pajero Sport"
            if c == 'xpander cross': return "Xpander Cross"
            if c == 'ranger raptor': return "Ranger Raptor"

    # Single token match or first token
    tokens = s.split()
    if tokens:
        first = tokens[0].title()
        # Clean punctuation
        first = re.sub(r'[^a-zA-Z0-9\-_]', '', first)
        # Normalize some names
        if first.lower() in ['santafe', 'santa']: return "SantaFe"
        if first.lower() == 'crv': return "CR-V"
        if first.lower() == 'hrv': return "HR-V"
        if first.lower() == 'i10': return "Grand i10"
        return first
        
    return "Other"

def extract_variant(brand, model, name):
    """Keep an explicit trim when the listing name contains one; otherwise UNKNOWN."""
    if pd.isna(name) or model == "Other":
        return "UNKNOWN"
    s = str(name).lower()
    # Keep distinctive luxury trims that were previously collapsed into UNKNOWN.
    luxury = re.search(r'\b(?:black badge|executive lounge|super sport|autobiography|brabus|rubicon|denali|gt3|carrera|azure|svr|amg)\b', s)
    designation = re.search(r'\b(?:s\s?\d{3}|g\s?\d{2,3}|gl[ces]\s?\d{2,3}|[ce]\s?\d{3}|\d{3}[a-z]?|\d{2,3}li|\d{3}h|\d{2,3}i)\b', s)
    if brand in {"Mercedes-Benz", "Lexus", "BMW", "Land Rover", "Porsche", "Rolls-Royce", "Bentley"}:
        parts = []
        if designation:
            parts.append(designation.group().replace(" ", "").upper())
        if luxury:
            parts.append(luxury.group().upper())
        for marker in ("black badge", "ewb", "lwb", "4matic", "xdrive", "m sport"):
            if re.search(r'\b' + re.escape(marker) + r'\b', s) and marker.upper() not in parts:
                parts.append(marker.upper())
        if parts:
            return " ".join(parts)
    return extract_variant_legacy(brand, model, name)


def extract_variant_legacy(brand, model, name):
    """Original v3 trim extraction, used for a fair holdout comparison."""
    if pd.isna(name) or model == "Other":
        return "UNKNOWN"
    s = str(name).lower()
    # A short, stable trim token captures C200/C300, G CVT, XLS/Wildtrak etc.
    tokens = re.findall(r"[a-z0-9]+(?:[.-][a-z0-9]+)*", s)
    for token in tokens:
        if re.fullmatch(r"(?:c|e|s|glc|gle|gls)\d{2,3}l?|wildtrak|raptor|stormtrak|platinum|titanium|xls|xl|premium|luxury|deluxe", token):
            return token.upper()
    if model.lower() in {"vios", "camry", "fortuner", "morning", "cx-5"}:
        match = re.search(r"\b(?:\d[.]\d)?([egqv])\s*(cvt|mt|at)?\b", s)
        if match:
            return (match.group(1) + (" " + match.group(2) if match.group(2) else "")).upper()
    return "UNKNOWN"

def run_preprocessing(raw_path="Data.xlsx", output_path="backend/ml_training/data/cleaned_cars.csv"):
    print("=== STARTING DATA PREPROCESSING ===")
    df = pd.read_excel(raw_path)
    print(f"1. Raw data shape: {df.shape}")

    # Condition: only 'Xe cũ'
    df['Condition'] = df['Condition'].astype(str).str.strip()
    df = df[df['Condition'] == 'Xe cũ'].copy()
    print(f"2. Used cars subset: {len(df)} rows")

    # Drop records with missing Year or Price
    df = df.dropna(subset=['Price', 'Year']).copy()
    print(f"3. After dropping null Year/Price: {len(df)} rows")

    # Clean Year & Age
    df['Year'] = df['Year'].astype(int)
    # Filter valid years (1995 to 2026)
    df = df[(df['Year'] >= 1995) & (df['Year'] <= 2026)].copy()
    df['Age'] = 2026 - df['Year']

    # Clean Price (in million VNĐ -> target is price in million VNĐ for model stability)
    df['Price_Million'] = df['Price'].astype(float)
    # Outlier filter: 50 million to 15,000 million (15 tỷ)
    df = df[(df['Price_Million'] >= 50.0) & (df['Price_Million'] <= 15000.0)].copy()
    df['Price_VND'] = (df['Price_Million'] * 1_000_000).astype(np.int64)
    print(f"4. After Price outlier filter [50tr - 15 tỷ]: {len(df)} rows")

    # Clean Miles (ODO)
    df['Odometer_Km'] = df['Miles'].apply(clean_miles)
    # Median impute for missing miles based on Age
    median_km_per_year = 15000
    df['Mileage_Unknown'] = df['Odometer_Km'].isna() | ((df['Odometer_Km'] == 0) & (df['Age'] > 1))
    df.loc[df['Mileage_Unknown'], 'Odometer_Km'] = df.loc[df['Mileage_Unknown'], 'Age'] * median_km_per_year

    # Clean Body Type
    df['Body_Type'] = df['Type'].apply(clean_body_type)

    # Clean Engine & Fuel
    engine_results = df['Engine'].apply(clean_engine)
    df['Fuel_Type'] = [r[0] for r in engine_results]
    df['Engine_Displacement'] = [r[1] for r in engine_results]
    df['Engine_Unknown'] = df['Engine_Displacement'].isna()
    # Median impute displacement
    df['Engine_Displacement'] = df['Engine_Displacement'].fillna(df['Engine_Displacement'].median())

    # Clean Seats & Doors
    df['Seats'] = df['Seats'].apply(clean_seats).fillna(5.0)
    df['Doors'] = df['Doors'].apply(clean_doors).fillna(5.0)

    # Clean Origin
    df['Origin'] = df['Origin'].fillna("Lắp ráp trong nước").astype(str).str.strip()
    df['Is_Imported'] = df['Origin'].apply(lambda x: 1 if "nhập khẩu" in x.lower() else 0)

    # Clean Location
    df['Location_Region'] = df['Location'].apply(clean_location)

    # Clean Brand & Model
    df['Brand'] = df['Brand'].apply(normalize_brand)
    df['Model'] = [extract_model(b, n) for b, n in zip(df['Brand'], df['Name'])]
    df['Variant'] = [extract_variant(b, m, n) for b, m, n in zip(df['Brand'], df['Model'], df['Name'])]
    print(f"   Extracted {df['Model'].nunique()} unique vehicle models across {df['Brand'].nunique()} brands.")

    # Drop duplicates by Car_code if present
    if 'Car_code' in df.columns:
        df = df.drop_duplicates(subset=['Car_code'])

    # Final feature columns
    features = [
        'Name',
        'Brand',
        'Model',
        'Variant',
        'Year',
        'Age',
        'Odometer_Km',
        'Mileage_Unknown',
        'Body_Type',
        'Fuel_Type',
        'Engine_Displacement',
        'Engine_Unknown',
        'Seats',
        'Doors',
        'Is_Imported',
        'Location_Region',
        'Price_Million',
        'Price_VND',
    ]

    clean_df = df[features].copy()
    clean_df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"5. Successfully saved cleaned dataset to '{output_path}' with {len(clean_df)} records!")
    print("\n--- CLEANED DATASET SUMMARY ---")
    print(clean_df.info())
    print("\nPrice statistics (Million VNĐ):")
    print(clean_df['Price_Million'].describe())

    return clean_df

if __name__ == "__main__":
    run_preprocessing()
