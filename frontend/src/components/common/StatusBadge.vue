<template>
  <span :class="['badge', statusClass]">
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string
}>();

const statusClass = computed(() => {
  switch (props.status) {
    case 'CONFIRMED': return 'badge-green';
    case 'PENDING': return 'badge-yellow';
    case 'CANCELLED': return 'badge-red';
    case 'COMPLETED': return 'badge-blue';
    case 'OCCUPIED': return 'badge-red';
    case 'REQUEST_CANCEL': return 'badge-orange';
    case 'NO_SHOW': return 'badge-gray';
    case 'EXPIRED': return 'badge-gray';
    default: return 'badge-gray';
  }
});

const statusLabel = computed(() => {
  switch (props.status) {
    case 'CONFIRMED': return '✅ Đã xác nhận';
    case 'PENDING': return '⏳ Chờ duyệt';
    case 'CANCELLED': return '❌ Đã hủy';
    case 'COMPLETED': return '✓ Hoàn thành';
    case 'OCCUPIED': return '🔴 Có khách';
    case 'REQUEST_CANCEL': return '❌ Yêu cầu hủy';
    case 'NO_SHOW': return '⚠️ Không đến';
    case 'EXPIRED': return '⏰ Hết hạn';
    default: return props.status;
  }
});
</script>

<style scoped>
.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.badge-green { background-color: #d1fae5; color: #065f46; } /* Xanh lá */
.badge-yellow { background-color: #fef3c7; color: #92400e; } /* Vàng */
.badge-red { background-color: #fee2e2; color: #991b1b; }    /* Đỏ */
.badge-blue { background-color: #dbeafe; color: #1e40af; }    /* Xanh dương */
.badge-orange { background-color: #fed7aa; color: #92400e; }  /* Cam */
.badge-gray { background-color: #f3f4f6; color: #374151; }   /* Xám */
</style>