<template>
  <div class="dashboard-layout" @click="closeUserMenu">
    <aside class="sidebar">
      <div class="brand" @click="router.push('/')">
        <img src="../../assets/logo.png" alt="Logo" class="brand-logo" />
        <div class="brand-info">
          <span class="brand-text">Trạm Sạc FC</span>
          <span class="brand-sub">Staff Portal</span>
        </div>
      </div>

      <ul class="nav-menu">
        <li class="nav-label">Nghiệp Vụ Hàng Ngày</li>
        
        <li 
          :class="{ active: currentTab === 'RESERVATIONS' }" 
          @click="currentTab = 'RESERVATIONS'"
        >
          <span class="icon">📅</span> 
          <span class="text">Danh Sách Đặt Bàn</span>
        </li>
        
        <li 
          :class="{ active: currentTab === 'TABLES' }" 
          @click="currentTab = 'TABLES'"
        >
          <span class="icon">🪑</span> 
          <span class="text">Sơ Đồ Bàn (Map)</span>
        </li>
      </ul>

      <div class="sidebar-footer">
        <p>© 2025 Trạm Sạc FC</p>
      </div>
    </aside>

    <main class="main-wrapper">
      <header class="top-header">
        <div class="page-title">
          <h2>{{ getTabName(currentTab) }}</h2>
          <span class="date-today">{{ todayString }}</span>
        </div>

        <div class="user-area" @click.stop="toggleUserMenu">
          <div class="user-info">
            <span class="name">{{ authStore.user?.name || 'Nhân Viên' }}</span>
            <span class="role-badge">STAFF</span>
          </div>
          
          <div class="avatar-circle">
            {{ getUserInitial }}
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
                <div class="menu-item" @click="handleProfile">
                  <span class="menu-icon">👤</span> Hồ sơ cá nhân
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item logout" @click="handleLogout">
                  <span class="menu-icon">🚪</span> Đăng xuất
                </div>
              </div>
            </div>
          </transition>
        </div>
      </header>

      <div class="content-body">
        
        <div v-if="currentTab === 'RESERVATIONS'" class="tab-content">
          <div class="stats-row">
            <div class="stat-card pending">
              <div class="stat-icon">⏳</div>
              <div class="stat-info">
                <h3>{{ pendingCount }}</h3>
                <p>Chờ Duyệt</p>
              </div>
            </div>
            <div class="stat-card confirmed">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <h3>{{ confirmedCount }}</h3>
                <p>Sắp Đến</p>
              </div>
            </div>
            <div class="stat-card total">
              <div class="stat-icon">📝</div>
              <div class="stat-info">
                <h3>{{ reservationStore.reservations.length }}</h3>
                <p>Tổng Hôm Nay</p>
              </div>
            </div>
          </div>

          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 25%">Khách Hàng</th>
                  <th style="width: 20%">Giờ Đặt</th>
                  <th style="width: 15%">Số Khách</th>
                  <th style="width: 15%">Trạng Thái</th>
                  <th style="width: 25%">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in reservationStore.reservations" :key="item.id">
                  <td>
                    <div class="customer-cell">
                      <div class="customer-avatar">{{ item.guestName.charAt(0) }}</div>
                      <div>
                        <strong>{{ item.guestName }}</strong>
                        <div class="sub-text">{{ item.phone }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="time-cell">
                      <span class="time-big">{{ formatTimeOnly(item.time) }}</span>
                      <span class="date-small">{{ formatDateOnly(item.time) }}</span>
                    </div>
                  </td>
                  <td>{{ item.people }} người</td>
                  <td>
                    <span :class="['status-badge', item.status.toLowerCase()]">
                      {{ getStatusLabel(item.status) }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button v-if="item.status === 'PENDING'" @click="updateStatus(item.id, 'CONFIRMED')" class="btn-action confirm" title="Xác nhận">
                      ✔ Duyệt
                    </button>
                    <button v-if="item.status === 'CONFIRMED'" @click="updateStatus(item.id, 'COMPLETED')" class="btn-action complete" title="Khách đã đến">
                      🏁 Check-in
                    </button>
                    <button v-if="['PENDING', 'CONFIRMED'].includes(item.status)" @click="updateStatus(item.id, 'CANCELLED')" class="btn-action cancel" title="Hủy bỏ">
                      ✕ Hủy
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="tab-content placeholder-tab">
          <div class="empty-state-icon">🪑</div>
          <h3>Giao diện Sơ Đồ Bàn</h3>
          <p>Tính năng hiển thị trạng thái bàn trực quan (Trống/Có khách) sẽ được cập nhật ở giai đoạn tiếp theo.</p>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from '../../store/authStore';
import { reservationStore } from '../../store/reservationStore';

const router = useRouter();
const currentTab = ref('RESERVATIONS');
const showUserMenu = ref(false);

// Computed
const getUserInitial = computed(() => authStore.user?.name.charAt(0).toUpperCase() || 'S');
const pendingCount = computed(() => reservationStore.reservations.filter(r => r.status === 'PENDING').length);
const confirmedCount = computed(() => reservationStore.reservations.filter(r => r.status === 'CONFIRMED').length);
const todayString = computed(() => new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

// Helpers
const getTabName = (tab: string) => tab === 'RESERVATIONS' ? 'Quản Lý Đặt Bàn' : 'Sơ Đồ Bàn Ăn';
const getStatusLabel = (status: string) => {
  const map: any = { PENDING: 'Chờ duyệt', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy', COMPLETED: 'Hoàn thành' };
  return map[status] || status;
};

const formatTimeOnly = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const formatDateOnly = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

// Actions
const updateStatus = (id: number, status: any) => {
  if(confirm(`Bạn có chắc muốn chuyển trạng thái sang "${getStatusLabel(status)}"?`)) {
    reservationStore.updateStatus(id, status);
  }
};

const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value; };
const closeUserMenu = () => { showUserMenu.value = false; };
const handleLogout = () => { authStore.logout(); router.push('/'); };
const handleProfile = () => { alert('Chức năng profile staff'); showUserMenu.value = false; };

onMounted(() => {
  reservationStore.fetchReservations();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

.dashboard-layout {
  display: flex;
  height: 100vh;
  background-color: #f4f6f8;
  font-family: 'Montserrat', sans-serif;
  color: #333;
}

/* --- 1. SIDEBAR --- */
.sidebar {
  width: 280px;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: all 0.3s;
}

.brand {
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 25px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
}
.brand-logo { height: 40px; margin-right: 15px; filter: brightness(0) invert(1); }
.brand-info { display: flex; flex-direction: column; }
.brand-text { font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px; color: #a67c52; }
.brand-sub { font-size: 0.75rem; color: #888; letter-spacing: 1px; text-transform: uppercase; }

.nav-menu { list-style: none; padding: 25px 15px; flex: 1; }
.nav-label { font-size: 0.75rem; text-transform: uppercase; color: #666; margin-bottom: 15px; padding-left: 15px; font-weight: 700; letter-spacing: 1px; }
.nav-menu li {
  display: flex; align-items: center;
  padding: 14px 20px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  color: #bbb;
  font-weight: 500;
  transition: all 0.25s ease;
}
.nav-menu li:not(.nav-label):hover { background: rgba(255,255,255,0.08); color: #fff; transform: translateX(5px); }
.nav-menu li.active { background: linear-gradient(135deg, #a67c52 0%, #8e653d 100%); color: #fff; box-shadow: 0 4px 15px rgba(166, 124, 82, 0.3); }
.nav-menu li .icon { margin-right: 15px; font-size: 1.2rem; }

.sidebar-footer { padding: 20px; text-align: center; color: #555; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); }

/* --- 2. MAIN WRAPPER --- */
.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* HEADER */
.top-header {
  height: 80px;
  background: #fff;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.page-title h2 { margin: 0; font-size: 1.5rem; color: #1a1a1a; font-weight: 700; }
.date-today { font-size: 0.9rem; color: #888; margin-top: 4px; display: block; text-transform: capitalize; }

.user-area { display: flex; align-items: center; gap: 15px; cursor: pointer; position: relative; }
.user-info { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
.user-info .name { font-weight: 600; font-size: 0.95rem; color: #333; }
.role-badge { font-size: 0.7rem; background: #eee; padding: 2px 8px; border-radius: 10px; color: #666; font-weight: 700; margin-top: 2px; }

.avatar-circle {
  width: 45px; height: 45px;
  background: linear-gradient(135deg, #333 0%, #1a1a1a 100%);
  color: #fff;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 700; font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  position: relative;
}
.status-dot { position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; background: #2ecc71; border: 2px solid #fff; border-radius: 50%; }

/* Dropdown Menu (Style giống Home) */
.user-dropdown { position: absolute; top: 60px; right: 0; width: 280px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; z-index: 100; border: 1px solid #f0f0f0; }
.dropdown-header { padding: 20px; background: #fcfcfc; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 15px; }
.header-avatar { width: 40px; height: 40px; background: #a67c52; color: #fff; border-radius: 50%; display: grid; place-items: center; font-weight: 700; }
.header-info { display: flex; flex-direction: column; overflow: hidden; }
.user-display-name { font-weight: 700; color: #333; }
.user-email { font-size: 0.8rem; color: #888; overflow: hidden; text-overflow: ellipsis; }
.dropdown-body { padding: 8px 0; }
.menu-item { padding: 12px 20px; font-size: 0.95rem; color: #555; transition: 0.2s; cursor: pointer; display: flex; align-items: center; gap: 10px; }
.menu-item:hover { background: #f9f9f9; color: #a67c52; }
.menu-item.logout { color: #e74c3c; }
.menu-item.logout:hover { background: #fff5f5; }
.menu-divider { height: 1px; background: #eee; margin: 5px 20px; }

/* CONTENT */
.content-body { padding: 40px; overflow-y: auto; flex: 1; }

.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 30px; }
.stat-card { background: #fff; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 20px; transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-3px); }
.stat-icon { width: 60px; height: 60px; border-radius: 12px; display: grid; place-items: center; font-size: 1.8rem; flex-shrink: 0; }
.stat-card.pending .stat-icon { background: #fff8e1; color: #f39c12; }
.stat-card.confirmed .stat-icon { background: #e8f5e9; color: #2ecc71; }
.stat-card.total .stat-icon { background: #f5f5f5; color: #34495e; }
.stat-info h3 { margin: 0; font-size: 1.8rem; font-weight: 700; color: #333; }
.stat-info p { margin: 0; color: #888; font-size: 0.9rem; }

.table-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #fafafa; padding: 18px 25px; text-align: left; font-weight: 600; color: #666; font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid #eee; }
.data-table td { padding: 18px 25px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; font-size: 0.95rem; }
.data-table tr:hover { background-color: #fcfcfc; }

.customer-cell { display: flex; align-items: center; gap: 12px; }
.customer-avatar { width: 36px; height: 36px; background: #e0e0e0; border-radius: 50%; display: grid; place-items: center; font-weight: 600; color: #555; }
.sub-text { font-size: 0.8rem; color: #888; margin-top: 2px; }

.time-cell { display: flex; flex-direction: column; }
.time-big { font-weight: 700; font-size: 1rem; color: #333; }
.date-small { font-size: 0.8rem; color: #999; }

.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }
.status-badge.completed { background: #e2e3e5; color: #383d41; }

.actions-cell { display: flex; gap: 8px; }
.btn-action { padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: 0.2s; }
.btn-action.confirm { background: #e8f5e9; color: #2e7d32; }
.btn-action.confirm:hover { background: #c8e6c9; }
.btn-action.cancel { background: #ffebee; color: #c62828; }
.btn-action.cancel:hover { background: #ffcdd2; }
.btn-action.complete { background: #e3f2fd; color: #1565c0; }
.btn-action.complete:hover { background: #bbdefb; }

.placeholder-tab { text-align: center; padding: 80px; color: #999; }
.empty-state-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.3; }

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }
</style>