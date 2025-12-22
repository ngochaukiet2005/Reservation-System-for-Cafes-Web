<template>
  <div class="dashboard-layout" @click="closeUserMenu">
    <aside class="sidebar">
      <div class="brand" @click="router.push('/')">
        <img src="../../assets/logo.png" alt="Logo" class="brand-logo" />
        <div class="brand-info"><span class="brand-text">Trạm Sạc FC</span><span class="brand-sub">Staff Portal</span></div>
      </div>
      <ul class="nav-menu">
        <li class="nav-label">Nghiệp Vụ Hàng Ngày</li>
        <li :class="{ active: currentTab === 'RESERVATIONS' }" @click="currentTab = 'RESERVATIONS'">
          <span class="icon">📅</span> <span class="text">Quản Lý Đặt Bàn</span>
        </li>
        <li :class="{ active: currentTab === 'TABLES' }" @click="currentTab = 'TABLES'">
          <span class="icon">🪑</span> <span class="text">Sơ Đồ Bàn (Map)</span>
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
          <div class="avatar-circle">{{ getUserInitial }}</div>
          <transition name="fade-slide">
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="menu-item logout" @click="handleLogout">🚪 Đăng xuất</div>
            </div>
          </transition>
        </div>
      </header>

      <div class="content-body">
        
        <div v-if="currentTab === 'RESERVATIONS'" class="tab-content">
          <div class="toolbar">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input v-model="searchKeyword" type="text" placeholder="Tìm tên khách, SĐT..." />
            </div>
            <div class="filter-tabs">
              <button v-for="status in statusTabs" :key="status.value"
                :class="['filter-tab', { active: filterStatus === status.value }]"
                @click="filterStatus = status.value">
                {{ status.label }} <span class="count-badge" v-if="status.value!=='ALL'">{{ getCountByStatus(status.value) }}</span>
              </button>
            </div>
            <button class="btn-create" @click="openCreateModal">+ Tạo Đơn Mới</button>
          </div>

          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mã #</th> <th>Khách Hàng</th> <th>Thời Gian</th> <th>Bàn & Khách</th> <th>Trạng Thái</th> <th class="text-right">Xử Lý</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredReservations.length === 0"><td colspan="6" class="no-data">Không tìm thấy đơn nào.</td></tr>
                <tr v-for="item in filteredReservations" :key="item.id">
                  <td class="id-col">#{{ item.id }}</td>
                  <td>
                    <div class="customer-cell">
                      <div class="customer-avatar">{{ item.guestName.charAt(0) }}</div>
                      <div><strong>{{ item.guestName }}</strong><div class="sub-text">{{ item.phone }}</div></div>
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
                    <span :class="['status-badge', item.status.toLowerCase()]">{{ getStatusLabel(item.status) }}</span>
                    <div v-if="item.status === 'REQUEST_CANCEL'" class="note-text">Lý do: "{{ item.cancellationReason }}"</div>
                  </td>
                  <td class="actions-cell text-right">
                    <div v-if="item.status === 'PENDING'" class="action-group">
                      <button @click="handleApprove(item)" class="btn-icon success">✔</button>
                      <button @click="handleReject(item)" class="btn-icon danger">✕</button>
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="tab-content">
          <div class="toolbar map-toolbar-custom">
             <div class="map-filters-styled">
                <div class="mf-item">
                    <label>Ngày xem sơ đồ</label>
                    <input type="date" v-model="mapFilter.date" @change="refreshMap">
                </div>
                
                <div class="mf-item">
                    <label>Thời gian</label>
                    <div class="time-group">
                        <select v-model="mapFilter.hour" @change="refreshMap">
                            <option v-for="h in 24" :key="h-1" :value="h-1">
                                {{ (h-1).toString().padStart(2,'0') }} giờ
                            </option>
                        </select>
                        <span class="colon">:</span>
                        <select v-model="mapFilter.minute" @change="refreshMap" class="minute-select">
                            <option v-for="m in 60" :key="m-1" :value="m-1">
                                {{ (m-1).toString().padStart(2,'0') }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="mf-item action">
                    <button class="btn-dark-flat" @click="resetToNow">HIỆN TẠI</button>
                </div>
             </div>
             
             <div class="map-legend">
                <span><i class="dot available"></i> Trống</span>
                <span><i class="dot pending"></i> Chờ duyệt</span>
                <span><i class="dot reserved"></i> Đã đặt</span>
                <span><i class="dot occupied"></i> Đang có khách</span>
             </div>
          </div>

          <div class="staff-map-grid">
             <div 
               v-for="table in reservationStore.tables" 
               :key="table.id"
               class="staff-table-card"
               :class="table.status.toLowerCase()"
               @click="handleTableClick(table)"
             >
                <div class="table-header">
                   <span class="t-name">{{ table.name }}</span>
                   <span class="t-cap">👤 {{ table.capacity }}</span>
                </div>
                <div class="table-body">
                   <div class="status-big">{{ getStatusLabelMap(table.status) }}</div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </main>

    <ReservationForm 
      v-if="showCreateModal"
      :isVisible="showCreateModal"
      :isAdminMode="true" 
      :selectedTable="selectedTableForAction"
      :initialData="staffInitData"
      @submit="handleStaffCreateReservation"
      @close="closeModal"
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

// --- TAB 1 LOGIC ---
const searchKeyword = ref('');
const filterStatus = ref('ALL');
const statusTabs = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Khách hủy', value: 'REQUEST_CANCEL' },
  { label: 'Sắp đến', value: 'CONFIRMED' },
  { label: 'Đang phục vụ', value: 'OCCUPIED' },
  { label: 'Lịch sử', value: 'HISTORY' } 
];

const filteredReservations = computed(() => {
  let data = reservationStore.reservations;
  if (filterStatus.value !== 'ALL') {
    if (filterStatus.value === 'HISTORY') data = data.filter(r => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(r.status));
    else data = data.filter(r => r.status === filterStatus.value);
  }
  if (searchKeyword.value) {
    const k = searchKeyword.value.toLowerCase();
    data = data.filter(r => r.guestName.toLowerCase().includes(k) || r.phone.includes(k));
  }
  return data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
});

const handleApprove = async (item: any) => { await reservationStore.approveReservation(item.id); Swal.fire('Duyệt thành công', '', 'success'); };
const handleReject = async (item: any) => { const { value: reason } = await Swal.fire({ input: 'text', title: 'Lý do hủy', showCancelButton: true }); if (reason) { await reservationStore.cancelReservation(item.id, reason); Swal.fire('Đã hủy', '', 'info'); } };
const handleApproveCancel = async (item: any) => { await reservationStore.cancelReservation(item.id, 'Staff approved cancel'); Swal.fire('Đã chấp nhận hủy', '', 'success'); };
const handleCheckIn = async (item: any) => { await reservationStore.checkInReservation(item.id); Swal.fire('Check-in xong', '', 'success'); };
const handleCheckOut = async (item: any) => { await reservationStore.checkOutReservation(item.id); Swal.fire('Check-out xong', '', 'success'); };

// --- TAB 2 LOGIC: MAP ---
const selectedTableForAction = ref<any>(null);
const staffInitData = reactive({ date: '', time: '', people: 2 });

const mapFilter = reactive({
    date: new Date().toISOString().split('T')[0],
    hour: new Date().getHours(),
    minute: new Date().getMinutes()
});

const refreshMap = () => {
   const t = `${mapFilter.hour.toString().padStart(2,'0')}:${mapFilter.minute.toString().padStart(2,'0')}`;
   reservationStore.fetchTablesByTime(mapFilter.date, t);
};

const resetToNow = () => {
    const now = new Date();
    mapFilter.date = now.toISOString().split('T')[0];
    mapFilter.hour = now.getHours();
    mapFilter.minute = now.getMinutes();
    refreshMap();
};

const handleTableClick = async (table: any) => {
   selectedTableForAction.value = table;
   const dateStr = mapFilter.date;
   const timeStr = `${mapFilter.hour.toString().padStart(2,'0')}:${mapFilter.minute.toString().padStart(2,'0')}`;

   if (table.status === 'AVAILABLE') {
       const { isConfirmed, value } = await Swal.fire({
          title: `Bàn ${table.name}`, text: 'Bàn Trống. Bạn muốn làm gì?',
          showDenyButton: true, showCancelButton: true,
          confirmButtonText: '⚡ Khách vào luôn (Check-in)', denyButtonText: '📅 Đặt trước (Booking)', cancelButtonText: 'Đóng'
       });

       if (isConfirmed) { 
           const { value: guestName } = await Swal.fire({ input: 'text', title: 'Tên khách', inputValue: 'Khách lẻ' });
           if (guestName) {
               await reservationStore.createReservation({
                   guestName, phone: 'N/A', people: table.capacity,
                   date: dateStr, time: timeStr, reservation_time: `${dateStr}T${timeStr}`,
                   tableId: table.id, tableName: table.name,
                   isAdmin: true, initialStatus: 'OCCUPIED'
               });
               Swal.fire('Thành công', 'Bàn đã chuyển sang CÓ KHÁCH', 'success');
           }
       } else if (value === false) { 
           staffInitData.date = dateStr; staffInitData.time = timeStr;
           showCreateModal.value = true;
       }
   }
   else if (table.status === 'PENDING') {
       const booking = reservationStore.reservations.find(r => r.tableId === table.id && r.status === 'PENDING');
       if (booking) {
           const res = await Swal.fire({ title: 'Duyệt đơn?', html: `Khách: <b>${booking.guestName}</b>`, showCancelButton: true, confirmButtonText: 'Duyệt', cancelButtonText: 'Từ chối' });
           if (res.isConfirmed) await reservationStore.approveReservation(booking.id);
           else if (res.dismiss === Swal.DismissReason.cancel) await reservationStore.cancelReservation(booking.id, 'Staff từ chối qua map');
       }
   }
   else if (table.status === 'OCCUPIED') {
       const booking = reservationStore.reservations.find(r => r.tableId === table.id && r.status === 'OCCUPIED');
       const res = await Swal.fire({ title: 'Thanh toán?', text: `Khách: ${booking?.guestName || 'Unknown'}`, showCancelButton: true, confirmButtonText: 'Check-out' });
       if (res.isConfirmed && booking) await reservationStore.checkOutReservation(booking.id);
   }
};

const openCreateModal = () => { selectedTableForAction.value = null; showCreateModal.value = true; };
const closeModal = () => { showCreateModal.value = false; selectedTableForAction.value = null; };
const handleStaffCreateReservation = async (formData: any) => {
    await reservationStore.createReservation({
        ...formData, reservation_time: `${formData.date}T${formData.time}`,
        tableId: selectedTableForAction.value?.id, tableName: selectedTableForAction.value?.name,
        isAdmin: true, initialStatus: 'CONFIRMED'
    });
    closeModal(); Swal.fire('Thành công', 'Đã tạo đơn', 'success');
};

const getTabName = (tab: string) => tab === 'RESERVATIONS' ? 'Quản Lý Đặt Bàn' : 'Sơ Đồ Khu Vực';
const getUserInitial = computed(() => authStore.user?.name.charAt(0).toUpperCase() || 'S');
const todayString = computed(() => new Date().toLocaleDateString('vi-VN'));
const getCountByStatus = (status: string) => status==='HISTORY' ? reservationStore.reservations.filter(r=>['COMPLETED','CANCELLED', 'NO_SHOW'].includes(r.status)).length : reservationStore.reservations.filter(r=>r.status===status).length;
const getStatusLabel = (s:string) => ({PENDING:'Chờ duyệt',CONFIRMED:'Sắp đến',OCCUPIED:'Đang có khách',COMPLETED:'Xong',CANCELLED:'Hủy', REQUEST_CANCEL: 'Yêu cầu hủy'}[s]||s);
const getStatusLabelMap = (s: string) => ({ AVAILABLE: 'Trống', PENDING: 'Chờ duyệt', RESERVED: 'Có khách đặt', OCCUPIED: 'Đang có khách', MAINTENANCE: 'Bảo trì' }[s] || s);
const formatTimeOnly = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const formatDateOnly = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value; };
const closeUserMenu = () => { showUserMenu.value = false; };
const handleLogout = () => { authStore.logout(); router.push('/'); };

onMounted(() => { reservationStore.fetchReservations(); refreshMap(); });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
.dashboard-layout { display: flex; height: 100vh; background-color: #f4f6f8; font-family: 'Montserrat', sans-serif; color: #333; }
.sidebar { width: 260px; background: #1a1a1a; color: #fff; display: flex; flex-direction: column; flex-shrink: 0; }
.brand { height: 70px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
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
.avatar-circle { width: 40px; height: 40px; background: #34495e; color: #fff; border-radius: 50%; display: grid; place-items: center; font-weight: 700; }
.user-dropdown { position: absolute; top: 55px; right: 0; width: 150px; background: #fff; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); z-index: 100; border: 1px solid #eee; padding: 10px; }
.menu-item { padding: 8px 10px; cursor: pointer; color: #555; }
.menu-item:hover { background: #f9f9f9; }

.content-body { padding: 30px; overflow-y: auto; flex: 1; }
.toolbar { display: flex; gap: 15px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
.search-box { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 0 12px; display: flex; align-items: center; height: 42px; width: 250px; }
.search-box input { border: none; outline: none; flex: 1; margin-left: 8px; font-size: 0.9rem; }
.filter-tabs { display: flex; background: #e0e0e0; padding: 4px; border-radius: 8px; gap: 4px; }
.filter-tab { border: none; background: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #666; cursor: pointer; }
.filter-tab.active { background: #fff; color: #333; }
.count-badge { background: #95a5a6; color: #fff; font-size: 0.7rem; padding: 1px 5px; border-radius: 10px; margin-left: 5px; }
.btn-create { margin-left: auto; background: #27ae60; color: #fff; border: none; padding: 0 20px; height: 42px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.table-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f8f9fa; text-align: left; padding: 15px; font-size: 0.8rem; text-transform: uppercase; color: #7f8c8d; border-bottom: 2px solid #eee; }
.data-table td { padding: 15px; border-bottom: 1px solid #f1f1f1; vertical-align: middle; font-size: 0.9rem; color: #2c3e50; }
.customer-cell { display: flex; gap: 10px; align-items: center; }
.customer-avatar { width: 32px; height: 32px; background: #ecf0f1; border-radius: 50%; display: grid; place-items: center; font-weight: 700; color: #7f8c8d; }
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.occupied { background: #cce5ff; color: #004085; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }
.note-text { font-size: 0.75rem; color: #c0392b; margin-top: 4px; font-style: italic; max-width: 150px; }

/* MAP STYLES UPDATE */
.map-toolbar-custom { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
.map-filters-styled { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
.mf-item { display: flex; flex-direction: column; }
.mf-item label { font-size: 0.75rem; font-weight: 700; color: #555; margin-bottom: 8px; text-transform: uppercase; }
.mf-item input, .mf-item select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.9rem; outline: none; }
.time-group { display: flex; align-items: center; gap: 5px; }
.minute-select { width: 70px; }
.colon { font-weight: bold; }
.btn-dark-flat { height: 38px; padding: 0 20px; background: #34495e; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; text-transform: uppercase; font-size: 0.85rem; }
.btn-dark-flat:hover { background: #2c3e50; }
.map-legend { display: flex; gap: 15px; font-size: 0.85rem; }

.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; }
.dot.available { background: #fff; border: 2px solid #27ae60; }
.dot.pending { background: #f1c40f; }
.dot.reserved { background: #e74c3c; }
.dot.occupied { background: #8e44ad; }
.staff-map-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; padding-bottom: 50px; }
.staff-table-card { background: #fff; border: 2px solid #eee; border-radius: 10px; padding: 15px; cursor: pointer; transition: 0.2s; min-height: 100px; display: flex; flex-direction: column; justify-content: space-between; }
.staff-table-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.staff-table-card.available { border-color: #27ae60; }
.staff-table-card.pending { background: #fffcf2; border-color: #f1c40f; animation: pulse 2s infinite; }
.staff-table-card.reserved { background: #fff5f5; border-color: #e74c3c; }
.staff-table-card.occupied { background: #f3e5f5; border-color: #8e44ad; }
.table-header { display: flex; justify-content: space-between; font-weight: 700; color: #555; margin-bottom: 10px; }
.status-big { text-align: center; font-weight: 600; font-size: 0.9rem; padding: 5px; border-radius: 4px; background: rgba(0,0,0,0.03); }
.staff-table-card.available .status-big { color: #27ae60; }
.staff-table-card.pending .status-big { color: #f39c12; }
.staff-table-card.reserved .status-big { color: #c0392b; }
.staff-table-card.occupied .status-big { color: #8e44ad; }

.action-group { display: flex; gap: 5px; justify-content: flex-end; }
.btn-icon { width: 30px; height: 30px; border-radius: 4px; border: none; cursor: pointer; display: grid; place-items: center; }
.btn-icon.success { background: #d4edda; color: #27ae60; }
.btn-icon.danger { background: #f8d7da; color: #c0392b; }
.btn-sm { padding: 5px 10px; border-radius: 4px; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.btn-primary { background: #3498db; color: #fff; }
.btn-success { background: #27ae60; color: #fff; }
.btn-danger-outline { border: 1px solid #e74c3c; background: #fff; color: #e74c3c; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(241, 196, 15, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(241, 196, 15, 0); } 100% { box-shadow: 0 0 0 0 rgba(241, 196, 15, 0); } }
</style>