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
          <label>Giờ đến (08:00 - 22:00)</label>
          <select v-model="filter.time" @change="loadTables">
             <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Số người</label>
          <select v-model="filter.people">
            <option :value="2">1-2 người</option>
            <option :value="4">3-4 người</option>
            <option :value="6">5-8 người</option>
            <option :value="10">10+ người (Tiệc)</option>
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
            :class="[
              table.status.toLowerCase(), 
              table.type.toLowerCase(), // Thêm class type để style riêng (nếu cần)
              { selected: selectedTable?.id === table.id }
            ]"
            @click="selectTable(table)"
          >
            <div class="table-icon">
              <span v-if="table.type === 'Outdoor'">🌳</span>
              <span v-else-if="table.type === 'VIP'">👑</span>
              <span v-else>☕</span>
            </div>
            <strong>{{ table.name }}</strong>
            <small>👤 {{ table.capacity }}</small>
          </div>
        </div>
      </div>

      <transition name="slide-up">
        <div v-if="selectedTable" class="footer-action">
          <div class="selection-info">
            Bạn chọn: <strong>{{ selectedTable.name }}</strong> ({{ selectedTable.type }}) <br>
            <small>{{ filter.time }} - {{ filter.date }}</small>
          </div>
          <button class="btn-continue" @click="showForm = true">Điền Thông Tin ➝</button>
        </div>
      </transition>
    </div>

    <ReservationForm 
      v-if="showForm" 
      :selectedTable="selectedTable"
      :initialData="filter"
      @submit="handleBooking"
      @cancel="showForm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { reservationStore, type Table } from '../../store/reservationStore';
import ReservationForm from '../../components/reservations/ReservationForm.vue';

const today = new Date().toISOString().split('T')[0];
const showForm = ref(false);
const selectedTable = ref<Table | null>(null);

const filter = reactive({
  date: today,
  time: '08:00', // Mặc định 8h sáng
  people: 2
});

// Tạo danh sách giờ từ 08:00 đến 22:00 tự động
const timeSlots = computed(() => {
  const slots = [];
  for (let i = 8; i <= 22; i++) {
    const h = i < 10 ? `0${i}` : `${i}`;
    slots.push(`${h}:00`);
  }
  return slots;
});

const loadTables = async () => {
  selectedTable.value = null;
  // Gọi hàm fetch từ store để lấy trạng thái bàn theo giờ chọn
  await reservationStore.fetchTablesByTime(filter.date, filter.time);
};

const selectTable = (table: Table) => {
  // Chỉ cho chọn nếu bàn còn trống (AVAILABLE)
  if (table.status === 'AVAILABLE') selectedTable.value = table;
};

const handleBooking = async (data: any) => {
  await reservationStore.createReservation({ ...data, tableId: selectedTable.value?.id });
  alert('Đặt bàn thành công!');
  showForm.value = false;
  loadTables(); // Reload lại bàn để cập nhật trạng thái
};

onMounted(() => loadTables());
</script>

<style scoped>
.reservation-page { padding: 20px; display: flex; justify-content: center; }
.main-card { background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); width: 100%; max-width: 1000px; position: relative; }
.header { text-align: center; margin-bottom: 30px; }
.header h2 { color: #a67c52; font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; margin-bottom: 5px; }

.filters { display: flex; gap: 20px; background: #fdfbf7; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #eee; }
.filter-item { flex: 1; display: flex; flex-direction: column; }
.filter-item label { font-size: 0.8rem; font-weight: 700; color: #555; margin-bottom: 8px; text-transform: uppercase; }
.filter-item input, .filter-item select { padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 1rem; }

/* Grid tự động điều chỉnh cho 20 bàn */
.grid-tables { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); 
  gap: 15px; 
}

.table-box { 
  border: 2px solid #eee; border-radius: 12px; padding: 15px; height: 110px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s; position: relative; 
}
.table-box.available:hover { border-color: #a67c52; transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
.table-box.selected { border-color: #2ecc71; background: #f0fff4; transform: scale(1.05); z-index: 10; }
.table-box.reserved { opacity: 0.5; background: #fff5f5; border-color: #feb2b2; cursor: not-allowed; }
.table-box.maintenance { background: #f3f4f6; cursor: not-allowed; color: #999; }

/* Style riêng cho loại bàn VIP (tùy chọn) */
.table-box.vip { background: linear-gradient(135deg, #fff 0%, #fffbf0 100%); border-style: double; }

.table-icon { font-size: 1.5rem; margin-bottom: 5px; opacity: 0.8; }
.table-box.selected .table-icon { transform: scale(1.2); transition: 0.2s; }

.legend { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; font-size: 0.9rem; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.dot.available { border: 2px solid #2ecc71; background: #fff; }
.dot.selected { background: #2ecc71; }
.dot.reserved { background: #e74c3c; opacity: 0.5; }
.dot.maintenance { background: #95a5a6; }

.footer-action { 
  position: sticky; bottom: 20px; margin-top: -30px; margin-left: auto; margin-right: auto;
  background: #1a1a1a; color: #fff; padding: 10px 25px; border-radius: 50px;
  display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: fit-content; z-index: 100;
}
.btn-continue { background: #a67c52; color: #fff; border: none; padding: 8px 20px; border-radius: 20px; font-weight: 700; cursor: pointer; }
.slide-up-enter-active { animation: slideUp 0.3s; }
@keyframes slideUp { from { transform: translate(0, 20px); opacity: 0; } to { transform: translate(0, 0); opacity: 1; } }
</style>