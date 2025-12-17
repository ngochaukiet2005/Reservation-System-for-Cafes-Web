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

      <transition name="slide-up">
        <div v-if="selectedTable" class="footer-action">
          <div class="selection-info">
            Bạn chọn: <strong>{{ selectedTable.name }}</strong> <br>
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
import { ref, reactive, onMounted } from 'vue';
import { reservationStore, type Table } from '../../store/reservationStore';
import ReservationForm from '../../components/reservations/ReservationForm.vue';

const today = new Date().toISOString().split('T')[0];
const showForm = ref(false);
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

const handleBooking = async (data: any) => {
  await reservationStore.createReservation({ ...data, tableId: selectedTable.value?.id });
  alert('Đặt bàn thành công!');
  showForm.value = false;
  loadTables(); // Reload lại bàn
};

onMounted(() => loadTables());
</script>

<style scoped>
.reservation-page { padding: 20px; display: flex; justify-content: center; }
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
.table-box { 
  border: 2px solid #eee; border-radius: 12px; padding: 20px; 
  display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: 0.2s; 
}
.table-box.available:hover { border-color: #a67c52; transform: translateY(-3px); }
.table-box.selected { border-color: #2ecc71; background: #f0fff4; }
.table-box.reserved { opacity: 0.5; background: #fff5f5; border-color: #feb2b2; cursor: not-allowed; }
.table-box.maintenance { background: #f3f4f6; cursor: not-allowed; }

.table-icon { width: 40px; height: 40px; background: #eee; border-radius: 8px; margin-bottom: 10px; opacity: 0.5; }
.table-box.selected .table-icon { background: #2ecc71; opacity: 1; }

.footer-action { 
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 50px;
  display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.btn-continue { background: #a67c52; color: #fff; border: none; padding: 8px 20px; border-radius: 20px; font-weight: 700; cursor: pointer; }
.slide-up-enter-active { animation: slideUp 0.3s; }
@keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
</style>