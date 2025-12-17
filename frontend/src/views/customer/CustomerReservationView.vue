<template>
  <div class="reservation-page">
    <div class="main-card">
      <div class="header">
        <h2>📅 Đặt Bàn Trực Tuyến</h2>
        <p>Vui lòng chọn thời gian để xem sơ đồ bàn trống</p>
      </div>

      <div class="filters">
        <div class="filter-item">
          <label>Ngày đặt</label>
          <input type="date" v-model="filter.date" :min="today" @change="loadTables">
        </div>
        <div class="filter-item">
          <label>Giờ đến</label>
          <select v-model="filter.time" @change="loadTables">
             <option v-for="h in ['08:00','09:00','10:00','14:00','19:00','20:00']" :key="h" :value="h">{{ h }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Số người</label>
          <select v-model="filter.people">
            <option :value="2">1-2 người</option>
            <option :value="4">3-4 người</option>
            <option :value="6">5+ người</option>
          </select>
        </div>
      </div>

      <div class="map-area">
        <div class="legend">
          <span><i class="dot available"></i> Trống</span>
          <span><i class="dot selected"></i> Đang chọn</span>
          <span><i class="dot reserved"></i> Đã đặt</span>
          <span><i class="dot maintenance"></i> Bảo trì</span>
        </div>

        <div v-if="reservationStore.isLoading" class="loading">Đang tải sơ đồ...</div>
        
        <div v-else class="grid-tables">
          <div 
            v-for="table in reservationStore.tables" 
            :key="table.id"
            class="table-box"
            :class="[table.status.toLowerCase(), { selected: selectedTable?.id === table.id }]"
            @click="selectTable(table)"
          >
            <div class="table-icon"></div>
            <strong>{{ table.name }}</strong>
            <small>👤 {{ table.capacity }}</small>
          </div>
        </div>
      </div>
    </div>

    <transition name="slide-up">
      <div v-if="selectedTable" class="footer-action-fixed">
        <div class="selection-info">
          Bạn đang chọn: <strong>{{ selectedTable.name }}</strong> <br>
          <small>{{ filter.time }} - {{ filter.date }}</small>
        </div>
        <button class="btn-continue" @click="showForm = true">Điền Thông Tin ➝</button>
      </div>
    </transition>

    <ReservationForm 
      v-if="showForm" 
      :isVisible="showForm"
      :selectedTable="selectedTable"
      :initialData="filter"
      @submit="handleBooking"
      @close="showForm = false"
    />

    <transition name="fade">
      <div v-if="showSuccessModal" class="success-overlay">
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h3>Đặt Bàn Thành Công!</h3>
          <p>Cảm ơn bạn đã đặt bàn. Yêu cầu của bạn đang chờ nhân viên xác nhận.</p>
          
          <div class="success-actions">
            <button class="btn-primary" @click="confirmAndGoToHistory">
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { reservationStore, type Table } from '../../store/reservationStore';
import ReservationForm from '../../components/reservations/ReservationForm.vue';

const router = useRouter();
const today = new Date().toISOString().split('T')[0];

const showForm = ref(false);
const showSuccessModal = ref(false);
const selectedTable = ref<Table | null>(null);

const filter = reactive({
  date: today,
  time: '19:00',
  people: 2
});

const loadTables = async () => {
  selectedTable.value = null;
  await reservationStore.fetchTablesByTime(filter.date, filter.time);
};

const selectTable = (table: Table) => {
  if (table.status === 'AVAILABLE') selectedTable.value = table;
};

// --- XỬ LÝ ĐẶT BÀN ---
const handleBooking = async (formData: any) => {
  try {
    // B1: Lưu vào Store
    await reservationStore.createReservation({
      ...formData,
      reservation_time: `${filter.date}T${filter.time}`,
      people: filter.people,
      tableId: selectedTable.value?.id,
      tableName: selectedTable.value?.name
    });

    // B2: ĐÓNG BẢNG ĐIỀN THÔNG TIN TRƯỚC
    showForm.value = false;

    // B3: Đợi 300ms cho Form đóng hẳn rồi mới hiện Thông Báo
    setTimeout(() => {
      showSuccessModal.value = true;
    }, 300);

  } catch (error) {
    alert('Có lỗi xảy ra, vui lòng thử lại');
  }
};

// --- XỬ LÝ KHI BẤM "ĐỒNG Ý" ---
const confirmAndGoToHistory = () => {
  // B4: Tắt thông báo
  showSuccessModal.value = false;

  // B5: Đợi thông báo tắt hẳn (300ms) rồi mới chuyển trang
  setTimeout(() => {
    router.push('/history');
  }, 300);
};

onMounted(() => loadTables());
</script>

<style scoped>
/* CSS cho Page & Map (Giữ nguyên) */
.reservation-page { padding: 20px; display: flex; justify-content: center; padding-bottom: 100px; }
.main-card { background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); width: 100%; max-width: 900px; position: relative; }
.header { text-align: center; margin-bottom: 30px; }
.header h2 { color: #a67c52; font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; margin-bottom: 5px; }

.filters { display: flex; gap: 20px; background: #fdfbf7; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #eee; }
.filter-item { flex: 1; display: flex; flex-direction: column; }
.filter-item label { font-size: 0.8rem; font-weight: 700; color: #555; margin-bottom: 8px; text-transform: uppercase; }
.filter-item input, .filter-item select { padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; }

.legend { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; font-size: 0.9rem; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.dot.available { border: 2px solid #2ecc71; background: #fff; }
.dot.selected { background: #2ecc71; }
.dot.reserved { background: #e74c3c; opacity: 0.5; }
.dot.maintenance { background: #95a5a6; }

.grid-tables { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 20px; }
.table-box { border: 2px solid #eee; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: 0.2s; }
.table-box.available:hover { border-color: #a67c52; transform: translateY(-3px); }
.table-box.selected { border-color: #2ecc71; background: #f0fff4; }
.table-box.reserved { opacity: 0.5; background: #fff5f5; border-color: #feb2b2; cursor: not-allowed; }
.table-box.maintenance { background: #f3f4f6; cursor: not-allowed; }
.table-icon { width: 40px; height: 40px; background: #eee; border-radius: 8px; margin-bottom: 10px; opacity: 0.5; }
.table-box.selected .table-icon { background: #2ecc71; opacity: 1; }

/* Footer Fixed Action */
.footer-action-fixed { 
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 1000;
  background: #1a1a1a; color: #fff; padding: 12px 30px; border-radius: 50px;
  display: flex; align-items: center; gap: 30px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); min-width: 350px; justify-content: space-between;
}
.selection-info strong { color: #2ecc71; }
.selection-info small { color: #bbb; display: block; }
.btn-continue { background: #a67c52; color: #fff; border: none; padding: 10px 25px; border-radius: 25px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-continue:hover { background: #c59d70; transform: scale(1.05); }

/* --- CSS SUCCESS MODAL (Đã chỉnh sửa animation) --- */
.success-overlay {
  position: fixed; inset: 0; 
  background: rgba(255, 255, 255, 0.9); /* Nền trắng mờ */
  backdrop-filter: blur(5px);
  z-index: 3000; /* Luôn cao nhất */
  display: flex; justify-content: center; align-items: center;
}

.success-box {
  background: #fff; padding: 40px; border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  text-align: center; max-width: 400px; width: 90%;
  border: 1px solid #eee;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-icon {
  width: 70px; height: 70px; background: #2ecc71; color: #fff;
  border-radius: 50%; font-size: 35px; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px; box-shadow: 0 10px 20px rgba(46, 204, 113, 0.3);
}

.success-box h3 { color: #2ecc71; margin: 0 0 10px; font-size: 1.5rem; }
.success-box p { color: #666; margin-bottom: 30px; line-height: 1.5; }

.success-actions { display: flex; justify-content: center; }

.btn-primary {
  background: #1a1a1a; color: #fff; padding: 12px 40px; border-radius: 30px; border: none;
  font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 1rem;
}
.btn-primary:hover { background: #333; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

/* Animation Transition */
.slide-up-enter-active { animation: slideUp 0.3s; }
.slide-up-leave-active { animation: slideUp 0.3s reverse; }
@keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>