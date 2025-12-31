<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { adminApi, type Staff } from '../../api/adminApi';

const staffs = ref<Staff[]>([]);
const loading = ref(false);
const showModal = ref(false);
const form = reactive({ fullName: '', email: '', role: 'STAFF' as any });

const fetchData = async () => {
  loading.value = true;
  staffs.value = await adminApi.getStaffList();
  loading.value = false;
};

const handleCreate = async () => {
  if(!form.fullName) return; // Validate đơn giản
  await adminApi.createStaff(form);
  showModal.value = false;
  form.fullName = ''; form.email = '';
  await fetchData();
};

const handleDelete = async (id: number) => {
  if(confirm('Bạn có chắc muốn xóa nhân viên này?')) {
    await adminApi.deleteStaff(id);
    await fetchData();
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 p-8 font-sans">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-800">Quản lý Nhân sự</h1>
        <p class="text-gray-500 mt-1">Danh sách nhân viên và phân quyền truy cập hệ thống.</p>
      </div>
      <button 
        @click="showModal = true" 
        class="group relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
      >
        <span class="bg-indigo-500 rounded-lg p-1 group-hover:bg-indigo-600 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        </span>
        <span class="font-semibold">Thêm nhân viên</span>
      </button>
    </div>

    <div class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100">
              <th class="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Nhân viên</th>
              <th class="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin liên hệ</th>
              <th class="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Vai trò</th>
              <th class="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
              <th class="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="5" class="p-10 text-center">
                 <div class="flex justify-center items-center gap-2 text-gray-400">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Đang tải dữ liệu...
                 </div>
              </td>
            </tr>
            
            <tr v-else v-for="staff in staffs" :key="staff.id" class="group hover:bg-indigo-50/30 transition-colors">
              <td class="p-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                    {{ staff.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-bold text-gray-800 text-base">{{ staff.fullName }}</p>
                    <p class="text-xs text-gray-400 mt-0.5 font-mono">ID: #{{ staff.id }}</p>
                  </div>
                </div>
              </td>
              <td class="p-6">
                <div class="flex items-center gap-2 text-gray-600 font-medium">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  {{ staff.email }}
                </div>
              </td>
              <td class="p-6">
                <span 
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                  :class="staff.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="staff.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'"></span>
                  {{ staff.role }}
                </span>
              </td>
              <td class="p-6">
                <span class="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                  Hoạt động
                </span>
              </td>
              <td class="p-6 text-right">
                <button 
                  @click="handleDelete(staff.id)" 
                  class="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all" 
                  title="Xóa nhân viên"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="!loading && staffs.length === 0" class="p-10 text-center text-gray-500">
        Chưa có nhân viên nào. Hãy thêm mới!
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" @click="showModal = false"></div>
      
      <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 transform transition-all scale-100">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            👤
          </div>
          <h3 class="text-2xl font-bold text-gray-800">Thêm nhân viên</h3>
          <p class="text-gray-500 text-sm">Điền thông tin nhân sự mới vào bên dưới</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-bold text-gray-700 block mb-2">Họ và Tên</label>
            <input v-model="form.fullName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Ví dụ: Nguyễn Văn A" />
          </div>
          
          <div>
            <label class="text-sm font-bold text-gray-700 block mb-2">Email đăng nhập</label>
            <input v-model="form.email" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="staff@example.com" />
          </div>

          <div>
            <label class="text-sm font-bold text-gray-700 block mb-2">Phân quyền</label>
            <div class="relative">
              <select v-model="form.role" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                <option value="STAFF">Nhân viên (Staff)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-8">
          <button @click="showModal = false" class="py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">
            Hủy bỏ
          </button>
          <button @click="handleCreate" class="py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5">
            Lưu nhân viên
          </button>
        </div>
      </div>
    </div>
  </div>
</template>