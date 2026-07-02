import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://ordercizquake.onrender.com'
);


// Menu data as parsed from ShopeeFood screenshots, enriched with premium descriptions
const MENU_DATA = [
  {
    id: 'mini-blueberry',
    name: 'Mini Box Blueberry',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '1.2RB terjual',
    description: 'Premium Mini Cheesecake topped with sweet, rich blueberry compote.',
    image: '/img/Blueberry.jpeg',
    inStock: true,
    rating: 4.8,
    salesCount: '1.2k'
  },
  {
    id: 'mini-cheese',
    name: 'Mini Box Double Cheese',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '2.5RB terjual',
    description: 'Classic creamy mini cheesecake with a generous layer of grated cheddar cheese.',
    image: '/img/cheese.jpeg',
    inStock: true,
    rating: 5.0,
    salesCount: '2.5k'
  },
  {
    id: 'mini-chocolate',
    name: 'Mini Box Chocolate',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '1.8RB terjual',
    description: 'Decadent mini cheesecake with a rich and smooth chocolate ganache topping.',
    image: '/img/Coklat.jpeg',
    inStock: true,
    rating: 4.9,
    salesCount: '1.8k'
  },
  {
    id: 'mini-lotus',
    name: 'Mini Box Lotus Biscoff',
    category: 'Mini Dessert Box',
    price: 12500,
    sales: '940 terjual',
    description: 'Creamy mini cheesecake layered with smooth Lotus Biscoff spread and biscuit crumbs.',
    image: '/img/Lotus.jpeg',
    inStock: true,
    rating: 4.9,
    salesCount: '940'
  },
  {
    id: 'mini-matcha',
    name: 'Mini Box Matcha',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '560 terjual',
    description: 'Mini cheesecake infused with high-quality Uji Matcha for a perfect sweet-bitter balance.',
    image: '/img/Matcha.jpeg',
    inStock: true,
    rating: 4.8,
    salesCount: '560'
  },
  {
    id: 'mini-oreo',
    name: 'Mini Box Oreo',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '2.1RB terjual',
    description: 'Delicious mini cheesecake with crushed Oreo cookies folded inside and on top.',
    image: '/img/Oreo.jpeg',
    inStock: true,
    rating: 4.9,
    salesCount: '2.1k'
  },
  {
    id: 'mini-redvelvet',
    name: 'Mini Box Red Velvet',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '870 terjual',
    description: 'Elegant red velvet mini cheesecake topped with cream cheese frosting and cake crumbs.',
    image: '/img/Redvelvet.jpeg',
    inStock: true,
    rating: 4.8,
    salesCount: '870'
  },
  {
    id: 'mini-seasalt',
    name: 'Mini Box Sea Salt Caramel',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '1.1RB terjual',
    description: 'Indulgent mini cheesecake with a perfect blend of sweet caramel and a touch of sea salt.',
    image: '/img/Seasalt.jpeg',
    inStock: true,
    rating: 4.9,
    salesCount: '1.1k'
  },
  {
    id: 'mini-tiramisu',
    name: 'Mini Box Tiramisu',
    category: 'Mini Dessert Box',
    price: 10000,
    sales: '1.5RB terjual',
    description: 'Coffee-infused cream cheese layers on a soft ladyfinger biscuit base, dusted with cocoa powder.',
    image: '/img/Tiramisu.jpeg',
    inStock: true,
    rating: 4.9,
    salesCount: '1.5k'
  }
];

export default function App() {
  // App views: 'catalog', 'checkout', 'payment', 'tracking'
  const [currentView, setCurrentView] = useState('catalog');
  
  // Catalog State
  const [menu, setMenu] = useState(MENU_DATA);
  const [selectedCategory, setSelectedCategory] = useState('All menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('All menu');

  // Checkout State
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('cizquake_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('cizquake_customer_phone') || '');
  const [addressSearch, setAddressSearch] = useState('');
  const [areaResults, setAreaResults] = useState([]);
  const [selectedArea, setSelectedArea] = useState(() => {
    try {
      const saved = localStorage.getItem('cizquake_customer_selected_area');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [detailedAddress, setDetailedAddress] = useState(() => localStorage.getItem('cizquake_customer_detailed_address') || '');
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ewallet');
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    if (selectedArea && !addressSearch) {
      setAddressSearch(selectedArea.name);
    }
  }, [selectedArea]);

  // Payment State
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentExpiryTimer, setPaymentExpiryTimer] = useState('15:00');

  // Tracking State
  const [trackingInfo, setTrackingInfo] = useState(null);

  // Admin Panel State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminOrders, setAdminOrders] = useState([]);
  const [isAdminLoadingOrders, setIsAdminLoadingOrders] = useState(false);
  const [adminFilter, setAdminFilter] = useState('all');
  const [adminSubTab, setAdminSubTab] = useState('orders'); // 'orders' or 'stock'

  // Menu Management CRUD State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Mini Dessert Box');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formRating, setFormRating] = useState('4.8');
  const [formSalesCount, setFormSalesCount] = useState('0');
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  // Promo Banner State
  const [promoBanner, setPromoBanner] = useState({
    image: '/img/cheese.jpeg',
    title: 'Mini Box Double Cheese',
    subtitle: 'Our premium double cheese bestseller'
  });
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSubtitle, setPromoSubtitle] = useState('');
  const [promoImage, setPromoImage] = useState('');
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  // Resto Status & Schedule State
  const [restoStatus, setRestoStatus] = useState({
    isOpen: true,
    reason: 'schedule_open',
    until: null
  });
  const [restoSettings, setRestoSettings] = useState(null);
  const [isSavingRestoSettings, setIsSavingRestoSettings] = useState(false);

  const [manualStatus, setManualStatus] = useState('auto');
  const [closeDuration, setCloseDuration] = useState('30m'); // '30m', '1h', 'fullday', 'indefinite', 'custom'
  const [customCloseUntil, setCustomCloseUntil] = useState('');
  
  const [scheduleForm, setScheduleForm] = useState({
    monday: { isOpen: true, openTime: '08:00', closeTime: '21:30' },
    tuesday: { isOpen: true, openTime: '08:00', closeTime: '21:30' },
    wednesday: { isOpen: true, openTime: '08:00', closeTime: '21:30' },
    thursday: { isOpen: true, openTime: '08:00', closeTime: '21:30' },
    friday: { isOpen: true, openTime: '08:00', closeTime: '21:30' },
    saturday: { isOpen: true, openTime: '08:00', closeTime: '21:30' },
    sunday: { isOpen: true, openTime: '08:00', closeTime: '21:30' }
  });

  useEffect(() => {
    if (restoSettings) {
      setManualStatus(restoSettings.manualStatus || 'auto');
      if (restoSettings.schedule) {
        setScheduleForm(restoSettings.schedule);
      }
    }
  }, [restoSettings]);

  // Profile Orders State
  const [profileOrders, setProfileOrders] = useState([]);
  const [isLoadingProfileOrders, setIsLoadingProfileOrders] = useState(false);
  const [profileSearchPhone, setProfileSearchPhone] = useState(() => localStorage.getItem('cizquake_customer_phone') || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileAddress, setEditProfileAddress] = useState('');

  const fetchProfileOrders = async (phone) => {
    if (!phone) return;
    setIsLoadingProfileOrders(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/customer/orders/${phone}`);
      if (response.data.success) {
        setProfileOrders(response.data.orders);
        if (response.data.orders.length > 0) {
          const latestOrder = response.data.orders[0];
          if (!localStorage.getItem('cizquake_customer_name') && latestOrder.customer?.name) {
            setCustomerName(latestOrder.customer.name);
            localStorage.setItem('cizquake_customer_name', latestOrder.customer.name);
          }
          if (!localStorage.getItem('cizquake_customer_detailed_address') && latestOrder.shipping?.address) {
            setDetailedAddress(latestOrder.shipping.address);
            localStorage.setItem('cizquake_customer_detailed_address', latestOrder.shipping.address);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile orders:', err);
    } finally {
      setIsLoadingProfileOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' && customerPhone) {
      fetchProfileOrders(customerPhone);
    }
  }, [activeTab, customerPhone]);

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('cizquake_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('cizquake_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Debouncing Address Search
  useEffect(() => {
    if (addressSearch.length < 3) {
      setAreaResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/shipping/areas?q=${addressSearch}`);
        if (response.data.success) {
          setAreaResults(response.data.areas);
        }
      } catch (err) {
        console.error('Error fetching areas:', err);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [addressSearch]);

  // Load dynamic menu stock & promo banner on mount / view changes
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/menu`);
        if (response.data.success) {
          setMenu(response.data.menu);
        }
      } catch (err) {
        console.error('Error fetching menu stock from backend:', err);
      }
    };
    const fetchPromo = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/promo`);
        if (response.data.success && response.data.promo) {
          setPromoBanner(response.data.promo);
          setPromoTitle(response.data.promo.title);
          setPromoSubtitle(response.data.promo.subtitle);
          setPromoImage(response.data.promo.image);
        }
      } catch (err) {
        console.error('Error fetching promo banner:', err);
      }
    };
    const fetchRestoStatus = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/resto/status`);
        if (response.data.success) {
          setRestoStatus(response.data.state);
          setRestoSettings(response.data.settings);
        }
      } catch (err) {
        console.error('Error fetching resto status:', err);
      }
    };
    fetchMenu();
    fetchPromo();
    fetchRestoStatus();
  }, [currentView, activeTab]);

  // Periodically poll resto status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/resto/status`);
        if (response.data.success) {
          setRestoStatus(response.data.state);
          setRestoSettings(response.data.settings);
        }
      } catch (err) {
        console.error('Error polling resto status:', err);
      }
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch rates when area changes or cart changes
  useEffect(() => {
    if (selectedArea && cart.length > 0) {
      fetchShippingRates();
    }
  }, [selectedArea, cart]);

  // Real-time tracking polling when in tracking view
  useEffect(() => {
    let pollInterval;
    if (currentView === 'tracking' && activeOrderId) {
      fetchOrderStatus(); // initial fetch
      pollInterval = setInterval(fetchOrderStatus, 3000); // poll every 3s
    }
    return () => clearInterval(pollInterval);
  }, [currentView, activeOrderId]);

  // Payment Timer countdown simulation
  useEffect(() => {
    if (currentView === 'payment' && paymentInfo) {
      const expiry = new Date(paymentInfo.expiryTime).getTime();
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          clearInterval(timer);
          setPaymentExpiryTimer('Expired');
        } else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setPaymentExpiryTimer(
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentView, paymentInfo]);

  // -----------------
  // API CALLS
  // -----------------
  const fetchShippingRates = async () => {
    setIsLoadingRates(true);
    setCouriers([]);
    setSelectedCourier(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/shipping/rates`, {
        destination_latitude: selectedArea.latitude,
        destination_longitude: selectedArea.longitude,
        destination_area_id: selectedArea.id,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      });
      if (response.data.success) {
        setCouriers(response.data.rates);
        if (response.data.rates.length > 0) {
          setSelectedCourier(response.data.rates[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!customerName || !customerPhone || !selectedArea || !detailedAddress || !selectedCourier) {
      alert('Mohon lengkapi seluruh data pengiriman.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const payload = {
        customer: {
          name: customerName,
          phone: customerPhone
        },
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        shipping: {
          address: `${detailedAddress}, ${selectedArea.name}`,
          latitude: selectedArea.latitude,
          longitude: selectedArea.longitude,
          courierCompany: selectedCourier.company,
          courierService: selectedCourier.courier_service_name
        },
        totalProductPrice: getCartSubtotal(),
        shippingPrice: selectedCourier.price
      };

      const response = await axios.post(`${BACKEND_URL}/api/checkout`, payload);
      if (response.data.success) {
        // Persist profile values in local storage
        localStorage.setItem('cizquake_customer_phone', customerPhone);
        localStorage.setItem('cizquake_customer_name', customerName);
        localStorage.setItem('cizquake_customer_detailed_address', detailedAddress);
        localStorage.setItem('cizquake_customer_selected_area', JSON.stringify(selectedArea));
        
        setActiveOrderId(response.data.orderId);
        setPaymentInfo(response.data);
        setCurrentView('payment');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      alert('Gagal memproses pesanan. Silakan coba kembali.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const fetchOrderStatus = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/order/${activeOrderId}`);
      if (response.data.success) {
        setTrackingInfo(response.data.order);
      }
    } catch (err) {
      console.error('Error checking order status:', err);
    }
  };

  const triggerSimulatePayment = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/order/${activeOrderId}/simulate-pay`);
      if (response.data.success) {
        setCurrentView('tracking');
      }
    } catch (err) {
      console.error('Error simulating payment:', err);
    }
  };

  // -----------------
  // ADMIN ACTIONS
  // -----------------
  const handleAdminLoginPrompt = async () => {
    const pin = prompt('Masukkan PIN Admin Cizquake:');
    if (!pin) return;
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/login`, { pin });
      if (response.data.success) {
        setIsAdminLoggedIn(true);
        setActiveTab('admin');
        setIsAdminLoadingOrders(true);
        try {
          const res = await axios.get(`${BACKEND_URL}/api/admin/orders`);
          if (res.data.success) {
            setAdminOrders(res.data.orders);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsAdminLoadingOrders(false);
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        alert('Update server sedang dideploy (biasanya butuh 2-3 menit di Render). Silakan coba lagi sebentar lagi.');
      } else {
        alert(err.response?.data?.message || 'Gagal login. PIN salah.');
      }
    }
  };

  const fetchAdminOrders = async () => {
    setIsAdminLoadingOrders(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/orders`);
      if (response.data.success) {
        setAdminOrders(response.data.orders);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setIsAdminLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/order/${orderId}/status`, {
        shippingStatus: newStatus
      });
      if (response.data.success) {
        setAdminOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, shippingStatus: newStatus } : o));
      }
    } catch (err) {
      alert('Gagal memperbarui status pengiriman.');
    }
  };

  const toggleMenuStock = async (id, currentStockStatus) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/menu/${id}/toggle-stock`, {
        inStock: !currentStockStatus
      });
      if (response.data.success) {
        setMenu(prev => prev.map(m => m.id === id ? { ...m, inStock: !currentStockStatus } : m));
      }
    } catch (err) {
      alert('Gagal mengubah status stok kue.');
    }
  };

  const openAddMenuModal = () => {
    setEditingMenuItem(null);
    setFormName('');
    setFormCategory('Mini box');
    setFormPrice('');
    setFormDescription('');
    setFormImage('');
    setFormRating('4.8');
    setFormSalesCount('0');
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (item) => {
    setEditingMenuItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormDescription(item.description);
    setFormImage(item.image);
    setFormRating(String(item.rating || '4.8'));
    setFormSalesCount(String(item.salesCount || '0'));
    setIsMenuModalOpen(true);
  };

  const handleDeleteMenu = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini secara permanen?')) return;
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/admin/menu/${id}`);
      if (response.data.success) {
        alert('Menu berhasil dihapus!');
        setMenu(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      alert('Gagal menghapus menu.');
    }
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!formName || !formCategory || !formPrice) {
      alert('Nama, kategori, dan harga wajib diisi!');
      return;
    }

    setIsSavingMenu(true);
    const payload = {
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice),
      description: formDescription,
      image: formImage,
      rating: parseFloat(formRating || 4.8),
      salesCount: parseInt(formSalesCount || 0)
    };

    try {
      if (editingMenuItem) {
        const response = await axios.post(`${BACKEND_URL}/api/admin/menu/${editingMenuItem.id}/edit`, payload);
        if (response.data.success) {
          alert('Menu berhasil diperbarui!');
          setMenu(prev => prev.map(m => m.id === editingMenuItem.id ? { ...m, ...payload } : m));
          setIsMenuModalOpen(false);
        }
      } else {
        const response = await axios.post(`${BACKEND_URL}/api/admin/menu/add`, payload);
        if (response.data.success) {
          alert('Menu baru berhasil ditambahkan!');
          setMenu(prev => [...prev, response.data.item]);
          setIsMenuModalOpen(false);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan menu.');
    } finally {
      setIsSavingMenu(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!promoTitle || !promoSubtitle || !promoImage) {
      alert('Semua bidang wajib diisi!');
      return;
    }
    setIsSavingPromo(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/promo`, {
        title: promoTitle,
        subtitle: promoSubtitle,
        image: promoImage
      });
      if (response.data.success) {
        alert('Banner promo berhasil diperbarui!');
        setPromoBanner(response.data.promo);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan banner promo.');
    } finally {
      setIsSavingPromo(false);
    }
  };

  const handlePromoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPromoImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOperationalSettings = async (e) => {
    e.preventDefault();
    
    let manualUntil = null;
    if (manualStatus === 'closed') {
      if (closeDuration === '30m') {
        manualUntil = new Date(Date.now() + 30 * 60000).toISOString();
      } else if (closeDuration === '1h') {
        manualUntil = new Date(Date.now() + 60 * 60000).toISOString();
      } else if (closeDuration === 'fullday') {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        manualUntil = midnight.toISOString();
      } else if (closeDuration === 'indefinite') {
        manualUntil = 'indefinite';
      } else if (closeDuration === 'custom') {
        if (!customCloseUntil) {
          alert('Harap pilih waktu tutup kustom!');
          return;
        }
        manualUntil = new Date(customCloseUntil).toISOString();
      }
    }

    const payload = {
      manualStatus,
      manualUntil,
      schedule: scheduleForm
    };

    setIsSavingRestoSettings(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/resto/settings`, payload);
      if (response.data.success) {
        alert('Pengaturan operasional toko berhasil diperbarui!');
        setRestoStatus(response.data.state);
        setRestoSettings(response.data.settings);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan operasional.');
    } finally {
      setIsSavingRestoSettings(false);
    }
  };

  // -----------------
  // CART ACTIONS
  // -----------------
  const addToCart = (product) => {
    if (!product.inStock) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getCartSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatSalesCount = (count) => {
    const num = parseInt(count) || 0;
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'RB';
    }
    return num.toString();
  };

  const CATEGORY_ORDER = ['Mini box', 'Medium box', 'Beverages', 'Bundling', 'Gift'];
  const getCategoryIndex = (cat) => {
    const idx = CATEGORY_ORDER.findIndex(c => c.toLowerCase() === cat.toLowerCase());
    return idx === -1 ? 99 : idx;
  };

  // Filtering & sorting menu items for Home tab
  const filteredMenuItems = menu
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedCategory === 'All Flavors' || selectedCategory === 'All menu' || selectedCategory === 'All') return true;
      return item.category.toLowerCase() === selectedCategory.toLowerCase();
    })
    .sort((a, b) => {
      const catDiff = getCategoryIndex(a.category) - getCategoryIndex(b.category);
      if (catDiff !== 0) return catDiff;
      return a.name.localeCompare(b.name);
    });

  // Filtering & sorting menu items for Menu tab
  const filteredMenuTabItems = menu
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedMenuCategory === 'All' || selectedMenuCategory === 'All menu') return true;
      return item.category.toLowerCase() === selectedMenuCategory.toLowerCase();
    })
    .sort((a, b) => {
      const catDiff = getCategoryIndex(a.category) - getCategoryIndex(b.category);
      if (catDiff !== 0) return catDiff;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex flex-col min-h-screen relative bg-background text-on-surface">
      
      {/* Closed Screen Cover */}
      {!restoStatus.isOpen && currentView !== 'admin' && activeTab !== 'profile' && activeTab !== 'admin' ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#161616] text-white p-6 max-w-[480px] mx-auto text-center z-[9999] relative">
          <div className="flex flex-col items-center gap-6 max-w-sm">
            <div className="w-28 h-28 rounded-full bg-[#fabd00] flex items-center justify-center border-4 border-white/20 shadow-lg shadow-[#fabd00]/20 animate-pulse p-4">
              <img 
                className="w-full h-auto object-contain" 
                alt="Cizquake Logo" 
                src="/logo.png"
              />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-lg font-black tracking-tight text-amber-500">Cizquake Express Sedang Tutup</h2>
              <p className="text-xs text-white/70 leading-relaxed font-semibold">
                Maaf, saat ini toko kami sedang tidak menerima pesanan baru. Kami akan segera kembali!
              </p>
            </div>

            {/* Reopen Info */}
            <div className="w-full bg-[#242424] border border-white/5 rounded-2xl p-4 text-xs font-semibold space-y-1">
              <p className="text-white/40 uppercase text-[9px] tracking-wider font-bold">Waktu Buka Kembali</p>
              <p className="text-sm font-bold text-amber-400">
                {restoStatus.reason === 'manual_closed_temporary' && restoStatus.until ? (
                  `Buka kembali: ${new Date(restoStatus.until).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                ) : restoStatus.until && restoStatus.until.label ? (
                  restoStatus.until.label
                ) : (
                  "Tutup sementara (hubungi Admin untuk pemesanan khusus)"
                )}
              </p>
            </div>

            {/* Hubungi Whatsapp button */}
            <a 
              href="https://wa.me/6288218003440" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-600/90 active:scale-95 transition-all text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm text-white"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              Hubungi Admin via WhatsApp
            </a>

            {/* Admin Login Link at the bottom of Closed page */}
            <button 
              onClick={handleAdminLoginPrompt}
              className="text-[10px] text-white/40 font-bold hover:text-white/60 pt-4 cursor-pointer hover:underline"
            >
              Kelola Toko (Login Admin)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. CATALOG VIEW (TABS: HOME, MENU, CART, PROFILE) */}
          {currentView === 'catalog' && (
        <div className="flex flex-col min-h-screen relative bg-background text-on-surface">
          
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <>
              <header className="bg-[#fabd00] fixed top-0 left-0 right-0 w-full max-w-[480px] z-50 flex items-center h-16 border-b border-[#fabd00] mx-auto text-white px-container-margin-mobile">
                <div className="flex items-center gap-3 z-10">
                  <img 
                    className="h-9 w-auto object-contain filter brightness-0 invert flex-shrink-0" 
                    alt="Cizquake Logo" 
                    src="/logo.png"
                  />
                </div>
                
                <span className="font-display text-base font-black tracking-tight text-white flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                  Cizquake Express
                  <span className="material-symbols-outlined text-white text-base font-black leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </span>
                
                <div className="flex-1"></div>
                
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-white z-10"
                >
                  <span className="material-symbols-outlined text-xl">notifications</span>
                </button>
              </header>

              <main className="mt-16 pb-32">
                {/* Neon Running Text (Marquee) */}
                <div className="cizquake-marquee-container">
                  <div className="cizquake-marquee-content">
                    🧀 Cizquake Dessert Creamy & Lembut - Sensasi Lumer di Mulut yang Bikin Ketagihan! ✨ Pengiriman Instant Cepat Sampai! 🚀 Pesan Sekarang Sebelum Kehabisan Varian Favoritmu! 🔥
                  </div>
                </div>

                {/* Hero Section */}
                <section className="mb-6">
                  <div className="relative w-full aspect-square rounded-none overflow-hidden group cursor-pointer transition-transform duration-500 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
                    <img 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={promoBanner.title} 
                      src={promoBanner.image} 
                    />
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full text-left">
                      <div className="flex flex-col gap-1">
                        <span className="cizquake-featured-badge w-fit mb-2">Featured Favorite</span>
                        <h2 className="font-display text-xl text-white leading-tight font-extrabold">{promoBanner.title}</h2>
                        <p className="text-white/80 text-[10px] font-semibold leading-relaxed mb-2">{promoBanner.subtitle}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-display text-[#fabd00] font-bold text-lg">Rp 10.000</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const item = menu.find(i => i.id === 'mini-cheese' || i.id.includes('cheese'));
                              if (item) addToCart(item);
                            }}
                            className="cizquake-btn-order-now transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">shopping_bag</span>
                            Order Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Categories scroll */}
                <section className="mb-6 px-container-margin-mobile overflow-x-auto hide-scrollbar flex gap-2.5">
                  {['All menu', 'Mini box', 'Medium box', 'Beverages', 'Bundling', 'Gift'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-full font-label-lg whitespace-nowrap transition-all active:scale-95 text-[11px] font-bold ${
                        selectedCategory === cat 
                          ? 'chip-active shadow-sm' 
                          : 'chip-inactive'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </section>

                {/* Popular Menu (Grid layout) */}
                <section className="px-container-margin-mobile mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-md text-[#2b1613] font-extrabold">Popular Menu</h3>
                    <button onClick={() => setActiveTab('menu')} className="text-[#785900] font-label-lg font-extrabold hover:underline text-xs">See All</button>
                  </div>

                  {/* 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {filteredMenuItems.map(product => (
                      <div 
                        key={product.id} 
                        className={`cizquake-card overflow-hidden group flex flex-col h-full transition-all ${
                          !product.inStock ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden shrink-0">
                          <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={product.name} src={product.image} />
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(product.id);
                            }}
                            className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform z-10"
                          >
                            <span 
                              className={`material-symbols-outlined text-[10px] font-bold transition-colors translate-y-[0.5px] ${
                                favorites.includes(product.id) ? 'text-[#e11d48]' : 'text-[#785900]'
                              }`} 
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              favorite
                            </span>
                          </div>
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                              <span className="text-[9px] text-white font-extrabold bg-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">SOLD OUT</span>
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 flex flex-col flex-grow text-left">
                          <div className="flex items-center gap-1 mb-0.5 text-[9px] text-on-surface-variant font-semibold">
                            <span className="text-[#fabd00] text-xs">★</span>
                            <span>{product.rating ? product.rating.toFixed(1) : '4.8'} <span className="opacity-70">({formatSalesCount(product.salesCount)})</span></span>
                          </div>
                          <h4 className="font-display text-[11px] font-extrabold text-[#2b1613] mb-1.5 leading-tight flex-grow line-clamp-2">{product.name}</h4>
                          <div className="flex items-center justify-between mt-auto pt-0.5">
                            <span className="font-display font-extrabold text-[#785900] text-[12px]">Rp {product.price.toLocaleString('id-ID')}</span>
                            {product.inStock ? (
                              <button 
                                onClick={() => addToCart(product)}
                                className="cizquake-btn-add-small hover:shadow-md"
                              >
                                <span className="material-symbols-outlined text-xs font-bold text-white">add</span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-error font-bold bg-red-50 border border-red-150 px-1.5 py-0.5 rounded">Habis</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Promo Banner */}
                {selectedCategory === 'All Flavors' && (
                  <section className="px-container-margin-mobile">
                    <div className="bg-[#ffbc97]/30 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden text-left border border-[#ffbc97]/20">
                      <div className="z-10 relative">
                        <h3 className="font-display text-sm text-[#763300] mb-1 font-bold">Sweet First Order?</h3>
                        <p className="text-[#763300]/80 mb-4 text-[11px] font-semibold">Get 20% off your first luxury slice.</p>
                        <button className="bg-[#9b4500] text-white px-5 py-2 rounded-full font-label-lg shadow-md active:scale-95 transition-transform text-[10px] font-bold">Claim Now</button>
                      </div>
                      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                      <div className="relative w-16 h-16 z-10 shrink-0">
                        <img 
                          className="w-full h-full object-contain" 
                          alt="Cheesecake box illustration" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWkUAG5dt3aS0xq_RG5FIRHZAuv9xiP8x0lpG40Q96UQ7gr6jd5QcPDrVisx9LrsWDBJSzBucQyOvjXv73RbWB8Rim4DxXSZOJNTbtpOVl5LshNssyn-oZIQPDo9jPvUqX2Eg8-fErGFBkt92ytjaSLDkGn-c8IYI9rhvlCfQZDdFIrCKjT7GA6-P1MS_A80BMRAZ312hoz1g2St7IB-EFqZ0WIkBzzH2hGfe5g3b-bQIFT3JE2VuA-HMg_LcIXPQbpJ-nv22Q8k6_"
                        />
                      </div>
                    </div>
                  </section>
                )}
              </main>
            </>
          )}

          {/* TAB 2: MENU (LIST VIEW) */}
          {activeTab === 'menu' && (
            <>
              {/* Header */}
              <header className="bg-[#fabd00] fixed top-0 left-0 right-0 w-full max-w-[480px] z-50 flex items-center h-16 border-b border-[#fabd00] mx-auto text-white px-container-margin-mobile">
                <div className="flex items-center gap-3 z-10">
                  <img 
                    className="h-9 w-auto object-contain filter brightness-0 invert flex-shrink-0" 
                    alt="Cizquake Logo" 
                    src="/logo.png"
                  />
                </div>
                
                <span className="font-display text-base font-black tracking-tight text-white whitespace-nowrap absolute left-1/2 -translate-x-1/2">Menu Cizquake</span>
                
                <div className="flex-1"></div>
                
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-white z-10"
                >
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                </button>
              </header>

              <main className="mt-16 pt-4 pb-32">
                {/* Search Input */}
                <section className="px-container-margin-mobile mb-6">
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">search</span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary-container font-body-md text-on-surface placeholder-on-surface-variant/60 transition-all outline-none" 
                      placeholder="Cari cizquake favoritmu..." 
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </section>

                {/* Menu Category Chips */}
                <section className="mb-6 px-container-margin-mobile overflow-x-auto hide-scrollbar flex gap-3">
                  {['All menu', 'Mini box', 'Medium box', 'Beverages', 'Bundling', 'Gift'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedMenuCategory(cat)}
                      className={`px-5 py-2 rounded-full font-label-lg whitespace-nowrap transition-all active:scale-95 text-xs font-bold ${
                        selectedMenuCategory === cat 
                          ? 'bg-primary-container text-on-primary-container shadow-sm font-bold' 
                          : 'bg-secondary-container/30 text-on-surface-variant'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </section>

                {/* Popular Picks (List Layout) */}
                <section className="px-container-margin-mobile">
                  <h2 className="font-headline-md text-headline-md text-primary mb-4 text-left font-bold">Popular Picks</h2>
                  
                  <div className="flex flex-col gap-4">
                    {filteredMenuTabItems.map(product => (
                      <div 
                        key={product.id} 
                        className={`bg-surface-container-lowest rounded-lg p-4 cake-card-shadow flex gap-4 items-center group transition-all border border-on-surface/5 text-left ${
                          !product.inStock ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <img className="w-full h-full object-cover" alt={product.name} src={product.image} />
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-[9px] text-white font-bold bg-error px-2.5 py-1 rounded-full">SOLD OUT</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-headline-md text-sm font-bold text-on-surface leading-tight">{product.name}</h3>
                            <span className="font-label-lg text-primary text-sm font-bold whitespace-nowrap">Rp {product.price.toLocaleString('id-ID')}</span>
                          </div>
                          <p className="text-on-surface-variant text-[11px] line-clamp-2 mt-1">{product.description}</p>
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[#fabd00] text-xs font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span className="text-[10px] font-bold text-on-surface-variant/80">{product.rating || '4.8'} ({formatSalesCount(product.salesCount)})</span>
                            </div>
                            {product.inStock ? (
                              <button 
                                onClick={() => addToCart(product)}
                                className="flex items-center gap-1 bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-xs font-bold transition-transform active:scale-90 hover:brightness-105"
                              >
                                <span className="material-symbols-outlined text-sm font-bold">add</span> Add
                              </button>
                            ) : (
                              <span className="text-xs text-error font-bold">Stok Habis</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </main>
            </>
          )}

          {/* TAB 3: CART */}
          {activeTab === 'cart' && (
            <div className="min-h-screen pb-40">
              <header className="bg-[#fabd00] fixed top-0 left-0 right-0 w-full max-w-[480px] z-50 flex items-center h-16 border-b border-[#fabd00] mx-auto text-white px-container-margin-mobile">
                <button onClick={() => setActiveTab('home')} className="transition-transform active:scale-95 text-white p-2 flex items-center justify-center z-10">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="font-display text-base font-black tracking-tight text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Keranjang Saya</h1>
                <div className="flex-1"></div>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-white z-10"
                >
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                </button>
              </header>

              <main className="mt-16 pt-4 px-container-margin-mobile flex flex-col gap-6 max-w-2xl mx-auto">
                {/* Cart Items Section */}
                <div className="flex flex-col gap-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-on-surface-variant bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-8 my-4">
                      <span className="material-symbols-outlined text-5xl text-primary opacity-50 mb-3">shopping_basket</span>
                      <p className="text-sm font-semibold">Keranjang belanja kosong.</p>
                      <p className="text-xs text-on-surface-variant/70 mt-1">Pilih menu Cizquake lezat untuk ditambahkan ke sini!</p>
                      <button 
                        onClick={() => setActiveTab('menu')}
                        className="mt-6 bg-primary-container text-on-primary-container px-6 py-2 rounded-full text-xs font-bold"
                      >
                        Mulai Belanja
                      </button>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-surface-container-lowest rounded-lg p-4 flex gap-4 shadow-[0_20px_20px_0_rgba(66,42,38,0.06)] border border-on-surface/5">
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img className="w-full h-full object-cover" alt={item.name} src={item.image} />
                        </div>
                        <div className="flex flex-col justify-between flex-grow text-left">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-headline-md text-sm font-bold text-on-surface leading-tight">{item.name}</h3>
                              <button 
                                onClick={() => updateCartQuantity(item.id, -item.quantity)} 
                                className="text-error opacity-65 hover:opacity-100 transition-opacity p-1"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                            <p className="text-on-surface-variant font-label-lg text-xs mt-0.5">{item.category}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-display text-primary font-bold text-sm">Rp {item.price.toLocaleString('id-ID')}</span>
                            <div className="flex items-center gap-3 bg-secondary-container rounded-full px-2 py-1">
                              <button 
                                onClick={() => updateCartQuantity(item.id, -1)} 
                                className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center transition-all active:scale-90"
                              >
                                <span className="material-symbols-outlined text-xs font-bold">remove</span>
                              </button>
                              <span className="font-bold text-xs text-on-secondary-container">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.id, 1)} 
                                className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center transition-all active:scale-90"
                              >
                                <span className="material-symbols-outlined text-xs font-bold">add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <>
                    {/* Order Summary Card */}
                    <div className="bg-surface-container-low rounded-lg p-6 flex flex-col gap-4 border border-on-surface/5">
                      <h2 className="font-headline-md text-lg text-on-surface font-bold text-left">Ringkasan Pesanan</h2>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-on-surface-variant">Subtotal Produk</span>
                        <span className="font-bold text-on-surface">Rp {getCartSubtotal().toLocaleString('id-ID')}</span>
                      </div>
                      <div className="h-[1px] bg-outline-variant/30 my-1"></div>
                      <div className="flex justify-between items-center">
                        <span className="font-display text-md text-on-surface font-bold">Total Estimasi</span>
                        <span className="font-display text-xl text-primary font-bold">Rp {getCartSubtotal().toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Vouchers/Promo Section */}
                    <button className="flex items-center justify-between bg-surface-container rounded-lg px-4 py-4 w-full group transition-all hover:bg-surface-container-high border border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">confirmation_number</span>
                        <span className="font-label-lg text-on-surface text-sm font-semibold">Gunakan voucher promo</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                  </>
                )}
              </main>

              {/* Bottom Action Bar */}
              {cart.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 bg-surface-container-lowest p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40 max-w-[480px] mx-auto border-t border-outline-variant/20">
                  <button 
                    onClick={() => {
                      setCurrentView('checkout');
                    }}
                    className="w-full bg-primary-container text-on-primary-container py-4 rounded-full font-display font-bold text-md shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Lanjut ke Pengiriman</span>
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="pb-32">
              <header className="bg-[#fabd00] fixed top-0 left-0 right-0 w-full max-w-[480px] z-50 flex items-center h-16 border-b border-[#fabd00] mx-auto text-white px-container-margin-mobile">
                <h1 className="font-display text-base font-black tracking-tight text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Profil Saya</h1>
                <div className="flex-1"></div>
                <button 
                  onClick={() => customerPhone && fetchProfileOrders(customerPhone)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-white z-10"
                >
                  <span className="material-symbols-outlined text-2xl">sync</span>
                </button>
              </header>

              <main className="mt-16 pt-6 px-container-margin-mobile flex flex-col gap-6 max-w-2xl mx-auto">
                {!customerPhone ? (
                  <div className="bg-surface-container-lowest rounded-2xl p-6 custom-shadow border border-on-surface/5 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">account_circle</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-on-surface">Lihat Profil & Riwayat Pesanan</h3>
                      <p className="text-[10px] text-on-surface-variant/80 font-semibold leading-relaxed mt-1">
                        Masukkan nomor WhatsApp Anda untuk memuat profil dan memantau seluruh riwayat transaksi Anda.
                      </p>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!profileSearchPhone) {
                        alert('Harap masukkan nomor WhatsApp!');
                        return;
                      }
                      setCustomerPhone(profileSearchPhone);
                      localStorage.setItem('cizquake_customer_phone', profileSearchPhone);
                      fetchProfileOrders(profileSearchPhone);
                    }} className="w-full space-y-3 mt-2">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Nomor WhatsApp</label>
                        <input 
                          type="tel"
                          value={profileSearchPhone}
                          onChange={(e) => setProfileSearchPhone(e.target.value)}
                          placeholder="Contoh: 088218003440"
                          required
                          className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-primary hover:bg-primary/95 text-white active:scale-95 transition-all text-xs rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm text-white"
                      >
                        <span className="material-symbols-outlined text-sm">login</span>
                        <span>Masuk Profil</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* Profile Card */}
                    <div className="bg-surface-container-lowest rounded-2xl p-5 custom-shadow border border-on-surface/5 flex items-center justify-between text-left">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-black font-display shadow-sm">
                          {customerName ? customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CZ'}
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-sm text-on-surface">
                            {customerName || 'Pelanggan Cizquake'}
                          </h2>
                          <p className="text-on-surface-variant text-[10px] font-semibold mt-0.5">{customerPhone}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setEditProfileName(customerName);
                          setEditProfileAddress(detailedAddress);
                          setIsEditingProfile(true);
                        }}
                        className="px-3 py-1.5 border border-outline-variant/30 text-on-surface-variant hover:bg-slate-50 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>Ubah</span>
                      </button>
                    </div>

                    {/* Edit Profile Modal / Form Inline */}
                    {isEditingProfile && (
                      <div className="bg-surface-container-lowest rounded-2xl p-5 custom-shadow border border-primary/20 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                        <h3 className="font-display font-bold text-xs text-primary mb-3">Ubah Info Profil</h3>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase font-bold text-on-surface-variant">Nama Anda</label>
                            <input 
                              type="text" 
                              value={editProfileName} 
                              onChange={(e) => setEditProfileName(e.target.value)}
                              className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/20 text-xs font-semibold focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase font-bold text-on-surface-variant">Alamat Detail Utama</label>
                            <textarea 
                              value={editProfileAddress} 
                              onChange={(e) => setEditProfileAddress(e.target.value)}
                              rows="2"
                              className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/20 text-xs font-semibold focus:outline-none focus:border-primary resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button 
                              onClick={() => setIsEditingProfile(false)}
                              className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant"
                            >
                              Batal
                            </button>
                            <button 
                              onClick={() => {
                                setCustomerName(editProfileName);
                                setDetailedAddress(editProfileAddress);
                                localStorage.setItem('cizquake_customer_name', editProfileName);
                                localStorage.setItem('cizquake_customer_detailed_address', editProfileAddress);
                                setIsEditingProfile(false);
                                alert('Profil berhasil diperbarui!');
                              }}
                              className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Details info */}
                    <div className="bg-surface-container-lowest rounded-2xl p-5 custom-shadow border border-on-surface/5 text-left">
                      <h3 className="font-display font-bold text-xs text-primary mb-3 flex items-center justify-between">
                        <span>Informasi Pengantaran</span>
                      </h3>
                      <div className="space-y-2.5 text-[11px] font-semibold text-on-surface-variant">
                        <div className="flex flex-col border-b border-outline-variant/5 pb-2">
                          <span className="text-[9px] text-on-surface-variant/60 uppercase">Alamat Pengiriman Default</span>
                          <span className="text-on-surface mt-0.5 font-bold">
                            {detailedAddress ? (
                              selectedArea ? `${detailedAddress}, ${selectedArea.name}` : detailedAddress
                            ) : (
                              <span className="text-red-500 font-semibold italic">Belum diatur (diatur otomatis saat checkout)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purchase history track record */}
                    <div className="bg-surface-container-lowest rounded-2xl p-5 custom-shadow border border-on-surface/5 text-left">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-display font-bold text-xs text-primary">Riwayat Pembelian</h3>
                        <button 
                          onClick={() => fetchProfileOrders(customerPhone)}
                          disabled={isLoadingProfileOrders}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-on-surface-variant"
                        >
                          <span className={`material-symbols-outlined text-sm ${isLoadingProfileOrders ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                      </div>

                      {isLoadingProfileOrders ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <span className="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
                          <span className="text-[10px] font-semibold text-on-surface-variant">Memuat transaksi Anda...</span>
                        </div>
                      ) : profileOrders.length === 0 ? (
                        <div className="text-center py-6 text-on-surface-variant/80 font-semibold text-[11px] leading-relaxed">
                          <span className="material-symbols-outlined text-2xl text-on-surface-variant/40 block mb-1">shopping_bag</span>
                          Belum ada riwayat pesanan untuk nomor ini.<br />Yuk, mulai rasakan lezatnya Cizquake!
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {profileOrders.map(order => (
                            <div 
                              key={order.orderId} 
                              onClick={() => {
                                setActiveOrderId(order.orderId);
                                if (order.paymentStatus === 'paid') {
                                  setTrackingInfo({
                                    orderId: order.orderId,
                                    customer: order.customer,
                                    items: order.items,
                                    shipping: order.shipping,
                                    grossAmount: order.grossAmount,
                                    shippingStatus: order.shippingStatus,
                                    paymentStatus: order.paymentStatus,
                                  });
                                  setCurrentView('tracking');
                                } else {
                                  setPaymentInfo({
                                    orderId: order.orderId,
                                    grossAmount: order.grossAmount,
                                    paymentQrUrl: order.paymentQrUrl,
                                    paymentExpiry: order.paymentExpiry,
                                  });
                                  setCurrentView('payment');
                                }
                              }}
                              className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 cursor-pointer hover:bg-surface-container-high transition-all flex items-center justify-between gap-3 text-left animate-in fade-in duration-200"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[11px] font-black text-on-surface truncate">#{order.orderId.substring(0, 8).toUpperCase()}</p>
                                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    order.paymentStatus === 'paid' 
                                      ? 'bg-green-50 text-green-700 border border-green-200' 
                                      : 'bg-amber-55 text-amber-750 border border-amber-200/50'
                                  }`}>
                                    {order.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                  </span>
                                </div>
                                
                                <p className="text-[9px] text-on-surface-variant mt-1 truncate">
                                  {order.items.map(i => `${i.name} (${i.quantity}x)`).join(', ')}
                                </p>
                                
                                <p className="text-[8px] text-on-surface-variant/60 font-bold mt-1.5">
                                  {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              
                              <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                                <p className="text-xs font-black text-primary">Rp {order.grossAmount.toLocaleString('id-ID')}</p>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                  order.shippingStatus === 'delivered' 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : order.shippingStatus === 'on_the_way' 
                                    ? 'bg-orange-50 text-orange-700' 
                                    : 'bg-slate-150 text-slate-700'
                                }`}>
                                  {order.shippingStatus === 'delivered' 
                                    ? 'Tiba' 
                                    : order.shippingStatus === 'on_the_way' 
                                    ? 'Diantar' 
                                    : 'Diproses'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin keluar dari profil?')) {
                          setCustomerPhone('');
                          setCustomerName('');
                          setDetailedAddress('');
                          localStorage.removeItem('cizquake_customer_phone');
                          localStorage.removeItem('cizquake_customer_name');
                          localStorage.removeItem('cizquake_customer_detailed_address');
                          localStorage.removeItem('cizquake_customer_selected_area');
                          setProfileOrders([]);
                        }
                      }}
                      className="w-full py-3 border border-red-200 text-red-650 hover:bg-red-50 active:scale-95 transition-all text-xs rounded-xl font-bold flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span>Keluar Akun Profil</span>
                    </button>
                  </>
                )}

                {/* Admin Access Panel */}
                <div className="bg-surface-container-lowest rounded-2xl p-5 custom-shadow border border-on-surface/5 text-left">
                  <h3 className="font-display font-bold text-xs text-primary mb-3">Portal Staf Restoran</h3>
                  <button 
                    onClick={handleAdminLoginPrompt}
                    className="w-full py-3 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/95 active:scale-95 transition-all text-xs rounded-xl font-bold flex items-center justify-center gap-2 border border-outline-variant/10"
                  >
                    <span className="material-symbols-outlined text-md">shield_person</span>
                    <span>Masuk Panel Admin Cizquake</span>
                  </button>
                </div>
              </main>
            </div>
          )}

          {/* TAB 5: ADMIN PANEL */}
          {activeTab === 'admin' && isAdminLoggedIn && (
            <div className="pb-32 text-left">
              <header className="bg-[#fabd00] fixed top-0 left-0 right-0 w-full max-w-[480px] z-50 flex items-center justify-between px-container-margin-mobile h-16 border-b border-[#fabd00] mx-auto text-white">
                <span className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                  Cizquake Admin Hub
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={fetchAdminOrders}
                    disabled={isAdminLoadingOrders}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-white disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-xl ${isAdminLoadingOrders ? 'animate-spin' : ''}`}>refresh</span>
                  </button>
                  <button 
                    onClick={() => {
                      setIsAdminLoggedIn(false);
                      setActiveTab('profile');
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 active:scale-95 transition-all text-red-650"
                  >
                    <span className="material-symbols-outlined text-xl">logout</span>
                  </button>
                </div>
              </header>

              <main className="mt-16 pt-6 px-container-margin-mobile flex flex-col gap-6 max-w-2xl mx-auto">
                {/* Admin Sub-Tabs */}
                <div className="flex gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/10 overflow-x-auto hide-scrollbar">
                  <button 
                    onClick={() => setAdminSubTab('orders')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap ${
                      adminSubTab === 'orders' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">list_alt</span>
                    <span>Kelola Pesanan</span>
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('stock')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap ${
                      adminSubTab === 'stock' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    <span>Stok Menu</span>
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('promo')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap ${
                      adminSubTab === 'promo' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">featured_video</span>
                    <span>Banner Promo</span>
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('schedule')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap ${
                      adminSubTab === 'schedule' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>Operasional</span>
                  </button>
                </div>

                {/* TAB CONTENT: ORDERS */}
                {adminSubTab === 'orders' && (
                  <>
                    {/* Sales Summary Card */}
                    <div className="bg-amber-100/50 rounded-2xl p-5 border border-amber-250 shadow-sm text-left">
                      <h3 className="font-display font-bold text-sm text-amber-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-md">analytics</span>
                        Ringkasan Penjualan
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase leading-none">Omzet</p>
                          <p className="text-sm font-black text-primary mt-2">
                            Rp {adminOrders
                              .filter(o => o.paymentStatus === 'paid')
                              .reduce((sum, o) => sum + o.grossAmount, 0)
                              .toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase leading-none">Pesanan</p>
                          <p className="text-sm font-black text-primary mt-2">
                            {adminOrders.filter(o => o.paymentStatus === 'paid').length} Lunas
                          </p>
                        </div>
                        <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase leading-none">Box Terjual</p>
                          <p className="text-sm font-black text-primary mt-2">
                            {adminOrders
                              .filter(o => o.paymentStatus === 'paid')
                              .reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0)} Box
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 border-b border-outline-variant/20 pb-1">
                      {['all', 'pending', 'paid', 'delivered'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => setAdminFilter(filter)}
                          className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                            adminFilter === filter
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                        >
                          {filter === 'all' && 'Semua'}
                          {filter === 'pending' && 'Belum Bayar'}
                          {filter === 'paid' && 'Siap Kirim'}
                          {filter === 'delivered' && 'Selesai'}
                        </button>
                      ))}
                    </div>

                    {/* Orders List */}
                    {isAdminLoadingOrders ? (
                      <div className="text-center py-12 flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                        <span className="text-xs text-on-surface-variant font-semibold">Memuat daftar pesanan...</span>
                      </div>
                    ) : adminOrders.length === 0 ? (
                      <div className="text-center py-12 bg-surface-container-low rounded-xl border border-outline-variant/10">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">shopping_basket</span>
                        <p className="text-xs text-on-surface-variant font-semibold mt-2">Belum ada pesanan masuk.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {adminOrders
                          .filter(order => {
                            if (adminFilter === 'pending') return order.paymentStatus === 'pending';
                            if (adminFilter === 'paid') return order.paymentStatus === 'paid' && order.shippingStatus !== 'delivered';
                            if (adminFilter === 'delivered') return order.shippingStatus === 'delivered';
                            return true;
                          })
                          .map(order => (
                            <div 
                              key={order.orderId}
                              className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm text-left flex flex-col gap-3.5"
                            >
                              {/* Top row */}
                              <div className="flex justify-between items-start border-b border-outline-variant/10 pb-3">
                                <div>
                                  <p className="text-xs font-black text-on-surface">Order #{order.orderId}</p>
                                  <p className="text-[10px] text-on-surface-variant mt-1 font-semibold">
                                    {new Date(order.createdAt).toLocaleString('id-ID', {
                                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div className="text-right flex flex-col gap-1.5 items-end">
                                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    order.paymentStatus === 'paid'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {order.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                                  </span>
                                  <span className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    order.shippingStatus === 'delivered'
                                      ? 'bg-blue-50 text-blue-700'
                                      : order.shippingStatus === 'on_the_way'
                                      ? 'bg-orange-50 text-orange-700 animate-pulse'
                                      : 'bg-surface-container text-on-surface-variant'
                                  }`}>
                                    status: {order.shippingStatus}
                                  </span>
                                </div>
                              </div>

                              {/* Customer & Shipping info */}
                              <div className="text-xs space-y-2 text-on-surface-variant font-semibold">
                                <div className="flex gap-1.5 items-start">
                                  <span className="material-symbols-outlined text-[14px] mt-0.5">person</span>
                                  <span>{order.customer.name} ({order.customer.phone})</span>
                                </div>
                                <div className="flex gap-1.5 items-start">
                                  <span className="material-symbols-outlined text-[14px] mt-0.5">location_on</span>
                                  <span className="line-clamp-2 leading-relaxed">{order.shipping.address}</span>
                                </div>
                                <div className="flex gap-1.5 items-start">
                                  <span className="material-symbols-outlined text-[14px] mt-0.5">local_shipping</span>
                                  <span>Kurir: <span className="uppercase text-primary font-bold">{order.shipping.courierCompany}</span> {order.shipping.courierService} (Rp {order.shippingPrice.toLocaleString('id-ID')})</span>
                                </div>
                              </div>

                              {/* Items List */}
                              <div className="bg-surface-container-low rounded-xl p-3 text-xs space-y-1.5 font-semibold">
                                {order.items.map(item => (
                                  <div key={item.id} className="flex justify-between text-on-surface-variant">
                                    <span>• {item.name} <span className="text-primary font-black">x{item.quantity}</span></span>
                                    <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-outline-variant/10 flex justify-between font-bold text-on-surface text-xs">
                                  <span>Total Bayar:</span>
                                  <span className="text-primary font-extrabold">Rp {order.grossAmount.toLocaleString('id-ID')}</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2 pt-1 border-t border-outline-variant/10 mt-1">
                                {order.paymentStatus === 'pending' && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await axios.post(`${BACKEND_URL}/api/order/${order.orderId}/simulate-pay`);
                                        alert('Simulasi pembayaran lunas berhasil dipicu!');
                                        fetchAdminOrders();
                                      } catch (e) {
                                        alert('Gagal menyimulasikan pembayaran.');
                                      }
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-all hover:bg-green-700"
                                  >
                                    Simulasikan Lunas
                                  </button>
                                )}

                                {order.paymentStatus === 'paid' && order.shippingStatus === 'idle' && (
                                  <button
                                    onClick={() => updateOrderStatus(order.orderId, 'searching')}
                                    className="px-4 py-2 bg-primary text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-all hover:bg-primary/95"
                                  >
                                    Kirim Pesanan (Pesan Kurir)
                                  </button>
                                )}

                                {order.shippingStatus === 'searching' && (
                                  <button
                                    onClick={() => updateOrderStatus(order.orderId, 'driver_assigned')}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-all hover:bg-amber-700"
                                  >
                                    Driver Ditemukan
                                  </button>
                                )}

                                {order.shippingStatus === 'driver_assigned' && (
                                  <button
                                    onClick={() => updateOrderStatus(order.orderId, 'on_the_way')}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-all hover:bg-orange-700"
                                  >
                                    Diantar Kurir (Dalam Perjalanan)
                                  </button>
                                )}

                                {order.shippingStatus === 'on_the_way' && (
                                  <button
                                    onClick={() => updateOrderStatus(order.orderId, 'delivered')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-all hover:bg-blue-700"
                                  >
                                    Tandai Telah Tiba di Lokasi
                                  </button>
                                )}

                                {order.shippingStatus === 'delivered' && (
                                  <span className="text-[11px] text-green-750 font-bold bg-green-50 px-4 py-2 rounded-full border border-green-200 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm font-bold text-green-600">check_circle</span>
                                    Pesanan Selesai
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}

                {/* TAB CONTENT: STOCK MANAGEMENT */}
                {adminSubTab === 'stock' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 shadow-sm text-left">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-display font-bold text-sm text-primary">Daftar Menu Restoran</h3>
                        <button
                          onClick={openAddMenuModal}
                          className="px-3.5 py-2 bg-primary text-white hover:bg-primary/95 active:scale-95 transition-all text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>Tambah Menu</span>
                        </button>
                      </div>
                      <p className="text-xs text-on-surface-variant/80 font-semibold mb-4 leading-relaxed">
                        Kelola data kue Cizquake, ubah info rasa/harga, nonaktifkan stok rasa yang kosong, atau hapus menu secara permanen.
                      </p>
                      
                      <div className="divide-y divide-outline-variant/10">
                        {menu.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden border border-outline-variant/10 flex-shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-secondary-container/30 text-secondary">
                                    <span className="material-symbols-outlined text-lg">image</span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-on-surface leading-tight truncate">{item.name}</p>
                                <p className="text-[10px] text-on-surface-variant/80 font-semibold mt-1">
                                  Rp {item.price.toLocaleString('id-ID')} • <span className="text-[9px] uppercase font-bold text-primary-container bg-primary-container/20 px-1.5 py-0.5 rounded">{item.category}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => toggleMenuStock(item.id, item.inStock)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 border ${
                                  item.inStock
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                              >
                                {item.inStock ? 'Tersedia' : 'Habis'}
                              </button>

                              <button
                                onClick={() => openEditMenuModal(item)}
                                className="w-8 h-8 rounded-lg border border-outline-variant/20 hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant active:scale-90 transition-all"
                                title="Edit Menu"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteMenu(item.id)}
                                className="w-8 h-8 rounded-lg border border-red-100 hover:bg-red-50 flex items-center justify-center text-red-650 active:scale-90 transition-all"
                                title="Hapus Menu"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PROMO BANNER MANAGEMENT */}
                {adminSubTab === 'promo' && (
                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm text-left flex flex-col gap-4">
                    <div>
                      <h3 className="font-display font-bold text-sm text-[#2b1613] mb-1">Pengaturan Banner Promo Utama</h3>
                      <p className="text-on-surface-variant text-[10px] leading-relaxed font-semibold">
                        Ubah foto banner utama, judul, dan subjudul yang muncul di bagian paling atas halaman Beranda.
                      </p>
                    </div>

                    <form onSubmit={handleSavePromo} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Judul Promo</label>
                        <input 
                          type="text"
                          value={promoTitle}
                          onChange={(e) => setPromoTitle(e.target.value)}
                          placeholder="Contoh: Mini Box Double Cheese"
                          required
                          className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Subjudul / Deskripsi Banner</label>
                        <input 
                          type="text"
                          value={promoSubtitle}
                          onChange={(e) => setPromoSubtitle(e.target.value)}
                          placeholder="Contoh: Best seller double cheese premium kami"
                          required
                          className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Foto Banner Utama</label>
                        <div className="flex gap-3 items-center">
                          <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-outline-variant/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {promoImage ? (
                              <img src={promoImage} alt="Preview Banner" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant/40 text-2xl">image</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={handlePromoFileChange}
                              id="promo-file-input"
                              className="hidden"
                            />
                            <label 
                              htmlFor="promo-file-input"
                              className="inline-flex px-3.5 py-2 bg-secondary-container hover:bg-secondary-container/90 active:scale-95 transition-all text-[10px] font-bold rounded-lg cursor-pointer border border-outline-variant/10 text-on-secondary-container items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">cloud_upload</span>
                              <span>Pilih File Gambar</span>
                            </label>
                            <p className="text-[8px] text-on-surface-variant/70 leading-normal font-semibold">
                              Format: JPEG/PNG. Maksimal 2MB.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="text-[9px] text-on-surface-variant/60 font-bold uppercase text-center">- ATAU MASUKKAN URL GAMBAR -</span>
                          <input 
                            type="text"
                            value={promoImage && promoImage.startsWith('data:') ? '' : promoImage}
                            onChange={(e) => setPromoImage(e.target.value)}
                            placeholder="https://contoh.com/gambar-banner.jpg"
                            className="px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingPromo}
                        className="w-full py-3 bg-primary hover:bg-primary/95 text-white active:scale-95 transition-all text-xs rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 mt-4"
                      >
                        {isSavingPromo ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            <span>Menyimpan Banner...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">save</span>
                            <span>Simpan Perubahan Banner</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB CONTENT: OPERATIONAL SCHEDULE & MANUAL STATUS */}
                {adminSubTab === 'schedule' && (
                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm text-left flex flex-col gap-4">
                    <div>
                      <h3 className="font-display font-bold text-sm text-[#2b1613] mb-1">Pengaturan Buka / Tutup Restoran</h3>
                      <p className="text-on-surface-variant text-[10px] leading-relaxed font-semibold">
                        Atur status buka-tutup restoran secara manual atau otomatis mengikuti jadwal operasional harian.
                      </p>
                    </div>

                    <form onSubmit={handleSaveOperationalSettings} className="space-y-6">
                      
                      {/* 1. Status Manual Overrides */}
                      <div className="space-y-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                        <label className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">settings</span>
                          Status Operasional Saat Ini
                        </label>
                        
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-outline-variant/5 cursor-pointer hover:bg-slate-50 transition-all">
                            <input 
                              type="radio" 
                              name="manualStatus" 
                              value="auto" 
                              checked={manualStatus === 'auto'}
                              onChange={(e) => setManualStatus(e.target.value)}
                              className="w-4 h-4 accent-primary"
                            />
                            <div className="text-left">
                              <p className="text-xs font-bold text-on-surface">Buka Otomatis (Sesuai Jadwal)</p>
                              <p className="text-[10px] text-on-surface-variant/80 font-medium">Toko akan buka/tutup secara otomatis mengikuti jadwal mingguan di bawah.</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-outline-variant/5 cursor-pointer hover:bg-slate-50 transition-all">
                            <input 
                              type="radio" 
                              name="manualStatus" 
                              value="open" 
                              checked={manualStatus === 'open'}
                              onChange={(e) => setManualStatus(e.target.value)}
                              className="w-4 h-4 accent-primary"
                            />
                            <div className="text-left">
                              <p className="text-xs font-bold text-green-700">Paksa Buka (Buka Terus)</p>
                              <p className="text-[10px] text-on-surface-variant/80 font-medium">Toko dipaksa buka terus 24 jam mengabaikan jadwal mingguan.</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-outline-variant/5 cursor-pointer hover:bg-slate-50 transition-all">
                            <input 
                              type="radio" 
                              name="manualStatus" 
                              value="closed" 
                              checked={manualStatus === 'closed'}
                              onChange={(e) => setManualStatus(e.target.value)}
                              className="w-4 h-4 accent-primary"
                            />
                            <div className="text-left">
                              <p className="text-xs font-bold text-red-650">Tutup Toko Sementara</p>
                              <p className="text-[10px] text-on-surface-variant/80 font-medium">Paksa tutup toko sementara dengan opsi waktu di bawah ini.</p>
                            </div>
                          </label>
                        </div>

                        {/* Opsi Durasi Tutup Sementara */}
                        {manualStatus === 'closed' && (
                          <div className="mt-3 p-3 bg-red-50/50 rounded-xl border border-red-200/40 space-y-3 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-[9px] uppercase font-black text-red-800 tracking-wider">Durasi Tutup Toko</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { val: '30m', label: '30 Menit' },
                                { val: '1h', label: '1 Jam' },
                                { val: 'fullday', label: 'Seharian Penuh' },
                                { val: 'indefinite', label: 'Tutup Permanen (Tekan Buka)' },
                                { val: 'custom', label: 'Kustom Waktu...' }
                              ].map(opt => (
                                <label 
                                  key={opt.val} 
                                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                                    opt.val === 'indefinite' ? 'col-span-2' : ''
                                  } ${
                                    closeDuration === opt.val 
                                      ? 'bg-red-600 text-white border-red-600' 
                                      : 'bg-white border-outline-variant/20 text-on-surface hover:bg-red-50/40'
                                  }`}
                                >
                                  <input 
                                    type="radio" 
                                    name="closeDuration" 
                                    value={opt.val}
                                    checked={closeDuration === opt.val}
                                    onChange={(e) => setCloseDuration(e.target.value)}
                                    className="hidden"
                                  />
                                  <span>{opt.label}</span>
                                </label>
                              ))}
                            </div>

                            {closeDuration === 'custom' && (
                              <div className="flex flex-col gap-1 mt-2 animate-in fade-in duration-200">
                                <label className="text-[8px] uppercase font-bold text-red-750">Pilih Waktu Buka Kembali</label>
                                <input 
                                  type="datetime-local" 
                                  value={customCloseUntil}
                                  onChange={(e) => setCustomCloseUntil(e.target.value)}
                                  className="w-full px-3 py-2 bg-white rounded-lg border border-red-200 text-xs font-semibold focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 2. Weekly Schedule Hours */}
                      <div className="space-y-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                        <label className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          Jadwal Operasional Mingguan
                        </label>
                        <p className="text-[9px] text-on-surface-variant/70 font-semibold leading-relaxed">
                          Jadwal default: 08:00 - 21:30. Hilangkan centang jika ingin toko tutup total pada hari tersebut.
                        </p>

                        <div className="space-y-3 divide-y divide-outline-variant/5">
                          {[
                            { key: 'monday', label: 'Senin' },
                            { key: 'tuesday', label: 'Selasa' },
                            { key: 'wednesday', label: 'Rabu' },
                            { key: 'thursday', label: 'Kamis' },
                            { key: 'friday', label: 'Jumat' },
                            { key: 'saturday', label: 'Sabtu' },
                            { key: 'sunday', label: 'Minggu' }
                          ].map(day => (
                            <div key={day.key} className="flex items-center justify-between pt-3 first:pt-0 gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={scheduleForm[day.key]?.isOpen ?? true}
                                  onChange={(e) => {
                                    setScheduleForm(prev => ({
                                      ...prev,
                                      [day.key]: {
                                        ...prev[day.key],
                                        isOpen: e.target.checked
                                      }
                                    }));
                                  }}
                                  className="w-4 h-4 accent-primary rounded"
                                />
                                <span className="text-xs font-bold text-on-surface">{day.label}</span>
                              </label>

                              {(scheduleForm[day.key]?.isOpen ?? true) && (
                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                  <input 
                                    type="time" 
                                    value={scheduleForm[day.key]?.openTime || '08:00'}
                                    onChange={(e) => {
                                      setScheduleForm(prev => ({
                                        ...prev,
                                        [day.key]: {
                                          ...prev[day.key],
                                          openTime: e.target.value
                                        }
                                      }));
                                    }}
                                    className="px-2 py-1 bg-white rounded-lg border border-outline-variant/20 text-xs font-bold focus:outline-none focus:border-primary"
                                  />
                                  <span className="text-[10px] font-bold text-on-surface-variant">s/d</span>
                                  <input 
                                    type="time" 
                                    value={scheduleForm[day.key]?.closeTime || '21:30'}
                                    onChange={(e) => {
                                      setScheduleForm(prev => ({
                                        ...prev,
                                        [day.key]: {
                                          ...prev[day.key],
                                          closeTime: e.target.value
                                        }
                                      }));
                                    }}
                                    className="px-2 py-1 bg-white rounded-lg border border-outline-variant/20 text-xs font-bold focus:outline-none focus:border-primary"
                                  />
                                </div>
                              )}
                              {!(scheduleForm[day.key]?.isOpen ?? true) && (
                                <span className="text-[10px] font-extrabold text-red-650 bg-red-55 px-2 py-1 rounded">TUTUP SEHARIAN</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSavingRestoSettings}
                        className="w-full py-3 bg-primary hover:bg-primary/95 text-white active:scale-95 transition-all text-xs rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 mt-4"
                      >
                        {isSavingRestoSettings ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            <span>Menyimpan Pengaturan...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">save</span>
                            <span>Simpan Pengaturan Operasional</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </main>
            </div>
          )}

          {/* MODAL: ADD / EDIT MENU ITEM */}
          {isMenuModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div 
                className="bg-background w-full max-w-md rounded-3xl p-6 custom-shadow border border-outline-variant/10 text-left max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-black text-base text-primary">
                    {editingMenuItem ? 'Edit Menu Kue' : 'Tambah Menu Baru'}
                  </h3>
                  <button 
                    onClick={() => setIsMenuModalOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-md">close</span>
                  </button>
                </div>

                <form onSubmit={handleSaveMenu} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Nama Kue</label>
                    <input 
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Mini Box Blueberry"
                      required
                      className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Kategori</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                    >
                      <option value="Mini box">Mini box</option>
                      <option value="Medium box">Medium box</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Bundling">Bundling</option>
                      <option value="Gift">Gift</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Harga (Rupiah)</label>
                    <input 
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="Contoh: 10000"
                      required
                      className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Deskripsi</label>
                    <textarea 
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Tulis deskripsi singkat premium mengenai rasa kue..."
                      rows="3"
                      className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface resize-none leading-relaxed"
                    ></textarea>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Foto Menu</label>
                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {formImage ? (
                          <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/40 text-xl">image</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          id="menu-file-input"
                          className="hidden"
                        />
                        <label 
                          htmlFor="menu-file-input"
                          className="inline-flex px-3.5 py-2 bg-secondary-container hover:bg-secondary-container/90 active:scale-95 transition-all text-[10px] font-bold rounded-lg cursor-pointer border border-outline-variant/10 text-on-secondary-container items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">cloud_upload</span>
                          <span>Pilih File Gambar</span>
                        </label>
                        <p className="text-[8px] text-on-surface-variant/70 leading-normal font-semibold">
                          Format: JPEG/PNG. Maksimal ukuran 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                      <span className="text-[9px] text-on-surface-variant/60 font-bold uppercase text-center">- ATAU MASUKKAN URL -</span>
                      <input 
                        type="text"
                        value={formImage && formImage.startsWith('data:') ? '' : formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://contoh.com/gambar.jpg"
                        className="px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                      />
                    </div>
                  </div>

                  {/* Rating & Sales Count */}
                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Rating Bintang</label>
                      <select
                        value={formRating}
                        onChange={(e) => setFormRating(e.target.value)}
                        className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                      >
                        {Array.from({ length: 11 }, (_, i) => (4.0 + i * 0.1).toFixed(1)).map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Jumlah Order</label>
                      <input 
                        type="number"
                        value={formSalesCount}
                        onChange={(e) => setFormSalesCount(e.target.value)}
                        placeholder="Contoh: 1500"
                        min="0"
                        className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:outline-none focus:border-primary text-xs font-semibold text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-outline-variant/10 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsMenuModalOpen(false)}
                      className="flex-1 py-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface active:scale-95 transition-all text-xs rounded-xl font-bold border border-outline-variant/10 text-center"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingMenu}
                      className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white active:scale-95 transition-all text-xs rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      {isSavingMenu ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Menu</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Floating Sticky Cart Bar (Contextual) */}
          {getCartCount() > 0 && (activeTab === 'home' || activeTab === 'menu') && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-40px)] max-w-[440px]">
              <div className="bg-primary text-white p-3.5 rounded-full flex items-center justify-between shadow-xl shadow-primary/30">
                <div className="flex items-center gap-3 text-left pl-2">
                  <div className="bg-white/20 p-2 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">shopping_basket</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-xs font-bold leading-none">{getCartCount()} Item</p>
                    <p className="text-[10px] text-white/80 font-bold mt-1">Rp {getCartSubtotal().toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('cart')}
                  className="bg-white text-primary px-5 py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
                >
                  Lihat Keranjang
                </button>
              </div>
            </div>
          )}

          {/* Shared Bottom Navigation Bar */}
          <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[480px] z-50 flex justify-around items-center px-4 pt-2.5 pb-1 bg-surface-container-lowest shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)] rounded-none mx-auto border-t border-outline-variant/10">
            {/* Home Tab */}
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex items-center justify-center transition-all duration-200 active:scale-90 ${
                activeTab === 'home' 
                  ? 'flex-row gap-1.5 cizquake-nav-active font-extrabold shadow-sm' 
                  : 'flex-col text-[#785900]/70 px-3 py-1'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
              <span className={`font-label-lg font-bold ${activeTab === 'home' ? 'text-[11px] capitalize' : 'text-[9px] mt-0.5 uppercase'}`}>Home</span>
            </button>
            
            {/* Menu Tab */}
            <button 
              onClick={() => setActiveTab('menu')}
              className={`flex items-center justify-center transition-all duration-200 active:scale-90 ${
                activeTab === 'menu' 
                  ? 'flex-row gap-1.5 cizquake-nav-active font-extrabold shadow-sm' 
                  : 'flex-col text-[#785900]/70 px-3 py-1'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'menu' ? "'FILL' 1" : "'FILL' 0" }}>restaurant_menu</span>
              <span className={`font-label-lg font-bold ${activeTab === 'menu' ? 'text-[11px] capitalize' : 'text-[9px] mt-0.5 uppercase'}`}>Menu</span>
            </button>

            {/* Cart Tab */}
            <button 
              onClick={() => setActiveTab('cart')}
              className={`relative flex items-center justify-center transition-all duration-200 active:scale-90 ${
                activeTab === 'cart' 
                  ? 'flex-row gap-1.5 cizquake-nav-active font-extrabold shadow-sm' 
                  : 'flex-col text-[#785900]/70 px-3 py-1'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'cart' ? "'FILL' 1" : "'FILL' 0" }}>shopping_bag</span>
              <span className={`font-label-lg font-bold ${activeTab === 'cart' ? 'text-[11px] capitalize' : 'text-[9px] mt-0.5 uppercase'}`}>Cart</span>
              {getCartCount() > 0 && activeTab !== 'cart' && (
                <span className="absolute -top-1.5 -right-1 bg-red-600 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-extrabold shadow-sm">
                  {getCartCount()}
                </span>
              )}
            </button>

            {/* Profile Tab */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center transition-all duration-200 active:scale-90 ${
                activeTab === 'profile' 
                  ? 'flex-row gap-1.5 cizquake-nav-active font-extrabold shadow-sm' 
                  : 'flex-col text-[#785900]/70 px-3 py-1'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
              <span className={`font-label-lg font-bold ${activeTab === 'profile' ? 'text-[11px] capitalize' : 'text-[9px] mt-0.5 uppercase'}`}>Profile</span>
            </button>
            
            {/* Admin Tab (Only if logged in) */}
            {isAdminLoggedIn && (
              <button 
                onClick={() => {
                  setActiveTab('admin');
                  fetchAdminOrders();
                }}
                className={`flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  activeTab === 'admin' 
                    ? 'flex-row gap-1.5 cizquake-nav-active font-extrabold shadow-sm' 
                    : 'flex-col text-[#785900]/70 px-3 py-1'
                }`}
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'admin' ? "'FILL' 1" : "'FILL' 0" }}>admin_panel_settings</span>
                <span className={`font-label-lg font-bold ${activeTab === 'admin' ? 'text-[11px] capitalize' : 'text-[9px] mt-0.5 uppercase'}`}>Admin</span>
              </button>
            )}
          </nav>
        </div>
      )}

      {/* 3. CHECKOUT VIEW */}
      {currentView === 'checkout' && (
        <div className="bg-background min-h-screen pb-32">
          <header className="fixed top-0 left-0 right-0 z-50 bg-[#fabd00] flex items-center h-16 max-w-[480px] mx-auto border-b border-[#fabd00] text-white px-container-margin-mobile">
            <button onClick={() => setCurrentView('catalog')} className="p-2 transition-transform active:scale-95 text-white flex items-center justify-center z-10">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-display text-base font-black tracking-tight text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Checkout</h1>
          </header>

          <main className="pt-20 px-container-margin-mobile max-w-2xl mx-auto flex flex-col gap-6">
            
            {/* Customer Information */}
            <section className="bg-surface-container-lowest p-5 rounded-lg custom-shadow border border-outline-variant/10">
              <h2 className="font-display font-bold text-[16px] text-primary mb-4 flex items-center gap-2 text-left">
                <span className="material-symbols-outlined text-lg">person</span>
                Detail Penerima
              </h2>
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant/80 uppercase mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Masukkan nama penerima" 
                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary font-body-md text-on-surface text-sm placeholder-on-surface-variant/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant/80 uppercase mb-1">Nomor WhatsApp</label>
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 0812XXXXXXXX" 
                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary font-body-md text-on-surface text-sm placeholder-on-surface-variant/50 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Delivery Address Section */}
            <section className="bg-surface-container-lowest p-5 rounded-lg custom-shadow border border-outline-variant/10">
              <h2 className="font-display font-bold text-[16px] text-primary mb-4 flex items-center gap-2 text-left">
                <span className="material-symbols-outlined text-lg">location_on</span>
                Alamat Pengiriman
              </h2>
              
              <div className="space-y-4 text-left">
                <div className="relative">
                  <label className="block text-xs font-bold text-on-surface-variant/80 uppercase mb-1">Cari Kelurahan / Kecamatan (Bandung)</label>
                  <input 
                    type="text"
                    value={addressSearch}
                    onChange={e => {
                      setAddressSearch(e.target.value);
                      if (selectedArea) setSelectedArea(null);
                    }}
                    placeholder="Ketik minimal 3 huruf..." 
                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary font-body-md text-on-surface text-sm placeholder-on-surface-variant/50 outline-none"
                  />
                  
                  {/* Results Autocomplete */}
                  {areaResults.length > 0 && !selectedArea && (
                    <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {areaResults.map(area => (
                        <div 
                          key={area.id}
                          onClick={() => {
                            setSelectedArea(area);
                            setAddressSearch(area.name);
                            setAreaResults([]);
                          }}
                          className="px-4 py-3 cursor-pointer hover:bg-primary-fixed/20 text-on-surface text-sm border-b border-outline-variant/10"
                        >
                          {area.name} (Kode Pos: {area.postal_code})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedArea && (
                  <div className="flex items-center gap-2 text-green-750 text-xs bg-green-100/50 p-3 rounded-lg border border-green-200">
                    <span className="material-symbols-outlined text-sm font-bold text-green-600">check_circle</span>
                    <span className="text-green-800">Area Terpilih: <strong>{selectedArea.name}</strong></span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant/80 uppercase mb-1">Alamat Lengkap & Patokan Rumah</label>
                  <textarea 
                    value={detailedAddress}
                    onChange={e => setDetailedAddress(e.target.value)}
                    placeholder="No. Rumah, RT/RW, nama jalan, patokan gerbang, pagar rumah, dll."
                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary font-body-md text-on-surface text-sm placeholder-on-surface-variant/50 h-20 resize-none pt-3 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Courier Selection */}
            {selectedArea && (
              <section className="bg-surface-container-lowest p-5 rounded-lg custom-shadow border border-outline-variant/10">
                <h2 className="font-display font-bold text-[16px] text-primary mb-4 flex items-center gap-2 text-left">
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                  Pilih Kurir Instan (Pengiriman dari Buahbatu)
                </h2>

                {isLoadingRates ? (
                  <div className="text-center py-8 text-on-surface-variant text-xs flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    <span>Mencari tarif kurir instan terbaik...</span>
                  </div>
                ) : couriers.length === 0 ? (
                  <div className="text-center py-6 text-error text-xs flex items-center justify-center gap-2 bg-red-50 rounded-lg border border-red-100">
                    <span className="material-symbols-outlined">warning</span>
                    <span>Layanan kurir tidak tersedia / area pengiriman terlalu jauh.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {couriers.map(courier => (
                      <div 
                        key={courier.courier_name}
                        onClick={() => setSelectedCourier(courier)}
                        className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-between transition-all text-left ${
                          selectedCourier?.courier_name === courier.courier_name 
                            ? 'border-primary bg-primary-fixed/20' 
                            : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-on-surface text-sm uppercase">{courier.courier_name}</p>
                          <p className="text-on-surface-variant text-xs mt-0.5">Estimasi tiba: {courier.duration}</p>
                        </div>
                        <span className="font-display font-bold text-primary text-sm">Rp {courier.price.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Payment Method Selector */}
            <section className="bg-surface-container-lowest p-5 rounded-lg custom-shadow border border-outline-variant/10">
              <h2 className="font-display font-bold text-[16px] text-primary mb-4 flex items-center gap-2 text-left">
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                Metode Pembayaran
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <label className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="ewallet" 
                    checked={selectedPaymentMethod === 'ewallet'}
                    onChange={() => setSelectedPaymentMethod('ewallet')}
                    className="hidden peer" 
                  />
                  <div className="p-4 rounded-xl border-2 flex items-center gap-4 transition-all peer-checked:border-primary peer-checked:bg-primary-fixed/20 border-outline-variant/30 bg-surface-container-lowest">
                    <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined text-primary">payments</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-on-surface text-sm">E-Wallet QRIS (Otomatis)</p>
                      <p className="text-on-surface-variant text-xs">Mendukung GoPay, OVO, DANA, LinkAja, BCA, dll.</p>
                    </div>
                    <span className="material-symbols-outlined text-primary opacity-0 peer-checked:opacity-100">check_circle</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Final Calculation Section */}
            <section className="bg-surface-container-lowest p-5 rounded-lg custom-shadow mb-8 border border-outline-variant/10 text-left">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal Cizquake ({getCartCount()} item)</span>
                  <span className="text-on-surface font-semibold">Rp {getCartSubtotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Biaya Pengiriman</span>
                  <span className="text-on-surface font-semibold">
                    {selectedCourier ? `Rp ${selectedCourier.price.toLocaleString('id-ID')}` : 'Pilih Kurir'}
                  </span>
                </div>
                <div className="pt-3 border-t border-outline-variant/30 flex justify-between items-center">
                  <span className="font-display font-bold text-md text-on-surface">Total Pembayaran</span>
                  <span className="font-display font-bold text-lg text-primary">
                    Rp {(getCartSubtotal() + (selectedCourier ? selectedCourier.price : 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </section>
          </main>

          {/* Sticky Bottom Confirm Button */}
          <div className="fixed bottom-0 left-0 right-0 p-container-margin-mobile bg-surface-container-lowest/80 backdrop-blur-md z-40 max-w-[480px] mx-auto border-t border-outline-variant/20">
            <button 
              onClick={handleCheckoutSubmit}
              disabled={isSubmittingOrder || !selectedCourier || !customerName || !customerPhone}
              className="w-full py-4 bg-primary-container text-on-primary-container font-display font-extrabold text-md rounded-full shadow-lg transition-all hover:brightness-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{isSubmittingOrder ? 'Memproses Pesanan...' : 'Konfirmasi & Bayar'}</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. PAYMENT VIEW (QRIS DISPLAY) */}
      {currentView === 'payment' && paymentInfo && (
        <div className="bg-background min-h-screen pb-32">
          <header className="bg-[#fabd00] fixed top-0 w-full max-w-[480px] z-50 flex items-center h-16 border-b border-[#fabd00] max-w-[480px] mx-auto text-white px-container-margin-mobile">
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-lg text-white">payments</span>
              <span className="text-base font-black tracking-tight text-white font-display">Pembayaran QRIS</span>
            </div>
            <div className="flex-grow"></div>
            <span className="bg-white/20 text-white px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm z-10">
              <span className="material-symbols-outlined text-xs">schedule</span>
              {paymentExpiryTimer}
            </span>
          </header>

          <main className="pt-20 px-container-margin-mobile max-w-2xl mx-auto flex flex-col items-center">
            
            {/* Developer Simulation Warning */}
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center shadow-sm">
              <p className="text-red-700 text-xs font-bold mb-2 uppercase tracking-wide">MODE SIMULATOR DEVELOPER</p>
              <p className="text-[11px] text-red-600 mb-3 font-semibold">Klik tombol di bawah ini untuk menyimulasikan notifikasi sukses pembayaran QRIS tanpa memindai kode.</p>
              <button 
                onClick={triggerSimulatePayment} 
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-6 rounded-full active:scale-95 transition shadow-md shadow-red-200"
              >
                Simulasikan Pembayaran Sukses
              </button>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xs font-bold text-on-surface-variant/80 uppercase">Total Nominal Pembayaran</h3>
              <p className="text-3xl font-extrabold text-primary mt-1 font-display font-bold">
                Rp {paymentInfo.grossAmount.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-on-surface-variant font-mono mt-2 bg-surface-container px-3 py-1 rounded-full border border-outline-variant/30 inline-block">ID Pesanan: {paymentInfo.orderId}</p>
            </div>

            {/* QRIS Code Image */}
            <div className="bg-surface-container-lowest p-6 rounded-lg custom-shadow flex flex-col items-center border border-outline-variant/10 mb-6">
              <div className="w-[220px] h-[220px] bg-white p-2 border border-outline-variant/40 rounded-lg flex items-center justify-center shadow-inner">
                {paymentInfo.paymentQrUrl ? (
                  <img 
                    src={paymentInfo.paymentQrUrl} 
                    alt="QRIS Code" 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <div className="text-center flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    <span className="text-[11px] text-on-surface-variant">Memuat QRIS...</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center text-center gap-1.5 mt-4 max-w-[280px]">
                <p className="text-xs font-bold text-on-surface">Pindai QRIS Menggunakan Aplikasi Bank/E-Wallet</p>
                <p className="text-[10px] text-on-surface-variant/80 leading-relaxed font-semibold">Mendukung GoPay, OVO, ShopeePay, DANA, BCA, LinkAja, Livin' Mandiri, dll.</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 mb-8 text-left">
              <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-sm font-bold">info</span>
                Petunjuk Pembayaran
              </h4>
              <ol className="text-left text-xs text-on-surface-variant space-y-2.5 list-decimal list-inside leading-relaxed font-semibold">
                <li>Simpan kode QR dengan melakukan screenshot halaman ini, atau scan langsung menggunakan handphone lain.</li>
                <li>Buka e-wallet (GoPay, DANA, OVO) atau aplikasi m-Banking Anda.</li>
                <li>Pilih menu scan QR/Pay dan arahkan kamera ke kode QRIS di atas.</li>
                <li>Setelah konfirmasi bayar sukses di simulator/aplikasi, halaman ini akan otomatis berganti ke halaman pelacakan pesanan.</li>
              </ol>
            </div>
          </main>
        </div>
      )}

      {/* 5. TRACKING VIEW */}
      {currentView === 'tracking' && trackingInfo && (
        <div className="bg-background min-h-screen pb-32">
          <header className="bg-[#fabd00] fixed top-0 w-full max-w-[480px] z-50 flex items-center h-16 border-b border-[#fabd00] max-w-[480px] mx-auto text-white px-container-margin-mobile">
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-lg text-white">local_shipping</span>
              <span className="text-base font-black tracking-tight text-white font-display">Status Pengiriman</span>
            </div>
            <div className="flex-grow"></div>
            <span className="text-[10px] bg-white/20 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider z-10">
              Lunas / Paid
            </span>
          </header>

          <main className="pt-20 px-container-margin-mobile max-w-2xl mx-auto flex flex-col gap-6">
            
            {/* Summary Order Box */}
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4 text-left">
                <div className="bg-primary-container p-3 rounded-xl text-on-primary-container">
                  <span className="material-symbols-outlined text-xl">package</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-on-surface">Pesanan #{trackingInfo.orderId.length > 12 ? `${trackingInfo.orderId.substring(0, 12)}...` : trackingInfo.orderId}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 font-semibold">Total: Rp {trackingInfo.grossAmount.toLocaleString('id-ID')}</p>
                  <p className="text-[11px] text-on-surface-variant/80 mt-2 font-semibold bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/10 leading-relaxed">
                    Alamat: {trackingInfo.shipping.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Courier Info & Live Map Card */}
            {trackingInfo.shippingOrderInfo && (
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 shadow-sm space-y-4 text-left animate-in fade-in duration-200">
                <h3 className="text-xs uppercase font-bold text-primary tracking-wider flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm font-bold">local_shipping</span>
                  Informasi Pengiriman
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <p className="text-on-surface-variant/65 text-[9px] uppercase font-bold">Nama Kurir / Driver</p>
                    <p className="text-on-surface font-bold">
                      {trackingInfo.shippingOrderInfo.courier_driver_name || 'Mencari Driver...'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-on-surface-variant/65 text-[9px] uppercase font-bold">Kontak Driver</p>
                    {trackingInfo.shippingOrderInfo.courier_driver_phone ? (
                      <a 
                        href={`tel:${trackingInfo.shippingOrderInfo.courier_driver_phone}`}
                        className="text-primary hover:underline font-bold flex items-center gap-1 w-fit"
                      >
                        <span className="material-symbols-outlined text-xs">call</span>
                        {trackingInfo.shippingOrderInfo.courier_driver_phone}
                      </a>
                    ) : (
                      <p className="text-on-surface/50 italic font-medium">Tidak tersedia</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-on-surface-variant/65 text-[9px] uppercase font-bold">Nomor Resi / Order ID Biteship</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-surface-container-low px-2.5 py-1 rounded-md border border-outline-variant/15 text-[10px] font-bold text-primary select-all">
                        {trackingInfo.shippingOrderInfo.courier_order_id}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(trackingInfo.shippingOrderInfo.courier_order_id);
                          alert('Nomor Resi berhasil disalin!');
                        }}
                        className="text-[10px] font-bold text-on-surface-variant hover:text-primary flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">content_copy</span>
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Iframe Map Tracking */}
                {trackingInfo.shippingOrderInfo.courier_tracking_url && (
                  <div className="mt-4 space-y-2">
                    <p className="text-on-surface-variant/65 text-[9px] uppercase font-bold">Peta Pelacakan Live</p>
                    <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-outline-variant/10 bg-slate-50 relative shadow-inner">
                      <iframe 
                        src={trackingInfo.shippingOrderInfo.courier_tracking_url} 
                        className="w-full h-full border-none"
                        title="Live Courier Tracking Map"
                        allow="geolocation"
                      ></iframe>
                    </div>
                    <div className="text-center pt-1">
                      <a 
                        href={trackingInfo.shippingOrderInfo.courier_tracking_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline font-bold flex items-center justify-center gap-1 w-fit mx-auto"
                      >
                        <span className="material-symbols-outlined text-xs font-bold">open_in_new</span>
                        Buka Peta Pelacakan di Tab Baru
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tracking Steps Timeline */}
            <h3 className="text-sm font-bold text-primary mb-1 text-left flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-md">list_alt</span>
              Progres Pengiriman Cizquake
            </h3>
            
            <div className="relative border-l-2 border-outline-variant/40 ml-4 pl-6 space-y-6 text-left pb-4">
              
              {/* Step 1: Pembayaran Sukses */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  trackingInfo.paymentStatus === 'paid' ? 'bg-primary border-primary shadow-sm shadow-primary/40' : 'bg-background border-outline-variant'
                }`}></div>
                <h4 className="font-bold text-sm text-on-surface leading-none">Pembayaran Diterima</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 font-semibold">Dana sebesar Rp {trackingInfo.grossAmount.toLocaleString('id-ID')} berhasil dikonfirmasi secara aman.</p>
              </div>

              {/* Step 2: Mencari Driver */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  ['searching', 'driver_assigned', 'on_the_way', 'delivered'].includes(trackingInfo.shippingStatus) 
                    ? 'bg-primary border-primary shadow-sm shadow-primary/40' 
                    : 'bg-background border-outline-variant'
                }`}></div>
                <h4 className="font-bold text-sm text-on-surface leading-none">Menghubungi Kurir</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 font-semibold">Mempersiapkan pengiriman instan via {trackingInfo.shipping.courierCompany} dari Buahbatu.</p>
              </div>

              {/* Step 3: Kurir ditugaskan */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  ['driver_assigned', 'on_the_way', 'delivered'].includes(trackingInfo.shippingStatus) 
                    ? 'bg-primary border-primary shadow-sm shadow-primary/40' 
                    : 'bg-background border-outline-variant'
                }`}></div>
                <h4 className="font-bold text-sm text-on-surface leading-none">Driver Ditemukan</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 font-semibold">
                  {trackingInfo.shippingOrderInfo?.courier_driver_name 
                    ? `Kurir: ${trackingInfo.shippingOrderInfo.courier_driver_name} (${trackingInfo.shippingOrderInfo.courier_driver_phone})`
                    : 'Menghubungi/menugaskan driver ke restoran...'}
                </p>
              </div>

              {/* Step 4: Dalam Perjalanan */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  ['on_the_way', 'delivered'].includes(trackingInfo.shippingStatus) 
                    ? 'bg-primary border-primary shadow-sm shadow-primary/40' 
                    : 'bg-background border-outline-variant'
                }`}></div>
                <h4 className="font-bold text-sm text-on-surface leading-none">Dalam Pengantaran</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 font-semibold">Cizquake sedang dibawa kurir dan dalam perjalanan ke tempat Anda.</p>
              </div>

              {/* Step 5: Selesai */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  trackingInfo.shippingStatus === 'delivered' ? 'bg-primary border-primary shadow-sm shadow-primary/40' : 'bg-background border-outline-variant'
                }`}></div>
                <h4 className="font-bold text-sm text-on-surface leading-none">Pesanan Tiba</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 font-semibold">Paket lezat Anda sudah sampai tujuan. Selamat menikmati!</p>
              </div>
            </div>

            {/* Back to Home Button */}
            <button 
              onClick={() => {
                setCart([]);
                setSelectedArea(null);
                setAddressSearch('');
                setDetailedAddress('');
                setSelectedCourier(null);
                setActiveTab('home');
                setCurrentView('catalog');
              }}
              className="w-full py-4 bg-primary-container text-on-primary-container font-display font-extrabold text-sm rounded-full shadow-lg transition-transform active:scale-95 hover:brightness-105 my-8"
            >
              Kembali ke Menu Utama
            </button>
          </main>
        </div>
      )}

      </>
      )}

    </div>
  );
}
