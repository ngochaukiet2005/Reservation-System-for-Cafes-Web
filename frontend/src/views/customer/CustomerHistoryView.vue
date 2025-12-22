<template>
  <div class="page-container">
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
        <label>Giờ:</label>
        <div class="time-filter-wrapper">
            <select v-model="filterHour" class="time-select">
                <option value="">--</option>
                <option v-for="h in 24" :key="h-1" :value="h-1">{{ (h-1).toString().padStart(2,'0') }}</option>
            </select>
            <span class="colon">:</span>
            <select v-model="filterMinute" class="time-select">
                <option value="">--</option>
                <option v-for="m in 60" :key="m-1" :value="m-1">{{ (m-1).toString().padStart(2,'0') }}</option>
            </select>
        </div>
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
            <th>Khách</th>
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
            <td>{{ res.people }} người</td>
            <td>
              <StatusBadge :status="res.status" />
              <div v-if="res.status === 'REQUEST_CANCEL'" class="sub-status warning">
                <small>⏳ Đợi Staff duyệt</small>
              </div>
              <div v-if="res.adminResponse && res.status === 'CONFIRMED'" class="sub-status error" @click="showRejectReason(res.adminResponse)">
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
              <span v-else class="text-gray">--</span>
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
           <div class="detail-row reason-box admin" v-if="selectedDetailRes.adminResponse"><strong>💬 Phản hồi từ Staff:</strong> <br>"{{ selectedDetailRes.adminResponse }}"</div>
          <div class="modal-actions"><button class="btn-primary" @click="showDetailModal = false">Đóng</button></div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { reservationStore } from '../../store/reservationStore';
import StatusBadge from '../../components/common/StatusBadge.vue';
import Swal from 'sweetalert2';

// State
const filterStatus = ref('');
const filterDate = ref('');
// State mới cho bộ lọc giờ
const filterHour = ref<number | string>('');
const filterMinute = ref<number | string>('');

// Modal Hủy
const showCancelModal = ref(false);
const cancelReason = ref('');
const selectedCancelRes = ref<any>(null);

// Modal Chi tiết
const showDetailModal = ref(false);
const selectedDetailRes = ref<any>(null);

const filteredReservations = computed(() => {
  return reservationStore.reservations.filter(res => {
    // 1. Lọc trạng thái
    if (filterStatus.value && res.status !== filterStatus.value) return false;
    
    const resObj = new Date(res.time);

    // 2. Lọc ngày
    if (filterDate.value) {
      const resDate = resObj.toISOString().split('T')[0];
      if (resDate !== filterDate.value) return false;
    }

    // 3. Lọc Giờ
    if (filterHour.value !== '') {
        if (resObj.getHours() !== Number(filterHour.value)) return false;
    }

    // 4. Lọc Phút
    if (filterMinute.value !== '') {
        if (resObj.getMinutes() !== Number(filterMinute.value)) return false;
    }

    return true;
  });
});

const formatDate = (isoStr: string) => {
  if(!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('vi-VN');
};

const formatTime = (isoStr: string) => {
  if(!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// --- TÍNH NĂNG XEM CHI TIẾT ---
const viewDetails = (res: any) => { selectedDetailRes.value = res; showDetailModal.value = true; };

const showRejectReason = (reason: string) => {
  Swal.fire({ icon: 'info', title: 'Lý do từ chối hủy', text: reason, confirmButtonColor: '#2c3e50' });
};

// --- LOGIC XỬ LÝ HỦY ---
const onCancelClick = async (res: any) => {
  const reservationTime = new Date(res.time).getTime();
  const now = new Date().getTime();
  const holdTimeMs = 30 * 60 * 1000; 

  if (now > reservationTime + holdTimeMs) {
    Swal.fire({ icon: 'error', title: 'Không thể hủy', text: 'Đã quá thời gian giữ bàn. Vui lòng liên hệ hotline.', });
    return;
  }

  if (res.status === 'PENDING') {
    const result = await Swal.fire({
      title: 'Hủy đơn chờ?', text: "Bạn có chắc chắn muốn hủy đơn đang chờ duyệt này không?", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Đồng ý hủy', cancelButtonText: 'Quay lại'
    });
    if (result.isConfirmed) {
      await reservationStore.cancelReservation(res.id, 'Khách chủ động hủy đơn chờ');
      Swal.fire('Đã hủy!', 'Đơn của bạn đã được hủy thành công.', 'success');
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
    await reservationStore.cancelReservation(selectedCancelRes.value.id, cancelReason.value);
    closeCancelModal();
    Swal.fire({ icon: 'success', title: 'Đã gửi yêu cầu', text: 'Yêu cầu hủy đang chờ nhân viên xác nhận.', timer: 2000, showConfirmButton: false });
  }
};

onMounted(() => { reservationStore.fetchReservations(); });
</script>

<style scoped>
.page-container { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.header h2 { margin: 0; color: #2c3e50; font-size: 24px; }

/* Filter Styles */
.filters-bar { display: flex; gap: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee; flex-wrap: wrap; }
.filter-group { display: flex; align-items: center; gap: 10px; }
.filter-group select, .filter-group input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; outline: none; }
.time-filter-wrapper { display: flex; align-items: center; gap: 5px; }
.time-select { width: 60px; }
.colon { font-weight: bold; }

/* Buttons */
.btn-create { background-color: #d4a373; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-create:hover { background-color: #b08968; }

.btn-cancel { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-cancel:hover { background-color: #fecaca; }

/* Table Styles */
.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; }
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
</style>