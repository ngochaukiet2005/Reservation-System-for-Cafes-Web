<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppTable from '../../components/common/AppTable.vue';
import AppButton from '../../components/common/AppButton.vue';

const staffList = ref<any[]>([]);
const loading = ref(false);

const loadStaff = () => {
  loading.value = true;
  setTimeout(() => {
    staffList.value = [
      { id: 1, name: 'Nguyễn Văn A', email: 'staff1@cafe.com', phone: '0901234567', role: 'STAFF', active: true },
      { id: 2, name: 'Trần Thị B', email: 'staff2@cafe.com', phone: '0909876543', role: 'STAFF', active: true },
      { id: 3, name: 'Lê Văn C', email: 'staff3@cafe.com', phone: '0912345678', role: 'STAFF', active: false },
    ];
    loading.value = false;
  }, 600);
};

onMounted(loadStaff);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Họ và Tên' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'SĐT' },
  { key: 'active', label: 'Trạng thái' },
  { key: 'actions', label: 'Thao tác' },
];
</script>

<template>
  <div class="manage-staff">
    <div class="actions-bar">
      <AppButton variant="primary">+ Tạo Nhân Viên Mới</AppButton>
    </div>

    <div class="table-wrapper">
      <AppTable :columns="columns" :data="staffList" :loading="loading">
        <template #cell-active="{ row }">
          <span :class="['status-dot', row.active ? 'online' : 'offline']">
            {{ row.active ? 'Đang hoạt động' : 'Đã khóa' }}
          </span>
        </template>
        <template #cell-actions>
          <div class="btn-group">
            <button class="btn-text">Sửa</button>
            <button class="btn-text danger">Khóa</button>
          </div>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.actions-bar { margin-bottom: 20px; display: flex; justify-content: flex-end; }
.table-wrapper { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.status-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem; }
.status-dot::before { content: ''; width: 8px; height: 8px; border-radius: 50%; }
.status-dot.online { color: #2ecc71; } .status-dot.online::before { background: #2ecc71; }
.status-dot.offline { color: #95a5a6; } .status-dot.offline::before { background: #95a5a6; }
.btn-text { background: none; border: none; cursor: pointer; color: #3498db; font-weight: 500; margin-right: 10px; }
.btn-text.danger { color: #e74c3c; }
</style>