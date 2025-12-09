<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import reservationApi, { type Reservation } from '@/api/reservationApi';
import tableApi, { type Table } from '@/api/tableApi';
import ReservationList from '@/components/reservations/ReservationList.vue';
import ReservationForm from '@/components/reservations/ReservationForm.vue'; // Import mới

// State
const tables = ref<Table[]>([]);
const reservations = ref<Reservation[]>([]);
const loading = ref(false);

// State cho Modal Đặt Bàn
const showCreateModal = ref(false);
const selectedTableForBooking = ref<Table | null>(null);

// ... Giữ nguyên hàm fetchData và các computed ...
const fetchData = async () => { /* Code cũ */ };
const pendingReservations = computed(() => /* Code cũ */);
const activeReservations = computed(() => /* Code cũ */);

// --- LOGIC MỚI: Xử lý click vào bàn ---
const handleTableClick = (table: Table) => {
  if (table.status === 'AVAILABLE') {
    // Nếu bàn trống -> Mở form đặt bàn
    selectedTableForBooking.value = table;
    showCreateModal.value = true;
  } else if (table.status === 'OCCUPIED' || table.status === 'RESERVED') {
    // Nếu bàn đang có khách -> Có thể hiện chi tiết đơn (tính năng mở rộng sau này)
    alert(`Bàn ${table.name} đang bận. Vui lòng chọn bàn khác!`);
  } else {
    alert("Bàn này đang bảo trì!");
  }
};

// --- LOGIC MỚI: Xử lý khi submit form ---
const handleCreateReservation = async (formData: any) => {
  try {
    loading.value = true;
    showCreateModal.value = false; // Đóng modal trước

    // 1. Gọi API tạo đặt bàn
    const res = await reservationApi.createReservation(formData);
    
    // 2. Cập nhật dữ liệu giả lập ở Frontend (Optimistic UI)
    // Thêm vào danh sách đặt bàn
    reservations.value.push(res.data);
    
    // Đổi trạng thái bàn sang RESERVED ngay lập tức
    const tableIndex = tables.value.findIndex(t => t.id === formData.table_id);
    if (tableIndex !== -1) {
      tables.value[tableIndex].status = 'RESERVED';
    }

    alert("Đặt bàn thành công!");
  } catch (e) {
    alert("Lỗi khi tạo đặt bàn");
  } finally {
    loading.value = false;
  }
};

// Helper màu bàn (Cập nhật để nhìn rõ hơn)
const getTableColor = (status: string) => {
  switch(status) {
    case 'AVAILABLE': 
      return 'bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100 shadow-sm'; // Màu xanh tươi mời gọi click
    case 'RESERVED': 
      return 'bg-yellow-50 border-yellow-400 text-yellow-700 opacity-90'; 
    case 'OCCUPIED': 
      return 'bg-rose-50 border-rose-400 text-rose-700 opacity-90';
    default: 
      return 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed';
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 min-h-screen relative">
    
    <div class="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
      <h2 class="text-xl font-bold mb-2 flex justify-between items-center text-gray-800">
        Sơ đồ bàn
        <button @click="fetchData" class="text-sm text-blue-600 hover:text-blue-800">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </h2>
      <p class="text-xs text-gray-500 mb-6 italic">Bấm vào bàn trống (màu xanh) để đặt nhanh.</p>
      
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div 
          v-for="table in tables" 
          :key="table.id"
          @click="handleTableClick(table)" 
          class="relative aspect-square border-2 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 transform hover:scale-105 active:scale-95"
          :class="getTableColor(table.status)"
        >
          <div class="mb-1 text-2xl">
            <span v-if="table.status === 'AVAILABLE'">🍽️</span>
            <span v-else-if="table.status === 'RESERVED'">📅</span>
            <span v-else-if="table.status === 'OCCUPIED'">👥</span>
            <span v-else>🔒</span>
          </div>

          <span class="font-bold text-lg">{{ table.name }}</span>
          <span class="text-xs font-medium">{{ table.capacity }} ghế</span>
        </div>
      </div>
      
      <div class="mt-8 grid grid-cols-2 gap-3 text-xs text-gray-600 font-medium">
        <div class="flex items-center gap-2"><span class="w-3 h-3 bg-emerald-400 rounded-full"></span> Trống (Click để đặt)</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 bg-yellow-400 rounded-full"></span> Đã đặt trước</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 bg-rose-400 rounded-full"></span> Đang có khách</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 bg-gray-400 rounded-full"></span> Bảo trì</div>
      </div>
    </div>

    <div class="lg:col-span-2 space-y-6">
       <ReservationList :reservations="pendingReservations" />
       </div>

    <ReservationForm 
      v-if="showCreateModal"
      :selectedTable="selectedTableForBooking"
      @submit="handleCreateReservation"
      @cancel="showCreateModal = false"
    />

  </div>
</template>