import requests
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

url = "http://119.59.102.161:3035/api/products"

try:
    response = requests.get(url, timeout=5)
    data = response.json()
    df = pd.DataFrame(data)
except Exception as e:
    print(f"เชื่อมต่อ API ไม่สำเร็จ: {e}")
    exit()

if df.empty:
    print("ไม่พบข้อมูลสินค้าในฐานข้อมูล")
    exit()

# ตรวจสอบว่ามีคอลัมน์ price และ stock หรือไม่
if 'price' not in df.columns or 'stock' not in df.columns:
    print("ข้อผิดพลาด: ตารางต้องมีทั้งคอลัมน์ 'price' และ 'stock'")
    exit()

# แปลงข้อมูลเป็นตัวเลข
df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0)
df['stock'] = pd.to_numeric(df['stock'], errors='coerce').fillna(0)

# เลือกใช้ 2 ฟีเจอร์ร่วมกัน (price และ stock)
features = df[['price', 'stock']]

n_samples = len(df)
n_clusters = min(3, n_samples) if n_samples > 0 else 1

# ทำ StandardScaler ให้ข้อมูลทั้งสองคอลัมน์มีสเกลเดียวกัน
scaler = StandardScaler()
scaled = scaler.fit_transform(features)

# รัน K-Means
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(scaled)

print("\n--- ผลลัพธ์ K-Means Clustering (ใช้ทั้ง Price และ Stock) ---")
print(df[['name', 'price', 'stock', 'cluster']])

# พล็อตแสดงกราฟกระจาย (Scatter Plot) เปรียบเทียบ Price กับ Stock
plt.scatter(df['price'], df['stock'], c=df['cluster'], cmap='viridis', s=150)
for i, txt in enumerate(df['name']):
    plt.annotate(txt, (df['price'][i], df['stock'][i]), fontsize=9, xytext=(5,5), textcoords='offset points')

plt.xlabel('Price (THB)')
plt.ylabel('Stock (Units)')
plt.title('K-Means Clustering by Price & Stock')
plt.grid(True)
plt.show()