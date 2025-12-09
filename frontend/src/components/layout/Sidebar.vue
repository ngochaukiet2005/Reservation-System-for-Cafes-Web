<template>
  <aside>
    <div class="logo">☕ Cafe Admin</div>
    <nav>
      <ul>
        <li><router-link to="/reservation">Đặt bàn (Khách)</router-link></li>
        <li><router-link to="/history">Lịch sử (Khách)</router-link></li>
        <hr />
        <li><router-link to="/staff/dashboard">Staff Dashboard</router-link></li>
        <hr />
        <li><router-link to="/admin/dashboard">Admin Dashboard</router-link></li>
        <li><router-link to="/admin/tables">Quản lý bàn</router-link></li>
        <li><router-link to="/admin/staff">Quản lý nhân viên</router-link></li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
/* CSS cơ bản cho Sidebar */
ul { list-style: none; padding: 0; }
li { margin: 10px 0; }
a { color: inherit; text-decoration: none; display: block; padding: 10px; }
a:hover { background: #34495e; }
.logo { padding: 20px; font-weight: bold; font-size: 1.2rem; }
</style>