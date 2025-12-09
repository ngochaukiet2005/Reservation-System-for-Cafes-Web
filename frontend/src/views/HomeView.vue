<template>
  <div class="landing-page" @click="closeUserMenuOutside">
    <nav class="navbar" :class="{ scrolled: isScrolled }">
      <div class="logo">
        <img src="../assets/logo.png" alt="Trạm Sạc FC" class="logo-img">
        <span class="logo-text">Trạm Sạc FC</span>
      </div>

      <div class="nav-actions">
        <div class="nav-links">
          <a href="#about" @click.prevent="scrollToSection('about')" class="link-item">Giới Thiệu</a>
          <a href="#menu" @click.prevent="scrollToSection('menu')" class="link-item">Menu</a>
        </div>
        
        <div class="auth-section">
          <button v-if="!authStore.isAuthenticated" @click="openAuthModal(false)" class="btn-login">
            Đăng Nhập / Đăng Ký
          </button>

          <div v-else class="user-area-icon-only" @click.stop="toggleUserMenu">
            <div class="user-avatar-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span class="status-dot"></span>
            </div>
            
            <transition name="fade-slide">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-header">
                  <div class="header-avatar">{{ getUserInitial }}</div>
                  <div class="header-info">
                    <span class="user-display-name">{{ authStore.user?.name }}</span>
                    <span class="user-email">{{ authStore.user?.email }}</span>
                  </div>
                </div>
                
                <div class="dropdown-body">
                  <div class="menu-item" @click="handleEditProfile">
                    <span class="menu-icon">✏️</span>
                    <span class="menu-text">Chỉnh sửa hồ sơ</span>
                  </div>
                  <div class="menu-divider"></div>
                  <div class="menu-item" @click="goToDashboard">
                    <span class="menu-icon">⚙️</span>
                    <span class="menu-text">Trang quản lý</span>
                  </div>
                  <div class="menu-item" @click="goToHistory">
                    <span class="menu-icon">📜</span>
                    <span class="menu-text">Lịch sử đặt bàn</span>
                  </div>
                  <div class="menu-divider"></div>
                  <div class="menu-item logout" @click="handleLogout">
                    <span class="menu-icon">🚪</span>
                    <span class="menu-text">Đăng xuất</span>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </nav>

    <header class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>
          <span class="hero-text-light">Tinh Hoa</span> <br> 
          <span class="hero-text-bold highlight">Hạt Cà Phê Việt</span>
        </h1>
        <p>Một không gian nghệ thuật nơi hương vị và cảm xúc thăng hoa.</p>
        <button @click="handleCTAClick" class="btn-cta">
          <span class="btn-text">Đặt Bàn Ngay</span>
          <span class="btn-icon">➝</span>
        </button>
      </div>
      <div class="scroll-down" @click="scrollToSection('about')">
        <span>Khám phá</span>
        <div class="arrow">↓</div>
      </div>
    </header>

    <div class="content-wrapper">
      
      <div class="bg-blob blob-top-left"></div>
      <div class="bg-blob blob-center-right"></div>
      <div class="bg-blob blob-bottom-left"></div>

      <section id="about" class="section about-section">
        <div class="container split-layout">
          <div class="text-col">
            <h2>Hơn Cả Một Tách Cà Phê</h2>
            <p class="desc-text">Trạm Sạc FC không chỉ là nơi phục vụ cà phê. Chúng tôi là điểm dừng chân của những tâm hồn yêu sự yên bình. Từng hạt cà phê được tuyển chọn từ vùng đất đỏ Bazan, rang xay mộc để giữ trọn hương vị nguyên bản.</p>
          </div>
          <div class="img-col">
            <div class="img-wrapper">
              <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&w=800&q=80" alt="Space">
            </div>
          </div>
        </div>
      </section>

      <section id="menu" class="section menu-section">
        <div class="container">
          <div class="section-title">
            <h2>Signature Collections</h2>
          </div>
          <div class="cards-wrapper">
            <div class="menu-card" v-for="(item, i) in bestSellers" :key="i">
              <div class="card-image" :style="{ backgroundImage: `url(${item.img})` }"></div>
              
              <div class="card-content">
                <div class="card-header">
                  <h3>{{ item.name }}</h3>
                  <p>{{ item.desc }}</p>
                </div>
                
                <div class="card-footer-price-only">
                  <span class="price">{{ item.price }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div> 
    <footer class="footer">
      <div class="footer-content">
        <h3>Trạm Sạc FC</h3>
        <p>© 2025 All rights reserved.</p>
      </div>
    </footer>

    <AuthModal 
      :isVisible="showModal" 
      @close="showModal = false"
      @success="handleLoginSuccess"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from '../store/authStore';
import AuthModal from '../components/AuthModal.vue'; // Import component mới

const router = useRouter();

// UI States
const isScrolled = ref(false);
const showModal = ref(false);
const showUserMenu = ref(false);
const redirectAfterLogin = ref(false);

// Dữ liệu mẫu (giữ nguyên)
const bestSellers = [
  { name: 'Salted Caramel Latte', desc: 'Sự hòa quyện giữa vị mặn nhẹ và ngọt ngào.', price: '65.000đ', img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&w=600&q=80' },
  { name: 'Tropical Fruit Tea', desc: 'Trà trái cây nhiệt đới tươi mát.', price: '55.000đ', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' },
  { name: 'Classic Tiramisu', desc: 'Bánh ngọt tráng miệng phong cách Ý.', price: '45.000đ', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80' },
];

const getUserInitial = computed(() => authStore.user?.name.charAt(0).toUpperCase() || 'U');

const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const handleScroll = () => { isScrolled.value = window.scrollY > 50; };
onMounted(() => window.addEventListener('scroll', handleScroll));
onUnmounted(() => window.removeEventListener('scroll', handleScroll));

// Logic Modal mới
const openAuthModal = (shouldRedirect: boolean) => {
  redirectAfterLogin.value = shouldRedirect;
  showModal.value = true;
};

const handleLoginSuccess = () => {
  if (redirectAfterLogin.value) {
    goToReservation();
  }
};

const handleCTAClick = () => {
  if (authStore.isAuthenticated) goToReservation();
  else openAuthModal(true);
};

const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value; };
const closeUserMenuOutside = () => { showUserMenu.value = false; };
const handleLogout = () => {
  authStore.logout();
  showUserMenu.value = false;
  router.push('/');
};

const handleEditProfile = () => { alert('Đang phát triển!'); showUserMenu.value = false; };
const goToReservation = () => router.push('/reservation');
const goToHistory = () => router.push('/history');
const goToDashboard = () => router.push('/staff/dashboard');
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');

/* GLOBAL SETTINGS */
.landing-page {
  --primary: #a67c52;
  --dark: #1a1a1a;
  --light: #fdfbf7;
  --gray: #f5f5f5;
  font-family: 'Montserrat', sans-serif;
  color: var(--dark);
  background: var(--light);
}

h1, h2, h3, .brand-text, .price, .header-avatar, .logo-text { 
  font-family: 'Cormorant Garamond', serif; 
}

/* NAVBAR */
.navbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 50px; position: fixed; width: 100%; z-index: 100;
  transition: all 0.4s ease; box-sizing: border-box;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
}
.navbar.scrolled { background: rgba(255, 255, 255, 0.98); box-shadow: 0 5px 20px rgba(0,0,0,0.05); padding: 15px 50px; }
.nav-actions { display: flex; align-items: center; gap: 40px; }
.nav-links { display: flex; align-items: center; gap: 30px; }

/* Links Styling */
.link-item { 
  text-decoration: none; 
  color: #ffffff; 
  font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px;
  transition: 0.3s; margin-right: 20px; cursor: pointer; text-transform: uppercase;
}
.navbar.scrolled .link-item { color: var(--dark); }
.link-item:hover { color: var(--primary); }

/* --- STYLE MỚI CHO LOGO (ẢNH + CHỮ) --- */
.logo {
  display: flex;
  align-items: center;
  gap: 15px; 
  cursor: pointer;
}

.logo-img {
  height: 90px;
  width: auto;
  display: block;
  transition: all 0.3s ease;
  filter: brightness(0) invert(1);
}

.logo-text {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.navbar.scrolled .logo-img { height: 70px; filter: none; }
.navbar.scrolled .logo-text { color: var(--dark); }

/* BUTTONS */
.btn-login {
  padding: 12px 30px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.6);
  color: #fff; border-radius: 30px; cursor: pointer; backdrop-filter: blur(4px); transition: 0.3s;
  display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 1.05rem;
}
.navbar.scrolled .btn-login { background: var(--dark); border-color: var(--dark); }
.btn-login:hover { background: var(--primary); border-color: var(--primary); }

/* HERO SECTION */
.hero { 
  height: 100vh; position: relative; display: flex; align-items: center; padding-left: 10%; color: #fff;
  background-color: #2c2c2c; 
  background-image: url('../assets/banner.jpg'); 
  background-size: cover; background-position: center;
}
.hero-overlay { 
  position: absolute; 
  inset: 0; 
  background: linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%); 
}
.hero-content { position: relative; z-index: 2; max-width: 700px; animation: fadeUp 1s ease-out; }

.hero h1 { 
  font-size: 4rem; line-height: 1.1; margin-bottom: 20px; color: #ffffff;
  text-shadow: 0 4px 20px rgba(0,0,0,0.9);
}
.hero-text-light { font-weight: 400; font-style: italic; opacity: 1; color: #ffffff; }
.hero-text-bold.highlight { 
  font-weight: 700; font-size: 5rem; display: block; margin-top: 10px;
  color: #ffe4c4; text-shadow: 0 4px 25px rgba(0,0,0,1);
}
.hero p { 
  font-size: 1.15rem; margin-bottom: 40px; color: #f0f0f0; 
  line-height: 1.8; font-weight: 500; max-width: 550px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.9);
}

.btn-cta {
  display: inline-flex; align-items: center; padding: 15px 45px;
  background: #c0392b; color: #fff; border: none; border-radius: 50px;
  font-size: 1rem; font-weight: 600; cursor: pointer; transition: 0.3s; letter-spacing: 1px;
  box-shadow: 0 10px 30px rgba(192, 57, 43, 0.4);
}
.btn-cta:hover { transform: translateX(10px); background: #d35400; }

/* CONTENT WRAPPER */
.content-wrapper {
  position: relative;
  background: #fdfbf7;
  overflow: hidden;
  padding-bottom: 50px;
}

.about-section, .menu-section {
  background: transparent !important;
  position: relative;
  z-index: 2;
}
.section { padding: 120px 50px; }

/* Blob Styles */
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.6;
  z-index: 1;
  pointer-events: none;
}
.blob-top-left { width: 600px; height: 600px; background: #ffe8cc; top: -100px; left: -200px; }
.blob-center-right { width: 500px; height: 500px; background: #e3f2fd; top: 35%; right: -150px; }
.blob-bottom-left { width: 700px; height: 700px; background: #fae3d9; bottom: -200px; left: -150px; }

/* Layout Content */
.split-layout { display: flex; gap: 80px; align-items: center; }
.text-col { flex: 1; }
.text-col h2 { font-size: 3.5rem; margin-bottom: 25px; line-height: 1.1; color: var(--dark); }
.desc-text { font-size: 1.1rem; line-height: 1.8; color: #555; text-align: justify; font-weight: 400; }
.img-col { flex: 1; }
.img-wrapper img { width: 100%; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }

/* MENU CARDS */
.section-title { text-align: center; margin-bottom: 60px; }
.section-title h2 { font-size: 3.5rem; color: var(--dark); margin: 0; }
.cards-wrapper { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; justify-content: center; }
.menu-card { 
  background: #fff; border-radius: 20px; overflow: hidden; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: 0.4s;
  display: flex; flex-direction: column;
}
.menu-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
.card-image { height: 280px; background-size: cover; background-position: center; }
.card-content { padding: 30px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.card-header h3 { font-size: 1.8rem; margin-bottom: 10px; color: var(--dark); font-weight: 700; }
.card-header p { color: #666; font-size: 1rem; margin-bottom: 20px; line-height: 1.6; font-weight: 400; }
.card-footer-price-only { display: flex; justify-content: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.price { font-size: 1.8rem; font-weight: 700; color: var(--primary); }

/* FOOTER */
.footer { background: var(--dark); color: #888; padding: 50px; text-align: center; font-family: 'Montserrat', sans-serif; }
.scroll-down { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); text-align: center; opacity: 1; animation: bounce 2s infinite; cursor: pointer; color: #ffffff; text-shadow: 0 2px 5px rgba(0,0,0,0.8); }
.scroll-down span { display: block; font-size: 0.8rem; letter-spacing: 2px; margin-bottom: 5px; text-transform: uppercase; font-weight: 600; }

/* USER DROPDOWN */
.user-area-icon-only { cursor: pointer; position: relative; }
.user-avatar-circle { width: 45px; height: 45px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: grid; place-items: center; color: #fff; border: 1px solid rgba(255, 255, 255, 0.5); backdrop-filter: blur(5px); transition: 0.3s; position: relative; }
.navbar.scrolled .user-avatar-circle { background: var(--dark); border-color: var(--dark); color: #fff; }
.user-avatar-circle:hover { background: var(--primary); border-color: var(--primary); color: #fff; }
.status-dot { position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; background: #2ecc71; border-radius: 50%; border: 2px solid #fff; }
.user-dropdown { position: absolute; top: 60px; right: 0; width: 300px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; text-align: left; animation: slideUp 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); border: 1px solid rgba(0,0,0,0.05); }
.dropdown-header { padding: 20px; background: #fdfbf7; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 15px; }
.header-avatar { width: 48px; height: 48px; background: var(--primary); color: #fff; border-radius: 50%; font-size: 1.5rem; display: grid; place-items: center; font-weight: 700; }
.header-info { display: flex; flex-direction: column; overflow: hidden; }
.user-display-name { font-size: 1.1rem; color: var(--dark); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Cormorant Garamond', serif; }
.user-email { color: #888; font-size: 0.85rem; margin-top: 2px; }
.dropdown-body { padding: 8px 0; }
.menu-item { display: flex; align-items: center; gap: 15px; padding: 12px 20px; cursor: pointer; transition: all 0.2s; color: #555; font-size: 0.95rem; font-weight: 500; }
.menu-item:hover { background: #fcfcfc; color: var(--primary); padding-left: 25px; }
.menu-icon { font-size: 1.1rem; width: 24px; text-align: center; }
.menu-item.logout { color: #e74c3c; margin-top: 5px; }
.menu-item.logout:hover { background: #fff5f5; color: #c0392b; }
.menu-divider { height: 1px; background: #eee; margin: 5px 20px; }

/* ANIMATIONS */
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);} 40% {transform: translateX(-50%) translateY(-10px);} 60% {transform: translateX(-50%) translateY(-5px);} }
</style>