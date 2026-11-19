export interface ChecklistCategory {
  title: string;
  items: { label: string; passed: boolean }[];
}

export type InspectionChecklistState = Record<string, ChecklistCategory>;

export const DEFAULT_INSPECTION_CHECKLIST: InspectionChecklistState = {
  engine_transmission: {
    title: '1. Động cơ & Hộp số (40 điểm)',
    items: [
      { label: 'Khởi động êm ái, không có tiếng gõ kim loại lạ', passed: true },
      { label: 'Không rò rỉ dầu máy, đáy carte khô ráo', passed: true },
      { label: 'Hộp số sang số mượt mà, không giật cục', passed: true },
      { label: 'Cao su chân máy & chân hộp số nguyên bản', passed: true },
      { label: 'Hệ thống turbo tăng áp (nếu có) không hú rít', passed: true },
    ],
  },
  chassis_suspension: {
    title: '2. Khung gầm & Hệ thống treo (35 điểm)',
    items: [
      { label: 'Khung gầm sắt xi không gỉ sét mục mọt, không nắn uốn', passed: true },
      { label: 'Thước lái đầm chắc, rotuyn cân bằng không rơ lắc', passed: true },
      { label: 'Hệ thống giảm xóc đàn hồi chuẩn, không xì dầu', passed: true },
      { label: 'Đĩa phanh và má phanh đạt độ dày an toàn > 70%', passed: true },
      { label: 'Lốp xe mòn đều, date lốp đồng bộ', passed: true },
    ],
  },
  body_paint: {
    title: '3. Thân vỏ & Nước sơn (30 điểm)',
    items: [
      { label: 'Đo độ dày sơn bằng máy chuyên dụng đạt chuẩn zin', passed: true },
      { label: 'Keo chỉ nắp capo, cốp sau và 4 cánh cửa nguyên bản', passed: true },
      { label: 'Các khe hở thân xe đều tăm tắp, không lệch mí', passed: true },
      { label: 'Kính chắn gió và toàn bộ kính xe nguyên bản nhà sản xuất', passed: true },
    ],
  },
  interior_comfort: {
    title: '4. Nội thất & Tiện nghi (30 điểm)',
    items: [
      { label: 'Ghế da zin, độ đàn hồi tốt, không nứt rách', passed: true },
      { label: 'Vô lăng, củ số, bàn đạp đúng độ hao mòn theo số km', passed: true },
      { label: 'Điều hòa 2 vùng làm mát sâu và khử mùi tốt', passed: true },
      { label: 'Không có dấu hiệu ẩm mốc ngập nước hay thủy kích sàn', passed: true },
    ],
  },
  electrical_safety: {
    title: '5. An toàn & Hệ thống điện (25 điểm)',
    items: [
      { label: 'Hệ thống túi khí SRS nguyên vẹn, không có mã lỗi OBD-II', passed: true },
      { label: 'Phanh ABS, cân bằng điện tử ESP hoạt động hoàn hảo', passed: true },
      { label: 'Cụm đèn pha Full LED, đèn hậu chiếu sáng chuẩn', passed: true },
      { label: 'Màn hình trung tâm, camera lùi & cảm biến an toàn nhạy bén', passed: true },
    ],
  },
};

export const REJECT_SUGGESTIONS = [
  'Hình ảnh mờ, không rõ biển số hoặc không đủ góc chụp theo tiêu chuẩn.',
  'Giá bán không hợp lý hoặc chênh lệch quá lớn so với thị trường.',
  'Thông số kỹ thuật không khớp với dòng xe thực tế.',
  'Nghi vấn phương tiện từng bị tai nạn hoặc thiếu giấy tờ hợp lệ.',
];

