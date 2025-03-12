import React, { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Card, DatePicker, Row, Col, Statistic, Tabs, Radio, Select, Typography, Spin, Empty, Space, Alert } from 'antd';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import moment from 'moment';
import 'moment/locale/vi';

// Cấu hình moment
moment.locale('vi');

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Định nghĩa trạng thái lịch hẹn
const STATUS = { 
  PENDING: "Chờ duyệt", 
  CONFIRMED: "Xác nhận", 
  COMPLETED: "Hoàn thành", 
  CANCELED: "Hủy" 
};

// Định nghĩa interface cho lịch hẹn
interface Appointment {
  id: string | number;
  date: string;
  time: string;
  employee: string;
  service: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
}

// Interface cho nhân viên
interface EmployeeData {
  id: string;
  name: string;
  position: string;
  phone?: string;
  email?: string;
  workingHours?: {
    start: string;
    end: string;
  };
  maxCustomersPerDay?: number;
}

// Interface cho dịch vụ
interface ServiceData {
  id: string;
  name: string;
  price: number | string;
  durationMinutes?: number;
  duration?: number;
  description?: string;
}

// Interface cho dữ liệu biểu đồ
interface ChartData {
  type: string;
  value: number;
}

// Interface cho label trong PieChart
interface PieChartLabelProps {
  type: string;
  value: number;
}

// Màu sắc cho biểu đồ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#8884D8', '#FF6B6B', '#6B66FF', '#FFA07A', '#20B2AA'];

// Format tiền tệ
const formatCurrency = (value: number): string => {
  return value.toLocaleString('vi-VN') + ' VNĐ';
};

const ThongKe: React.FC = () => {
  // State cho dữ liệu
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  
  // State cho bộ lọc
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment]>([
    moment().startOf('month'), 
    moment().endOf('month')
  ]);
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  
  // State cho thống kê
  const [appointmentStats, setAppointmentStats] = useState<ChartData[]>([]);
  const [revenueByServiceStats, setRevenueByServiceStats] = useState<ChartData[]>([]);
  const [revenueByEmployeeStats, setRevenueByEmployeeStats] = useState<ChartData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);
  const [completedAppointments, setCompletedAppointments] = useState<number>(0);
  
  // Tạo các hàm xử lý để tránh render lại không cần thiết
  const handleEmployeeChange = useCallback((value: string) => {
    setSelectedEmployee(value);
  }, []);
  
  const handleServiceChange = useCallback((value: string) => {
    setSelectedService(value);
  }, []);
  
  const handleDateRangeChange = useCallback((dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
    }
  }, []);
  
  const handlePeriodChange = useCallback((e: any) => {
    setStatsPeriod(e.target.value);
  }, []);

  // Load dữ liệu từ localStorage - chỉ chạy 1 lần khi component mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Lấy dữ liệu từ localStorage với các key chính xác
        const storedAppointments = localStorage.getItem('appointments');
        const storedEmployees = localStorage.getItem('booking-app-employees');
        const storedServices = localStorage.getItem('booking-app-services');
        
        const newDebugMessages: string[] = [];
        newDebugMessages.push(`Dữ liệu từ localStorage: appointments=${!!storedAppointments}, employees=${!!storedEmployees}, services=${!!storedServices}`);
        
        // Xử lý appointments
        if (storedAppointments) {
          try {
            const parsedAppointments = JSON.parse(storedAppointments);
            setAppointments(parsedAppointments);
            newDebugMessages.push(`Đã load ${parsedAppointments.length} lịch hẹn`);
            newDebugMessages.push(`Dữ liệu lịch hẹn: ${JSON.stringify(parsedAppointments)}`);
            
            // Log các trạng thái có trong dữ liệu
            const statusSet = new Set(parsedAppointments.map((app: Appointment) => app.status));
            newDebugMessages.push(`Các trạng thái có trong dữ liệu: ${Array.from(statusSet).join(', ')}`);
          } catch (err) {
            newDebugMessages.push(`Lỗi khi parse appointments: ${err}`);
            setError('Lỗi khi đọc dữ liệu lịch hẹn');
          }
        } else {
          newDebugMessages.push('Không tìm thấy dữ liệu appointments trong localStorage');
        }
        
        // Xử lý employees
        if (storedEmployees) {
          try {
            const parsedEmployees = JSON.parse(storedEmployees);
            setEmployees(parsedEmployees);
            newDebugMessages.push(`Đã load ${parsedEmployees.length} nhân viên`);
            
            // Log tên của tất cả nhân viên
            const employeeNames = parsedEmployees.map((emp: EmployeeData) => emp.name);
            newDebugMessages.push(`Các nhân viên: ${employeeNames.join(', ')}`);
            newDebugMessages.push(`Dữ liệu nhân viên: ${JSON.stringify(parsedEmployees)}`);
          } catch (err) {
            newDebugMessages.push(`Lỗi khi parse employees: ${err}`);
            setError('Lỗi khi đọc dữ liệu nhân viên');
          }
        } else {
          newDebugMessages.push('Không tìm thấy dữ liệu employees trong localStorage');
        }
        
        // Xử lý services
        if (storedServices) {
          try {
            const parsedServices = JSON.parse(storedServices);
            setServices(parsedServices);
            newDebugMessages.push(`Đã load ${parsedServices.length} dịch vụ`);
            newDebugMessages.push(`Dữ liệu dịch vụ: ${JSON.stringify(parsedServices)}`);
            
            // Log thông tin chi tiết của mỗi dịch vụ
            parsedServices.forEach((svc: ServiceData, idx: number) => {
              newDebugMessages.push(`Dịch vụ ${idx+1}: ID=${svc.id}, Tên=${svc.name}, Giá=${svc.price}`);
            });
          } catch (err) {
            newDebugMessages.push(`Lỗi khi parse services: ${err}`);
            setError('Lỗi khi đọc dữ liệu dịch vụ');
          }
        } else {
          newDebugMessages.push('Không tìm thấy dữ liệu booking-app-services trong localStorage');
        }

        setDebug(prevDebug => [...prevDebug, ...newDebugMessages]);
      } catch (err) {
        setError(`Lỗi khi load dữ liệu: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Tính toán thống kê dựa trên dữ liệu và bộ lọc
  useEffect(() => {
    if (loading) return;
    
    const calculateStats = () => {
      const newDebugMessages: string[] = [];
      newDebugMessages.push('Bắt đầu tính toán thống kê...');
      
      try {
        // Lọc lịch hẹn theo thời gian
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        let filteredAppointments = appointments.filter(app => 
          app.date >= startDate && app.date <= endDate
        );
        
        newDebugMessages.push(`Sau khi lọc theo thời gian (${startDate} đến ${endDate}): ${filteredAppointments.length} lịch hẹn`);
        
        // Lọc theo nhân viên nếu có chọn
        if (selectedEmployee !== 'all') {
          filteredAppointments = filteredAppointments.filter(app => 
            app.employee === selectedEmployee
          );
          newDebugMessages.push(`Sau khi lọc theo nhân viên (${selectedEmployee}): ${filteredAppointments.length} lịch hẹn`);
        }
        
        // Lọc theo dịch vụ nếu có chọn
        if (selectedService !== 'all') {
          filteredAppointments = filteredAppointments.filter(app => 
            app.service === selectedService
          );
          newDebugMessages.push(`Sau khi lọc theo dịch vụ (${selectedService}): ${filteredAppointments.length} lịch hẹn`);
        }
        
        // Tính tổng số lịch hẹn
        setTotalAppointments(filteredAppointments.length);
        
        // Lọc lịch hẹn đã hoàn thành
        const completed = filteredAppointments.filter(app => 
          app.status === STATUS.COMPLETED
        );
        setCompletedAppointments(completed.length);
        newDebugMessages.push(`Số lịch hẹn đã hoàn thành: ${completed.length}`);
        
        // Thống kê số lượng lịch hẹn theo ngày/tuần/tháng
        const statsByPeriod = new Map<string, number>();
        
        // Phân loại theo khoảng thời gian đã chọn
        filteredAppointments.forEach(app => {
          let periodKey: string;
          const appDate = moment(app.date);
          
          if (statsPeriod === 'day') {
            periodKey = appDate.format('DD/MM/YYYY');
          } else if (statsPeriod === 'week') {
            const weekNumber = appDate.week();
            const year = appDate.year();
            periodKey = `Tuần ${weekNumber}, ${year}`;
          } else {
            periodKey = appDate.format('MM/YYYY');
          }
          
          statsByPeriod.set(
            periodKey, 
            (statsByPeriod.get(periodKey) || 0) + 1
          );
        });
        
        // Chuyển Map thành mảng và sắp xếp theo thời gian
        const appointmentStatsArray: ChartData[] = Array.from(statsByPeriod.entries())
          .map(([type, value]) => ({ type, value }))
          .sort((a, b) => {
            // Sắp xếp theo thời gian
            if (statsPeriod === 'day') {
              return moment(a.type, 'DD/MM/YYYY').diff(moment(b.type, 'DD/MM/YYYY'));
            } else if (statsPeriod === 'week') {
              const [aWeek, aYear] = a.type.replace('Tuần ', '').split(', ');
              const [bWeek, bYear] = b.type.replace('Tuần ', '').split(', ');
              return aYear === bYear 
                ? parseInt(aWeek) - parseInt(bWeek)
                : parseInt(aYear) - parseInt(bYear);
            } else {
              return moment(a.type, 'MM/YYYY').diff(moment(b.type, 'MM/YYYY'));
            }
          });
        
        setAppointmentStats(appointmentStatsArray);
        
        // Tính toán doanh thu
        newDebugMessages.push('=== TÍNH DOANH THU CHI TIẾT ===');
        
        let calculatedTotalRevenue = 0;
        const revenueByService = new Map<string, number>();
        const revenueByEmployee = new Map<string, number>();
        
        completed.forEach(app => {
          // Tìm dịch vụ tương ứng để lấy giá
          const service = services.find(svc => svc.name === app.service);
          
          if (service) {
            // Chuyển đổi price thành số nếu là chuỗi
            let price = 0;
            if (typeof service.price === 'string') {
              price = parseInt(service.price, 10);
            } else {
              price = service.price;
            }
            
            if (!isNaN(price)) {
              newDebugMessages.push(`Lịch hẹn ID=${app.id}, Service=${app.service}, Employee=${app.employee}, Price=${price}`);
              
              // Cộng doanh thu
              calculatedTotalRevenue += price;
              
              // Thống kê theo dịch vụ
              revenueByService.set(
                app.service,
                (revenueByService.get(app.service) || 0) + price
              );
              
              // Thống kê theo nhân viên
              revenueByEmployee.set(
                app.employee,
                (revenueByEmployee.get(app.employee) || 0) + price
              );
            } else {
              newDebugMessages.push(`Lỗi: Giá của dịch vụ "${app.service}" không phải là số hợp lệ (giá=${service.price})`);
            }
          } else {
            newDebugMessages.push(`CẢNH BÁO: Không tìm thấy thông tin giá cho dịch vụ "${app.service}"`);
          }
        });
        
        // Cập nhật các state
        setTotalRevenue(calculatedTotalRevenue);
        newDebugMessages.push(`Tổng doanh thu tính được: ${calculatedTotalRevenue.toLocaleString('vi-VN')} VNĐ`);
        
        // Chuyển Map thành mảng
        const revenueByServiceArray: ChartData[] = Array.from(revenueByService.entries())
          .map(([type, value]) => ({ type, value }))
          .sort((a, b) => b.value - a.value); // Sắp xếp theo doanh thu giảm dần
        
        const revenueByEmployeeArray: ChartData[] = Array.from(revenueByEmployee.entries())
          .map(([type, value]) => ({ type, value }))
          .sort((a, b) => b.value - a.value); // Sắp xếp theo doanh thu giảm dần
        
        setRevenueByServiceStats(revenueByServiceArray);
        setRevenueByEmployeeStats(revenueByEmployeeArray);
        
        newDebugMessages.push(`Doanh thu theo dịch vụ: ${JSON.stringify(revenueByServiceArray)}`);
        newDebugMessages.push(`Doanh thu theo nhân viên: ${JSON.stringify(revenueByEmployeeArray)}`);
      } catch (err) {
        newDebugMessages.push(`Lỗi khi tính toán thống kê: ${err}`);
        setError(`Lỗi khi tính toán thống kê: ${err}`);
      }
      
      // Cập nhật debug logs
      setDebug(prevDebug => [...prevDebug, ...newDebugMessages]);
    };
    
    calculateStats();
  }, [loading, appointments, services, dateRange, selectedEmployee, selectedService, statsPeriod]);

  // Tạo danh sách option cho dropdown Employee
  const employeeOptions = useMemo(() => {
    const options = [{
      value: 'all',
      label: 'Tất cả nhân viên'
    }];
    
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        options.push({
          value: emp.name,
          label: emp.name
        });
      });
    }
    
    return options;
  }, [employees]);

  // Tạo danh sách option cho dropdown Service
  const serviceOptions = useMemo(() => {
    const options = [{
      value: 'all',
      label: 'Tất cả dịch vụ'
    }];
    
    if (services && services.length > 0) {
      services.forEach(svc => {
        options.push({
          value: svc.name,
          label: svc.name
        });
      });
    }
    
    return options;
  }, [services]);

  return (
    <div style={{ padding: 24 }}>
      <Card title="Thống kê lịch hẹn">
        {error && (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        {/* Bộ lọc */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Thời gian</Text>
              <RangePicker 
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Nhân viên</Text>
              <Select
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                style={{ width: '100%' }}
                options={employeeOptions}
              />
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Dịch vụ</Text>
              <Select
                value={selectedService}
                onChange={handleServiceChange}
                style={{ width: '100%' }}
                options={serviceOptions}
              />
            </Space>
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Text>Hiển thị thống kê theo</Text>
            <Radio.Group value={statsPeriod} onChange={handlePeriodChange} style={{ marginLeft: 16 }}>
              <Radio.Button value="day">Ngày</Radio.Button>
              <Radio.Button value="week">Tuần</Radio.Button>
              <Radio.Button value="month">Tháng</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
        
        {/* Thống kê tổng quan */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng số lịch hẹn"
                value={totalAppointments}
                suffix="lịch hẹn"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Lịch hẹn đã hoàn thành"
                value={completedAppointments}
                suffix={`(${totalAppointments ? Math.round(completedAppointments / totalAppointments * 100) : 0}%)`}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={totalRevenue}
                suffix="VNĐ"
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return value.toLocaleString('vi-VN');
                  }
                  return String(value);
                }}
              />
            </Card>
          </Col>
        </Row>
        
        {/* Tabs biểu đồ */}
        <Tabs defaultActiveKey="appointments">
          <TabPane tab="Thống kê số lượng lịch hẹn" key="appointments">
            <Card>
              <Title level={4}>Số lượng lịch hẹn theo {statsPeriod === 'day' ? 'ngày' : statsPeriod === 'week' ? 'tuần' : 'tháng'}</Title>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin />
                </div>
              ) : appointmentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={appointmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value} lịch hẹn`, 'Số lượng']} />
                    <Legend />
                    <Bar dataKey="value" name="Số lượng lịch hẹn" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </TabPane>
          
          <TabPane tab="Thống kê doanh thu theo dịch vụ" key="revenueByService">
            <Card>
              <Title level={4}>Doanh thu theo dịch vụ (chỉ tính lịch hẹn Hoàn thành)</Title>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin />
                </div>
              ) : revenueByServiceStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={revenueByServiceStats}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ type, value }: PieChartLabelProps) => `${type}: ${value.toLocaleString('vi-VN')} VNĐ`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="type"
                    >
                      {revenueByServiceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Doanh thu']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu doanh thu" />
              )}
            </Card>
          </TabPane>
          
          <TabPane tab="Thống kê doanh thu theo nhân viên" key="revenueByEmployee">
            <Card>
              <Title level={4}>Doanh thu theo nhân viên (chỉ tính lịch hẹn Hoàn thành)</Title>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin />
                </div>
              ) : revenueByEmployeeStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueByEmployeeStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="type" />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Doanh thu']} />
                    <Legend />
                    <Bar dataKey="value" name="Doanh thu" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu doanh thu" />
              )}
            </Card>
          </TabPane>
        </Tabs>
        
      </Card>
    </div>
  );
};

export default ThongKe;