<template>
  <div class="reservation-page">
    <div class="main-card">
      <div class="header">
        <h2>📅 Đặt Bàn Trực Tuyến</h2>
        <p>Chọn thời gian để xem tình trạng bàn</p>
      </div>

      <div class="filters">
        <div class="filter-item">
          <label class="text-center">Ngày đặt</label>
          <input type="date" v-model="filter.date" :min="today" @change="handleDateChange">
        </div>

        <div class="filter-item">
          <label class="text-center">Giờ đến</label>
          <div class="time-group">
             <select v-model="filter.hour" @change="loadTables">
                <option v-for="h in availableHours" :key="h" :value="h">
                    {{ h.toString().padStart(2, '0') }} giờ
                </option>
             </select>
             <span class="colon">:</span>
             <select v-model="filter.minute" @change="loadTables">
                <option v-for="m in 60" :key="m-1" :value="m-1">
                    {{ (m-1).toString().padStart(2, '0') }}
                </option>
             </select>
          </div>
        </div>

        <div class="filter-item">
          <label class="text-center">Số người</label>
          <select v-model="filter.people">
            <option :value="2">1-2 người</option>
            <option :value="4">3-4 người</option>
            <option :value="6">5+ người</option>
          </select>
        </div>
        
        <div class="filter-item action-col">
          <button class="btn-suggest" @click="suggestTable">
             ✨ Chọn nhanh
          </button>
        </div>
      </div>

      <div class="map-area">
        <div class="legend">
          <span><i class="dot available"></i> Trống</span>
          <span><i class="dot selected"></i> Đang chọn</span>
          <span><i class="dot pending"></i> Chờ duyệt</span>
          <span><i class="dot reserved"></i> Đã đặt</span>
          <span><i class="dot occupied"></i> Đang có khách</span>
        </div>

        <div v-if="reservationStore.isLoading" class="loading">Đang cập nhật sơ đồ...</div>
        
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
            <div class="status-label" v-if="table.status !== 'AVAILABLE'">
                {{ getStatusText(table.status) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="slide-up">
      <div v-if="selectedTable" class="footer-action-fixed">
        <div class="selection-info">
          Bạn đang chọn: <strong>{{ selectedTable.name }}</strong> <br>
          <small>{{ formatTimeDisplay }} - {{ filter.date }}</small>
        </div>
        <button class="btn-continue" @click="showForm = true">Điền Thông Tin ➝</button>
      </div>
    </transition>

    <ReservationForm 
      v-if="showForm" 
      :isVisible="showForm"
      :selectedTable="selectedTable"
      :initialData="{ ...filter, time: formatTimeDisplay }"
      @submit="handleBooking"
      @close="showForm = false"
    />

    <transition name="fade">
      <div v-if="showSuccessModal" class="success-overlay">
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h3>Gửi Yêu Cầu Thành Công!</h3>
          <p>Yêu cầu đặt bàn của bạn đang chờ nhân viên xác nhận.</p>
          <div class="success-actions">
            <button class="btn-primary" @click="confirmAndGoToHistory">Xem lịch sử</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { reservationStore, type Table } from '../../store/reservationStore';
import ReservationForm from '../../components/reservations/ReservationForm.vue';

const router = useRouter();
const today = new Date().toISOString().split('T')[0];

const showForm = ref(false);
const showSuccessModal = ref(false);
const selectedTable = ref<Table | null>(null);

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;

const filter = reactive({
  date: today,
  hour: new Date().getHours() + 1, 
  minute: 0,
  people: 2
});

const availableHours = computed(() => {
  const hours = [];
  const now = new Date();
  const currentHour = now.getHours();
  const isToday = filter.date === today;
  let start = isToday ? Math.max(currentHour, OPEN_HOUR) : OPEN_HOUR;

  for (let h = start; h <= CLOSE_HOUR; h++) {
    hours.push(h);
  }
  return hours;
});

const formatTimeDisplay = computed(() => {
    return `${filter.hour.toString().padStart(2,'0')}:${filter.minute.toString().padStart(2,'0')}`;
});

const handleDateChange = () => {
  if (availableHours.value.length > 0) filter.hour = availableHours.value[0];
  loadTables();
};

const loadTables = async () => {
  selectedTable.value = null;
  await reservationStore.fetchTablesByTime(filter.date, formatTimeDisplay.value);
};

const selectTable = (table: Table) => {
  if (table.status === 'AVAILABLE') selectedTable.value = table;
};

const suggestTable = () => {
  if (reservationStore.tables.length === 0) return;
  const bestTable = reservationStore.tables.find(t => 
    t.status === 'AVAILABLE' && t.capacity >= filter.people
  );
  if (bestTable) selectedTable.value = bestTable;
  else alert("Không tìm thấy bàn phù hợp.");
};

const handleBooking = async (formData: any) => {
  try {
    await reservationStore.createReservation({
      ...formData,
      reservation_time: `${filter.date}T${formatTimeDisplay.value}`,
      people: filter.people,
      tableId: selectedTable.value?.id,
      tableName: selectedTable.value?.name,
      isAdmin: false 
    });
    showForm.value = false;
    setTimeout(() => { showSuccessModal.value = true; }, 300);
  } catch (error) {
    alert('Lỗi kết nối');
  }
};

const getStatusText = (status: string) => {
    if (status === 'PENDING') return 'Đợi duyệt';
    if (status === 'RESERVED') return 'Đã đặt';
    if (status === 'OCCUPIED') return 'Có khách';
    return '';
};

const confirmAndGoToHistory = () => {
  showSuccessModal.value = false;
  setTimeout(() => { router.push('/history'); }, 300);
};

watch(availableHours, (newVal) => {
    if (!newVal.includes(filter.hour)) filter.hour = newVal[0] || OPEN_HOUR;
});

onMounted(() => {
    const now = new Date();
    if (now.getHours() >= CLOSE_HOUR) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter.date = tomorrow.toISOString().split('T')[0];
        filter.hour = OPEN_HOUR;
    }
    loadTables();
});
</script>

<style scoped>
.reservation-page { padding: 20px; display: flex; justify-content: center; padding-bottom: 100px; }
.main-card { background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); width: 100%; max-width: 900px; position: relative; }
.header { text-align: center; margin-bottom: 30px; }
.header h2 { color: #a67c52; font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; margin-bottom: 5px; }

/* Filter Styles Update */
.filters { display: flex; gap: 20px; background: #fdfbf7; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #eee; align-items: flex-end; }
.filter-item { flex: 1; display: flex; flex-direction: column; }
.filter-item.action-col { justify-content: flex-end; flex: 0.8; }

.text-center { text-align: center; width: 100%; display: block; }

.filter-item label { font-size: 0.8rem; font-weight: 700; color: #555; margin-bottom: 8px; text-transform: uppercase; }
.filter-item input, .filter-item select { padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; }

.time-group { display: flex; align-items: center; gap: 5px; }
.time-group select { flex: 1; }
.colon { font-weight: bold; }

.btn-suggest { height: 42px; width: 100%; background: #2ecc71; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-suggest:hover { background: #27ae60; transform: translateY(-1px); }

.legend { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; font-size: 0.9rem; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.dot.available { border: 2px solid #2ecc71; background: #fff; }
.dot.selected { background: #2ecc71; }
.dot.pending { background: #f1c40f; }
.dot.reserved { background: #e74c3c; opacity: 0.5; }
.dot.occupied { background: #8e44ad; }

.grid-tables { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 20px; }
.table-box { border: 2px solid #eee; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: 0.2s; position: relative; min-height: 100px; }
.table-box.available:hover { border-color: #a67c52; transform: translateY(-3px); }
.table-box.selected { border-color: #2ecc71; background: #f0fff4; }

.table-box.pending { background: #fffcf2; border-color: #fceabb; cursor: not-allowed; opacity: 0.8; }
.table-box.reserved { background: #fff5f5; border-color: #feb2b2; cursor: not-allowed; opacity: 0.7; }
.table-box.occupied { background: #f3e5f5; border-color: #e1bee7; cursor: not-allowed; }
.table-box.maintenance { background: #f3f4f6; cursor: not-allowed; opacity: 0.5; }
.status-label { position: absolute; bottom: 10px; font-size: 0.75rem; font-weight: 700; color: #555; background: rgba(255,255,255,0.8); padding: 2px 5px; border-radius: 4px; }

.table-icon { width: 40px; height: 40px; background: #eee; border-radius: 8px; margin-bottom: 10px; opacity: 0.5; }
.table-box.selected .table-icon { background: #2ecc71; opacity: 1; }

.footer-action-fixed { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 1000; background: #1a1a1a; color: #fff; padding: 12px 30px; border-radius: 50px; display: flex; align-items: center; gap: 30px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); min-width: 350px; justify-content: space-between; }
.selection-info strong { color: #2ecc71; }
.selection-info small { color: #bbb; display: block; }
.btn-continue { background: #a67c52; color: #fff; border: none; padding: 10px 25px; border-radius: 25px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-continue:hover { background: #c59d70; transform: scale(1.05); }

.success-overlay { position: fixed; inset: 0; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(5px); z-index: 3000; display: flex; justify-content: center; align-items: center; }
.success-box { background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; border: 1px solid #eee; animation: popIn 0.4s; }
.success-icon { width: 70px; height: 70px; background: #2ecc71; color: #fff; border-radius: 50%; font-size: 35px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
.success-box h3 { color: #2ecc71; margin: 0 0 10px; }
.success-box p { color: #666; margin-bottom: 30px; }
.btn-primary { background: #1a1a1a; color: #fff; padding: 12px 40px; border-radius: 30px; border: none; font-weight: 600; cursor: pointer; }

@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.slide-up-enter-active { animation: slideUp 0.3s; }
@keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
</style>