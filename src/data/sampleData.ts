import { Employee } from '../pages/quanLyNhanVien/qlnv';
import { Service } from '../pages/quanLyNhanVien/quanLyDichVu';
import moment from 'moment';

// Dữ liệu dịch vụ mẫu
export const sampleServices: Service[] = [
  {
    id: 'service-1',
    name: 'Cắt tóc nam',
    price: 150000,
    durationMinutes: 30,
    description: 'Cắt tóc nam theo yêu cầu, bao gồm gội đầu và tạo kiểu cơ bản'
  },
  {
    id: 'service-2',
    name: 'Nhuộm tóc',
    price: 500000,
    durationMinutes: 120,
    description: 'Nhuộm tóc theo màu yêu cầu, bao gồm tẩy tóc nếu cần thiết'
  },
  {
    id: 'service-3',
    name: 'Uốn tóc',
    price: 800000,
    durationMinutes: 180,
    description: 'Uốn tóc theo kiểu yêu cầu, bao gồm dưỡng tóc'
  },
  {
    id: 'service-4',
    name: 'Gội đầu massage',
    price: 100000,
    durationMinutes: 45,
    description: 'Gội đầu kèm massage đầu, vai, cổ thư giãn'
  },
  {
    id: 'service-5',
    name: 'Cạo râu',
    price: 50000,
    durationMinutes: 15,
    description: 'Cạo râu và tỉa gọn'
  }
];

// Dữ liệu nhân viên mẫu
export const sampleEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'an.nguyen@example.com',
    position: 'Thợ cắt tóc cao cấp',
    maxCustomersPerDay: 10,
    workingDays: [1, 2, 3, 4, 5], // Thứ 2 đến thứ 6
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    services: ['service-1', 'service-2', 'service-3'],
    averageRating: 4.5,
    avatar: 'https://example.com/avatar1.jpg'
  },
  {
    id: 'emp-2',
    name: 'Trần Thị Bình',
    phone: '0912345678',
    email: 'binh.tran@example.com',
    position: 'Chuyên gia nhuộm tóc',
    maxCustomersPerDay: 8,
    workingDays: [2, 3, 4, 5, 6], // Thứ 3 đến thứ 7
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    services: ['service-2', 'service-3'],
    averageRating: 4.8
  },
  {
    id: 'emp-3',
    name: 'Lê Văn Cường',
    phone: '0923456789',
    email: 'cuong.le@example.com',
    position: 'Thợ cắt tóc',
    maxCustomersPerDay: 12,
    workingDays: [0, 1, 2, 3, 4, 5, 6], // Cả tuần
    workingHours: {
      start: '10:00',
      end: '19:00'
    },
    services: ['service-1', 'service-4', 'service-5'],
    averageRating: 4.2
  }
];

// Dữ liệu lịch hẹn mẫu
export const sampleAppointments = [
  {
    id: 'app-1',
    date: moment().format('YYYY-MM-DD'),
    time: '09:00',
    customerName: 'Phạm Văn Đức',
    customerPhone: '0934567890',
    employee: 'Nguyễn Văn An',
    service: 'Cắt tóc nam',
    status: 'Chờ duyệt',
    note: 'Khách hẹn lần đầu'
  },
  {
    id: 'app-2',
    date: moment().add(1, 'days').format('YYYY-MM-DD'),
    time: '14:00',
    customerName: 'Nguyễn Thị Em',
    customerPhone: '0945678901',
    employee: 'Trần Thị Bình',
    service: 'Nhuộm tóc',
    status: 'Xác nhận',
    note: 'Nhuộm màu nâu đỏ'
  },
  {
    id: 'app-3',
    date: moment().format('YYYY-MM-DD'),
    time: '15:30',
    customerName: 'Trần Văn Phong',
    customerPhone: '0956789012',
    employee: 'Lê Văn Cường',
    service: 'Gội đầu massage',
    status: 'Hoàn thành',
    note: ''
  }
];

// Hàm khởi tạo dữ liệu mẫu trong localStorage
export const initializeSampleData = () => {
  // Kiểm tra và khởi tạo dữ liệu dịch vụ
  if (!localStorage.getItem('booking-app-services')) {
    localStorage.setItem('booking-app-services', JSON.stringify(sampleServices));
  }

  // Kiểm tra và khởi tạo dữ liệu nhân viên
  if (!localStorage.getItem('booking-app-employees')) {
    localStorage.setItem('booking-app-employees', JSON.stringify(sampleEmployees));
  }

  // Kiểm tra và khởi tạo dữ liệu lịch hẹn
  if (!localStorage.getItem('appointments')) {
    localStorage.setItem('appointments', JSON.stringify(sampleAppointments));
  }
}; 