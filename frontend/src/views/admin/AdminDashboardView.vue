<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminApi, type DashboardStats } from '../../api/adminApi';

const stats = ref<DashboardStats>({ revenue: 0, totalBookings: 0, activeTables: 0, onlineStaff: 0 });
const isLoading = ref(true);

// Mock data cho timeline hoạt động (để giao diện đỡ trống)
const activities = [
  { id: 1, user: 'Nguyễn Văn A', action: 'đã đặt bàn B05', time: '5 phút trước', type: 'booking' },
  { id: 2, user: 'Trần Thị B', action: 'thanh toán hóa đơn #HD002', time: '15 phút trước', type: 'payment' },
  { id: 3, user: 'Hệ thống', action: 'cập nhật trạng thái bàn T01', time: '1 giờ trước', type: 'system' },
];

onMounted(async () => {
  try {
    stats.value = await adminApi.getDashboardStats();
  } finally {
    isLoading.value = false;
  }
});

const formatVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 p-8 font-sans">
    <div class="flex justify-between items-end mb-10">
      <div>
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Dashboard
        </h1>
        <p class="text-gray-500 mt-2 font-medium">Tổng quan tình hình kinh doanh hôm nay</p>
      </div>
      <div class="text-sm bg-white px-4 py-2 rounded-full shadow-sm text-gray-600 border border-gray-100">
        📅 {{ new Date().toLocaleDateString('vi-VN') }}
      </div>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-40 bg-gray-200 rounded-3xl"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
      
      <div class="relative overflow-hidden bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 group border border-gray-100">
        <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
          <svg class="w-32 h-32 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.33 0 2.26-.81 2.26-1.94 0-1.03-.9-1.55-2.5-1.93l-1.02-.25c-2.34-.56-3.73-1.85-3.73-3.86 0-1.8 1.28-3.08 3.03-3.48V3h2.67v1.9c1.6.34 2.84 1.44 2.92 3.19h-1.89c-.1-1.05-.98-1.63-2.12-1.63-1.12 0-1.99.71-1.99 1.63 0 .86.82 1.41 2.37 1.77l1.01.24c2.51.6 3.99 1.96 3.99 4.04 0 2.05-1.47 3.4-3.53 3.74z"></path></svg>
        </div>
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">Doanh thu</span>
          </div>
          <h3 class="text-3xl font-black text-gray-800">{{ formatVND(stats.revenue) }}</h3>
          <p class="text-green-500 text-sm font-semibold mt-2 flex items-center">
            <span class="bg-green-100 px-2 py-1 rounded-lg mr-2">↗ 12.5%</span> so với hôm qua
          </p>
        </div>
      </div>

      <div class="relative overflow-hidden bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 group border border-gray-100">
        <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
           <svg class="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"></path></svg>
        </div>
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-4">
             <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">Đặt bàn</span>
          </div>
          <h3 class="text-3xl font-black text-gray-800">{{ stats.totalBookings }}</h3>
           <p class="text-blue-500 text-sm font-semibold mt-2 flex items-center">
            <span class="bg-blue-50 px-2 py-1 rounded-lg mr-2">+5</span> đơn mới
          </p>
        </div>
      </div>

      <div class="relative overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 p-6 rounded-3xl shadow-lg shadow-orange-200 text-white transform hover:-translate-y-1 transition-transform">
        <div class="relative z-10">
           <div class="flex items-center gap-3 mb-4">
            <div class="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <span class="text-sm font-bold text-white/80 uppercase tracking-wider">Bàn có khách</span>
          </div>
          <h3 class="text-3xl font-black">{{ stats.activeTables }} <span class="text-lg font-medium opacity-80">/ 20</span></h3>
          <div class="w-full bg-black/20 rounded-full h-2 mt-4 overflow-hidden backdrop-blur-sm">
            <div class="bg-white h-2 rounded-full" :style="`width: ${(stats.activeTables/20)*100}%`"></div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:border-purple-200 transition-colors">
        <div class="flex justify-between items-start">
           <div>
            <p class="text-sm font-bold text-gray-400 uppercase tracking-wider">Nhân sự trực</p>
            <h3 class="text-3xl font-black text-gray-800 mt-2">{{ stats.onlineStaff }}</h3>
          </div>
          <div class="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
        </div>
        <div class="flex -space-x-3 mt-4">
           <img class="w-10 h-10 rounded-full border-2 border-white shadow-sm" src="https://ui-avatars.com/api/?name=User+1&background=random" alt=""/>
           <img class="w-10 h-10 rounded-full border-2 border-white shadow-sm" src="https://ui-avatars.com/api/?name=User+2&background=random" alt=""/>
           <div class="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+{{stats.onlineStaff > 2 ? stats.onlineStaff - 2 : 0}}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">Biểu đồ Doanh thu</h3>
          <select class="bg-gray-50 border-none text-sm font-semibold text-gray-500 rounded-lg px-3 py-1 outline-none">
            <option>Tuần này</option>
            <option>Tháng này</option>
          </select>
        </div>
        <div class="h-64 rounded-2xl bg-gradient-to-b from-gray-50 to-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center group hover:border-indigo-300 transition-colors cursor-pointer">
          <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
             <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
          </div>
          <span class="text-gray-400 font-medium">Biểu đồ sẽ hiển thị tại đây</span>
        </div>
      </div>

      <div class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
        <h3 class="text-xl font-bold text-gray-800 mb-6">Hoạt động gần đây</h3>
        <div class="relative pl-6 border-l-2 border-gray-100 space-y-8">
          <div v-for="act in activities" :key="act.id" class="relative">
            <div class="absolute -left-[29px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                 :class="{
                   'bg-blue-500': act.type === 'booking',
                   'bg-green-500': act.type === 'payment',
                   'bg-gray-400': act.type === 'system'
                 }"></div>
            <div>
              <p class="text-sm text-gray-800">
                <span class="font-bold">{{ act.user }}</span> {{ act.action }}
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ act.time }}</p>
            </div>
          </div>
        </div>
        <button class="w-full mt-8 py-3 rounded-xl bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100 transition-colors text-sm">
          Xem tất cả lịch sử
        </button>
      </div>

    </div>
  </div>
</template>