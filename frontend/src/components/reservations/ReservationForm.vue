<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue';

const props = defineProps<{
  selectedTable: { id: number; name: string } | null;
}>();

const emit = defineEmits(['submit', 'cancel']);

// Form data mặc định
const formData = ref({
  customer_name: '',
  customer_phone: '',
  guest_count: 1,
  reservation_time: new Date().toISOString().slice(0, 16) // Lấy giờ hiện tại mặc định
});

const handleSubmit = () => {
  if (!formData.value.customer_name || !formData.value.customer_phone) {
    alert("Vui lòng nhập tên và số điện thoại!");
    return;
  }
  // Gửi dữ liệu ra ngoài cho trang cha xử lý
  emit('submit', { ...formData.value, table_id: props.selectedTable?.id });
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-lg w-96">
      <h3 class="text-xl font-bold mb-4 text-blue-600">
        Đặt bàn tại quầy: {{ selectedTable?.name }}
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Tên khách hàng</label>
          <input 
            v-model="formData.customer_name" 
            type="text" 
            class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ví dụ: Anh Nam"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Số điện thoại</label>
          <input 
            v-model="formData.customer_phone" 
            type="text" 
            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="09xxx"
          />
        </div>

        <div class="flex gap-4">
          <div class="w-1/2">
            <label class="block text-sm font-medium text-gray-700">Số người</label>
            <input 
              v-model="formData.guest_count" 
              type="number" 
              min="1"
              class="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div class="w-1/2">
             <label class="block text-sm font-medium text-gray-700">Giờ vào</label>
             <input 
               v-model="formData.reservation_time"
               type="datetime-local"
               class="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
             />
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end space-x-3">
        <button 
          @click="$emit('cancel')" 
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Hủy bỏ
        </button>
        <button 
          @click="handleSubmit" 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
        >
          Tạo đặt bàn
        </button>
      </div>
    </div>
  </div>
</template>