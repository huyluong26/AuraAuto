import sys
sys.stdout.reconfigure(encoding="utf-8")
import pandas as pd
import numpy as np

def explore():
    print("Reading Data.xlsx...")
    df = pd.read_excel("Data.xlsx")
    print(f"Total rows: {len(df)}, columns: {len(df.columns)}")
    print("Columns:", list(df.columns))

    print("\n--- SAMPLE ROWS (first 5) ---")
    print(df[['Name', 'Condition', 'Price', 'Year', 'Miles', 'Type', 'Origin', 'Location']].head(5))

    print("\n--- CONDITION COUNTS ---")
    print(df['Condition'].value_counts(dropna=False))

    print("\n--- PRICE SAMPLES & SUMMARY (Raw) ---")
    print(df['Price'].head(15))
    print("Price null count:", df['Price'].isna().sum())

    # Let's inspect some names and prices to confirm Price is in million VNĐ
    sample_cars = df[df['Condition'] == 'Xe cũ'][['Name', 'Price', 'Year', 'Miles']].dropna().head(10)
    print("\n--- SAMPLE USED CARS ---")
    for _, row in sample_cars.iterrows():
        print(f"Name: {row['Name']} | Price: {row['Price']} | Year: {row['Year']} | Miles: {row['Miles']}")

    print("\n--- MILES SAMPLES ---")
    print(df['Miles'].dropna().head(10))

    print("\n--- TYPES (Body Type) ---")
    print(df['Type'].value_counts(dropna=False).head(10))

    print("\n--- ORIGIN ---")
    print(df['Origin'].value_counts(dropna=False).head(10))

if __name__ == "__main__":
    explore()
