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
        <li :class="{ active: currentTab === 'RESERVATIONS' }" @click="currentTab = 'RESERVATIONS'">
          <span class="icon">📅</span> <span class="text">Quản Lý Đặt Bàn</span>
        </li>
        <li :class="{ active: currentTab === 'TABLES' }" @click="currentTab = 'TABLES'">
          <span class="icon">🪑</span> <span class="text">Sơ Đồ Bàn</span>
        </li>
      </ul>
      <div class="sidebar-footer"><p>© 2025 Trạm Sạc FC</p></div>
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
          
          <div class="toolbar">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="Tìm tên khách, SĐT..." 
              />
            </div>
            
            <div class="filter-tabs">
              <button 
                v-for="status in statusTabs" 
                :key="status.value"
                :class="['filter-tab', { active: filterStatus === status.value }]"
                @click="filterStatus = status.value"
              >
                {{ status.label }} 
                <span class="count-badge" v-if="status.value !== 'ALL'">
                  {{ getCountByStatus(status.value) }}
                </span>
              </button>
            </div>

            <button class="btn-create" @click="openCreateModal">
              + Tạo Đơn Mới
            </button>
          </div>

          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mã #</th>
                  <th>Khách Hàng</th>
                  <th>Thời Gian</th>
                  <th>Bàn & Khách</th>
                  <th>Trạng Thái</th>
                  <th class="text-right">Xử Lý</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredReservations.length === 0">
                  <td colspan="6" class="no-data">Không tìm thấy đơn nào phù hợp.</td>
                </tr>
                <tr v-for="item in filteredReservations" :key="item.id">
                  <td class="id-col">#{{ item.id }}</td>
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
                  <td>
                    <div class="table-info">
                      <span class="table-badge">{{ item.tableName || 'Chưa chọn' }}</span>
                      <span class="people-count">👥 {{ item.people }}</span>
                    </div>
                  </td>
                  <td>
                    <span :class="['status-badge', item.status.toLowerCase()]">
                      {{ getStatusLabel(item.status) }}
                    </span>
                    <div v-if="item.status === 'REQUEST_CANCEL'" class="note-text">
                      Lý do: "{{ item.cancellationReason }}"
                    </div>
                  </td>
                  
                  <td class="actions-cell text-right">
                    
                    <div v-if="item.status === 'PENDING'" class="action-group">
                      <button @click="handleApprove(item)" class="btn-icon success" title="Duyệt đơn">✔</button>
                      <button @click="handleReject(item)" class="btn-icon danger" title="Từ chối">✕</button>
                    </div>

                    <div v-else-if="item.status === 'REQUEST_CANCEL'" class="action-group">
                      <button @click="handleApproveCancel(item)" class="btn-sm btn-danger-outline">Đồng ý Hủy</button>
                    </div>

                    <div v-else-if="item.status === 'CONFIRMED'" class="action-group">
                      <button @click="handleCheckIn(item)" class="btn-sm btn-primary">⬇ Check-in</button>
                      <button @click="handleReject(item)" class="btn-icon danger" title="Hủy đơn">✕</button>
                    </div>

                    <div v-else-if="item.status === 'OCCUPIED'" class="action-group">
                      <button @click="handleCheckOut(item)" class="btn-sm btn-success">⬆ Check-out</button>
                    </div>

                    <span v-else class="text-gray">--</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="tab-content placeholder-tab">
          <div class="empty-state-icon">🪑</div>
          <h3>Sơ Đồ Bàn Ăn (Map)</h3>
          <p>Tính năng đang phát triển theo FR-2.4</p>
        </div>

      </div>
    </main>

    <ReservationForm 
      v-if="showCreateModal"
      :isVisible="showCreateModal"
      :isAdminMode="true" 
      @submit="handleCreateReservation"
      @close="showCreateModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { authStore } from '../../store/authStore';
import { reservationStore } from '../../store/reservationStore';
import ReservationForm from '../../components/reservations/ReservationForm.vue';

const router = useRouter();
const currentTab = ref('RESERVATIONS');
const showUserMenu = ref(false);
const showCreateModal = ref(false);

// Bộ lọc & Tìm kiếm
const searchKeyword = ref('');
const filterStatus = ref('ALL');

const statusTabs = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Yêu cầu hủy', value: 'REQUEST_CANCEL' }, // Mới
  { label: 'Sắp đến', value: 'CONFIRMED' },
  { label: 'Đang phục vụ', value: 'OCCUPIED' },
  { label: 'Lịch sử', value: 'HISTORY' } // Gộp Completed + Cancelled
];

// Computed Data
const getUserInitial = computed(() => authStore.user?.name.charAt(0).toUpperCase() || 'S');
const todayString = computed(() => new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));

const filteredReservations = computed(() => {
  let data = reservationStore.reservations;

  // 1. Lọc theo Tab Status
  if (filterStatus.value !== 'ALL') {
    if (filterStatus.value === 'HISTORY') {
      data = data.filter(r => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(r.status));
    } else {
      data = data.filter(r => r.status === filterStatus.value);
    }
  }

  // 2. Tìm kiếm (FR-8.1)
  if (searchKeyword.value) {
    const k = searchKeyword.value.toLowerCase();
    data = data.filter(r => 
      r.guestName.toLowerCase().includes(k) || 
      r.phone.includes(k) ||
      r.id.toString().includes(k)
    );
  }

  // Sắp xếp: Mới nhất lên đầu
  return data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
});

// Helper Functions
const getTabName = (tab: string) => tab === 'RESERVATIONS' ? 'Quản Lý Đặt Bàn' : 'Sơ Đồ Khu Vực';
const getCountByStatus = (status: string) => {
  if(status === 'HISTORY') return reservationStore.reservations.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status)).length;
  return reservationStore.reservations.filter(r => r.status === status).length;
};
const getStatusLabel = (status: string) => {
  const map: any = { 
    PENDING: 'Chờ duyệt', CONFIRMED: 'Đã xác nhận', REQUEST_CANCEL: 'Khách hủy',
    OCCUPIED: 'Đang ăn', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', NO_SHOW: 'Vắng mặt' 
  };
  return map[status] || status;
};
const formatTimeOnly = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const formatDateOnly = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

// --- XỬ LÝ NGHIỆP VỤ (ACTIONS) ---

// 1. Duyệt Đơn (FR-4.1)
const handleApprove = async (item: any) => {
  const result = await Swal.fire({
    title: 'Duyệt đơn này?',
    text: `Khách ${item.guestName} - ${item.people} người`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Duyệt ngay',
    confirmButtonColor: '#2ecc71'
  });
  if (result.isConfirmed) {
    // Logic thực tế sẽ gọi API update status
    // Ở đây giả lập sửa store
    item.status = 'CONFIRMED';
    Swal.fire('Thành công', 'Đơn đã được xác nhận', 'success');
  }
};

// 2. Từ chối / Hủy (FR-4.2, FR-7.2)
const handleReject = async (item: any) => {
  const { value: reason } = await Swal.fire({
    title: 'Từ chối / Hủy Đơn',
    input: 'textarea',
    inputLabel: 'Nhập lý do hủy (bắt buộc):',
    inputPlaceholder: 'Ví dụ: Hết bàn, Khách không nghe máy...',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    confirmButtonText: 'Xác nhận hủy',
    inputValidator: (value) => {
      if (!value) return 'Bạn cần nhập lý do hủy!';
    }
  });

  if (reason) {
    item.status = 'CANCELLED';
    item.adminResponse = reason; // Lưu lý do Staff nhập
    Swal.fire('Đã hủy', `Lý do: ${reason}`, 'success');
  }
};

// 3. Duyệt yêu cầu hủy của khách
const handleApproveCancel = async (item: any) => {
   const result = await Swal.fire({
    title: 'Đồng ý hủy đơn?',
    text: `Khách đưa ra lý do: "${item.cancellationReason}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    confirmButtonText: 'Đồng ý hủy'
  });
  if(result.isConfirmed) {
    item.status = 'CANCELLED';
    Swal.fire('Đã hủy', 'Đơn đặt bàn đã được hủy theo yêu cầu khách.', 'success');
  }
};

// 4. Check-in (FR-6.1)
const handleCheckIn = async (item: any) => {
  const result = await Swal.fire({
    title: 'Check-in Khách?',
    text: 'Xác nhận khách đã đến và nhận bàn?',
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: '#3498db',
    confirmButtonText: 'Check-in'
  });
  if (result.isConfirmed) {
    item.status = 'OCCUPIED';
    Swal.fire('Check-in thành công', 'Trạng thái bàn đã chuyển sang CÓ KHÁCH', 'success');
  }
};

// 5. Check-out (FR-6.2)
const handleCheckOut = async (item: any) => {
  const result = await Swal.fire({
    title: 'Thanh toán & Trả bàn?',
    text: 'Xác nhận khách đã hoàn tất thanh toán?',
    icon: 'success',
    showCancelButton: true,
    confirmButtonColor: '#27ae60',
    confirmButtonText: 'Hoàn tất'
  });
  if (result.isConfirmed) {
    item.status = 'COMPLETED';
    Swal.fire('Hoàn tất', 'Bàn đã trống và sẵn sàng đón khách mới.', 'success');
  }
};

// 6. Tạo đơn mới (FR-3.2)
const openCreateModal = () => { showCreateModal.value = true; };
const handleCreateReservation = async (formData: any) => {
  await reservationStore.createReservation({
    ...formData,
    reservation_time: `${formData.date}T${formData.time}`,
    tableName: formData.tableName || 'Bàn Staff chọn' // Giả lập
  });
  showCreateModal.value = false;
  Swal.fire('Thành công', 'Đã tạo đơn đặt bàn mới', 'success');
};

const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value; };
const closeUserMenu = () => { showUserMenu.value = false; };
const handleLogout = () => { authStore.logout(); router.push('/'); };

onMounted(() => {
  reservationStore.fetchReservations();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

.dashboard-layout { display: flex; height: 100vh; background-color: #f4f6f8; font-family: 'Montserrat', sans-serif; color: #333; }

/* SIDEBAR & HEADER (Giữ nguyên style cũ, chỉ tút lại chút) */
.sidebar { width: 260px; background: #1a1a1a; color: #fff; display: flex; flex-direction: column; flex-shrink: 0; }
.brand { height: 70px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
.brand-logo { height: 32px; margin-right: 12px; filter: brightness(0) invert(1); }
.brand-text { font-weight: 700; color: #a67c52; font-size: 1.1rem; }
.brand-sub { font-size: 0.7rem; color: #888; display: block; }
.nav-menu { padding: 20px 15px; flex: 1; list-style: none; }
.nav-label { font-size: 0.7rem; color: #666; margin-bottom: 10px; padding-left: 10px; font-weight: 700; text-transform: uppercase; }
.nav-menu li { padding: 12px 15px; margin-bottom: 5px; border-radius: 8px; cursor: pointer; color: #bbb; display: flex; align-items: center; transition: 0.2s; }
.nav-menu li:hover { background: rgba(255,255,255,0.05); color: #fff; }
.nav-menu li.active { background: linear-gradient(135deg, #a67c52 0%, #8e653d 100%); color: #fff; }
.nav-menu .icon { margin-right: 10px; }
.sidebar-footer { padding: 15px; text-align: center; color: #555; font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); }

.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-header { height: 70px; background: #fff; border-bottom: 1px solid #eaeaea; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; }
.page-title h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #2c3e50; }
.date-today { font-size: 0.85rem; color: #7f8c8d; text-transform: capitalize; }
.user-area { display: flex; align-items: center; gap: 12px; cursor: pointer; position: relative; }
.user-info { text-align: right; }
.role-badge { font-size: 0.65rem; background: #ecf0f1; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #7f8c8d; }
.avatar-circle { width: 40px; height: 40px; background: #34495e; color: #fff; border-radius: 50%; display: grid; place-items: center; font-weight: 700; position: relative; }
.status-dot { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #2ecc71; border: 2px solid #fff; border-radius: 50%; }

/* USER DROPDOWN */
.user-dropdown { position: absolute; top: 55px; right: 0; width: 250px; background: #fff; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); z-index: 100; border: 1px solid #eee; }
.dropdown-header { padding: 15px; border-bottom: 1px solid #eee; display: flex; gap: 10px; align-items: center; }
.header-avatar { width: 35px; height: 35px; background: #a67c52; color: #fff; border-radius: 50%; display: grid; place-items: center; }
.user-display-name { font-weight: 700; display: block; font-size: 0.9rem; }
.user-email { font-size: 0.75rem; color: #888; }
.menu-item { padding: 10px 15px; cursor: pointer; display: flex; gap: 10px; color: #555; }
.menu-item:hover { background: #f9f9f9; }
.menu-item.logout { color: #e74c3c; }

/* MAIN CONTENT */
.content-body { padding: 30px; overflow-y: auto; flex: 1; }

/* TOOLBAR */
.toolbar { display: flex; gap: 15px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
.search-box { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 0 12px; display: flex; align-items: center; height: 42px; width: 250px; }
.search-box input { border: none; outline: none; flex: 1; margin-left: 8px; font-size: 0.9rem; }

.filter-tabs { display: flex; background: #e0e0e0; padding: 4px; border-radius: 8px; gap: 4px; overflow-x: auto; }
.filter-tab { border: none; background: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #666; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 5px; }
.filter-tab.active { background: #fff; color: #333; shadow: 0 2px 5px rgba(0,0,0,0.05); }
.count-badge { background: #95a5a6; color: #fff; font-size: 0.7rem; padding: 1px 5px; border-radius: 10px; }
.filter-tab.active .count-badge { background: #a67c52; }

.btn-create { margin-left: auto; background: #27ae60; color: #fff; border: none; padding: 0 20px; height: 42px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-create:hover { background: #2ecc71; }

/* TABLE */
.table-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f8f9fa; text-align: left; padding: 15px; font-size: 0.8rem; text-transform: uppercase; color: #7f8c8d; border-bottom: 2px solid #eee; }
.data-table td { padding: 15px; border-bottom: 1px solid #f1f1f1; vertical-align: middle; font-size: 0.9rem; color: #2c3e50; }
.id-col { font-family: monospace; color: #95a5a6; }
.no-data { text-align: center; padding: 40px; color: #999; font-style: italic; }

.customer-cell { display: flex; gap: 10px; align-items: center; }
.customer-avatar { width: 32px; height: 32px; background: #ecf0f1; border-radius: 50%; display: grid; place-items: center; font-weight: 700; color: #7f8c8d; }
.sub-text { font-size: 0.8rem; color: #95a5a6; }

.time-big { display: block; font-weight: 700; font-size: 1rem; }
.date-small { color: #95a5a6; font-size: 0.8rem; }

.table-badge { background: #34495e; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
.people-count { display: block; font-size: 0.8rem; color: #7f8c8d; margin-top: 3px; }

/* Status Badges */
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.occupied { background: #cce5ff; color: #004085; }
.status-badge.cancelled, .status-badge.request_cancel { background: #f8d7da; color: #721c24; }
.status-badge.completed { background: #e2e3e5; color: #383d41; }
.note-text { font-size: 0.75rem; color: #c0392b; margin-top: 4px; font-style: italic; max-width: 150px; }

/* Actions */
.text-right { text-align: right; }
.action-group { display: flex; gap: 8px; justify-content: flex-end; }
.btn-icon { width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; display: grid; place-items: center; font-size: 0.9rem; transition: 0.2s; }
.btn-icon.success { background: #d4edda; color: #27ae60; }
.btn-icon.success:hover { background: #27ae60; color: #fff; }
.btn-icon.danger { background: #f8d7da; color: #c0392b; }
.btn-icon.danger:hover { background: #c0392b; color: #fff; }

.btn-sm { padding: 6px 12px; border-radius: 6px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.btn-primary { background: #3498db; color: #fff; }
.btn-primary:hover { background: #2980b9; }
.btn-success { background: #27ae60; color: #fff; }
.btn-success:hover { background: #219150; }
.btn-danger-outline { border: 1px solid #e74c3c; background: #fff; color: #e74c3c; }
.btn-danger-outline:hover { background: #e74c3c; color: #fff; }

.placeholder-tab { text-align: center; padding: 60px; color: #bbb; }
.empty-state-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }
</style>