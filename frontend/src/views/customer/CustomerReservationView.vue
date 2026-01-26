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
             <input 
               type="text" 
               readonly 
               :value="formatTimeDisplay"
               @click="toggleMinuteDropdown"
               class="time-display-input"
               placeholder="HH:mm"
             />
             
             <transition name="fade-slide">
               <div v-if="showMinuteDropdown" class="time-picker-dropdown">
                 <!-- Hour Selector -->
                 <div class="time-section">
                   <label class="time-label">Giờ</label>
                   <div class="time-scroll">
                     <div 
                       v-for="h in availableHours" 
                       :key="h" 
                       class="time-option" 
                       :class="{ active: h === filter.hour }"
                       @click="selectHour(h)"
                     >
                       {{ h.toString().padStart(2, '0') }}
                     </div>
                   </div>
                 </div>
                 
                 <div class="time-divider">:</div>
                 
                 <!-- Minute Selector -->
                 <div class="time-section">
                   <label class="time-label">Phút</label>
                   <div class="time-scroll">
                     <div 
                       v-for="m in availableMinutes" 
                       :key="m" 
                       class="time-option" 
                       :class="{ active: m === filter.minute }"
                       @click="selectMinute(m)"
                     >
                       {{ m.toString().padStart(2, '0') }}
                     </div>
                     <div v-if="availableMinutes.length === 0" class="time-empty">
                       Hết giờ
                     </div>
                   </div>
                 </div>
               </div>
             </transition>
          </div>
        </div>

        <div class="filter-item">
          <label>Số người</label>
          <select v-model="filter.people">
            <option :value="0">Không có (Hiển thị tất cả)</option>
            <option :value="2">1-2 người</option>
            <option :value="4">3-4 người</option>
            <option :value="6">5+ người</option>
          </select>
        </div>
        
        <div class="filter-item action-col">
          <button class="btn-search" @click="loadTables(true)" :disabled="isSearching">
            <span v-if="!isSearching">🔍 TÌM KIẾM</span>
            <span v-else>⏳ Đang tìm...</span>
          </button>
          <button class="btn-quick-select" @click="suggestTableAfterSearch" :disabled="reservationStore.tables.length === 0 || isSearching">
             ⚡ CHỌN NHANH
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
const isSearching = ref(false);
const showMinuteDropdown = ref(false);

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;

const filter = reactive({
  date: today,
  hour: new Date().getHours(),
  minute: new Date().getMinutes(),
  people: 0
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

const selectHour = (h: number) => {
    filter.hour = h;
    // Kiểm tra minute có hợp lệ không sau khi đổi giờ
    const validMinutes = availableMinutes.value;
    if (validMinutes.length > 0 && !validMinutes.includes(filter.minute)) {
        filter.minute = validMinutes[0];
    }
};

const selectMinute = (m: number) => {
    filter.minute = m;
    showMinuteDropdown.value = false;
};

const suggestTableAfterSearch = () => {
  let bestTable;
  
  if (filter.people === 0) {
    // Không lọc - chọn bàn AVAILABLE đầu tiên
    bestTable = reservationStore.tables.find(t => t.status === 'AVAILABLE');
  } else {
    // Lọc theo capacity - chọn bàn phù hợp nhỏ nhất
    bestTable = reservationStore.tables.find(t => 
      t.status === 'AVAILABLE' && t.capacity >= filter.people
    );
  }
  
  if (bestTable) {
    selectedTable.value = bestTable;
  } else {
    alert("Không tìm thấy bàn phù hợp. Vui lòng tìm kiếm lại.");
  }
};

const handleDateChange = () => {
  if (availableHours.value.length > 0) {
      filter.hour = availableHours.value[0];
      handleHourChange();
  }
};

const handleHourChange = () => {
    const validMinutes = availableMinutes.value;
    if (validMinutes.length > 0 && !validMinutes.includes(filter.minute)) {
        filter.minute = validMinutes[0];
    }
};

const loadTables = async (manualTrigger = false) => {
  // Chỉ reset selectedTable nếu user trigger manual (click TÌM KIẾM)
  if (manualTrigger) {
    selectedTable.value = null;
  }
  
  isSearching.value = manualTrigger; // Chỉ show loading khi manual
  
  try {
    // Luôn lấy TẤT CẢ bàn với status thực tế từ backend (không chỉ AVAILABLE)
    const allTables = await reservationStore.fetchTables();
    
    // Filter client-side theo ngày, giờ và sức chứa
    if (filter.people === 0) {
      // Hiển thị TẤT CẢ các bàn (không lọc theo capacity)
      // Nhưng vẫn lọc theo status: chỉ show AVAILABLE, PENDING, RESERVED
      // Lý do: PENDING = chờ duyệt (khách hàng cần thấy), RESERVED = đã đặt (khách hàng cần thấy)
      reservationStore.tables = allTables.filter((table: any) => 
        ['AVAILABLE', 'PENDING', 'RESERVED'].includes(table.status)
      );
    } else {
      // Lọc bàn theo sức chứa và status
      let filteredTables = allTables.filter((table: any) => 
        ['AVAILABLE', 'PENDING', 'RESERVED'].includes(table.status)
      );
      
      if (filter.people === 2) {
        // 1-2 người: chỉ lấy bàn capacity 1-2
        filteredTables = filteredTables.filter((table: any) => table.capacity >= 1 && table.capacity <= 2);
      } else if (filter.people === 4) {
        // 3-4 người: chỉ lấy bàn capacity 3-4
        filteredTables = filteredTables.filter((table: any) => table.capacity >= 3 && table.capacity <= 4);
      } else if (filter.people === 6) {
        // 5+ người: chỉ lấy bàn capacity >= 5
        filteredTables = filteredTables.filter((table: any) => table.capacity >= 5);
      }
      
      reservationStore.tables = filteredTables;
    }
    
    if (reservationStore.tables.length === 0) {
      alert('Không tìm thấy bàn trong thời gian này. Vui lòng chọn thời gian khác.');
    }
    
    // Validate selectedTable sau khi load - nếu bàn đã chọn không còn available thì clear
    if (selectedTable.value && !manualTrigger) {
      const stillValid = reservationStore.tables.find(
        (t: any) => t.id === selectedTable.value?.id && t.status === 'AVAILABLE'
      );
      if (!stillValid) {
        selectedTable.value = null;
      }
    }
  } catch (error) {
    console.error('Lỗi khi lọc bàn:', error);
    alert('Không thể tải danh sách bàn. Vui lòng thử lại.');
  } finally {
    isSearching.value = false;
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

const suggestTable = suggestTableAfterSearch;

const handleBooking = async (formData: any) => {
  try {
    // Validate selectedTable
    if (!selectedTable.value || !selectedTable.value.id) {
      alert('Vui lòng chọn bàn trước khi đặt chỗ!');
      return;
    }

    await reservationStore.createReservation({
      ...formData,
      reservation_time: `${filter.date}T${formatTimeDisplay.value}`,
      people: filter.people || 2,
      tableId: selectedTable.value.id,
      tableName: selectedTable.value.name,
      isAdmin: false 
    });
    showForm.value = false;
    setTimeout(() => { showSuccessModal.value = true; }, 300);
  } catch (error) {
    console.error('Error booking:', error);
    alert('Lỗi kết nối hoặc thông tin không hợp lệ. Vui lòng thử lại.');
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
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour >= CLOSE_HOUR) {
        // Sau giờ đóng cửa - chuyển sang ngày mai
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter.date = tomorrow.toISOString().split('T')[0];
        filter.hour = OPEN_HOUR;
        filter.minute = 0;
    } else if (currentHour < OPEN_HOUR) {
        // Trước giờ mở cửa - set giờ mở cửa
        filter.hour = OPEN_HOUR;
        filter.minute = 0;
    } else {
        // Trong giờ hoạt động - set giờ hiện tại
        filter.hour = currentHour;
        filter.minute = currentMinute;
    }
    
    // Load bàn ngay lập tức khi mount
    loadTables(true);
    
    // Cập nhật real-time theo định kỳ (30 giây) - chỉ khi không đang điền form
    if (!customerPollId) {
      customerPollId = setInterval(() => {
        if (!showForm.value) {
          loadTables(false); // Background refresh, không reset selected
        }
      }, 30000);
    }
    
    // Listen socket events - chỉ refresh khi không đang điền form
<<<<<<< HEAD
    // Luôn setup lại listeners mỗi lần mount để đảm bảo nhận events
    customerSocket = getSocket();
    const refresh = () => {
      if (!showForm.value) {
        loadTables(false); // Background refresh
      }
    };
    customerSocket.on('reservation.created', refresh);
    customerSocket.on('reservation.updated', refresh);
    customerSocket.on('reservation.cancelled', refresh);
=======
    if (!customerSocket) {
      customerSocket = getSocket();
      const refresh = () => {
        if (!showForm.value) {
          loadTables(false); // Background refresh
        }
      };
      customerSocket.on('reservation.created', refresh);
      customerSocket.on('reservation.updated', refresh);
      customerSocket.on('reservation.cancelled', refresh);
      
      // Listen table.updated để cập nhật trạng thái bàn real-time
      customerSocket.on('table.updated', (updatedTable: any) => {
        console.log('[CustomerReservation] Table updated:', updatedTable);
        if (updatedTable && updatedTable.id) {
          const index = reservationStore.tables.findIndex((t: any) => t.id === updatedTable.id);
          if (index !== -1) {
            // Cập nhật table trong danh sách
            reservationStore.tables[index] = {
              id: updatedTable.id,
              name: updatedTable.name,
              capacity: updatedTable.capacity,
              status: updatedTable.status?.name || 'AVAILABLE',
            };
            console.log(`[CustomerReservation] Updated table ${updatedTable.id} to status ${updatedTable.status?.name}`);
          }
        }
      });
    }
>>>>>>> f473ebfa99a075f4360f2668165ead0180386442
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
    customerSocket.off('table.updated');
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
.filter-item.action-col { justify-content: flex-end; flex: 2; display: flex; gap: 10px; align-items: flex-end; }
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

.time-group { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  position: relative;
  width: 100%;
}

/* Time Display Input */
.time-display-input {
  width: 100%;
  height: 42px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
}
.time-display-input:hover { border-color: #a67c52; }
.time-display-input:focus { border-color: #a67c52; outline: none; }

/* Time Picker Dropdown */
.time-picker-dropdown {
  position: absolute;
  top: 110%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  gap: 0;
  overflow: hidden;
}

.time-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.time-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #666;
  text-align: center;
  padding: 10px;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-scroll {
  max-height: 200px;
  overflow-y: auto;
  padding: 5px 0;
}

.time-option {
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
}

.time-option:hover {
  background: #f0f7ff;
  color: #a67c52;
}

.time-option.active {
  background: #a67c52;
  color: white;
  font-weight: 700;
}

.time-divider {
  width: 1px;
  background: #ddd;
  align-self: stretch;
  margin: 10px 0;
}

.time-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
}

.time-scroll::-webkit-scrollbar { width: 5px; }
.time-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
.time-scroll::-webkit-scrollbar-track { background: #f8f8f8; }

/* FIX: Overlay giảm z-index xuống 5 */
.click-overlay { position: fixed; inset: 0; z-index: 5; cursor: default; }

/* Buttons */
.btn-search { 
  height: 42px; 
  flex: 1;
  background: #a67c52; 
  color: white; 
  border: none; 
  border-radius: 6px; 
  font-weight: 700; 
  cursor: pointer; 
  transition: 0.2s; 
  text-transform: uppercase; 
  letter-spacing: 0.5px; 
}
.btn-search:hover:not(:disabled) { background: #c59d70; transform: translateY(-1px); }
.btn-search:disabled { background: #ccc; cursor: not-allowed; opacity: 0.6; }

.btn-quick-select { 
  height: 42px; 
  flex: 0.8;
  background: #2c3e50; 
  color: white; 
  border: none; 
  border-radius: 6px; 
  font-weight: 700; 
  cursor: pointer; 
  transition: 0.2s; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
  margin-left: 10px;
}
.btn-quick-select:hover:not(:disabled) { background: #34495e; transform: translateY(-1px); }
.btn-quick-select:disabled { background: #ccc; cursor: not-allowed; opacity: 0.6; }

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