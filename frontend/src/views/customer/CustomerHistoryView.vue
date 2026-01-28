<template>
  <div class="page-container">
    
    <div v-if="showHourDropdown || showMinuteDropdown" class="click-overlay" @click="closeAllDropdowns"></div>

    <div class="header">
      <h2>📜 Lịch Sử Đặt Bàn</h2>
      <button class="btn-create" @click="$router.push('/reservation')">+ Đặt bàn mới</button>
    </div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Trạng thái:</label>
        <select v-model="filterStatus">
          <option value="">Tất cả</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="REQUEST_CANCEL">Đang yêu cầu hủy</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Ngày đặt:</label>
        <input type="date" v-model="filterDate">
      </div>
      
      <div class="filter-group">
        <label>Thời gian:</label>
        <div class="time-filter-wrapper">
            
            <div class="custom-select hour-width">
                <div class="cms-trigger" @click="toggleHourDropdown">
                    <span>
                        {{ filterHour === '' ? '--' : filterHour.toString().padStart(2, '0') + ' giờ' }}
                    </span>
                    <span class="chevron" :class="{ rotate: showHourDropdown }">▼</span>
                </div>
                
                <transition name="fade-slide">
                    <div v-if="showHourDropdown" class="cms-dropdown">
                        <div class="cms-item" :class="{ active: filterHour === '' }" @click="selectHour('')">
                            --
                        </div>
                        <div 
                            v-for="h in availableHours" 
                            :key="h" 
                            class="cms-item" 
                            :class="{ active: h === filterHour }"
                            @click="selectHour(h)"
                        >
                            {{ h.toString().padStart(2, '0') }} giờ
                        </div>
                    </div>
                </transition>
            </div>
            
            <span class="colon">:</span>
            
            <div class="custom-select minute-width">
                <div class="cms-trigger" @click="toggleMinuteDropdown">
                    <span>
                        {{ filterMinute === '' ? '--' : filterMinute.toString().padStart(2, '0') }}
                    </span>
                    <span class="chevron" :class="{ rotate: showMinuteDropdown }">▼</span>
                </div>
                
                <transition name="fade-slide">
                    <div v-if="showMinuteDropdown" class="cms-dropdown">
                        <div class="cms-item" :class="{ active: filterMinute === '' }" @click="selectMinute('')">
                            --
                        </div>
                        <div 
                            v-for="m in availableMinutes" 
                            :key="m" 
                            class="cms-item" 
                            :class="{ active: m === filterMinute }"
                            @click="selectMinute(m)"
                        >
                            {{ m.toString().padStart(2, '0') }}
                        </div>
                    </div>
                </transition>
            </div>

        </div>
      </div>

      <div class="filter-group" v-if="filterDate || filterHour !== '' || filterMinute !== ''">
          <button class="btn-clear-filter" @click="clearFilters">✕ Xóa lọc</button>
      </div>

    </div>
    
    <div v-if="reservationStore.isLoading" class="loading-state">
      <div class="spinner"></div> Đang tải dữ liệu...
    </div>
    
    <div v-else-if="filteredReservations.length === 0" class="empty-state">
      <p>Không tìm thấy lịch đặt bàn nào phù hợp.</p>
    </div>

    <div v-else class="table-container">
      <table class="history-table">
        <thead>
          <tr>
            <th>Mã #</th>
            <th>Bàn</th> <th>Thời gian</th>
            <th>Tên Khách & SĐT</th>
            <th>Trạng thái</th>
            <th class="text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in filteredReservations" :key="res.id">
            <td>#{{ res.id }}</td>
            
            <td>
              <div class="table-name-wrapper">
                <span class="table-name">{{ res.tableName || 'Bàn ngẫu nhiên' }}</span>
                <button class="btn-icon info-inline" @click="viewDetails(res)" title="Xem chi tiết">
                  ℹ️
                </button>
              </div>
            </td>

            <td>
              <div>{{ formatDate(res.time) }}</div>
              <div class="time-sub">{{ formatTime(res.time) }}</div>
            </td>
            <td>
              <div><strong>{{ res.guestName || "Chưa cập nhật" }}</strong></div>
              <div class="time-sub">{{ res.phone || "-" }}</div>
            </td>
            <td>
              <StatusBadge :status="res.status" />
              <div v-if="res.status === 'REQUEST_CANCEL'" class="sub-status warning">
                <small>⏳ Đợi Staff duyệt</small>
              </div>
              <div v-if="res.raw?.adminResponse?.toString() && res.status === 'CONFIRMED'" class="sub-status error" @click="showRejectReason(res.raw.adminResponse as string)">
                <small>⚠️ Staff từ chối hủy (Xem)</small>
              </div>
            </td>
            
            <td class="text-right">
              <button 
                v-if="['PENDING', 'CONFIRMED'].includes(res.status)"
                @click="onCancelClick(res)"
                class="btn-cancel"
                title="Hủy đặt bàn"
              >
                Hủy
              </button>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <transition name="fade">
      <div v-if="showCancelModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Hủy Đặt Bàn</h3>
          <p class="modal-desc">
            Bạn đang yêu cầu hủy đơn <strong>#{{ selectedCancelRes?.id }}</strong>. 
            <br>Vì đơn đã xác nhận, vui lòng nhập lý do để nhân viên kiểm duyệt:
          </p>
          <textarea v-model="cancelReason" placeholder="Ví dụ: Có việc đột xuất, đổi địa điểm..." rows="3" class="reason-input"></textarea>
          <div class="modal-actions">
            <button class="btn-back" @click="closeCancelModal">Quay lại</button>
            <button class="btn-confirm-cancel" @click="confirmCancelRequest">Gửi yêu cầu</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showDetailModal && selectedDetailRes" class="modal-overlay" @click.self="showDetailModal = false">
        <div class="modal-content info-modal">
          <h3>Chi Tiết Đơn #{{ selectedDetailRes.id }}</h3>
          <div class="detail-row"><strong>👤 Khách hàng:</strong> {{ selectedDetailRes.guestName }}</div>
          <div class="detail-row"><strong>📞 SĐT:</strong> {{ selectedDetailRes.phone }}</div>
          <div class="detail-row"><strong>🕒 Thời gian:</strong> {{ formatDate(selectedDetailRes.time) }} - {{ formatTime(selectedDetailRes.time) }}</div>
          <div class="detail-row"><strong>📍 Bàn:</strong> {{ selectedDetailRes.tableName }} ({{ selectedDetailRes.people }} người)</div>
          <div class="detail-row reason-box" v-if="selectedDetailRes.cancellationReason"><strong>Lý do hủy của bạn:</strong> <br>"{{ selectedDetailRes.cancellationReason }}"</div>
           <div class="detail-row reason-box admin" v-if="selectedDetailRes?.raw?.adminResponse"><strong>💬 Phản hồi từ Staff:</strong> <br>"{{ selectedDetailRes.raw.adminResponse }}"</div>
          <div class="modal-actions"><button class="btn-primary" @click="showDetailModal = false">Đóng</button></div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { reservationStore } from '../../store/reservationStore';
import StatusBadge from '../../components/common/StatusBadge.vue';
import Swal from 'sweetalert2';
import { getSocket } from '../../realtime/socket';

// State
const filterStatus = ref('');
const filterDate = ref('');
// State lọc giờ/phút
const filterHour = ref<number | string>('');
const filterMinute = ref<number | string>('');

// State custom dropdown
const showMinuteDropdown = ref(false);
const showHourDropdown = ref(false);

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;

const availableHours = computed(() => {
    const hours = [];
    for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) hours.push(h);
    return hours;
});

const availableMinutes = computed(() => {
    const minutes = [];
    for (let m = 0; m < 60; m++) minutes.push(m);
    return minutes;
});

// Modal Hủy
const showCancelModal = ref(false);
const cancelReason = ref('');
const selectedCancelRes = ref<any>(null);

// Modal Chi tiết
const showDetailModal = ref(false);
const selectedDetailRes = ref<any>(null);

let historySocket: any = null;

const filteredReservations = computed(() => {
  return reservationStore.reservations.filter(res => {
    if (filterStatus.value && res.status !== filterStatus.value) return false;
    
    const resObj = new Date(res.time);

    if (filterDate.value) {
      const resDate = resObj.toISOString().split('T')[0];
      if (resDate !== filterDate.value) return false;
    }

    if (filterHour.value !== '') {
        if (resObj.getHours() !== Number(filterHour.value)) return false;
    }

    if (filterMinute.value !== '') {
        if (resObj.getMinutes() !== Number(filterMinute.value)) return false;
    }

    return true;
  });
});

// --- Actions Dropdown ---
const closeAllDropdowns = () => {
    showMinuteDropdown.value = false;
    showHourDropdown.value = false;
};

const toggleHourDropdown = () => {
    if (showHourDropdown.value) {
        showHourDropdown.value = false;
    } else {
        showHourDropdown.value = true;
        showMinuteDropdown.value = false; 
    }
};

const toggleMinuteDropdown = () => {
    if (showMinuteDropdown.value) {
        showMinuteDropdown.value = false;
    } else {
        showMinuteDropdown.value = true;
        showHourDropdown.value = false;
    }
};

const selectHour = (h: number | string) => {
    filterHour.value = h;
    showHourDropdown.value = false;
};

const selectMinute = (m: number | string) => {
    filterMinute.value = m;
    showMinuteDropdown.value = false;
};

// NEW: Action xóa bộ lọc
const clearFilters = () => {
    filterDate.value = '';
    filterHour.value = '';
    filterMinute.value = '';
};

const formatDate = (isoStr: string) => {
  if(!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('vi-VN');
};

const formatTime = (isoStr: string) => {
  if(!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const viewDetails = (res: any) => { selectedDetailRes.value = res; showDetailModal.value = true; };

const showRejectReason = (reason: string) => {
  Swal.fire({ icon: 'info', title: 'Lý do từ chối hủy', text: reason, confirmButtonColor: '#2c3e50' });
};

const onCancelClick = async (res: any) => {
  // Khách hàng có thể hủy nếu đơn chưa được xác nhận (PENDING)
  if (res.status === 'PENDING') {
    const result = await Swal.fire({
      title: 'Hủy đơn chờ?', text: "Bạn có chắc chắn muốn hủy đơn đang chờ duyệt này không?", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Đồng ý hủy', cancelButtonText: 'Quay lại'
    });
    if (result.isConfirmed) {
      try {
        await reservationStore.cancelReservation(res.id, 'Khách chủ động hủy đơn chờ');
        await reservationStore.fetchReservations(); // Refresh danh sách
        Swal.fire('Đã hủy!', 'Đơn của bạn đã được hủy thành công.', 'success');
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: error.message || 'Không thể hủy đơn' });
      }
    }
    return;
  }

  if (res.status === 'CONFIRMED') {
    selectedCancelRes.value = res;
    cancelReason.value = '';
    showCancelModal.value = true;
  }
};

const closeCancelModal = () => { showCancelModal.value = false; selectedCancelRes.value = null; };

const confirmCancelRequest = async () => {
  if (!cancelReason.value.trim()) { Swal.fire('Thiếu thông tin', 'Vui lòng nhập lý do hủy!', 'warning'); return; }
  if (selectedCancelRes.value) {
    try {
      await reservationStore.cancelReservation(selectedCancelRes.value.id, cancelReason.value);
      await reservationStore.fetchReservations(); // Refresh danh sách
      closeCancelModal();
      Swal.fire({ icon: 'success', title: 'Đã gửi yêu cầu', text: 'Yêu cầu hủy đang chờ nhân viên xác nhận.', timer: 2000, showConfirmButton: false });
    } catch (error: any) {
      console.error('[CUSTOMER] Cancel error:', error);
      const message = error?.message || 'Không thể hủy đơn';
      Swal.fire({ icon: 'error', title: 'Lỗi', text: message });
    }
  }
};

onMounted(() => {
  reservationStore.fetchReservations();
  if (!historySocket) {
    historySocket = getSocket();
    const refresh = () => reservationStore.fetchReservations();
    historySocket.on('reservation.updated', refresh);
    historySocket.on('reservation.cancelled', refresh);
  }
});

onUnmounted(() => {
  if (historySocket) {
    historySocket.off('reservation.updated');
    historySocket.off('reservation.cancelled');
    historySocket = null;
  }
});
</script>

<style scoped>
.page-container { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.header h2 { margin: 0; color: #2c3e50; font-size: 24px; }

/* Filter Styles */
/* Đã sửa align-items thành flex-end để nút xóa lọc nằm dưới cùng */
.filters-bar { display: flex; gap: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee; flex-wrap: wrap; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 5px; }
.filter-group label { font-size: 0.85rem; font-weight: 600; color: #555; }
.filter-group select, .filter-group input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; outline: none; height: 38px; box-sizing: border-box; }
.time-filter-wrapper { display: flex; align-items: center; gap: 5px; }
.colon { font-weight: bold; }

/* Nút xóa lọc */
.btn-clear-filter { height: 38px; padding: 0 15px; border: 1px solid #e74c3c; color: #e74c3c; background: transparent; border-radius: 4px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-clear-filter:hover { background: #e74c3c; color: #fff; }

/* --- CUSTOM SELECT CSS (COMMON) --- */
.custom-select {
    position: relative;
    height: 38px;
}
.custom-select.hour-width { width: 100px; }
.custom-select.minute-width { width: 70px; }

.cms-trigger {
    height: 100%;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
}
.cms-trigger:hover { border-color: #a67c52; }
.chevron { font-size: 0.6rem; color: #888; transition: transform 0.2s; }
.chevron.rotate { transform: rotate(180deg); }

.cms-dropdown {
    position: absolute;
    top: 105%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    z-index: 10; 
    max-height: 200px; 
    overflow-y: auto;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
.cms-item { padding: 8px; text-align: center; cursor: pointer; transition: 0.1s; font-size: 0.9rem; border-bottom: 1px solid #f9f9f9; }
.cms-item:hover { background: #f5f5f5; color: #a67c52; }
.cms-item.active { background: #e3f2fd; color: #1565c0; font-weight: bold; }

/* Scrollbar styling */
.cms-dropdown::-webkit-scrollbar { width: 4px; }
.cms-dropdown::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

/* Overlay */
.click-overlay { position: fixed; inset: 0; z-index: 5; cursor: default; }

/* Buttons */
.btn-create { background-color: #d4a373; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-create:hover { background-color: #b08968; }

.btn-cancel { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-cancel:hover { background-color: #fecaca; }

/* Table Styles */
.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; position: relative; z-index: 1; }
.history-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.history-table th { background-color: #f8f9fa; color: #6c757d; font-weight: 600; text-align: left; padding: 15px; border-bottom: 2px solid #eee; }
.history-table td { padding: 15px; border-bottom: 1px solid #eee; color: #333; vertical-align: middle; }
.text-right { text-align: right; }

.table-name-wrapper { display: flex; align-items: center; gap: 8px; }
.table-name { font-weight: bold; color: #2c3e50; }
.btn-icon { background: none; border: none; cursor: pointer; transition: transform 0.2s; padding: 0; }
.btn-icon:hover { transform: scale(1.2); }
.btn-icon.info-inline { font-size: 1rem; opacity: 0.6; }
.btn-icon.info-inline:hover { opacity: 1; }

.time-sub { font-size: 0.85em; color: #888; margin-top: 2px; }
.sub-status { margin-top: 5px; cursor: pointer; }
.sub-status.warning small { color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.sub-status.error small { color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #666; }
.text-gray { color: #ccc; }

/* Modal Styles */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px); }
.modal-content { background: white; width: 90%; max-width: 450px; padding: 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease-out; }
.modal-content h3 { margin-top: 0; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
.detail-row { margin-bottom: 12px; font-size: 0.95rem; line-height: 1.5; }
.reason-box { background: #f9fafb; padding: 10px; border-radius: 6px; border-left: 3px solid #ccc; font-style: italic; color: #555; margin-top: 10px; }
.reason-box.admin { background: #fee2e2; border-left-color: #ef4444; color: #991b1b; }
.reason-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-family: inherit; margin-bottom: 20px; resize: vertical; }
.reason-input:focus { outline: none; border-color: #d9534f; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-back { background: #eee; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-primary { background: #2c3e50; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
.btn-confirm-cancel { background: #d9534f; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-confirm-cancel:hover { background: #c9302c; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-5px); }
</style>