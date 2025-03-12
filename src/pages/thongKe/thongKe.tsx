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

// Interface cho dịch vụ - điều chỉnh để tương thích với dữ liệu thực tế
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
        const storedEmployees = localStorage.getItem('booking-app-employees');
        const storedServices = localStorage.getItem('booking-app-services'); // Sửa key này
        
        newDebugMessages.push(`Dữ liệu từ localStorage: appointments=${!!storedAppointments}, employees=${!!storedEmployees}, services=${!!storedServices}`);
        newDebugMessages.push(`Dữ liệu dịch vụ: ${storedServices}`);
        newDebugMessages.push(`Dữ liệu nhân viên: ${storedEmployees}`);
        newDebugMessages.push(`Dữ liệu lịch hẹn: ${storedAppointments}`);
        
        // Xử lý appointments
        let parsedAppointments: Appointment[] = [];
        if (storedAppointments) {
          try {
            parsedAppointments = JSON.parse(storedAppointments);
            newDebugMessages.push(`Đã load ${parsedAppointments.length} lịch hẹn`);
            
            // Debug: hiển thị trạng thái có trong dữ liệu
            const statusSet = new Set(parsedAppointments.map(app => app.status));
            newDebugMessages.push(`Các trạng thái có trong dữ liệu: ${Array.from(statusSet).join(', ')}`);
            
            setAppointments(parsedAppointments);
          } catch (err) {
            newDebugMessages.push(`Lỗi khi parse dữ liệu lịch hẹn: ${err}`);
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
            
            // Debug: hiển thị tên nhân viên
            const employeeNames = parsedEmployees.map(emp => emp.name);
            newDebugMessages.push(`Các nhân viên: ${employeeNames.join(', ')}`);
            
            setEmployees(parsedEmployees);
          } catch (err) {
            newDebugMessages.push(`Lỗi khi parse dữ liệu nhân viên: ${err}`);
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
            
            // Debug: hiển thị thông tin dịch vụ và giá
            parsedServices.forEach(svc => {
              newDebugMessages.push(`Dịch vụ: ${svc.name}, Giá: ${svc.price}, ID: ${svc.id}`);
            });
            
            setServices(parsedServices);
          } catch (err) {
            newDebugMessages.push(`Lỗi khi parse dữ liệu dịch vụ: ${err}`);
          }
        } else {
          newDebugMessages.push('Không tìm thấy dữ liệu booking-app-services trong localStorage');
        }
      } catch (error) {
        setError('Đã xảy ra lỗi khi tải dữ liệu');
        newDebugMessages.push(`Lỗi tải dữ liệu: ${error}`);
      } finally {
        setLoading(false);
        setDebug(newDebugMessages);
      }
    };
    
    loadData();
  }, []);

  // Tính toán thống kê dựa theo dữ liệu và bộ lọc
  useEffect(() => {
    if (loading) return;
    
    const calculateStats = () => {
      const newDebugMessages = [...debug];
      newDebugMessages.push('Bắt đầu tính toán thống kê...');
      
      try {
        // Lọc lịch hẹn theo thời gian
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        let filteredAppointments = appointments.filter(app => {
          const appDate = app.date;
          return appDate >= startDate && appDate <= endDate;
        });
        
        newDebugMessages.push(`Sau khi lọc theo thời gian (${startDate} đến ${endDate}): ${filteredAppointments.length} lịch hẹn`);
        
        // Lọc theo nhân viên nếu cần
        if (selectedEmployee !== 'all') {
          filteredAppointments = filteredAppointments.filter(app => app.employee === selectedEmployee);
          newDebugMessages.push(`Sau khi lọc theo nhân viên ${selectedEmployee}: ${filteredAppointments.length} lịch hẹn`);
        }
        
        // Lọc theo dịch vụ nếu cần
        if (selectedService !== 'all') {
          filteredAppointments = filteredAppointments.filter(app => app.service === selectedService);
          newDebugMessages.push(`Sau khi lọc theo dịch vụ ${selectedService}: ${filteredAppointments.length} lịch hẹn`);
        }
        
        // Tổng lịch hẹn và lịch hẹn hoàn thành
        setTotalAppointments(filteredAppointments.length);
        const completed = filteredAppointments.filter(app => app.status === STATUS.COMPLETED);
        setCompletedAppointments(completed.length);
        newDebugMessages.push(`Số lịch hẹn đã hoàn thành: ${completed.length}`);
        
        // Tính doanh thu
        newDebugMessages.push('=== TÍNH DOANH THU CHI TIẾT ===');
        let calculatedTotalRevenue = 0;
        const revenueByService = new Map<string, number>();
        const revenueByEmployee = new Map<string, number>();
        
        completed.forEach(app => {
          // Tìm dịch vụ tương ứng để lấy giá
          const service = services.find(svc => svc.name === app.service);
          
          if (service) {
            // Chuyển đổi giá từ string sang number nếu cần
            let price = 0;
            if (typeof service.price === 'string') {
              price = parseInt(service.price, 10);
            } else {
              price = service.price;
            }
            
            if (!isNaN(price)) {
              newDebugMessages.push(`Lịch hẹn ID=${app.id}, Dịch vụ=${app.service}, Giá=${price.toLocaleString('vi-VN')} VNĐ`);
              
              // Cộng vào tổng doanh thu
              calculatedTotalRevenue += price;
              
              // Cộng vào doanh thu theo dịch vụ
              const currentServiceRevenue = revenueByService.get(app.service) || 0;
              revenueByService.set(app.service, currentServiceRevenue + price);
              
              // Cộng vào doanh thu theo nhân viên
              const currentEmployeeRevenue = revenueByEmployee.get(app.employee) || 0;
              revenueByEmployee.set(app.employee, currentEmployeeRevenue + price);
            } else {
              newDebugMessages.push(`CẢNH BÁO: Giá không hợp lệ cho dịch vụ "${app.service}": ${service.price}`);
            }
          } else {
            newDebugMessages.push(`CẢNH BÁO: Không tìm thấy thông tin giá cho dịch vụ "${app.service}"`);
          }
        });
        
        // Cập nhật tổng doanh thu
        setTotalRevenue(calculatedTotalRevenue);
        newDebugMessages.push(`Tổng doanh thu tính được: ${calculatedTotalRevenue.toLocaleString('vi-VN')} VNĐ`);
        
        // Chuyển đổi Map thành mảng cho biểu đồ
        const revenueByServiceArray: ChartData[] = Array.from(revenueByService).map(([type, value]) => ({ type, value }));
        const revenueByEmployeeArray: ChartData[] = Array.from(revenueByEmployee).map(([type, value]) => ({ type, value }));
        
        setRevenueByServiceStats(revenueByServiceArray);
        setRevenueByEmployeeStats(revenueByEmployeeArray);
        
        newDebugMessages.push(`Doanh thu theo dịch vụ: ${JSON.stringify(revenueByServiceArray)}`);
        newDebugMessages.push(`Doanh thu theo nhân viên: ${JSON.stringify(revenueByEmployeeArray)}`);
        
        // Tính thống kê lịch hẹn theo thời gian
        const statsByTime = new Map<string, number>();
        
        filteredAppointments.forEach(app => {
          let key = '';
          const date = moment(app.date);
          
          if (statsPeriod === 'day') {
            key = date.format('DD/MM/YYYY');
          } else if (statsPeriod === 'week') {
            const weekOfYear = date.week();
            const year = date.year();
            key = `Tuần ${weekOfYear}, ${year}`;
          } else {
            key = `Tháng ${date.month() + 1}, ${date.year()}`;
          }
          
          const currentCount = statsByTime.get(key) || 0;
          statsByTime.set(key, currentCount + 1);
        });
        
        // Chuyển đổi Map thành mảng cho biểu đồ
        const statsByTimeArray = Array.from(statsByTime).map(([type, value]) => ({ type, value }));
        
        // Sắp xếp theo thời gian
        if (statsPeriod === 'day') {
          statsByTimeArray.sort((a, b) => {
            const dateA = moment(a.type, 'DD/MM/YYYY');
            const dateB = moment(b.type, 'DD/MM/YYYY');
            return dateA.diff(dateB);
          });
        }
        
        setAppointmentStats(statsByTimeArray);
        newDebugMessages.push(`Thống kê lịch hẹn theo thời gian: ${JSON.stringify(statsByTimeArray)}`);
        
      } catch (error) {
        newDebugMessages.push(`Lỗi khi tính toán thống kê: ${error}`);
      } finally {
        setDebug(newDebugMessages);
      }
    };
    
    calculateStats();
  }, [appointments, services, employees, dateRange, selectedEmployee, selectedService, statsPeriod, loading, debug]);

  return (
    <div style={{ padding: 24 }}>
      <Card title="Thống kê hoạt động kinh doanh">
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
          <Col span={24}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>Khoảng thời gian</Title>
                <RangePicker 
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  style={{ width: 280 }}
                />
              </div>
              
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>Thống kê theo</Title>
                <Radio.Group value={statsPeriod} onChange={handlePeriodChange}>
                  <Radio.Button value="day">Ngày</Radio.Button>
                  <Radio.Button value="week">Tuần</Radio.Button>
                  <Radio.Button value="month">Tháng</Radio.Button>
                </Radio.Group>
              </div>
              
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>Nhân viên</Title>
                <Select
                  style={{ width: 200 }}
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                >
                  <Option value="all">Tất cả nhân viên</Option>
                  {employees.map(emp => (
                    <Option key={emp.id} value={emp.name}>{emp.name}</Option>
                  ))}
                </Select>
              </div>
              
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>Dịch vụ</Title>
                <Select
                  style={{ width: 200 }}
                  value={selectedService}
                  onChange={handleServiceChange}
                >
                  <Option value="all">Tất cả dịch vụ</Option>
                  {services.map(service => (
                    <Option key={service.id} value={service.name}>{service.name}</Option>
                  ))}
                </Select>
              </div>
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

      </Card>
    </div>
  );
};

export default ThongKe;