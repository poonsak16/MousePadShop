import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// กำหนด URL พื้นฐานสำหรับเชื่อมต่อ Backend API
const API_BASE_URL = 'http://119.59.102.161:3035/api'; 

export default function App() {
  // ==========================================
  // 1. STATE MANAGEMENT (ตัวแปรสำหรับเก็บสถานะของระบบ)
  // ==========================================
  const [authView, setAuthView] = useState('login'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [currentUsername, setCurrentUsername] = useState(''); 
  
  // States สำหรับฟอร์ม Authentication (Login / Register)
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');

  // States สำหรับข้อมูลสินค้า (Products) และฟิลเตอร์ค้นหา
  const [products, setProducts] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [minPrice, setMinPrice] = useState(''); 
  const [maxPrice, setMaxPrice] = useState(''); 
  const [selectedCategory, setSelectedCategory] = useState('All'); 
  const [sortBy, setSortBy] = useState('price-asc'); 
  const [loading, setLoading] = useState(false); 
  
  const [currentView, setCurrentView] = useState('list'); 

  // States สำหรับฟอร์มเพิ่ม/แก้ไขสินค้า
  const [isEditMode, setIsEditMode] = useState(false); 
  const [editId, setEditId] = useState(null); 
  const [brand, setBrand] = useState(''); 
  const [description, setDescription] = useState(''); 
  const [size, setSize] = useState('L'); 
  const [price, setPrice] = useState(''); 
  const [type, setType] = useState('Speed'); 
  const [value, setValue] = useState(''); 
  const [image, setImage] = useState(''); 

  // States สำหรับ Modal ยืนยันการลบสินค้า
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); 
  const [itemToDelete, setItemToDelete] = useState(null); 

  // States สำหรับระบบแบ่งหน้า (Pagination)
  const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 4; // ปรับลดจำนวนรายการต่อหน้าให้เหมาะกับมือถือ

  // State สำหรับระบบแจ้งเตือน (Toast Notification)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
    }
  }, [isLoggedIn]);

  // ==========================================
  // 2. API FUNCTIONS
  // ==========================================
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      setAccessibleCurrentPage(1); 
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setAccessibleCurrentPage = (page) => setCurrentPage(page);

  const handleRegister = async () => {
    if (!regUser.trim() || !regPass.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (regPass !== regConfirmPass) {
      showToast('Passwords do not match.', 'error');
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUsername('');
    setLoginUser('');
    setLoginPass('');
    setAuthView('login');
  };

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

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

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

  const handleResetFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory('All');
    setSortBy('price-asc');
    showToast('Filters reset successfully.');
  };

  // ==========================================
  // 3. FILTERING & SORTING LOGIC
  // ==========================================
  const filteredProducts = products.filter(item => {
    const cat = item.category || item.type || 'Speed';
    const matchCat = selectedCategory === 'All' || cat.toLowerCase() === selectedCategory.toLowerCase();

    const itemPriceNum = parseFloat(String(item.productCode || '0').replace(/[^0-9.]/g, '')) || 0;
    const min = minPrice !== '' ? parseFloat(minPrice) : 0;
    const max = maxPrice !== '' ? parseFloat(maxPrice) : Infinity;
    const matchPrice = itemPriceNum >= min && itemPriceNum <= max;

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

  const totalStock = products.reduce((acc, curr) => acc + (parseInt(curr.stock ?? curr.value) || 0), 0);
  const categoriesCount = new Set(products.map(p => p.category || p.type)).size;
  const totalInventoryValue = products.reduce((acc, curr) => {
    const priceNum = parseFloat(String(curr.productCode || '0').replace(/[^0-9.]/g, '')) || 0;
    const stockNum = parseInt(curr.stock ?? curr.value) || 0;
    return acc + (priceNum * stockNum);
  }, 0);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

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
  // 4. RENDER VIEWS (MOBILE OPTIMIZED)
  // ==========================================

  // --- Login / Register ---
  if (!isLoggedIn) {
    if (authView === 'register') {
      return (
        <ScrollView contentContainerStyle={[styles.loginContainer, {backgroundColor: theme.bg}]}>
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
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={[styles.loginContainer, {backgroundColor: theme.bg}]}>
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
      </ScrollView>
    );
  }

  // --- Add / Edit Product Form ---
  if (currentView === 'form') {
    return (
      <ScrollView style={[styles.container, {backgroundColor: theme.bg}]} contentContainerStyle={{padding: 16, paddingBottom: 40}}>
        {toast.visible && (
          <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}
        <View style={[styles.headerMobile, {backgroundColor: theme.headerBg, borderColor: theme.border}]}>
          <Text style={[styles.headerTitleMobile, {color: theme.text}]}>{isEditMode ? 'EDIT SPEC' : 'ADD PRODUCT'}</Text>
          <TouchableOpacity style={[styles.cancelButton, {borderColor: theme.border}]} onPress={() => setCurrentView('list')}>
            <Text style={styles.cancelButtonText}>✕ CANCEL</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.formCardMobile, {backgroundColor: theme.card, borderColor: theme.goldBorder}]}>
          <Text style={[styles.label, {color: theme.subText}]}>Mousepad Brand / Model *</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., Artisan FX Zero" placeholderTextColor="#9CA3AF" value={brand} onChangeText={setBrand} />

          <Text style={[styles.label, {color: theme.subText}]}>Description / Features</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., Smooth control surface" placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} />

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
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., 1290" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={price} onChangeText={setPrice} />

          <Text style={[styles.label, {color: theme.subText}]}>Glide Type</Text>
          <View style={styles.categoryPickerRow}>
            {['Speed', 'Control', 'Hybrid'].map((cat) => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.catChipMobile, {backgroundColor: theme.inputBg, borderColor: theme.border}, type === cat && {backgroundColor: theme.goldLight, borderColor: theme.gold}]} 
                onPress={() => setType(cat)}
              >
                <Text style={[styles.catChipText, {color: theme.subText}, type === cat && {color: theme.gold, fontWeight: '900'}]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, {color: theme.subText}]}>Stock Quantity</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="e.g., 50" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={value} onChangeText={setValue} />

          <Text style={[styles.label, {color: theme.subText}]}>Image URL</Text>
          <TextInput style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} placeholder="Paste image URL" placeholderTextColor="#9CA3AF" value={image} onChangeText={setImage} />

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
            <Text style={styles.saveButtonText}>{isEditMode ? 'SAVE CHANGES' : 'SAVE MOUSEPAD'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- Main Mobile Dashboard & Product List ---
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
            <Text style={[styles.modalTitle, {color: theme.text}]}>CONFIRM DELETION</Text>
            <Text style={[styles.modalDesc, {color: theme.subText}]}>Are you sure you want to remove "{itemToDelete?.brand || itemToDelete?.name}"?</Text>
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

      {/* Header มือถือ */}
      <View style={[styles.headerMobile, {backgroundColor: theme.headerBg, borderColor: theme.border}]}>
        <View style={{flex: 1}}>
          <Text style={[styles.storeTagMobile, {color: theme.gold}]}>ELITE WAREHOUSE</Text>
          <Text style={[styles.headerTitleMobile, {color: theme.text}]} numberOfLines={1}>Gaming Mousepad</Text>
        </View>
        <View style={styles.headerRightRow}>
          <TouchableOpacity style={[styles.addButtonMobile, {backgroundColor: theme.gold}]} onPress={openAddForm}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.logoutButtonMobile, {backgroundColor: theme.inputBg, borderColor: theme.border}]} onPress={handleLogout}>
            <Text style={[styles.logoutButtonText, {color: theme.subText}]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 40}}>
        {/* สถิติแบบการ์ดแถวเดียว เลื่อนขวาได้หรือจัดเรียงแบบ 2x2 */}
        <View style={styles.statsContainerMobile}>
          <View style={[styles.statCardMobile, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <Text style={[styles.statLabel, {color: theme.subText}]}>Items</Text>
            <Text style={[styles.statValue, {color: theme.text}]}>{products.length}</Text>
          </View>
          <View style={[styles.statCardMobile, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <Text style={[styles.statLabel, {color: theme.subText}]}>Stock</Text>
            <Text style={[styles.statValue, {color: theme.text}]}>{totalStock}</Text>
          </View>
          <View style={[styles.statCardMobile, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <Text style={[styles.statLabel, {color: theme.subText}]}>Value</Text>
            <Text style={[styles.statValue, {color: theme.gold}]} numberOfLines={1}>฿{totalInventoryValue.toLocaleString()}</Text>
          </View>
        </View>
        
        {/* ช่องค้นหา & ตัวกรอง */}
        <View style={[styles.filterSectionCard, {backgroundColor: theme.card, borderColor: theme.border}]}>
          <TextInput 
            style={[styles.searchInputMobile, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} 
            placeholderTextColor="#9CA3AF" 
            placeholder="🔍 Search brand, model..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          
          <View style={styles.priceFilterRow}>
            <TextInput 
              style={[styles.priceInputMobile, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} 
              placeholderTextColor="#9CA3AF" 
              placeholder="Min ฿" 
              keyboardType="numeric"
              value={minPrice} 
              onChangeText={setMinPrice} 
            />
            <TextInput 
              style={[styles.priceInputMobile, {backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}]} 
              placeholderTextColor="#9CA3AF" 
              placeholder="Max ฿" 
              keyboardType="numeric"
              value={maxPrice} 
              onChangeText={setMaxPrice} 
            />
            <TouchableOpacity style={[styles.resetButtonMobile, {backgroundColor: theme.inputBg, borderColor: theme.border}]} onPress={handleResetFilters}>
              <Text style={[styles.resetButtonText, {color: theme.text}]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* หมวดหมู่ */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarMobile}>
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
          </ScrollView>

          {/* จัดเรียง */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortBarMobile}>
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
          </ScrollView>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#D4AF37" style={{marginTop: 40}} />
        ) : (
          <View>
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyEmoji, {color: theme.gold}]}>◆</Text>
                <Text style={[styles.emptyTitle, {color: theme.text}]}>No Mousepads Found</Text>
                <Text style={[styles.emptySubtitle, {color: theme.subText}]}>Try adjusting your search criteria.</Text>
                <TouchableOpacity style={[styles.emptyResetBtn, {backgroundColor: theme.gold}]} onPress={handleResetFilters}>
                  <Text style={styles.emptyResetText}>Reset All Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* --- รายการสินค้าแบบ 1 คอลัมน์เต็มจอโทรศัพท์ (Mobile Feed List) --- */}
                <View style={styles.gridContainerMobile}>
                  {currentProducts.map((item) => {
                    const currentStock = parseInt(item.stock ?? item.value) || 0;
                    const isLowStock = currentStock <= 3;

                    return (
                      <View key={item.id} style={[styles.cardMobile, {backgroundColor: theme.card, borderColor: theme.border}]}>
                        <View style={[styles.imageWrapperMobile, {backgroundColor: theme.inputBg, borderColor: theme.border}]}>
                          {item.image ? (
                            <Image source={{uri: item.image}} style={styles.cardImage} resizeMode="contain" />
                          ) : (
                            <Text style={{color: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}}>NO IMAGE</Text>
                          )}
                        </View>

                        <View style={styles.cardBodyMobile}>
                          <View>
                            <View style={styles.badgeRow}>
                              <Text style={[styles.categoryBadge, {backgroundColor: theme.goldLight, borderColor: theme.goldBorder, color: theme.gold}]}>{item.category || item.type || 'Speed'}</Text>
                              <Text style={[styles.stockBadge, {color: isLowStock ? '#DC2626' : theme.subText}]}>
                                {isLowStock ? `⚠️ Stock: ${currentStock}` : `Stock: ${currentStock}`}
                              </Text>
                            </View>
                            <Text style={[styles.cardTitleMobile, {color: theme.text}]} numberOfLines={1}>{item.brand || item.name}</Text>
                            <Text style={[styles.cardSubMobile, {color: theme.subText}]}>Size: {item.sizes || '-'} • <Text style={{fontWeight: '900', color: theme.gold}}>{item.productCode || '0'} THB</Text></Text>
                            <Text style={[styles.cardDescMobile, {color: theme.subText}]} numberOfLines={2}>{item.orderName || item.description || ''}</Text>
                          </View>
                          
                          <View style={styles.actionRowMobile}>
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

                {/* --- Pagination --- */}
                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[styles.pageButton, {backgroundColor: theme.card, borderColor: theme.border}, currentPage === 1 && styles.pageButtonDisabled]} 
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <Text style={[styles.pageButtonText, {color: theme.text}]}>◀ Prev</Text>
                  </TouchableOpacity>

                  <Text style={[styles.pageIndicator, {color: theme.text}]}>
                    {currentPage} / {totalPages}
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
// 5. STYLESHEET (MOBILE SCALED)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  toast: { position: 'absolute', top: 40, alignSelf: 'center', zIndex: 9999, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  toastSuccess: { backgroundColor: '#1A1A1A' },
  toastError: { backgroundColor: '#DC2626' },
  toastText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { padding: 24, borderRadius: 12, width: '100%', maxWidth: 340, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 12, marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  modalActionRow: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { color: '#6B7280', fontWeight: 'bold', fontSize: 11 },
  modalConfirmBtn: { flex: 1, backgroundColor: '#DC2626', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },

  loginContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { padding: 24, borderRadius: 12, borderWidth: 1, width: '100%', maxWidth: 360 },
  loginTag: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 6, textAlign: 'center' },
  loginTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  switchButton: { marginTop: 16, alignItems: 'center' },
  switchButtonText: { fontSize: 12, fontWeight: '700' },

  headerMobile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  storeTagMobile: { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  headerTitleMobile: { fontSize: 16, fontWeight: '900' },
  headerRightRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  userBadgeHeader: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  userBadgeText: { fontSize: 10, fontWeight: 'bold' },
  addButtonMobile: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  logoutButtonMobile: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  logoutButtonText: { fontWeight: '900', fontSize: 10 },
  cancelButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  cancelButtonText: { color: '#6B7280', fontWeight: 'bold', fontSize: 10 },

  statsContainerMobile: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCardMobile: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '900' },

  filterSectionCard: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16, gap: 10 },
  searchInputMobile: { padding: 10, borderRadius: 6, fontSize: 12, borderWidth: 1 },
  priceFilterRow: { flexDirection: 'row', gap: 8 },
  priceInputMobile: { flex: 1, padding: 8, borderRadius: 6, fontSize: 11, borderWidth: 1 },
  resetButtonMobile: { paddingHorizontal: 12, justifyContent: 'center', borderRadius: 6, borderWidth: 1 },
  resetButtonText: { fontWeight: 'bold', fontSize: 11 },

  filterBarMobile: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  sortBarMobile: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  filterChipText: { fontSize: 10, fontWeight: 'bold' },
  sortChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  sortChipText: { fontSize: 10, fontWeight: 'bold' },

  gridContainerMobile: { flexDirection: 'column', gap: 12 },
  cardMobile: { width: '100%', borderRadius: 10, padding: 10, borderWidth: 1, flexDirection: 'row', gap: 12 },
  imageWrapperMobile: { width: 90, height: 90, borderRadius: 6, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '100%', height: '100%' },
  cardBodyMobile: { flex: 1, justifyContent: 'space-between' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, alignItems: 'center' },
  categoryBadge: { fontSize: 8, fontWeight: '900', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, overflow: 'hidden', borderWidth: 1 },
  stockBadge: { fontSize: 9, fontWeight: '800' },
  cardTitleMobile: { fontSize: 14, fontWeight: '900' },
  cardSubMobile: { fontSize: 11, marginTop: 1 },
  cardDescMobile: { fontSize: 10, marginTop: 2, color: '#6B7280' },
  
  actionRowMobile: { flexDirection: 'row', gap: 6, marginTop: 8 },
  editBtn: { paddingVertical: 4, borderRadius: 4, borderWidth: 1, flex: 1, alignItems: 'center' },
  deleteBtn: { backgroundColor: 'rgba(220, 38, 38, 0.05)', paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#FCA5A5', flex: 1, alignItems: 'center' },
  actionText: { fontSize: 10, fontWeight: '900' },

  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 12 },
  pageButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { fontWeight: 'bold', fontSize: 11 },
  pageIndicator: { fontSize: 11, fontWeight: 'bold' },

  formCardMobile: { padding: 16, borderRadius: 10, borderWidth: 1, width: '100%' },
  label: { fontSize: 10, marginBottom: 6, fontWeight: '900', letterSpacing: 0.5 },
  categoryPickerRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, flex: 1, alignItems: 'center' },
  catChipMobile: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  catChipText: { fontSize: 11, fontWeight: 'bold' },
  input: { padding: 10, borderRadius: 6, fontSize: 12, marginBottom: 12, borderWidth: 1 },
  previewContainer: { alignItems: 'center', marginBottom: 12 },
  previewImage: { width: 80, height: 80, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  saveButton: { padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  emptySubtitle: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  emptyResetBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  emptyResetText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 10 }
});