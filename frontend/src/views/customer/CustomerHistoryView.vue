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
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Ngày đặt:</label>
        <input type="date" v-model="filterDate">
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
            <th>Bàn</th>
            <th>Thời gian</th>
            <th>Khách</th>
            <th>Trạng thái</th>
            <th class="text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in filteredReservations" :key="res.id">
            <td>#{{ res.id }}</td>
            <td>
              <div class="table-name">{{ res.tableName || 'Bàn ngẫu nhiên' }}</div>
            </td>
            <td>
              <div>{{ formatDate(res.time) }}</div>
              <div class="time-sub">{{ formatTime(res.time) }}</div>
            </td>
            <td>{{ res.people }} người</td>
            <td>
              <StatusBadge :status="res.status" />
            </td>
            <td class="text-right">
              <button 
                v-if="['PENDING', 'CONFIRMED'].includes(res.status)"
                @click="onCancelClick(res)"
                class="btn-cancel"
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
            <br>Vui lòng cho chúng tôi biết lý do:
          </p>
          
          <textarea 
            v-model="cancelReason" 
            placeholder="Ví dụ: Có việc đột xuất, đổi địa điểm..."
            rows="3"
            class="reason-input"
          ></textarea>

          <div class="modal-actions">
            <button class="btn-back" @click="closeCancelModal">Quay lại</button>
            <button class="btn-confirm-cancel" @click="confirmCancel">Xác nhận Hủy</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { reservationStore } from '../../store/reservationStore';
import StatusBadge from '../../components/common/StatusBadge.vue';

// State cho bộ lọc
const filterStatus = ref('');
const filterDate = ref('');

// State cho Popup Hủy
const showCancelModal = ref(false);
const cancelReason = ref('');
const selectedCancelRes = ref<any>(null);

const filteredReservations = computed(() => {
  return reservationStore.reservations.filter(res => {
    if (filterStatus.value && res.status !== filterStatus.value) return false;
    if (filterDate.value) {
      const resDate = new Date(res.time).toISOString().split('T')[0];
      if (resDate !== filterDate.value) return false;
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

// [LOGIC XỬ LÝ HỦY]
const onCancelClick = async (res: any) => {
  // 1. Kiểm tra thời gian giữ bàn (Áp dụng cho CẢ PENDING và CONFIRMED theo yêu cầu)
  const reservationTime = new Date(res.time).getTime();
  const now = new Date().getTime();
  const holdTimeMs = 30 * 60 * 1000; // 30 phút

  if (now > reservationTime + holdTimeMs) {
    alert("Đã quá thời gian giữ bàn, bạn không thể hủy đơn này. Vui lòng liên hệ hotline.");
    return;
  }

  // 2. Trường hợp PENDING: Hủy ngay bằng confirm thường
  if (res.status === 'PENDING') {
    if (confirm('Bạn có chắc chắn muốn hủy đơn chờ duyệt này không?')) {
      await reservationStore.cancelReservation(res.id, '');
      alert('Đã hủy yêu cầu thành công.');
    }
    return;
  }

  // 3. Trường hợp CONFIRMED: Mở Popup nhập lý do
  if (res.status === 'CONFIRMED') {
    selectedCancelRes.value = res;
    cancelReason.value = '';
    showCancelModal.value = true;
  }
};

const closeCancelModal = () => {
  showCancelModal.value = false;
  selectedCancelRes.value = null;
};

const confirmCancel = async () => {
  if (!cancelReason.value.trim()) {
    alert("Vui lòng nhập lý do hủy!");
    return;
  }
  
  if (selectedCancelRes.value) {
    await reservationStore.cancelReservation(selectedCancelRes.value.id, cancelReason.value);
    alert('Đã gửi yêu cầu hủy thành công.');
    closeCancelModal();
  }
};

onMounted(() => {
  reservationStore.fetchReservations();
});
</script>

<style scoped>
.page-container { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.header h2 { margin: 0; color: #2c3e50; font-size: 24px; }

/* CSS cho bộ lọc */
.filters-bar { display: flex; gap: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee; }
.filter-group { display: flex; align-items: center; gap: 10px; }
.filter-group label { font-weight: 600; color: #555; }
.filter-group select, .filter-group input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }

.btn-create { background-color: #d4a373; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-create:hover { background-color: #b08968; }

.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; }
.history-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.history-table th { background-color: #f8f9fa; color: #6c757d; font-weight: 600; text-align: left; padding: 15px; border-bottom: 2px solid #eee; }
.history-table td { padding: 15px; border-bottom: 1px solid #eee; color: #333; vertical-align: middle; }
.text-right { text-align: right; }
.table-name { font-weight: bold; color: #2c3e50; }
.time-sub { font-size: 0.85em; color: #888; margin-top: 2px; }

.btn-cancel { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-cancel:hover { background-color: #fecaca; }

.text-gray { color: #ccc; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #666; }
.empty-state { border: 2px dashed #eee; border-radius: 8px; }

/* CSS Popup Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px); }
.modal-content { background: white; width: 90%; max-width: 450px; padding: 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease-out; }
.modal-content h3 { margin-top: 0; color: #d9534f; }
.modal-desc { color: #555; margin-bottom: 15px; line-height: 1.5; }
.reason-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-family: inherit; margin-bottom: 20px; resize: vertical; }
.reason-input:focus { outline: none; border-color: #d9534f; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-back { background: #eee; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-confirm-cancel { background: #d9534f; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-confirm-cancel:hover { background: #c9302c; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>