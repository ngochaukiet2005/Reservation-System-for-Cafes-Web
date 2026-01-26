<template>
  <div class="reservation-page">
    
    <div v-if="showMinuteDropdown" class="click-overlay" @click="showMinuteDropdown = false"></div>

    <div class="main-card">
      <div class="header">
        <h2>📅 Đặt Bàn Trực Tuyến</h2>
        <p>Chọn thời gian để xem tình trạng bàn</p>
      </div>

      <div class="filters">
        <div class="filter-item">
          <label>Ngày đặt</label>
          <input type="date" v-model="filter.date" :min="today" @change="handleDateChange">
        </div>

        <div class="filter-item">
          <label>Giờ đến</label>
          <div class="time-group">
             <select v-model="filter.hour" @change="handleHourChange">
                <option v-for="h in availableHours" :key="h" :value="h">
                    {{ h.toString().padStart(2, '0') }} giờ
                </option>
             </select>
             
             <span class="colon">:</span>
             
             <div class="custom-minute-select">
                <div class="cms-trigger" @click="toggleMinuteDropdown">
                    <span>{{ filter.minute.toString().padStart(2, '0') }}</span>
                    <span class="chevron" :class="{ rotate: showMinuteDropdown }">▼</span>
                </div>
                
                <transition name="fade-slide">
                    <div v-if="showMinuteDropdown" class="cms-dropdown">
                        <div 
                            v-for="m in availableMinutes" 
                            :key="m" 
                            class="cms-item" 
                            :class="{ active: m === filter.minute }"
                            @click="selectMinute(m)"
                        >
                            {{ m.toString().padStart(2, '0') }}
                        </div>
                        <div v-if="availableMinutes.length === 0" class="cms-empty">
                            Hết giờ
                        </div>
                    </div>
                </transition>
             </div>

          </div>
        </div>

        <div class="filter-item">
          <label>Số người</label>
          <select v-model="filter.people">
            <option :value="2">1-2 người</option>
            <option :value="4">3-4 người</option>
            <option :value="6">5+ người</option>
          </select>
        </div>
        
        <div class="filter-item action-col">
          <button class="btn-primary-action" @click="suggestTable">
             CHỌN NHANH
          </button>
        </div>
      </div>

      <div class="map-area">
        <div class="legend">
          <span><i class="dot available"></i> Trống</span>
          <span><i class="dot selected"></i> Đang chọn</span>
          <span><i class="dot pending"></i> Chờ duyệt</span>
          <span><i class="dot reserved"></i> Đã đặt</span>
          <span><i class="dot occupied"></i> Có khách</span>
          <span><i class="dot maintenance"></i> Bảo trì</span>
        </div>

        <div v-if="reservationStore.isLoading" class="loading">Đang cập nhật sơ đồ...</div>
        
        <div v-else class="map-wrapper-customer">
          <TableMap 
            :tables="reservationStore.tables" 
            mode="customer"
            :selected-id="selectedTable?.id"
            @click-table="selectTable"
          />
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
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { reservationStore, type Table } from '../../store/reservationStore';
import ReservationForm from '../../components/reservations/ReservationForm.vue';
import TableMap from '../../components/map/TableMap.vue';
import { getSocket } from '../../realtime/socket';
import { tableApi } from '../../api/tableApi';

const router = useRouter();
const today = new Date().toISOString().split('T')[0];
const showForm = ref(false);
const showSuccessModal = ref(false);
const selectedTable = ref<Table | null>(null);

const showMinuteDropdown = ref(false);

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;

const filter = reactive({
  date: today,
  hour: new Date().getHours(),
  minute: new Date().getMinutes(),
  people: 2
});

const currentSystemTime = reactive({
    hour: new Date().getHours(),
    minute: new Date().getMinutes()
});

let customerSocket: any = null;
let customerPollId: any = null;

setInterval(() => {
    const now = new Date();
    currentSystemTime.hour = now.getHours();
    currentSystemTime.minute = now.getMinutes();
}, 60000);

const availableHours = computed(() => {
  const hours = [];
  const isToday = filter.date === today;
  let start = isToday ? Math.max(currentSystemTime.hour, OPEN_HOUR) : OPEN_HOUR;

  for (let h = start; h <= CLOSE_HOUR; h++) {
    hours.push(h);
  }
  return hours;
});

const availableMinutes = computed(() => {
    const minutes = [];
    const isToday = filter.date === today;
    const isCurrentHour = isToday && (filter.hour === currentSystemTime.hour);
    let startMinute = isCurrentHour ? currentSystemTime.minute : 0;

    for (let m = startMinute; m < 60; m++) {
        minutes.push(m);
    }
    return minutes;
});

const formatTimeDisplay = computed(() => {
    return `${filter.hour.toString().padStart(2,'0')}:${filter.minute.toString().padStart(2,'0')}`;
});

const toggleMinuteDropdown = () => {
    showMinuteDropdown.value = !showMinuteDropdown.value;
};

const selectMinute = (m: number) => {
    filter.minute = m;
    showMinuteDropdown.value = false;
    loadTables();
};

const handleDateChange = () => {
  if (availableHours.value.length > 0) {
      filter.hour = availableHours.value[0];
      handleHourChange();
  } else {
      loadTables();
  }
};

const handleHourChange = () => {
    const validMinutes = availableMinutes.value;
    if (validMinutes.length > 0 && !validMinutes.includes(filter.minute)) {
        filter.minute = validMinutes[0];
    }
    loadTables();
};

const loadTables = async () => {
  selectedTable.value = null;
  try {
    // Gọi API lọc bàn trống theo ngày, giờ, sức chứa
    const availableTables = await tableApi.getAvailableTables({
      date: filter.date,
      start_time: formatTimeDisplay.value,
      end_time: calculateEndTime(formatTimeDisplay.value),
      capacity: filter.people
    });
    
    // Cập nhật bàn từ kết quả lọc
    reservationStore.tables = availableTables.map((table: any) => ({
      ...table,
      status: 'AVAILABLE'
    }));
  } catch (error) {
    console.error('Lỗi khi lọc bàn:', error);
    alert('Không thể tải danh sách bàn. Vui lòng thử lại.');
  }
};

const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(hours + 1, minutes, 0, 0);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
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

const confirmAndGoToHistory = () => {
  showSuccessModal.value = false;
  setTimeout(() => { router.push('/history'); }, 300);
};

watch(availableHours, (newVal) => {
    if (newVal.length > 0 && !newVal.includes(filter.hour)) {
        filter.hour = newVal[0];
        handleHourChange();
    }
});

onMounted(() => {
    const now = new Date();
    if (now.getHours() >= CLOSE_HOUR) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter.date = tomorrow.toISOString().split('T')[0];
        filter.hour = OPEN_HOUR;
        filter.minute = 0;
    } else {
        if (filter.minute < now.getMinutes()) {
            filter.minute = now.getMinutes();
        }
    }
    loadTables();
  if (!customerPollId) {
    customerPollId = setInterval(() => {
      loadTables();
    }, 15000);
  }
  if (!customerSocket) {
    customerSocket = getSocket();
    const refresh = () => loadTables();
    customerSocket.on('reservation.created', refresh);
    customerSocket.on('reservation.updated', refresh);
    customerSocket.on('reservation.cancelled', refresh);
  }
});

onUnmounted(() => {
    if (customerPollId) {
        clearInterval(customerPollId);
        customerPollId = null;
    }
  if (customerSocket) {
    customerSocket.off('reservation.created');
    customerSocket.off('reservation.updated');
    customerSocket.off('reservation.cancelled');
    customerSocket = null;
  }
});
</script>

<style scoped>
/* Base Styles */
.reservation-page { padding: 20px; display: flex; justify-content: center; padding-bottom: 100px; }

/* FIX: Tăng z-index main-card lên 10 để nằm trên overlay (z-index 5) */
.main-card { 
    background: #fff; padding: 40px; border-radius: 20px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.05); width: 100%; max-width: 900px; 
    position: relative; 
    z-index: 10; 
}
.header { text-align: center; margin-bottom: 30px; }
.header h2 { color: #a67c52; font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; margin-bottom: 5px; }

/* Filters */
.filters { display: flex; gap: 20px; background: #fdfbf7; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #eee; align-items: flex-end; }
.filter-item { flex: 1; display: flex; flex-direction: column; }
.filter-item.action-col { justify-content: flex-end; flex: 0.8; }
.filter-item label { font-size: 0.8rem; font-weight: 700; color: #555; margin-bottom: 8px; text-transform: uppercase; }

/* Inputs styling */
.filter-item input, .filter-item select { 
    padding: 10px 15px; 
    border: 1px solid #ddd; 
    border-radius: 8px; 
    font-family: inherit; 
    font-size: 0.95rem; 
    outline: none; 
    background: #fff; 
    height: 42px; 
    width: 100%; 
    box-sizing: border-box; 
}
.filter-item input:focus, .filter-item select:focus { border-color: #a67c52; }

.time-group { display: flex; align-items: center; gap: 8px; }
.time-group select { flex: 1; }
.colon { font-weight: bold; }

/* --- CUSTOM MINUTE SELECT CSS --- */
.custom-minute-select {
    position: relative;
    width: 90px;
    height: 42px;
}
.cms-trigger {
    height: 100%;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
}
.cms-trigger:hover { border-color: #a67c52; }
.chevron { font-size: 0.7rem; color: #888; transition: transform 0.2s; }
.chevron.rotate { transform: rotate(180deg); }

.cms-dropdown {
    position: absolute;
    top: 105%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    z-index: 100;
    max-height: 180px; 
    overflow-y: auto;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
.cms-item { padding: 10px; text-align: center; cursor: pointer; transition: 0.1s; font-size: 0.9rem; border-bottom: 1px solid #f9f9f9; }
.cms-item:hover { background: #f5f5f5; color: #a67c52; }
.cms-item.active { background: #e3f2fd; color: #1565c0; font-weight: bold; }
.cms-empty { padding: 10px; text-align: center; color: #888; font-size: 0.8rem; }
.cms-dropdown::-webkit-scrollbar { width: 6px; }
.cms-dropdown::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
.cms-dropdown::-webkit-scrollbar-track { background: #f1f1f1; }

/* FIX: Overlay giảm z-index xuống 5 */
.click-overlay { position: fixed; inset: 0; z-index: 5; cursor: default; }

/* Buttons */
.btn-primary-action { height: 42px; width: 100%; background: #2c3e50; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
.btn-primary-action:hover { background: #34495e; transform: translateY(-1px); }

/* UPDATE: LEGEND ĐỒNG BỘ */
.legend { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; font-size: 0.9rem; flex-wrap: wrap; }
.dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 5px; border: 1px solid rgba(0,0,0,0.1); }

.dot.available { background: #20c997; } /* Teal */
.dot.selected { background: #2ecc71; border: 2px solid #2ecc71; box-shadow: 0 0 0 2px #e8f5e9; } /* Green Selected */
.dot.pending { background: #7950f2; }   /* Purple */
.dot.reserved { background: #fab005; }  /* Yellow */
.dot.occupied { background: #fa5252; }  /* Red */
.dot.maintenance { background: #868e96; } /* Grey */

.map-wrapper-customer { margin-top: 10px; }

/* Modals & Animations */
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
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>