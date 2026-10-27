"""
Synthetic Sample Dataset Generator for Crime Data Analysis
Adheres strictly to the Kaggle dataset schema: 'Crime Data from 2020 to Present' (LAPD).

Source dataset reference:
https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/22ks-2vno
https://www.kaggle.com/datasets/chaitanyapillai/crime-data-from-2020-to-present

NOTE: This script generates a statistically realistic sample dataset for testing and demonstration
when the full ~800,000+ row Kaggle CSV has not been manually downloaded into data/raw/.
"""

import os
import random
import datetime
import pandas as pd
import numpy as np

# LAPD 21 Geographic Areas with realistic centroid coordinates
LAPD_AREAS = [
    {"code": 1, "name": "Central", "lat": 34.0442, "lon": -118.2518},
    {"code": 2, "name": "Rampart", "lat": 34.0567, "lon": -118.2750},
    {"code": 3, "name": "Southwest", "lat": 34.0169, "lon": -118.3033},
    {"code": 4, "name": "Hollenbeck", "lat": 34.0435, "lon": -118.2117},
    {"code": 5, "name": "Harbor", "lat": 33.7573, "lon": -118.2892},
    {"code": 6, "name": "Hollywood", "lat": 34.1016, "lon": -118.3387},
    {"code": 7, "name": "Wilshire", "lat": 34.0483, "lon": -118.3424},
    {"code": 8, "name": "West LA", "lat": 34.0456, "lon": -118.4489},
    {"code": 9, "name": "Van Nuys", "lat": 34.1867, "lon": -118.4487},
    {"code": 10, "name": "West Valley", "lat": 34.1939, "lon": -118.5463},
    {"code": 11, "name": "Northeast", "lat": 34.1117, "lon": -118.2394},
    {"code": 12, "name": "77th Street", "lat": 33.9703, "lon": -118.2779},
    {"code": 13, "name": "Newton", "lat": 34.0125, "lon": -118.2564},
    {"code": 14, "name": "Pacific", "lat": 33.9917, "lon": -118.4461},
    {"code": 15, "name": "N Hollywood", "lat": 34.1841, "lon": -118.3789},
    {"code": 16, "name": "Foothill", "lat": 34.2533, "lon": -118.4111},
    {"code": 17, "name": "Devonshire", "lat": 34.2570, "lon": -118.5360},
    {"code": 18, "name": "Southeast", "lat": 33.9388, "lon": -118.2464},
    {"code": 19, "name": "Mission", "lat": 34.2729, "lon": -118.4682},
    {"code": 20, "name": "Olympic", "lat": 34.0502, "lon": -118.2917},
    {"code": 21, "name": "Topanga", "lat": 34.2214, "lon": -118.6009},
]

# Top LAPD Crime Codes and Descriptions
CRIME_TYPES = [
    {"code": 510, "desc": "VEHICLE - STOLEN", "weight": 0.16},
    {"code": 624, "desc": "BATTERY - SIMPLE ASSAULT", "weight": 0.13},
    {"code": 330, "desc": "BURGLARY FROM VEHICLE", "weight": 0.11},
    {"code": 310, "desc": "BURGLARY", "weight": 0.10},
    {"code": 354, "desc": "THEFT OF IDENTITY", "weight": 0.08},
    {"code": 440, "desc": "THEFT PLAIN - PETTY ($950 & UNDER)", "weight": 0.08},
    {"code": 740, "desc": "VANDALISM - FELONY ($400 & OVER)", "weight": 0.07},
    {"code": 626, "desc": "INTIMATE PARTNER - SIMPLE ASSAULT", "weight": 0.06},
    {"code": 230, "desc": "ASSAULT WITH DEADLY WEAPON, AGGRAVATED ASSAULT", "weight": 0.06},
    {"code": 210, "desc": "ROBBERY", "weight": 0.05},
    {"code": 341, "desc": "THEFT-GRAND ($950.01 & OVER)EXCPT GUNS/FOWL/MOTOR SER", "weight": 0.04},
    {"code": 442, "desc": "SHOPLIFTING - PETTY THEFT ($950 & UNDER)", "weight": 0.03},
    {"code": 745, "desc": "VANDALISM - MISDEMEANOR ($399 OR UNDER)", "weight": 0.03},
]

PREMISES = [
    {"code": 101, "desc": "STREET", "weight": 0.35},
    {"code": 102, "desc": "SIDEWALK", "weight": 0.18},
    {"code": 501, "desc": "SINGLE FAMILY DWELLING", "weight": 0.16},
    {"code": 502, "desc": "MULTI-UNIT DWELLING (APARTMENT, DUPLEX ETC)", "weight": 0.12},
    {"code": 108, "desc": "PARKING LOT", "weight": 0.10},
    {"code": 404, "desc": "DEPARTMENT STORE", "weight": 0.05},
    {"code": 122, "desc": "VEHICLE, PASSENGER/TRUCK", "weight": 0.04},
]

WEAPONS = [
    {"code": 400, "desc": "STRONG-ARM (HANDS, FIST, FEET OR BODILY FORCE)"},
    {"code": 511, "desc": "BLUNT INSTRUMENT"},
    {"code": 102, "desc": "HANDGUN"},
    {"code": 200, "desc": "KNIFE WITH BLADE 6INCHES OR LESS"},
]

STATUS_CHOICES = [
    {"code": "IC", "desc": "Invest Cont", "weight": 0.78},
    {"code": "AA", "desc": "Adult Arrest", "weight": 0.14},
    {"code": "AO", "desc": "Adult Other", "weight": 0.06},
    {"code": "JA", "desc": "Juv Arrest", "weight": 0.02},
]

STREET_NAMES = [
    "FIGUEROA ST", "HOLLYWOOD BLVD", "SUNSET BLVD", "BROADWAY", "WILSHIRE BLVD",
    "VERMONT AVE", "WESTERN AVE", "MAIN ST", "SEPULVEDA BLVD", "SANTA MONICA BLVD",
    "CRENSHAW BLVD", "PICO BLVD", "OLYMPIC BLVD", "CESAR E CHAVEZ AVE", "VENTURA BLVD"
]

def generate_sample_data(num_records: int = 15000, output_path: str = "data/raw/crime_data_sample.csv") -> str:
    """
    Generates synthetic crime records strictly matching LAPD Kaggle structure.
    """
    print(f"Generating {num_records} realistic crime records matching LAPD schema...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    random.seed(42)
    np.random.seed(42)
    
    start_date = datetime.date(2021, 1, 1)
    end_date = datetime.date(2023, 12, 31)
    total_days = (end_date - start_date).days
    
    crime_weights = [c["weight"] for c in CRIME_TYPES]
    premis_weights = [p["weight"] for p in PREMISES]
    status_weights = [s["weight"] for s in STATUS_CHOICES]
    
    records = []
    
    # Introduce higher incident volume in some known high-density areas (Central, 77th Street, Hollywood, Southwest)
    area_weights = []
    for a in LAPD_AREAS:
        if a["name"] in ["Central", "77th Street", "Hollywood", "Southwest", "Newton", "Rampart"]:
            area_weights.append(1.8)
        elif a["name"] in ["West LA", "Devonshire", "Topanga", "Foothill"]:
            area_weights.append(0.6)
        else:
            area_weights.append(1.0)
    total_area_weight = sum(area_weights)
    area_probs = [w / total_area_weight for w in area_weights]
    
    hour_probs = np.array([
        0.03, 0.02, 0.02, 0.02, 0.02, 0.02,  # 00 - 05
        0.03, 0.04, 0.05, 0.05, 0.05, 0.05,  # 06 - 11
        0.06, 0.06, 0.06, 0.06, 0.06, 0.07,  # 12 - 17
        0.07, 0.06, 0.06, 0.05, 0.05, 0.04   # 18 - 23
    ])
    hour_probs = hour_probs / hour_probs.sum()

    for i in range(num_records):
        dr_no = 200000000 + i + 1000
        days_offset = random.randint(0, total_days)
        occ_date = start_date + datetime.timedelta(days=days_offset)
        # Date Rptd is either same day or 0-5 days later
        rpt_date = occ_date + datetime.timedelta(days=random.choice([0, 0, 0, 1, 1, 2, 5]))
        
        # Time occurred: military time (0001 to 2359). Evening/night has higher crime concentration
        hour_sample = np.random.choice(list(range(24)), p=hour_probs)
        minute_sample = random.randint(0, 59)
        time_occ = hour_sample * 100 + minute_sample
        
        # Area selection
        area_obj = np.random.choice(LAPD_AREAS, p=area_probs)
        area_code = area_obj["code"]
        area_name = area_obj["name"]
        rpt_dist_no = area_code * 100 + random.randint(1, 99)
        
        # Crime selection
        crime_obj = random.choices(CRIME_TYPES, weights=crime_weights, k=1)[0]
        crm_cd = crime_obj["code"]
        crm_cd_desc = crime_obj["desc"]
        
        # Victim profile
        if "VEHICLE" in crm_cd_desc or "BURGLARY" in crm_cd_desc:
            vict_age = random.choice([0, random.randint(22, 68)])
            vict_sex = random.choice(["M", "F", "X"]) if vict_age > 0 else None
            vict_descent = random.choice(["H", "W", "B", "A", "O"]) if vict_age > 0 else None
        else:
            vict_age = random.randint(16, 75)
            vict_sex = random.choice(["M", "F", "X"])
            vict_descent = random.choice(["H", "W", "B", "A", "O"])
            
        # Premise
        premis_obj = random.choices(PREMISES, weights=premis_weights, k=1)[0]
        premis_cd = premis_obj["code"]
        premis_desc = premis_obj["desc"]
        
        # Weapon (if assault or robbery)
        weapon_cd = None
        weapon_desc = None
        if "ASSAULT" in crm_cd_desc or "ROBBERY" in crm_cd_desc:
            w = random.choice(WEAPONS)
            weapon_cd = w["code"]
            weapon_desc = w["desc"]
            
        status_obj = random.choices(STATUS_CHOICES, weights=status_weights, k=1)[0]
        status_code = status_obj["code"]
        status_desc = status_obj["desc"]
        
        street = random.choice(STREET_NAMES)
        bldg_no = random.randint(100, 9900)
        location = f"{bldg_no} {street}"
        
        # Add slight jitter to centroid for realistic spatial scattering
        lat_jitter = np.random.normal(0, 0.015)
        lon_jitter = np.random.normal(0, 0.015)
        lat = round(area_obj["lat"] + lat_jitter, 4)
        lon = round(area_obj["lon"] + lon_jitter, 4)
        
        # Add a tiny percentage (0.5%) of 0.0 coordinates to test data cleaning pipeline!
        if random.random() < 0.005:
            lat = 0.0
            lon = 0.0
            
        records.append({
            "DR_NO": dr_no,
            "Date Rptd": rpt_date.strftime("%m/%d/%Y 12:00:00 AM"),
            "DATE OCC": occ_date.strftime("%m/%d/%Y 12:00:00 AM"),
            "TIME OCC": time_occ,
            "AREA": area_code,
            "AREA NAME": area_name,
            "Rpt Dist No": rpt_dist_no,
            "Crm Cd": crm_cd,
            "Crm Cd Desc": crm_cd_desc,
            "Vict Age": vict_age,
            "Vict Sex": vict_sex,
            "Vict Descent": vict_descent,
            "Premis Cd": premis_cd,
            "Premis Desc": premis_desc,
            "Weapon Used Cd": weapon_cd,
            "Weapon Desc": weapon_desc,
            "Status": status_code,
            "Status Desc": status_desc,
            "Crm Cd 1": crm_cd,
            "LOCATION": location,
            "Cross Street": "",
            "LAT": lat,
            "LON": lon
        })
        
    df = pd.DataFrame(records)
    
    # Add a few duplicates to test deduplication in Spark / data loader
    df = pd.concat([df, df.iloc[:15]], ignore_index=True)
    
    df.to_csv(output_path, index=False)
    print(f"Generated sample dataset: {output_path} with {len(df)} rows and {len(df.columns)} columns.")
    
    # Also save a copy in data/sample/
    sample_copy_path = "data/sample/crime_data_sample.csv"
    os.makedirs(os.path.dirname(sample_copy_path), exist_ok=True)
    df.to_csv(sample_copy_path, index=False)
    print(f"Saved duplicate copy to {sample_copy_path}")
    
    return output_path

if __name__ == "__main__":
    generate_sample_data(num_records=16000)
