<template>
  <div class="dashboard-layout" @click="closeAllDropdowns">
    
    <div v-if="showUserMenu || showHourDropdown || showMinuteDropdown || showListHourDropdown || showListMinuteDropdown" class="click-overlay" @click="closeAllDropdowns"></div>

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
          </div>
          <div class="avatar-circle">{{ getUserInitial }}</div>
          <transition name="fade-slide">
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="menu-item" @click="openEditProfile">✏️ Hồ sơ cá nhân</div>
              <div class="menu-divider"></div>
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
            <button class="btn-create" @click="switchToMapForCreate">+ Tạo Đơn Mới</button>
          </div>

          <div class="filters-bar-reservations">
             <div class="fb-item">
                <label>Ngày:</label>
                <input type="date" v-model="listFilter.date" class="date-input">
             </div>
             <div class="fb-item">
                <label>Thời gian:</label>
                <div class="time-group">
                    
                    <div class="custom-select hour-width">
                        <div class="cms-trigger" @click.stop="toggleListHourDropdown">
                            <span>
                                {{ listFilter.hour === '' ? '--' : listFilter.hour.toString().padStart(2, '0') + ' giờ' }}
                            </span>
                            <span class="chevron" :class="{ rotate: showListHourDropdown }">▼</span>
                        </div>
                        <transition name="fade-slide">
                            <div v-if="showListHourDropdown" class="cms-dropdown">
                                <div class="cms-item" :class="{ active: listFilter.hour === '' }" @click="selectListHour('')">--</div>
                                <div v-for="h in availableListHours" :key="h" 
                                     class="cms-item" :class="{ active: h === listFilter.hour }"
                                     @click="selectListHour(h)">
                                    {{ h.toString().padStart(2, '0') }} giờ
                                </div>
                            </div>
                        </transition>
                    </div>

                    <span class="colon">:</span>

                    <div class="custom-select minute-width">
                        <div class="cms-trigger" @click.stop="toggleListMinuteDropdown">
                            <span>
                                {{ listFilter.minute === '' ? '--' : listFilter.minute.toString().padStart(2, '0') }}
                            </span>
                            <span class="chevron" :class="{ rotate: showListMinuteDropdown }">▼</span>
                        </div>
                        <transition name="fade-slide">
                            <div v-if="showListMinuteDropdown" class="cms-dropdown">
                                <div class="cms-item" :class="{ active: listFilter.minute === '' }" @click="selectListMinute('')">--</div>
                                <div v-for="m in 60" :key="m-1" 
                                     class="cms-item" :class="{ active: (m-1) === listFilter.minute }"
                                     @click="selectListMinute(m-1)">
                                    {{ (m-1).toString().padStart(2, '0') }}
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
             </div>
             
             <div class="fb-item" v-if="listFilter.date || listFilter.hour !== '' || listFilter.minute !== ''">
                 <button class="btn-clear-filter" @click="clearListFilter">✕ Xóa lọc</button>
             </div>
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
                      <div class="customer-avatar">{{ (item.guestName || "N").charAt(0).toUpperCase() }}</div>
                      <div><strong>{{ item.guestName || "Chưa cập nhật" }}</strong><div class="sub-text">{{ item.phone || "-" }}</div></div>
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
                      <span class="people-count"> & Khách: {{ item.people }}</span>
                    </div>
                  </td>
                  <td>
                    <span :class="['status-badge', item.status.toLowerCase()]">{{ getStatusLabel(item.status) }}</span>
                    <div v-if="item.status === 'REQUEST_CANCEL'" class="note-text">Lý do: "{{ item.cancellationReason }}"</div>
                  </td>
                  <td class="actions-cell text-right">
                    <div v-if="item.status === 'PENDING'" class="action-group">
                      <button @click="handleApprove(item)" class="btn-icon success" title="Duyệt đơn">✔</button>
                      <button @click="handleReject(item)" class="btn-icon danger" title="Từ chối">✕</button>
                    </div>
                    <div v-else-if="item.status === 'REQUEST_CANCEL'" class="action-group">
                      <button @click="handleApproveCancel(item)" class="btn-sm btn-success" title="Đồng ý hủy">Đồng ý Hủy</button>
                      <button @click="handleRejectCancel(item)" class="btn-sm btn-danger-outline" title="Từ chối hủy">Từ Chối Hủy</button>
                    </div>
                    <div v-else-if="item.status === 'CONFIRMED'" class="action-group">
                      <button @click="handleCheckIn(item)" class="btn-sm btn-primary">Check-in</button>
                      <button @click="handleReject(item)" class="btn-icon danger" title="Hủy đơn">✕</button>
                    </div>
                    <div v-else-if="item.status === 'OCCUPIED'" class="action-group">
                      <button @click="handleCheckOut(item)" class="btn-sm btn-success">Check-out</button>
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
                    <label>Ngày</label>
                    <input type="date" v-model="mapFilter.date" :min="today" @change="handleDateChange">
                 </div>
                 
                 <div class="mf-item">
                    <label>Thời gian</label>
                    <div class="time-group">
                        <div class="custom-select hour-width">
                            <div class="cms-trigger" @click.stop="toggleHourDropdown">
                                <span>{{ mapFilter.hour.toString().padStart(2, '0') }} giờ</span>
                                <span class="chevron" :class="{ rotate: showHourDropdown }">▼</span>
                            </div>
                            <transition name="fade-slide">
                                <div v-if="showHourDropdown" class="cms-dropdown">
                                    <div 
                                        v-for="h in availableHours" :key="h" 
                                        class="cms-item" :class="{ active: h === mapFilter.hour }"
                                        @click="selectHour(h)"
                                    >
                                        {{ h.toString().padStart(2, '0') }} giờ
                                    </div>
                                    <div v-if="availableHours.length === 0" class="cms-empty">Hết giờ</div>
                                </div>
                            </transition>
                        </div>
                        
                        <span class="colon">:</span>
                        
                        <div class="custom-select minute-width">
                            <div class="cms-trigger" @click.stop="toggleMinuteDropdown">
                                <span>{{ mapFilter.minute.toString().padStart(2, '0') }}</span>
                                <span class="chevron" :class="{ rotate: showMinuteDropdown }">▼</span>
                            </div>
                            <transition name="fade-slide">
                                <div v-if="showMinuteDropdown" class="cms-dropdown">
                                    <div 
                                        v-for="m in availableMinutes" :key="m" 
                                        class="cms-item" :class="{ active: m === mapFilter.minute }"
                                        @click="selectMinute(m)"
                                    >
                                        {{ m.toString().padStart(2, '0') }}
                                    </div>
                                    <div v-if="availableMinutes.length === 0" class="cms-empty">Hết giờ</div>
                                </div>
                            </transition>
                        </div>

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
                <span><i class="dot occupied"></i> Có khách</span>
                <span><i class="dot maintenance"></i> Bảo trì</span>
              </div>
          </div>

          <div class="map-container-styled">
             <TableMap 
               :tables="reservationStore.tables" 
               mode="staff"
               @click-table="handleTableClick"
             />
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

    <EditProfileModal 
      v-if="showEditProfileModal"
      :isVisible="showEditProfileModal"
      @close="showEditProfileModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { authStore } from '../../store/authStore';
import { reservationStore } from '../../store/reservationStore';
import ReservationForm from '../../components/reservations/ReservationForm.vue';
import EditProfileModal from '../../components/EditProfileModal.vue';
import TableMap from '../../components/map/TableMap.vue'; // IMPORT
import { getSocket } from '../../realtime/socket';

const router = useRouter();

// --- STATE QUẢN LÝ TAB ---
const savedTab = localStorage.getItem('staffCurrentTab');
const currentTab = ref(savedTab && ['RESERVATIONS', 'TABLES'].includes(savedTab) ? savedTab : 'RESERVATIONS');

watch(currentTab, (newVal) => {
    localStorage.setItem('staffCurrentTab', newVal);
});

// --- DROPDOWN STATE ---
const showUserMenu = ref(false);

// Map Tab Dropdowns
const showHourDropdown = ref(false);
const showMinuteDropdown = ref(false);

// List Tab Dropdowns
const showListHourDropdown = ref(false);
const showListMinuteDropdown = ref(false);

const showCreateModal = ref(false);
const showEditProfileModal = ref(false);

// --- TAB 1: RESERVATION LIST LOGIC ---
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

// List Filter State
const listFilter = reactive({
    date: '',
    hour: '' as string | number,
    minute: '' as string | number
});

const availableListHours = computed(() => {
    const arr = [];
    for(let i=8; i<=22; i++) arr.push(i);
    return arr;
});

const clearListFilter = () => {
    listFilter.date = '';
    listFilter.hour = '';
    listFilter.minute = '';
};

// Không cần watch vì filter làm hoàn toàn client-side
// Data đã được fetch hết, computed sẽ tự động filter

// Actions cho List Dropdown
const toggleListHourDropdown = () => { showListHourDropdown.value = !showListHourDropdown.value; showListMinuteDropdown.value = false; showUserMenu.value = false; };
const toggleListMinuteDropdown = () => { showListMinuteDropdown.value = !showListMinuteDropdown.value; showListHourDropdown.value = false; showUserMenu.value = false; };
const selectListHour = (h: string | number) => { listFilter.hour = h; showListHourDropdown.value = false; };
const selectListMinute = (m: string | number) => { listFilter.minute = m; showListMinuteDropdown.value = false; };

const switchToMapForCreate = () => {
    currentTab.value = 'TABLES';
    Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Hãy chọn một bàn trống trên sơ đồ', showConfirmButton: false, timer: 3000 });
};

// Computed Filtered List
const filteredReservations = computed(() => {
  let data = [...reservationStore.reservations]; // Tạo bản copy mới

  if (filterStatus.value !== 'ALL') {
    if (filterStatus.value === 'HISTORY') data = data.filter(r => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(r.status));
    else data = data.filter(r => r.status === filterStatus.value);
  }

  if (searchKeyword.value) {
    const k = searchKeyword.value.toLowerCase();
    data = data.filter(r => r.guestName.toLowerCase().includes(k) || r.phone.includes(k));
  }

  if (listFilter.date || listFilter.hour !== '' || listFilter.minute !== '') {
      data = data.filter(r => {
          const rDate = new Date(r.time);
          if (listFilter.date) {
              const dStr = rDate.toISOString().split('T')[0];
              if (dStr !== listFilter.date) return false;
          }
          if (listFilter.hour !== '') {
              if (rDate.getHours() !== Number(listFilter.hour)) return false;
          }
          if (listFilter.minute !== '') {
              if (rDate.getMinutes() !== Number(listFilter.minute)) return false;
          }
          return true;
      });
  }

  return data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
});

const handleApprove = async (item: any) => { 
  try {
    await reservationStore.approveReservation(item.id);
    Swal.fire({ icon: 'success', title: 'Duyệt thành công', text: `Đơn #${item.id} đã được xác nhận`, timer: 2000, showConfirmButton: false });
  } catch (err: any) {
    Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || 'Không thể duyệt đơn' });
  }
};

const handleReject = async (item: any) => { 
  const { value: reason } = await Swal.fire({ 
    input: 'textarea',
    title: 'Lý do từ chối/hủy', 
    inputPlaceholder: 'Nhập lý do...',
    showCancelButton: true,
    confirmButtonText: 'Xác Nhận',
    cancelButtonText: 'Hủy'
  }); 
  if (reason !== undefined && reason !== null) {
    try {
      await reservationStore.cancelReservation(item.id, reason || 'Staff từ chối');
      Swal.fire({ icon: 'info', title: 'Đã hủy', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || 'Không thể hủy đơn' });
    }
  }
};

const handleApproveCancel = async (item: any) => { 
  try {
    await reservationStore.approveCancelRequest(item.id);
    Swal.fire({ icon: 'success', title: 'Đã chấp nhận hủy', text: `Đơn #${item.id} đã hủy`, timer: 2000, showConfirmButton: false });
  } catch (err: any) {
    Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || 'Không thể xử lý hủy' });
  }
};

const handleRejectCancel = async (item: any) => {
  const { value: reason } = await Swal.fire({
    input: 'textarea',
    title: 'Lý do từ chối hủy',
    inputPlaceholder: 'Nhập lý do từ chối hủy đơn...',
    showCancelButton: true,
    confirmButtonText: 'Xác Nhận',
    cancelButtonText: 'Hủy'
  });
  if (reason !== undefined && reason !== null) {
    try {
      await reservationStore.rejectCancelRequest(item.id, reason || 'Staff từ chối hủy');
      Swal.fire({ icon: 'success', title: 'Đã từ chối hủy', text: 'Đơn quay lại trạng thái xác nhận', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || 'Không thể xử lý' });
    }
  }
};
const handleCheckIn = async (item: any) => { await reservationStore.checkInReservation(item.id); Swal.fire('Check-in xong', '', 'success'); };
const handleCheckOut = async (item: any) => { await reservationStore.checkOutReservation(item.id); Swal.fire('Check-out xong', '', 'success'); };

// --- TAB 2 LOGIC: MAP ---
const selectedTableForAction = ref<any>(null);
const staffInitData = reactive({ date: '', time: '', people: 2 });
const today = new Date().toISOString().split('T')[0];
const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;

const mapFilter = reactive({
    date: today,
    hour: new Date().getHours(),
    minute: new Date().getMinutes()
});

const currentSystemTime = reactive({
    hour: new Date().getHours(),
    minute: new Date().getMinutes()
});

setInterval(() => {
    const now = new Date();
    currentSystemTime.hour = now.getHours();
    currentSystemTime.minute = now.getMinutes();
}, 60000);

const availableHours = computed(() => {
    const hours = [];
    const isToday = mapFilter.date === today;
    let start = isToday ? Math.max(currentSystemTime.hour, OPEN_HOUR) : OPEN_HOUR;
    for (let h = start; h <= CLOSE_HOUR; h++) hours.push(h);
    return hours;
});

const availableMinutes = computed(() => {
    const minutes = [];
    const isToday = mapFilter.date === today;
    const isCurrentHour = isToday && (mapFilter.hour === currentSystemTime.hour);
    let startMinute = isCurrentHour ? currentSystemTime.minute : 0;
    for (let m = startMinute; m < 60; m++) minutes.push(m);
    return minutes;
});

watch(availableHours, (newVal) => {
    if (newVal.length > 0 && !newVal.includes(mapFilter.hour)) mapFilter.hour = newVal[0];
});
watch(availableMinutes, (newVal) => {
    if (newVal.length > 0 && !newVal.includes(mapFilter.minute)) mapFilter.minute = newVal[0];
});

// Dropdown Management
const closeAllDropdowns = () => {
    showUserMenu.value = false;
    showHourDropdown.value = false;
    showMinuteDropdown.value = false;
    showListHourDropdown.value = false;
    showListMinuteDropdown.value = false;
};
const toggleUserMenu = () => { 
    showUserMenu.value = !showUserMenu.value; 
    showHourDropdown.value = false; showMinuteDropdown.value = false; 
    showListHourDropdown.value = false; showListMinuteDropdown.value = false;
};
const toggleHourDropdown = () => { showHourDropdown.value = !showHourDropdown.value; showMinuteDropdown.value = false; showUserMenu.value = false; };
const toggleMinuteDropdown = () => { showMinuteDropdown.value = !showMinuteDropdown.value; showHourDropdown.value = false; showUserMenu.value = false; };
const selectHour = (h: number) => { mapFilter.hour = h; showHourDropdown.value = false; refreshMap(); };
const selectMinute = (m: number) => { mapFilter.minute = m; showMinuteDropdown.value = false; refreshMap(); };

const handleDateChange = () => { refreshMap(); };

const refreshMap = () => {
   const t = `${mapFilter.hour.toString().padStart(2,'0')}:${mapFilter.minute.toString().padStart(2,'0')}`;
   reservationStore.fetchTablesByTime(mapFilter.date, t);
};

const resetToNow = () => {
    const now = new Date();
    if (now.getHours() >= CLOSE_HOUR) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        mapFilter.date = tomorrow.toISOString().split('T')[0];
        mapFilter.hour = OPEN_HOUR;
        mapFilter.minute = 0;
    } else {
        mapFilter.date = today;
        mapFilter.hour = Math.max(now.getHours(), OPEN_HOUR);
        mapFilter.minute = now.getMinutes();
    }
    refreshMap();
};

const handleTableClick = async (table: any) => {
   if (table.status === 'MAINTENANCE') {
       Swal.fire({ icon: 'warning', title: 'Bàn đang bảo trì', text: 'Không thể thao tác trên bàn này.' });
       return;
   }

   selectedTableForAction.value = table;
   const dateStr = mapFilter.date;
   const timeStr = `${mapFilter.hour.toString().padStart(2,'0')}:${mapFilter.minute.toString().padStart(2,'0')}`;

   if (table.status === 'AVAILABLE') {
       const { isConfirmed, value } = await Swal.fire({
          title: `Thao tác: ${table.name}`,
          text: 'Bàn đang trống. Vui lòng chọn hành động:',
          showDenyButton: true, showCancelButton: true,
          confirmButtonText: 'Khách Vào Ngay', confirmButtonColor: '#27ae60',
          denyButtonText: 'Tạo Đặt Trước', denyButtonColor: '#3498db',
          cancelButtonText: 'Đóng', cancelButtonColor: '#95a5a6'
       });

       if (isConfirmed) { 
           const { value: guestName } = await Swal.fire({ 
               input: 'text', title: 'Nhập Tên Khách Hàng', inputValue: 'Khách vãng lai',
               confirmButtonText: 'Xác Nhận', confirmButtonColor: '#27ae60',
               showCancelButton: true, cancelButtonText: 'Hủy'
           });
           if (guestName) {
               await reservationStore.createReservation({
                   guestName, phone: 'N/A', people: table.capacity,
                   date: dateStr, time: timeStr, reservation_time: `${dateStr}T${timeStr}`,
                   tableId: table.id, tableName: table.name,
                   isAdmin: true, initialStatus: 'OCCUPIED'
               });
               Swal.fire({ icon: 'success', title: 'Thành công', text: 'Bàn đã chuyển trạng thái CÓ KHÁCH', timer: 1500, showConfirmButton: false });
           }
       } else if (value === false) { 
           staffInitData.date = dateStr; staffInitData.time = timeStr;
           showCreateModal.value = true;
       }
   }
   else if (table.status === 'PENDING') {
       const booking = reservationStore.reservations.find(r => r.tableId === table.id && r.status === 'PENDING');
       if (booking) {
           const res = await Swal.fire({ 
               title: 'Xử lý đơn chờ', html: `Khách: <strong>${booking.guestName}</strong><br>SĐT: ${booking.phone}`, 
               showCancelButton: true, confirmButtonText: 'Duyệt Đơn', confirmButtonColor: '#27ae60',
               cancelButtonText: 'Từ Chối', cancelButtonColor: '#e74c3c'
           });
           if (res.isConfirmed) {
               await reservationStore.approveReservation(booking.id);
               Swal.fire({ icon: 'success', title: 'Đã duyệt', timer: 1500, showConfirmButton: false });
           } else if (res.dismiss === Swal.DismissReason.cancel) {
               await reservationStore.cancelReservation(booking.id, 'Staff từ chối qua map');
           }
       }
   }
   else if (table.status === 'OCCUPIED') {
       const booking = reservationStore.reservations.find(r => r.tableId === table.id && r.status === 'OCCUPIED');
       const res = await Swal.fire({ 
           title: 'Thanh Toán & Trả Bàn', text: `Khách: ${booking?.guestName || 'Unknown'}`, 
           showCancelButton: true, confirmButtonText: 'Xác Nhận Trả Bàn', confirmButtonColor: '#f39c12' 
       });
       if (res.isConfirmed && booking) {
           await reservationStore.checkOutReservation(booking.id);
           Swal.fire({ icon: 'success', title: 'Hoàn tất', text: 'Bàn đã trở về trạng thái Trống', timer: 1500, showConfirmButton: false });
       }
   }
};

const openCreateModal = () => { selectedTableForAction.value = null; showCreateModal.value = true; };
const closeModal = () => { showCreateModal.value = false; selectedTableForAction.value = null; };
const openEditProfile = () => { showEditProfileModal.value = true; showUserMenu.value = false; };
const closeUserMenu = () => { showUserMenu.value = false; };

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
const getStatusLabel = (s:string) => ({PENDING:'⏳ Chờ duyệt',CONFIRMED:'✅ Sắp đến',OCCUPIED:'🔴 Đang có khách',COMPLETED:'✓ Xong',CANCELLED:'❌ Hủy', REQUEST_CANCEL: '❌ Yêu cầu hủy'}[s]||s);
const getStatusLabelMap = (s: string) => ({ AVAILABLE: '🟢 Trống', PENDING: '🟡 Chờ duyệt', RESERVED: '🟠 Có khách đặt', OCCUPIED: '🔴 Đang có khách', MAINTENANCE: '⚪ Bảo trì' }[s] || s);
const formatTimeOnly = (iso: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const formatDateOnly = (iso: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const handleLogout = () => { 
    authStore.logout(); 
    localStorage.removeItem('staffCurrentTab'); 
    router.push('/'); 
    closeUserMenu(); 
};

let staffPollId: any = null;
let staffSocket: any = null;
let refreshTimeout: any = null;

// Debounced refresh để tránh gọi API liên tục
const refreshReservations = () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
        reservationStore.fetchReservations();
    }, 300);
};

onMounted(() => { 
    refreshReservations(); 
    resetToNow();
    // Luôn setup lại listeners mỗi lần mount để đảm bảo nhận events
    staffSocket = getSocket();
    const refresh = () => { 
        refreshReservations(); 
        refreshMap(); 
    };
    staffSocket.on('reservation.created', refresh);
    staffSocket.on('reservation.updated', refresh);
    staffSocket.on('reservation.cancelled', refresh);
    if (!staffPollId) {
        staffPollId = setInterval(() => {
            refreshReservations();
            refreshMap();
        }, 15000);
    }
});

onUnmounted(() => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    if (staffPollId) {
        clearInterval(staffPollId);
        staffPollId = null;
    }
  if (staffSocket) {
    staffSocket.off('reservation.created');
    staffSocket.off('reservation.updated');
    staffSocket.off('reservation.cancelled');
    staffSocket = null;
  }
});
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

.avatar-circle { width: 40px; height: 40px; background: #34495e; color: #fff; border-radius: 50%; display: grid; place-items: center; font-weight: 700; }
.user-dropdown { position: absolute; top: 55px; right: 0; width: 180px; background: #fff; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); z-index: 100; border: 1px solid #eee; padding: 10px; }
.menu-item { padding: 10px 12px; cursor: pointer; color: #555; font-size: 0.9rem; transition: background 0.2s; border-radius: 4px; }
.menu-item:hover { background: #f9f9f9; color: #a67c52; }
.menu-divider { height: 1px; background: #eee; margin: 5px 0; }
.menu-item.logout { color: #c0392b; }
.menu-item.logout:hover { background: #fdedec; }

/* Overlay */
.click-overlay { position: fixed; inset: 0; z-index: 90; cursor: default; }

.content-body { padding: 30px; overflow-y: auto; flex: 1; }
.toolbar { display: flex; gap: 15px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
.search-box { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 0 12px; display: flex; align-items: center; height: 42px; width: 250px; }
.search-box input { border: none; outline: none; flex: 1; margin-left: 8px; font-size: 0.9rem; }
.filter-tabs { display: flex; background: #e0e0e0; padding: 4px; border-radius: 8px; gap: 4px; }
.filter-tab { border: none; background: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #666; cursor: pointer; }
.filter-tab.active { background: #fff; color: #333; }
.count-badge { background: #95a5a6; color: #fff; font-size: 0.7rem; padding: 1px 5px; border-radius: 10px; margin-left: 5px; }
.btn-create { margin-left: auto; background: #27ae60; color: #fff; border: none; padding: 0 20px; height: 42px; border-radius: 8px; font-weight: 600; cursor: pointer; }

/* NEW: FILTERS BAR FOR LIST (UPDATED CSS: align-items: flex-end) */
.filters-bar-reservations { display: flex; gap: 20px; background: #fff; padding: 15px 20px; border-radius: 12px; margin-bottom: 20px; align-items: flex-end; box-shadow: 0 2px 10px rgba(0,0,0,0.03); flex-wrap: wrap; }
.fb-item { display: flex; flex-direction: column; }
.fb-item label { font-size: 0.75rem; font-weight: 700; color: #555; margin-bottom: 5px; text-transform: uppercase; }
.date-input { height: 42px; padding: 0 10px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.9rem; outline: none; box-sizing: border-box; }
.btn-clear-filter { align-self: flex-end; height: 42px; padding: 0 15px; border: 1px solid #e74c3c; color: #e74c3c; background: transparent; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-clear-filter:hover { background: #e74c3c; color: #fff; }

.table-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f8f9fa; text-align: left; padding: 15px; font-size: 0.8rem; text-transform: uppercase; color: #7f8c8d; border-bottom: 2px solid #eee; }
.data-table td { padding: 15px; border-bottom: 1px solid #f1f1f1; vertical-align: middle; font-size: 0.9rem; color: #2c3e50; }
.customer-cell { display: flex; gap: 10px; align-items: center; }
.customer-avatar { width: 32px; height: 32px; background: #ecf0f1; border-radius: 50%; display: grid; place-items: center; font-weight: 700; color: #7f8c8d; }
.time-cell { display: flex; flex-direction: column; gap: 2px; }
.time-cell .time-big { font-size: 1rem; font-weight: 600; color: #2c3e50; }
.time-cell .date-small { font-size: 0.8rem; color: #7f8c8d; }
.sub-text { font-size: 0.8rem; color: #7f8c8d; margin-top: 2px; }
.table-info { display: flex; flex-direction: column; gap: 4px; }
.table-badge { background: #e8f4fd; color: #2980b9; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
.people-count { font-size: 0.8rem; color: #7f8c8d; }
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.occupied { background: #cce5ff; color: #004085; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }
.status-badge.request_cancel { background: #ffe5e5; color: #d63031; }
.note-text { font-size: 0.75rem; color: #c0392b; margin-top: 4px; font-style: italic; max-width: 150px; }

/* MAP STYLES */
.map-toolbar-custom { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
.map-filters-styled { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
.mf-item { display: flex; flex-direction: column; }
.mf-item label { font-size: 0.75rem; font-weight: 700; color: #555; margin-bottom: 8px; text-transform: uppercase; }
.mf-item input, .mf-item select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.9rem; outline: none; height: 42px; box-sizing: border-box; }
.time-group { display: flex; align-items: center; gap: 8px; }
.colon { font-weight: bold; }
.btn-dark-flat { height: 42px; padding: 0 20px; background: #34495e; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; text-transform: uppercase; font-size: 0.85rem; }
.btn-dark-flat:hover { background: #2c3e50; }

/* UPDATE: LEGEND CSS ĐỒNG BỘ */
.map-legend { display: flex; gap: 15px; font-size: 0.85rem; flex-wrap: wrap; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 5px; border: 1px solid rgba(0,0,0,0.1); }
.dot.available { background: #20c997; } /* Teal */
.dot.pending { background: #7950f2; }   /* Purple */
.dot.reserved { background: #fab005; }  /* Yellow */
.dot.occupied { background: #fa5252; }  /* Red */
.dot.maintenance { background: #868e96; } /* Grey */

.map-container-styled { padding-bottom: 50px; }

/* Custom Dropdown CSS */
.custom-select { position: relative; height: 42px; }
.custom-select.hour-width { width: 100px; }
.custom-select.minute-width { width: 80px; }
.cms-trigger { height: 100%; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 0 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 0.9rem; transition: border-color 0.2s; box-sizing: border-box; }
.cms-trigger:hover { border-color: #a67c52; }
.chevron { font-size: 0.6rem; color: #888; transition: transform 0.2s; }
.chevron.rotate { transform: rotate(180deg); }
.cms-dropdown { position: absolute; top: 105%; left: 0; width: 100%; background: white; border: 1px solid #ddd; border-radius: 6px; z-index: 100; max-height: 200px; overflow-y: auto; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.cms-item { padding: 10px; text-align: center; cursor: pointer; transition: 0.1s; font-size: 0.9rem; border-bottom: 1px solid #f9f9f9; }
.cms-item:hover { background: #f5f5f5; color: #a67c52; }
.cms-item.active { background: #e3f2fd; color: #1565c0; font-weight: bold; }
.cms-empty { padding: 10px; text-align: center; color: #888; font-size: 0.8rem; }
.cms-dropdown::-webkit-scrollbar { width: 4px; }
.cms-dropdown::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

.action-group { display: flex; gap: 5px; justify-content: flex-end; }
.btn-icon { width: 30px; height: 30px; border-radius: 4px; border: none; cursor: pointer; display: grid; place-items: center; }
.btn-icon.success { background: #d4edda; color: #27ae60; }
.btn-icon.danger { background: #f8d7da; color: #c0392b; }
.btn-sm { padding: 5px 10px; border-radius: 4px; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.btn-primary { background: #3498db; color: #fff; }
.btn-success { background: #27ae60; color: #fff; }
.btn-danger-outline { border: 1px solid #e74c3c; background: #fff; color: #e74c3c; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-5px); }
</style>