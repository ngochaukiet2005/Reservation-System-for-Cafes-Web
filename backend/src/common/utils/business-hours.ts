/**
 * Utility để quản lý giờ làm việc của quán café
 */

// Giờ mở cửa và đóng cửa (theo múi giờ địa phương)
const CAFE_OPEN_HOUR = 8;
const CAFE_CLOSE_HOUR = 22;

export interface BusinessHoursConfig {
  openHour: number;
  closeHour: number;
}

/**
 * Kiểm tra xem một thời điểm có nằm trong giờ làm việc hay không
 * @param dateTime Thời điểm cần kiểm tra
 * @param config Config giờ làm việc (optional)
 * @returns true nếu nằm trong giờ làm việc
 */
export function isWithinBusinessHours(
  dateTime: Date,
  config?: BusinessHoursConfig,
): boolean {
  const openHour = config?.openHour ?? CAFE_OPEN_HOUR;
  const closeHour = config?.closeHour ?? CAFE_CLOSE_HOUR;
  
  const hour = dateTime.getHours();
  return hour >= openHour && hour < closeHour;
}

/**
 * Kiểm tra xem một thời điểm có nằm ngoài giờ làm việc hay không
 * @param dateTime Thời điểm cần kiểm tra
 * @param config Config giờ làm việc (optional)
 * @returns true nếu nằm ngoài giờ làm việc
 */
export function isOutsideBusinessHours(
  dateTime: Date,
  config?: BusinessHoursConfig,
): boolean {
  return !isWithinBusinessHours(dateTime, config);
}

/**
 * Lấy giờ mở cửa tiếp theo từ một thời điểm
 * @param fromTime Thời điểm bắt đầu
 * @param config Config giờ làm việc (optional)
 * @returns Thời điểm mở cửa tiếp theo
 */
export function getNextOpeningTime(
  fromTime: Date,
  config?: BusinessHoursConfig,
): Date {
  const openHour = config?.openHour ?? CAFE_OPEN_HOUR;
  const closeHour = config?.closeHour ?? CAFE_CLOSE_HOUR;
  
  const nextDay = new Date(fromTime);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(openHour, 0, 0, 0);
  
  // Nếu từ thời điểm hiện tại là trong giờ làm việc, trả về thời điểm hiện tại
  if (isWithinBusinessHours(fromTime, config)) {
    return new Date(fromTime);
  }
  
  // Ngược lại, trả về giờ mở cửa hôm sau
  return nextDay;
}

/**
 * Tính thời gian hết hạn dựa trên trạng thái và thời gian tạo
 * - Trong giờ: 15 phút
 * - Ngoài giờ: tới giờ mở cửa hôm sau
 * @param createdAt Thời điểm tạo đơn
 * @param config Config giờ làm việc (optional)
 * @returns Thời điểm hết hạn
 */
export function calculateExpireTime(
  createdAt: Date,
  config?: BusinessHoursConfig,
): Date {
  const PENDING_TIMEOUT_MS = 15 * 60 * 1000; // 15 phút
  
  if (isWithinBusinessHours(createdAt, config)) {
    // Trong giờ làm việc: hết hạn sau 15 phút
    return new Date(createdAt.getTime() + PENDING_TIMEOUT_MS);
  } else {
    // Ngoài giờ làm việc: hết hạn vào giờ mở cửa hôm sau
    return getNextOpeningTime(createdAt, config);
  }
}

/**
 * Lấy config giờ làm việc từ environment hoặc dùng mặc định
 */
export function getBusinessHoursConfig(): BusinessHoursConfig {
  return {
    openHour: parseInt(process.env.CAFE_OPEN_HOUR ?? '8', 10),
    closeHour: parseInt(process.env.CAFE_CLOSE_HOUR ?? '22', 10),
  };
}
