import React, { useState, useEffect, ReactNode, useCallback } from 'react';
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
  duration: number;
  price: number;
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

// Loại dữ liệu cho giá trị Statistic
type valueType = string | number;

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
  
  // Memoize các hàm xử lý để tránh render lại không cần thiết
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
      setLoading(true);
      setError(null);
      const newDebugMessages: string[] = [];
      
      try {
        // Lấy dữ liệu từ localStorage với các key chính xác
        const storedAppointments = localStorage.getItem('appointments');
        const storedEmployees = localStorage.getItem('booking-app-employees'); // Key chính xác
        const storedServices = localStorage.getItem('services');
        
        newDebugMessages.push(`Dữ liệu từ localStorage: appointments=${!!storedAppointments}, employees=${!!storedEmployees}, services=${!!storedServices}`);
        
        // Xử lý appointments
        let parsedAppointments: Appointment[] = [];
        if (storedAppointments) {
          try {
            parsedAppointments = JSON.parse(storedAppointments);
            newDebugMessages.push(`Đã load ${parsedAppointments.length} lịch hẹn`);
            
            // Debug: hiển thị trạng thái trong các lịch hẹn
            const statuses = Array.from(new Set(parsedAppointments.map((app: Appointment) => app.status)));
            newDebugMessages.push(`Các trạng thái lịch hẹn: ${statuses.join(', ')}`);
            
            // Debug: kiểm tra lịch hẹn hoàn thành
            const completed = parsedAppointments.filter((app: Appointment) => app.status === STATUS.COMPLETED);
            newDebugMessages.push(`Số lịch hẹn hoàn thành: ${completed.length}`);

            setAppointments(parsedAppointments);
          } catch (e) {
            newDebugMessages.push(`Lỗi khi parse dữ liệu lịch hẹn: ${e}`);
            setError(`Lỗi khi đọc dữ liệu lịch hẹn: ${e}`);
          }
        } else {
          newDebugMessages.push('Không tìm thấy dữ liệu lịch hẹn trong localStorage');
        }
        
        // Xử lý employees
        let parsedEmployees: EmployeeData[] = [];
        if (storedEmployees) {
          try {
            parsedEmployees = JSON.parse(storedEmployees);
            newDebugMessages.push(`Đã load ${parsedEmployees.length} nhân viên`);
            newDebugMessages.push(`Tên các nhân viên: ${parsedEmployees.map(emp => emp.name).join(', ')}`);
            
            setEmployees(parsedEmployees);
          } catch (e) {
            newDebugMessages.push(`Lỗi khi parse dữ liệu nhân viên: ${e}`);
            setError(`Lỗi khi đọc dữ liệu nhân viên: ${e}`);
          }
        } else {
          newDebugMessages.push('Không tìm thấy dữ liệu nhân viên trong localStorage');
        }
        
        // Xử lý services
        let parsedServices: ServiceData[] = [];
        if (storedServices) {
          try {
            parsedServices = JSON.parse(storedServices);
            newDebugMessages.push(`Đã load ${parsedServices.length} dịch vụ`);
            
            // Debug: hiển thị thông tin của mỗi dịch vụ
            parsedServices.forEach(svc => {
              newDebugMessages.push(`Dịch vụ: ${svc.name}, Giá: ${svc.price}`);
            });
            
            setServices(parsedServices);
          } catch (e) {
            newDebugMessages.push(`Lỗi khi parse dữ liệu dịch vụ: ${e}`);
            setError(`Lỗi khi đọc dữ liệu dịch vụ: ${e}`);
          }
        } else {
          newDebugMessages.push('Không tìm thấy dữ liệu dịch vụ trong localStorage');
        }
        
        // Cập nhật debug và hoàn thành loading
        setDebug(newDebugMessages);
      } catch (e) {
        newDebugMessages.push(`Lỗi không xác định: ${e}`);
        setError(`Lỗi không xác định: ${e}`);
        setDebug(newDebugMessages);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Tính toán thống kê khi dữ liệu hoặc bộ lọc thay đổi
  useEffect(() => {
    if (loading) return;
    
    const calculateStats = () => {
      const newDebugMessages: string[] = [];
      
      try {
        // Lọc dữ liệu theo khoảng thời gian
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        newDebugMessages.push(`Lọc lịch hẹn từ ${startDate} đến ${endDate}`);
        
        let filteredAppointments = appointments.filter(app => {
          const appDate = app.date;
          return appDate >= startDate && appDate <= endDate;
        });
        
        newDebugMessages.push(`Số lịch hẹn sau khi lọc theo ngày: ${filteredAppointments.length}`);
        
        // Lọc theo nhân viên nếu có chọn
        if (selectedEmployee !== 'all') {
          filteredAppointments = filteredAppointments.filter(app => app.employee === selectedEmployee);
          newDebugMessages.push(`Số lịch hẹn sau khi lọc theo nhân viên ${selectedEmployee}: ${filteredAppointments.length}`);
        }
        
        // Lọc theo dịch vụ nếu có chọn
        if (selectedService !== 'all') {
          filteredAppointments = filteredAppointments.filter(app => app.service === selectedService);
          newDebugMessages.push(`Số lịch hẹn sau khi lọc theo dịch vụ ${selectedService}: ${filteredAppointments.length}`);
        }
        
        // Cập nhật tổng số lịch hẹn
        setTotalAppointments(filteredAppointments.length);
        
        // Tính số lịch hẹn đã hoàn thành
        const completed = filteredAppointments.filter(app => app.status === STATUS.COMPLETED);
        setCompletedAppointments(completed.length);
        newDebugMessages.push(`Số lịch hẹn hoàn thành: ${completed.length}`);
        
        // Tính tổng doanh thu (chỉ từ lịch hẹn hoàn thành)
        let revenue = 0;
        completed.forEach(app => {
          const service = services.find(svc => svc.name === app.service);
          if (service) {
            revenue += service.price;
            newDebugMessages.push(`Lịch hẹn ${app.id} - ${app.service}: +${service.price} VNĐ`);
          } else {
            newDebugMessages.push(`Không tìm thấy thông tin dịch vụ cho: ${app.service}`);
          }
        });
        
        setTotalRevenue(revenue);
        newDebugMessages.push(`Tổng doanh thu: ${revenue} VNĐ`);
        
        // Thống kê theo ngày/tuần/tháng
        const appointmentsByPeriod: {[key: string]: number} = {};
        
        filteredAppointments.forEach(app => {
          let period;
          const appDate = moment(app.date);
          
          if (statsPeriod === 'day') {
            period = appDate.format('DD/MM/YYYY');
          } else if (statsPeriod === 'week') {
            const weekNumber = appDate.week();
            const year = appDate.year();
            period = `Tuần ${weekNumber}/${year}`;
          } else {
            period = appDate.format('MM/YYYY');
          }
          
          appointmentsByPeriod[period] = (appointmentsByPeriod[period] || 0) + 1;
        });
        
        const formattedAppointmentStats = Object.entries(appointmentsByPeriod)
          .map(([type, value]) => ({ type, value }))
          .sort((a, b) => {
            if (statsPeriod === 'day') {
              return moment(a.type, 'DD/MM/YYYY').valueOf() - moment(b.type, 'DD/MM/YYYY').valueOf();
            }
            return 0;
          });
        
        setAppointmentStats(formattedAppointmentStats);
        
        // Thống kê doanh thu theo dịch vụ (chỉ tính lịch hẹn hoàn thành)
        const revenueByService: {[key: string]: number} = {};
        
        completed.forEach(app => {
          const service = services.find(svc => svc.name === app.service);
          if (service) {
            revenueByService[app.service] = (revenueByService[app.service] || 0) + service.price;
          }
        });
        
        const formattedRevenueByService = Object.entries(revenueByService)
          .map(([type, value]) => ({ type, value }))
          .sort((a, b) => b.value - a.value);
        
        setRevenueByServiceStats(formattedRevenueByService);
        
        // Thống kê doanh thu theo nhân viên (chỉ tính lịch hẹn hoàn thành)
        const revenueByEmployee: {[key: string]: number} = {};
        
        completed.forEach(app => {
          const service = services.find(svc => svc.name === app.service);
          if (service) {
            revenueByEmployee[app.employee] = (revenueByEmployee[app.employee] || 0) + service.price;
          }
        });
        
        const formattedRevenueByEmployee = Object.entries(revenueByEmployee)
          .map(([type, value]) => ({ type, value }))
          .sort((a, b) => b.value - a.value);
        
        setRevenueByEmployeeStats(formattedRevenueByEmployee);
        
        // Cập nhật debug
        setDebug(prev => [...prev, ...newDebugMessages]);
      } catch (e) {
        setError(`Lỗi khi tính toán thống kê: ${e}`);
        setDebug(prev => [...prev, `Lỗi khi tính toán thống kê: ${e}`]);
      }
    };
    
    calculateStats();
  }, [appointments, employees, services, dateRange, selectedEmployee, selectedService, statsPeriod, loading]);

  return (
    <div>
      <Card>
        <Title level={2}>Thống kê</Title>
        
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
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col md={8} sm={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Khoảng thời gian:</Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Space>
          </Col>
          <Col md={6} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Phân tích theo:</Text>
              <Radio.Group value={statsPeriod} onChange={handlePeriodChange}>
                <Radio.Button value="day">Ngày</Radio.Button>
                <Radio.Button value="week">Tuần</Radio.Button>
                <Radio.Button value="month">Tháng</Radio.Button>
              </Radio.Group>
            </Space>
          </Col>
          <Col md={5} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Nhân viên:</Text>
              <Select
                style={{ width: '100%' }}
                value={selectedEmployee}
                onChange={handleEmployeeChange}
              >
                <Option value="all">Tất cả nhân viên</Option>
                {employees.map(emp => (
                  <Option key={emp.id} value={emp.name}>{emp.name}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col md={5} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Dịch vụ:</Text>
              <Select
                style={{ width: '100%' }}
                value={selectedService}
                onChange={handleServiceChange}
              >
                <Option value="all">Tất cả dịch vụ</Option>
                {services.map(svc => (
                  <Option key={svc.id} value={svc.name}>{svc.name}</Option>
                ))}
              </Select>
            </Space>
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
        
        {/* DEBUG INFO */}
        {debug.length > 0 && (
          <Card title="Thông tin debug" style={{ marginTop: 24 }}>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {debug.map((msg, index) => `[${index}] ${msg}`).join('\n')}
            </pre>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default ThongKe;