import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// กำหนด URL พื้นฐานสำหรับเชื่อมต่อ Backend API
const API_BASE_URL = 'http://119.59.102.161:3035/api'; 

export default function App() {
  // ==========================================
  // 1. STATE MANAGEMENT (ตัวแปรสำหรับเก็บสถานะของระบบ)
  // ==========================================
  const [authView, setAuthView] = useState('login'); // ควบคุมมุมมองหน้าล็อกอินหรือสมัครสมาชิก ('login' หรือ 'register')
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือยัง (true/false)
  const [currentUsername, setCurrentUsername] = useState(''); // เก็บชื่อผู้ใช้งานปัจจุบันที่เข้าสู่ระบบ
  
  // States สำหรับฟอร์ม Authentication (Login / Register)
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');

  // States สำหรับข้อมูลสินค้า (Products) และฟิลเตอร์ค้นหา
  const [products, setProducts] = useState([]); // เก็บรายการสินค้าทั้งหมดจาก API
  const [searchQuery, setSearchQuery] = useState(''); // คำค้นหา (Brand, Model, Type, Description)
  const [minPrice, setMinPrice] = useState(''); // ราคาต่ำสุดสำหรับกรอง
  const [maxPrice, setMaxPrice] = useState(''); // ราคาสูงสุดสำหรับกรอง
  const [selectedCategory, setSelectedCategory] = useState('All'); // หมวดหมู่ที่เลือก (All, Speed, Control, Hybrid)
  const [sortBy, setSortBy] = useState('price-asc'); // รูปแบบการจัดเรียงราคา ('price-asc' หรือ 'price-desc')
  const [loading, setLoading] = useState(false); // สถานะกำลังโหลดข้อมูล (Spinner)
  
  const [currentView, setCurrentView] = useState('list'); // ควบคุมหน้าจอหลักระหว่าง 'list' (รายการ) และ 'form' (เพิ่ม/แก้ไข)

  // States สำหรับฟอร์มเพิ่ม/แก้ไขสินค้า (Add / Edit Product Form)
  const [isEditMode, setIsEditMode] = useState(false); // เช็คว่าเป็นโหมดแก้ไข (true) หรือโหมดเพิ่มใหม่ (false)
  const [editId, setEditId] = useState(null); // เก็บ ID ของสินค้าที่กำลังแก้ไข
  const [brand, setBrand] = useState(''); // แบรนด์หรือชื่อรุ่นสินค้า
  const [description, setDescription] = useState(''); // รายละเอียดสินค้า
  const [size, setSize] = useState('L'); // ขนาด (S, M, L, XL, XXL)
  const [price, setPrice] = useState(''); // ราคา (THB)
  const [type, setType] = useState('Speed'); // ประเภทผิวสัมผัส (Speed, Control, Hybrid)
  const [value, setValue] = useState(''); // จำนวนสต็อกสินค้า
  const [image, setImage] = useState(''); // URL รูปภาพสินค้าหรือ Base64

  // States สำหรับ Modal ยืนยันการลบสินค้า
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // ควบคุมการแสดงผล Modal ยืนยันลบ
  const [itemToDelete, setItemToDelete] = useState(null); // เก็บข้อมูลสินค้าที่จะถูกลบ

  // States สำหรับระบบแบ่งหน้า (Pagination)
  const [currentPage, setCurrentPage] = useState(1); // หน้าปัจจุบัน
  const itemsPerPage = 6; // จำนวนสินค้าต่อ 1 หน้า

  // State สำหรับระบบแจ้งเตือน (Toast Notification)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // ฟังก์ชันแสดง Toast Notification (จะหายไปเองใน 3 วินาที)
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  // ==========================================
  // 2. USEEFFECT HOOKS (ดึงข้อมูลอัตโนมัติเมื่อเข้าสู่ระบบ)
  // ==========================================
  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
    }
  }, [isLoggedIn]);

  // ==========================================
  // 3. API FUNCTIONS (ฟังก์ชันเชื่อมต่อ Backend)
  // ==========================================
  
  // ฟังก์ชันดึงข้อมูลสินค้าทั้งหมดจาก Server (ดึงมาทั้งหมดเพื่อให้ Client ทำการ Filter ได้ครอบคลุมรวมถึง Description)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      setCurrentPage(1); 
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสมัครสมาชิกผู้ใช้งานใหม่
  const handleRegister = async () => {
    if (!regUser.trim() || !regPass.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (regPass !== regConfirmPass) {
      showToast('Passwords do not match. Please check again.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUser.trim(), password: regPass.trim() })
      });
      const result = await res.json();

      if (res.ok) {
        showToast('Registration successful! Please sign in.');
        setAuthView('login');
        setRegUser('');
        setRegPass('');
        setRegConfirmPass('');
      } else {
        showToast(result.error || 'Username may already be taken.', 'error');
      }
    } catch (err) {
      showToast('Network connection failed.', 'error');
    }
  };

  // ฟังก์ชันเข้าสู่ระบบ
  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      showToast('Please enter username and password.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass.trim() })
      });
      const result = await res.json();

      if (res.ok) {
        setCurrentUsername(loginUser.trim());
        setIsLoggedIn(true);
        showToast('Sign in successful!');
      } else {
        showToast(result.error || 'Invalid username or password.', 'error');
      }
    } catch (err) {
      showToast('Network connection failed.', 'error');
    }
  };

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUsername('');
    setLoginUser('');
    setLoginPass('');
    setAuthView('login');
  };

  // ฟังก์ชันแปลงไฟล์รูปภาพที่อัปโหลดจากเครื่องให้เป็น Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ฟังก์ชันบันทึกข้อมูลสินค้า (รองรับทั้งเพิ่มสินค้าใหม่ POST และแก้ไขสินค้า PUT)
  const handleSave = async () => {
    if (!brand.trim()) {
      showToast('Please enter brand/model name.', 'error');
      return;
    }
    
    const payload = {
      name: brand.trim(),
      brand: brand.trim(),
      category: type || 'Speed',
      sizes: size || 'L',
      stock: parseInt(value) || 0,
      productCode: price.trim() || '0',
      orderName: description.trim() || '',
      image: image.trim() || null
    };

    const url = isEditMode ? `${API_BASE_URL}/products/${editId}` : `${API_BASE_URL}/products`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        showToast(isEditMode ? 'Changes saved successfully!' : 'Product added successfully!');
        setCurrentView('list');
        fetchProducts();
      } else {
        showToast(result.error || 'Failed to save data.', 'error');
      }
    } catch (err) {
      showToast('Network connection failed.', 'error');
    }
  };

  // เปิด Modal ยืนยันก่อนลบสินค้า
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  // ฟังก์ชันสั่งลบสินค้าออกจากฐานข้อมูล (DELETE)
  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/${itemToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product deleted successfully.');
        fetchProducts();
      } else {
        showToast('Failed to delete product.', 'error');
      }
    } catch (err) {
      showToast('Error occurred during deletion.', 'error');
    } finally {
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  // เปิดฟอร์มสำหรับเพิ่มสินค้าใหม่
  const openAddForm = () => {
    setIsEditMode(false);
    setEditId(null);
    setBrand('');
    setDescription('');
    setSize('L');
    setPrice('');
    setType('Speed');
    setValue('');
    setImage('');
    setCurrentView('form');
  };

  // เปิดฟอร์มสำหรับแก้ไขสินค้า (ดึงข้อมูลเดิมมาใส่ใน State)
  const openEditForm = (item) => {
    setIsEditMode(true);
    setEditId(item.id);
    setBrand(item.brand || item.name || '');
    setDescription(item.orderName || '');
    setSize(item.sizes || 'L');
    setPrice(item.productCode || '');
    setType(item.category || 'Speed');
    setValue(String(item.stock ?? '0'));
    setImage(item.image || '');
    setCurrentView('form');
  };

  // ฟังก์ชันรีเซ็ตค่าตัวกรองทั้งหมดกลับค่าเริ่มต้น
  const handleResetFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory('All');
    setSortBy('price-asc');
    showToast('Filters reset successfully.');
  };

  // ==========================================
  // 4. FILTERING & SORTING LOGIC (ระบบกรองและจัดเรียงข้อมูล ครอบคลุม Description)
  // ==========================================
  const filteredProducts = products.filter(item => {
    const cat = item.category || item.type || 'Speed';
    const matchCat = selectedCategory === 'All' || cat.toLowerCase() === selectedCategory.toLowerCase();

    const itemPriceNum = parseFloat(String(item.productCode || '0').replace(/[^0-9.]/g, '')) || 0;
    const min = minPrice !== '' ? parseFloat(minPrice) : 0;
    const max = maxPrice !== '' ? parseFloat(maxPrice) : Infinity;
    const matchPrice = itemPriceNum >= min && itemPriceNum <= max;

    // รองรับการค้นหาครอบคลุม Brand, Name, Category, Sizes, OrderName และ Description อย่างสมบูรณ์
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = query === '' || 
      (item.brand && item.brand.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (cat && cat.toLowerCase().includes(query)) ||
      (item.sizes && item.sizes.toLowerCase().includes(query)) ||
      (item.orderName && item.orderName.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query));

    return matchCat && matchPrice && matchSearch;
  }).sort((a, b) => {
    const priceA = parseFloat(String(a.productCode || '0').replace(/[^0-9.]/g, '')) || 0;
    const priceB = parseFloat(String(b.productCode || '0').replace(/[^0-9.]/g, '')) || 0;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    return 0; 
  });

  // คำนวณสถิติต่างๆ สำหรับ Dashboard Cards
  const totalItems = products.length;
  const totalStock = products.reduce((acc, curr) => acc + (parseInt(curr.stock ?? curr.value) || 0), 0);
  const categoriesCount = new Set(products.map(p => p.category || p.type)).size;
  
  const totalInventoryValue = products.reduce((acc, curr) => {
    const priceNum = parseFloat(String(curr.productCode || '0').replace(/[^0-9.]/g, '')) || 0;
    const stockNum = parseInt(curr.stock ?? curr.value) || 0;
    return acc + (priceNum * stockNum);
  }, 0);

  // การแบ่งหน้า Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // ธีมสี White & Gold Luxury (ขาว & ทอง)
  const theme = {
    bg: '#FAFAFA',           
    card: '#FFFFFF',         
    text: '#1A1A1A',         
    subText: '#6B7280',      
    border: '#E5E7EB',       
    inputBg: '#F9FAFB',      
    headerBg: '#FFFFFF',     
    gold: '#D4AF37',         
    goldLight: '#FDF8EC',    
    goldBorder: '#E6D59C'
  };

  // ==========================================
  // 5. RENDER VIEWS (ส่วนแสดงผล UI ตามเงื่อนไข)
  // ==========================================

  // --- 5.1 หน้าจอ Login / Register ---
  if (!isLoggedIn) {
    if (authView === 'register') {
      return (
        <View style={[styles.loginContainer, {backgroundColor: theme.bg}]}>
          {toast.visible && (
            <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          )}
          <View style={[styles.loginCard, {backgroundColor: theme.card, borderColor: theme.goldBorder}]}>
            <Text style={[styles.loginTag, {color: theme.gold}]}>◆ ELITE GOLD SYSTEM ◆</Text>
            <Text style={[styles.loginTitle, {color: theme.text}]}>Create Account</Text>
            
            <Text style={[styles.label, {color: theme.subText}]}>Username</Text>
            <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Username" placeholderTextColor="#9CA3AF" value={regUser} onChangeText={setRegUser} />

            <Text style={[styles.label, {color: theme.subText}]}>Password</Text>
            <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Password" placeholderTextColor="#9CA3AF" secureTextEntry value={regPass} onChangeText={setRegPass} />

            <Text style={[styles.label, {color: theme.subText}]}>Confirm Password</Text>
            <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Confirm Password" placeholderTextColor="#9CA3AF" secureTextEntry value={regConfirmPass} onChangeText={setRegConfirmPass} />

            <TouchableOpacity style={[styles.saveButton, {backgroundColor: theme.gold}]} onPress={handleRegister}>
              <Text style={styles.saveButtonText}>🚀 REGISTER</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchButton} onPress={() => setAuthView('login')}>
              <Text style={[styles.switchButtonText, {color: theme.gold}]}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.loginContainer, {backgroundColor: theme.bg}]}>
        {toast.visible && (
          <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}
        <View style={[styles.loginCard, {backgroundColor: theme.card, borderColor: theme.goldBorder}]}>
          <Text style={[styles.loginTag, {color: theme.gold}]}>◆ ELITE GOLD SYSTEM ◆</Text>
          <Text style={[styles.loginTitle, {color: theme.text}]}>System Access</Text>
          
          <Text style={[styles.label, {color: theme.subText}]}>Username</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Username" placeholderTextColor="#9CA3AF" value={loginUser} onChangeText={setLoginUser} />

          <Text style={[styles.label, {color: theme.subText}]}>Password</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Password" placeholderTextColor="#9CA3AF" secureTextEntry value={loginPass} onChangeText={setLoginPass} />

          <TouchableOpacity style={[styles.saveButton, {backgroundColor: theme.gold}]} onPress={handleLogin}>
            <Text style={styles.saveButtonText}>⚡ ACCESS SYSTEM</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => setAuthView('register')}>
            <Text style={[styles.switchButtonText, {color: theme.gold}]}>No account? Register here</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- 5.2 หน้าจอ Add / Edit Product Form ---
  if (currentView === 'form') {
    return (
      <ScrollView style={[styles.container, {backgroundColor: theme.bg}]} contentContainerStyle={{padding: 24}}>
        {toast.visible && (
          <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}
        <View style={[styles.header, {backgroundColor: theme.headerBg, borderColor: theme.border}]}>
          <Text style={[styles.headerTitle, {color: theme.text}]}>{isEditMode ? '◆ EDIT MOUSEPAD SPEC' : ' ADD NEW PRODUCT '}</Text>
          <TouchableOpacity style={[styles.cancelButton, {borderColor: theme.border}]} onPress={() => setCurrentView('list')}>
            <Text style={styles.cancelButtonText}>✕ CANCEL</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.formCard, {backgroundColor: theme.card, borderColor: theme.goldBorder}]}>
          <Text style={[styles.label, {color: theme.subText}]}>Mousepad Brand / Model *</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., Artisan FX Zero, Razer Gigantus V2" placeholderTextColor="#9CA3AF" value={brand} onChangeText={setBrand} />

          <Text style={[styles.label, {color: theme.subText}]}>Description / Features</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., Smooth control surface, stitched edges" placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} />

          <Text style={[styles.label, {color: theme.subText}]}>Surface Size</Text>
          <View style={styles.categoryPickerRow}>
            {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
              <TouchableOpacity 
                key={s} 
                style={[styles.catChip, {backgroundColor: theme.inputBg, borderColor: theme.border}, size === s && {backgroundColor: theme.goldLight, borderColor: theme.gold}]} 
                onPress={() => setSize(s)}
              >
                <Text style={[styles.catChipText, {color: theme.subText}, size === s && {color: theme.gold, fontWeight: '900'}]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, {color: theme.subText}]}>Price (THB)</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., 1,290 THB" placeholderTextColor="#9CA3AF" value={price} onChangeText={setPrice} />

          <Text style={[styles.label, {color: theme.subText}]}>Glide Type</Text>
          <View style={styles.categoryPickerRow}>
            {['Speed', 'Control', 'Hybrid'].map((cat) => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.catChip, {backgroundColor: theme.inputBg, borderColor: theme.border}, type === cat && {backgroundColor: theme.goldLight, borderColor: theme.gold}]} 
                onPress={() => setType(cat)}
              >
                <Text style={[styles.catChipText, {color: theme.subText}, type === cat && {color: theme.gold, fontWeight: '900'}]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, {color: theme.subText}]}>Stock Quantity</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., 50" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={value} onChangeText={setValue} />

          <Text style={[styles.label, {color: theme.subText}]}>Mousepad Image URL</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Paste image URL or choose file below" placeholderTextColor="#9CA3AF" value={image} onChangeText={setImage} />

          {Platform.OS === 'web' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, {color: theme.subText}]}>Upload Image File</Text>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ color: '#4B5563', fontSize: 13, background: theme.inputBg, padding: 10, border: `1px solid ${theme.border}`, width: '100%', borderRadius: 6 }} 
              />
            </View>
          )}

          {image ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />
            </View>
          ) : null}

          <TouchableOpacity style={[styles.saveButton, {backgroundColor: theme.gold}]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{isEditMode ? '◆ SAVE CHANGES' : '◆ SAVE MOUSEPAD'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- 5.3 หน้าจอหลัก Dashboard & Product Grid ---
  return (
    <View style={[styles.container, {backgroundColor: theme.bg}]}>
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Modal ยืนยันการลบสินค้า */}
      {deleteModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, {backgroundColor: theme.card, borderColor: theme.goldBorder}]}>
            <Text style={[styles.modalTitle, {color: theme.text}]}>◆ CONFIRM DELETION</Text>
            <Text style={[styles.modalDesc, {color: theme.subText}]}>Are you sure you want to remove "{itemToDelete?.brand || itemToDelete?.name}" from warehouse?</Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalCancelBtn, {borderColor: theme.border}]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={executeDelete}>
                <Text style={styles.modalConfirmText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Header ของระบบ */}
      <View style={[styles.header, {backgroundColor: theme.headerBg, borderColor: theme.border}]}>
        <View>
          <Text style={[styles.storeTag, {color: theme.gold}]}>ELITE GAMING MOUSEPAD WAREHOUSE</Text>
          <Text style={[styles.headerTitle, {color: theme.text}]}>Gaming Mousepad Inventory</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap'}}>
          <View style={[styles.userBadgeHeader, {backgroundColor: theme.inputBg, borderColor: theme.border}]}>
            <Text style={[styles.userBadgeText, {color: theme.text}]}>◆ {currentUsername} <Text style={{color: theme.gold}}>[ADMIN]</Text></Text>
          </View>

          <TouchableOpacity style={[styles.addButton, {backgroundColor: theme.gold}]} onPress={openAddForm}>
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.logoutButton, {backgroundColor: theme.inputBg, borderColor: theme.border}]} onPress={handleLogout}>
            <Text style={[styles.logoutButtonText, {color: theme.subText}]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{padding: 24}}>
        {/* ส่วนแสดงสถิติลอย (Dashboard Stats Cards) */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <Text style={[styles.statLabel, {color: theme.subText}]}>Total Items</Text>
            <Text style={[styles.statValue, {color: theme.text}]}>{products.length} <Text style={styles.statUnit}>items</Text></Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <Text style={[styles.statLabel, {color: theme.subText}]}>Total Stock</Text>
            <Text style={[styles.statValue, {color: theme.text}]}>{totalStock} <Text style={styles.statUnit}>pcs</Text></Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <Text style={[styles.statLabel, {color: theme.subText}]}>Categories</Text>
            <Text style={[styles.statValue, {color: theme.text}]}>{categoriesCount} <Text style={styles.statUnit}>groups</Text></Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <Text style={[styles.statLabel, {color: theme.subText}]}>Inventory Value</Text>
            <Text style={[styles.statValue, {color: theme.gold}]}>{totalInventoryValue.toLocaleString()} <Text style={styles.statUnit}>THB</Text></Text>
          </View>
        </View>
        
        {/* แถบค้นหา (Search) และตัวกรองราคา/หมวดหมู่ */}
        <View style={[styles.filterSectionCard, {backgroundColor: theme.card, borderColor: theme.border}]}>
          <View style={styles.searchRow}>
            <TextInput 
              style={[styles.searchInput, {flex: 1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} 
              placeholderTextColor="#9CA3AF" 
              placeholder="🔍 Search brand, model, description..." 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
            <TextInput 
              style={[styles.priceInputSmall, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} 
              placeholderTextColor="#9CA3AF" 
              placeholder="Min ฿" 
              keyboardType="numeric"
              value={minPrice} 
              onChangeText={setMinPrice} 
            />
            <TextInput 
              style={[styles.priceInputSmall, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} 
              placeholderTextColor="#9CA3AF" 
              placeholder="Max ฿" 
              keyboardType="numeric"
              value={maxPrice} 
              onChangeText={setMaxPrice} 
            />
            <TouchableOpacity style={[styles.resetButton, {backgroundColor: theme.inputBg, borderColor: theme.border}]} onPress={handleResetFilters}>
              <Text style={[styles.resetButtonText, {color: theme.text}]}>🗑️ Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterAndSortRow}>
            <View style={styles.filterBar}>
              {['All', 'Speed', 'Control', 'Hybrid'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.filterChip, {backgroundColor: theme.inputBg, borderColor: theme.border}, selectedCategory === cat && {backgroundColor: theme.goldLight, borderColor: theme.gold}]} 
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                >
                  <Text style={[styles.filterChipText, {color: theme.subText}, selectedCategory === cat && {color: theme.gold, fontWeight: '900'}]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sortBar}>
              {[
                { key: 'price-asc', label: 'Price: Low ➔ High' },
                { key: 'price-desc', label: 'Price: High ➔ Low' }
              ].map((s) => (
                <TouchableOpacity 
                  key={s.key} 
                  style={[styles.sortChip, {backgroundColor: theme.inputBg, borderColor: theme.border}, sortBy === s.key && {backgroundColor: theme.goldLight, borderColor: theme.gold}]} 
                  onPress={() => setSortBy(s.key)}
                >
                  <Text style={[styles.sortChipText, {color: theme.subText}, sortBy === s.key && {color: theme.gold, fontWeight: '900'}]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#D4AF37" style={{marginTop: 40}} />
        ) : (
          <View>
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyEmoji, {color: theme.gold}]}>◆</Text>
                <Text style={[styles.emptyTitle, {color: theme.text}]}>No Mousepads Found</Text>
                <Text style={[styles.emptySubtitle, {color: theme.subText}]}>Try adjusting your search criteria or resetting filters.</Text>
                <TouchableOpacity style={[styles.emptyResetBtn, {backgroundColor: theme.gold}]} onPress={handleResetFilters}>
                  <Text style={styles.emptyResetText}>Reset All Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* --- แสดงรายการสินค้า (Product Grid Cards) --- */}
                <View style={styles.gridContainer}>
                  {currentProducts.map((item) => {
                    const currentStock = parseInt(item.stock ?? item.value) || 0;
                    const isLowStock = currentStock <= 3; // แจ้งเตือนเมื่อสินค้าใกล้หมด (เหลือน้อยกว่าหรือเท่ากับ 3 ชิ้น)

                    return (
                      <View key={item.id} style={[styles.card, {backgroundColor: theme.card, borderColor: theme.border}]}>
                        {/* กรอบรูปภาพสินค้าแนวตั้งแบบ Contain ป้องกันรูปถูกตัด */}
                        <View style={[styles.imageWrapper, {backgroundColor: theme.inputBg, borderColor: theme.border}]}>
                          {item.image ? (
                            <Image source={{uri: item.image}} style={styles.cardImage} resizeMode="contain" />
                          ) : (
                            <Text style={{color: '#9CA3AF', fontSize: 11, fontWeight: 'bold', letterSpacing: 1}}>NO IMAGE</Text>
                          )}
                        </View>

                        {/* รายละเอียดข้อมูลสินค้า */}
                        <View style={styles.cardBody}>
                          <View>
                            <View style={styles.badgeRow}>
                              <Text style={[styles.categoryBadge, {backgroundColor: theme.goldLight, borderColor: theme.goldBorder, color: theme.gold}]}>{item.category || item.type || 'Speed'}</Text>
                              <Text style={[styles.stockBadge, {color: isLowStock ? '#DC2626' : theme.subText}]}>
                                {isLowStock ? `⚠️ Stock: ${currentStock}` : `Stock: ${currentStock}`}
                              </Text>
                            </View>
                            <Text style={[styles.cardTitle, {color: theme.text}]} numberOfLines={1}>{item.brand || item.name}</Text>
                            <Text style={[styles.cardSub, {color: theme.subText}]}>Size: {item.sizes || '-'} • <Text style={{fontWeight: '900', color: theme.gold}}>{item.productCode || '0'} THB</Text></Text>
                            <Text style={[styles.cardDesc, {color: theme.subText}]} numberOfLines={1}>{item.orderName || item.description || ''}</Text>
                          </View>
                          
                          {/* ปุ่มแก้ไขและลบสินค้า */}
                          <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.editBtn, {backgroundColor: theme.inputBg, borderColor: theme.border}]} onPress={() => openEditForm(item)}>
                              <Text style={[styles.actionText, {color: theme.text}]}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
                              <Text style={[styles.actionText, {color: '#DC2626'}]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* --- ระบบแบ่งหน้า (Pagination Controls) --- */}
                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[styles.pageButton, {backgroundColor: theme.card, borderColor: theme.border}, currentPage === 1 && styles.pageButtonDisabled]} 
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <Text style={[styles.pageButtonText, {color: theme.text}]}>◀ Prev</Text>
                  </TouchableOpacity>

                  <Text style={[styles.pageIndicator, {color: theme.text}]}>
                    Page {currentPage} of {totalPages}
                  </Text>

                  <TouchableOpacity 
                    style={[styles.pageButton, {backgroundColor: theme.card, borderColor: theme.border}, currentPage === totalPages && styles.pageButtonDisabled]} 
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    <Text style={[styles.pageButtonText, {color: theme.text}]}>Next ▶</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ==========================================
// 6. STYLESHEET (การตกแต่งหน้าตาด้วย CSS-in-JS)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  toast: { position: 'absolute', top: 20, alignSelf: 'center', zIndex: 9999, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  toastSuccess: { backgroundColor: '#1A1A1A' },
  toastError: { backgroundColor: '#DC2626' },
  toastText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { padding: 32, borderRadius: 12, width: '100%', maxWidth: 420, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: 1 },
  modalDesc: { fontSize: 13, marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  modalActionRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { color: '#6B7280', fontWeight: 'bold', fontSize: 12 },
  modalConfirmBtn: { flex: 1, backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { padding: 40, borderRadius: 12, borderWidth: 1, width: '100%', maxWidth: 420, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24 },
  loginTag: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  loginTitle: { fontSize: 24, fontWeight: '900', marginBottom: 24, textAlign: 'center', letterSpacing: 0.5 },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchButtonText: { fontSize: 13, fontWeight: '700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1 },
  storeTag: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  userBadgeHeader: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  userBadgeText: { fontSize: 11, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  addButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 6, borderWidth: 1 },
  logoutButtonText: { fontWeight: '900', fontSize: 11 },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  cancelButtonText: { color: '#6B7280', fontWeight: 'bold', fontSize: 11 },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 200, padding: 16, borderRadius: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statUnit: { fontSize: 11, fontWeight: 'normal', color: '#9CA3AF' },
  filterSectionCard: { padding: 16, borderRadius: 10, borderWidth: 1, marginBottom: 20, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { padding: 11, borderRadius: 8, fontSize: 13, borderWidth: 1, minWidth: 220 },
  priceInputSmall: { width: 90, padding: 11, borderRadius: 8, fontSize: 12, borderWidth: 1 },
  resetButton: { paddingHorizontal: 14, paddingVertical: 11, justifyContent: 'center', borderRadius: 8, borderWidth: 1 },
  resetButtonText: { fontWeight: 'bold', fontSize: 11 },
  filterAndSortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  filterBar: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: 'bold' },
  sortBar: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  sortChipText: { fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', marginBottom: 16, maxWidth: 350 },
  emptyResetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  emptyResetText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '48.8%', minWidth: 320, flexGrow: 0, borderRadius: 12, padding: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, flexDirection: 'column', gap: 12 },
  imageWrapper: { width: '100%', height: 180, borderRadius: 8, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '100%', height: '100%' },
  cardBody: { flex: 1, justifyContent: 'space-between', gap: 8 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' },
  categoryBadge: { fontSize: 9, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', borderWidth: 1 },
  stockBadge: { fontSize: 10, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  cardSub: { fontSize: 12, marginTop: 2 },
  cardDesc: { fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, flex: 1, alignItems: 'center' },
  deleteBtn: { backgroundColor: 'rgba(220, 38, 38, 0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5', flex: 1, alignItems: 'center' },
  actionText: { fontSize: 11, fontWeight: '900' },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, gap: 16 },
  pageButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { fontWeight: 'bold', fontSize: 12 },
  pageIndicator: { fontSize: 12, fontWeight: 'bold' },
  formCard: { padding: 32, borderRadius: 12, borderWidth: 1, marginTop: 12, maxWidth: 640, alignSelf: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 },
  label: { fontSize: 11, marginBottom: 8, fontWeight: '900', letterSpacing: 0.5 },
  categoryPickerRow: { flexDirection: 'row', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 6, borderWidth: 1 },
  catChipText: { fontSize: 12, fontWeight: 'bold' },
  input: { padding: 14, borderRadius: 8, fontSize: 14, marginBottom: 18, borderWidth: 1 },
  previewContainer: { alignItems: 'center', marginBottom: 18 },
  previewImage: { width: 110, height: 110, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  saveButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 }
});