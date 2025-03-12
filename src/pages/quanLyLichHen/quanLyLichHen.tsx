import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, DatePicker, TimePicker, Select, Input, Space, Tag, message, Card, Typography, Row, Col, Statistic } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult, TableCurrentDataSource } from "antd/es/table/interface";
import moment from "moment";
import "moment/locale/vi";
import { v4 as uuidv4 } from "uuid";

// Import interface từ các component khác
import { Employee } from "../quanLyNhanVien/qlnv";
import { Service } from "../quanLyNhanVien/quanLyDichVu";

// Cấu hình moment
moment.locale('vi');

const { Option } = Select;
const { Title } = Typography;
const { RangePicker } = DatePicker;

// Định nghĩa các trạng thái lịch hẹn
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
  employee: string; // Tên nhân viên (không phải ID)
  service: string;  // Tên dịch vụ (không phải ID)
  status: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
}

const QuanLyLichHen: React.FC = () => {
  // Khai báo state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[moment.Moment | null, moment.Moment | null] | null>(null);
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
  const [sortedInfo, setSortedInfo] = useState<SorterResult<Appointment>>({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Lấy tên ngày trong tuần
  const getDayName = (day: number): string => {
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return days[day];
  };
  
  // Tải dữ liệu từ localStorage khi component được render
  useEffect(() => {
    loadDataFromStorage();
  }, []);
  
  // Đăng ký xử lý khi component unmount
  useEffect(() => {
    return () => {
      // Cleanup code if needed
    };
  }, []);
  
  // Hàm tải dữ liệu từ localStorage
  const loadDataFromStorage = () => {
    // Tải danh sách lịch hẹn
    const storedAppointments = localStorage.getItem("appointments");
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }
    
    // Tải danh sách nhân viên
    const storedEmployees = localStorage.getItem("booking-app-employees");
    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees));
    } else {
      console.warn("Không tìm thấy danh sách nhân viên trong localStorage");
    }
    
    // Tải danh sách dịch vụ
    const storedServices = localStorage.getItem("booking-app-services");
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    } else {
      console.warn("Không tìm thấy danh sách dịch vụ trong localStorage");
    }
  };
  
  // Lưu lịch hẹn vào localStorage
  const saveAppointments = (data: Appointment[]) => {
    localStorage.setItem("appointments", JSON.stringify(data));
    setAppointments(data);
  };
  
  // Kiểm tra nếu ngày đã chọn là ngày làm việc của nhân viên
  const isWorkingDay = (employeeName: string, date: moment.Moment): boolean => {
    const employee = employees.find(emp => emp.name === employeeName);
    if (!employee) return false;
    
    const dayOfWeek = date.day(); // 0 = Chủ nhật, 1-6 = Thứ 2 - Thứ 7
    return employee.workingDays.includes(dayOfWeek);
  };
  
  // Lấy dịch vụ của nhân viên
  const getEmployeeServices = (employeeName: string): Service[] => {
    // Tìm nhân viên theo tên để lấy ID
    const employee = employees.find(emp => emp.name === employeeName);
    
    if (!employee) {
      console.warn(`Không tìm thấy nhân viên có tên: ${employeeName}`);
      return [];
    }
    
    // Debug
    console.log("Nhân viên được chọn:", employee);
    console.log("Danh sách dịch vụ:", services);
    console.log("Các ID dịch vụ của nhân viên:", employee.services);
    
    // Lọc dịch vụ dựa trên ID dịch vụ của nhân viên
    const employeeServices = services.filter(service => 
      employee.services.includes(service.id)
    );
    
    console.log("Các dịch vụ của nhân viên sau khi lọc:", employeeServices);
    
    return employeeServices;
  };
  
  // Kiểm tra trùng lịch với nhân viên 
  const checkOverlappingAppointment = (values: any): boolean => {
    const date = values.date.format('YYYY-MM-DD');
    const timeStart = moment(`${date} ${values.time.format('HH:mm')}`);
    
    // Tìm dịch vụ được chọn
    const selectedService = services.find(svc => svc.name === values.service);
    if (!selectedService) return false;
    
    // Tính thời gian kết thúc
    const timeEnd = moment(timeStart).add(selectedService.durationMinutes, 'minute');
    
    // Kiểm tra xem có trùng với lịch hẹn nào khác không
    const existingAppointments = appointments.filter(app => 
      app.date === date && 
      app.employee === values.employee &&
      (editingAppointment ? app.id !== editingAppointment.id : true)
    );
    
    for (const app of existingAppointments) {
      const appTimeStart = moment(`${app.date} ${app.time}`);
      
      // Tìm dịch vụ của lịch hẹn hiện tại
      const appService = services.find(svc => svc.name === app.service);
      if (!appService) continue;
      
      const appTimeEnd = moment(appTimeStart).add(appService.durationMinutes, 'minute');
      
      // Kiểm tra có trùng thời gian không
      if (
        (timeStart.isSameOrAfter(appTimeStart) && timeStart.isBefore(appTimeEnd)) ||
        (timeEnd.isAfter(appTimeStart) && timeEnd.isSameOrBefore(appTimeEnd)) ||
        (timeStart.isBefore(appTimeStart) && timeEnd.isAfter(appTimeEnd))
      ) {
        return true;
      }
    }
    
    return false;
  };
  
  // Kiểm tra xem thời gian đã chọn có nằm trong giờ làm việc của nhân viên không
  const isWithinWorkingHours = (employeeName: string, time: moment.Moment): boolean => {
    const employee = employees.find(emp => emp.name === employeeName);
    if (!employee) return false;
    
    const startTime = moment(employee.workingHours.start, "HH:mm");
    const endTime = moment(employee.workingHours.end, "HH:mm");
    const selectedTime = moment(time.format("HH:mm"), "HH:mm");
    
    return selectedTime.isAfter(startTime) && selectedTime.isBefore(endTime);
  };
  
  // Kiểm tra nhân viên đã đạt đến số lượng khách tối đa trong ngày chưa
  const isEmployeeAvailable = (employeeName: string, date: string): boolean => {
    const employee = employees.find(emp => emp.name === employeeName);
    if (!employee) return false;
    
    const appointmentsForDay = appointments.filter(app => 
      app.employee === employeeName && 
      app.date === date && 
      (app.status === STATUS.PENDING || app.status === STATUS.CONFIRMED)
    );
    
    return appointmentsForDay.length < employee.maxCustomersPerDay;
  };
  
  // Xử lý khi thay đổi nhân viên
  const handleEmployeeChange = (value: string) => {
    // Cần reset field dịch vụ khi thay đổi nhân viên
    form.setFieldsValue({ service: undefined });
    
    // Tìm nhân viên theo tên
    const employee = employees.find(emp => emp.name === value);
    if (employee) {
      setSelectedEmployeeId(employee.id);
      
      // Kiểm tra ngày làm việc
      const selectedDate = form.getFieldValue('date');
      if (selectedDate) {
        const dayOfWeek = selectedDate.day();
        if (!employee.workingDays.includes(dayOfWeek)) {
          message.warning(`Nhân viên ${employee.name} không làm việc vào ${getDayName(dayOfWeek)}!`);
        }
      }
      
      // Load lại dịch vụ
      console.log("Đã chọn nhân viên:", employee.name);
      console.log("ID dịch vụ của nhân viên:", employee.services);
    }
  };
  
  // Xử lý khi thêm hoặc cập nhật lịch hẹn
  const handleAddOrUpdate = (values: any) => {
    const { date, time, employee, service, customerName, customerPhone, note } = values;
    
    // Chuyển đổi date và time sang định dạng chuẩn
    const formattedDate = date.format("YYYY-MM-DD");
    const formattedTime = time.format("HH:mm");
    
    // Kiểm tra nếu ngày đã chọn là ngày làm việc của nhân viên
    if (!isWorkingDay(employee, date)) {
      message.error(`Nhân viên ${employee} không làm việc vào ${getDayName(date.day())}`);
      return;
    }
    
    // Kiểm tra nếu thời gian đã chọn nằm trong giờ làm việc của nhân viên
    if (!isWithinWorkingHours(employee, time)) {
      message.error(`Thời gian đã chọn không nằm trong giờ làm việc của nhân viên ${employee}`);
      return;
    }
    
    // Kiểm tra xem nhân viên đã đạt đến số lượng khách tối đa trong ngày chưa
    if (!isEmployeeAvailable(employee, formattedDate)) {
      message.error(`Nhân viên ${employee} đã đạt đến số lượng khách tối đa trong ngày này`);
      return;
    }
    
    // Kiểm tra trùng lịch
    if (checkOverlappingAppointment(values)) {
      message.error("Lịch hẹn bị trùng với lịch hẹn khác của nhân viên này");
      return;
    }
    
    if (editingAppointment) {
      // Cập nhật lịch hẹn
      const updatedAppointments = appointments.map(app => 
        app.id === editingAppointment.id 
          ? { 
              ...app, 
              date: formattedDate,
              time: formattedTime,
              employee,
              service,
              customerName,
              customerPhone,
              note
            } 
          : app
      );
      
      saveAppointments(updatedAppointments);
      message.success("Cập nhật lịch hẹn thành công!");
      
    } else {
      // Thêm lịch hẹn mới
      const newAppointment: Appointment = {
        id: uuidv4(),
        date: formattedDate,
        time: formattedTime,
        employee,
        service,
        status: STATUS.PENDING,
        customerName,
        customerPhone,
        note
      };
      
      saveAppointments([...appointments, newAppointment]);
      message.success("Đặt lịch hẹn thành công!");
    }
    
    setVisible(false);
  };
  
  // Xử lý khi chuyển trạng thái lịch hẹn
  const handleChangeStatus = (record: Appointment, newStatus: string) => {
    Modal.confirm({
      title: `Xác nhận ${newStatus === STATUS.CANCELED ? "hủy" : "chuyển trạng thái"}`,
      content: `Bạn có chắc chắn muốn ${newStatus === STATUS.CANCELED ? "hủy" : `chuyển sang trạng thái "${newStatus}"`} lịch hẹn này?`,
      onOk() {
        const updatedAppointments = appointments.map(app => 
          app.id === record.id ? { ...app, status: newStatus } : app
        );
        saveAppointments(updatedAppointments);
        message.success(`${newStatus === STATUS.CANCELED ? "Hủy" : "Cập nhật trạng thái"} lịch hẹn thành công!`);
      },
    });
  };
  
  // Xử lý khi thay đổi bảng (sắp xếp, lọc)
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Appointment> | SorterResult<Appointment>[],
    _: TableCurrentDataSource<Appointment>
  ) => {
    setFilteredInfo(filters);
    setSortedInfo(Array.isArray(sorter) ? sorter[0] : sorter);
  };
  
  // Lấy danh sách lịch hẹn đã được lọc
  const getFilteredAppointments = () => {
    let filtered = [...appointments];
    
    // Lọc theo ngày
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      
      filtered = filtered.filter(app => 
        app.date >= startDate && app.date <= endDate
      );
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(app => 
        (app.customerName && app.customerName.toLowerCase().includes(search)) ||
        (app.customerPhone && app.customerPhone.toLowerCase().includes(search)) ||
        app.employee.toLowerCase().includes(search) ||
        app.service.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };
  
  // Thống kê lịch hẹn theo trạng thái
  const appointmentStats = {
    total: appointments.length,
    pending: appointments.filter(app => app.status === STATUS.PENDING).length,
    confirmed: appointments.filter(app => app.status === STATUS.CONFIRMED).length,
    completed: appointments.filter(app => app.status === STATUS.COMPLETED).length,
    canceled: appointments.filter(app => app.status === STATUS.CANCELED).length,
  };
  
  // Xử lý khi thêm mới lịch hẹn
  const handleAddNew = () => {
    setEditingAppointment(null);
    setSelectedEmployeeId(null);
    form.resetFields();
    
    // Đặt ngày mặc định là hôm nay
    form.setFieldsValue({
      date: moment(),
    });
    
    // Tải lại dữ liệu từ localStorage để đảm bảo có dữ liệu mới nhất
    loadDataFromStorage();
    
    setVisible(true);
  };
  
  // Xử lý khi sửa lịch hẹn
  const handleEdit = (record: Appointment) => {
    setEditingAppointment(record);
    
    // Tìm ID của nhân viên dựa trên tên
    const employee = employees.find(emp => emp.name === record.employee);
    setSelectedEmployeeId(employee?.id || null);
    
    // Tải lại dữ liệu từ localStorage để đảm bảo có dữ liệu mới nhất
    loadDataFromStorage();
    
    form.setFieldsValue({
      date: moment(record.date),
      time: moment(record.time, "HH:mm"),
      employee: record.employee,
      service: record.service,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      note: record.note,
    });
    
    setVisible(true);
  };
  
  // Xử lý khi xóa lịch hẹn
  const handleDelete = (record: Appointment) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa lịch hẹn này?",
      onOk() {
        const updatedAppointments = appointments.filter(app => app.id !== record.id);
        saveAppointments(updatedAppointments);
        message.success("Xóa lịch hẹn thành công!");
      },
    });
  };
  
  // Định nghĩa cột cho bảng lịch hẹn
  const columns: ColumnsType<Appointment> = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => a.date.localeCompare(b.date),
      sortOrder: sortedInfo.columnKey === 'date' ? sortedInfo.order : null,
      render: (date: string) => <>{moment(date).format("DD/MM/YYYY")}</>,
    },
    {
      title: "Giờ",
      dataIndex: "time",
      key: "time",
      sorter: (a, b) => a.time.localeCompare(b.time),
      sortOrder: sortedInfo.columnKey === 'time' ? sortedInfo.order : null,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      render: (_: any, record: Appointment) => (
        <>
          <div>{record.customerName || "Chưa có tên"}</div>
          <div>{record.customerPhone || "Chưa có SĐT"}</div>
        </>
      ),
    },
    {
      title: "Nhân viên",
      dataIndex: "employee",
      key: "employee",
      filters: employees.map(emp => ({ text: emp.name, value: emp.name })),
      filteredValue: filteredInfo.employee as string[] || null,
      onFilter: (value: string | number | boolean, record: Appointment) => 
        record.employee === value.toString(),
    },
    {
      title: "Dịch vụ",
      dataIndex: "service",
      key: "service",
      filters: services.map(svc => ({ text: svc.name, value: svc.name })),
      filteredValue: filteredInfo.service as string[] || null,
      onFilter: (value: string | number | boolean, record: Appointment) => 
        record.service === value.toString(),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: Object.values(STATUS).map(status => ({ text: status, value: status })),
      filteredValue: filteredInfo.status as string[] || null,
      onFilter: (value: string | number | boolean, record: Appointment) => 
        record.status === value.toString(),
      render: (status: string) => {
        let color = 'default';
        if (status === STATUS.PENDING) color = 'gold';
        else if (status === STATUS.CONFIRMED) color = 'blue';
        else if (status === STATUS.COMPLETED) color = 'green';
        else if (status === STATUS.CANCELED) color = 'red';
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Appointment) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            type="text" 
            onClick={() => handleEdit(record)}
          />
          
          <Button 
            icon={<DeleteOutlined />} 
            type="text" 
            danger
            onClick={() => handleDelete(record)}
          />
          
          {record.status === STATUS.PENDING && (
            <Button 
              icon={<CheckOutlined />} 
              type="text" 
              style={{ color: '#1890ff' }}
              onClick={() => handleChangeStatus(record, STATUS.CONFIRMED)}
              title="Xác nhận"
            />
          )}
          
          {record.status === STATUS.CONFIRMED && (
            <Button 
              icon={<CheckOutlined />} 
              type="text" 
              style={{ color: '#52c41a' }}
              onClick={() => handleChangeStatus(record, STATUS.COMPLETED)}
              title="Hoàn thành"
            />
          )}
          
          {(record.status === STATUS.PENDING || record.status === STATUS.CONFIRMED) && (
            <Button 
              icon={<CloseOutlined />} 
              type="text" 
              danger
              onClick={() => handleChangeStatus(record, STATUS.CANCELED)}
              title="Hủy"
            />
          )}
        </Space>
      ),
    },
  ];
  
  // Validate form trước khi lưu
  const validateBeforeSave = (values: any): boolean => {
    // Lấy thông tin nhân viên
    const employee = employees.find(emp => emp.name === values.employee);
    if (!employee) {
      message.error("Không tìm thấy thông tin nhân viên!");
      return false;
    }
    
    const selectedDate = values.date;
    const dayOfWeek = selectedDate.day();
    
    // Kiểm tra ngày làm việc
    if (!employee.workingDays.includes(dayOfWeek)) {
      message.error(`Nhân viên ${employee.name} không làm việc vào ${getDayName(dayOfWeek)}!`);
      return false;
    }
    
    // Kiểm tra giờ làm việc
    const selectedTime = values.time;
    
    // Tạo đối tượng moment cho thời gian đã chọn
    const selectedHour = selectedTime.hour();
    const selectedMinute = selectedTime.minute();
    const selectedTimeForCompare = moment().hour(selectedHour).minute(selectedMinute);
    
    // Tạo đối tượng moment cho thời gian làm việc của nhân viên
    const [startHour, startMinute] = employee.workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = employee.workingHours.end.split(':').map(Number);
    
    const empStartForCompare = moment().hour(startHour).minute(startMinute);
    const empEndForCompare = moment().hour(endHour).minute(endMinute);
    
    if (selectedTimeForCompare.isBefore(empStartForCompare) || selectedTimeForCompare.isAfter(empEndForCompare)) {
      message.error(`Nhân viên ${employee.name} chỉ làm việc từ ${employee.workingHours.start} đến ${employee.workingHours.end}!`);
      return false;
    }
    
    // Kiểm tra số lượng khách tối đa trong ngày
    const existingAppointmentsForEmployee = appointments.filter(app => 
      app.date === selectedDate.format('YYYY-MM-DD') && 
      app.employee === employee.name &&
      (editingAppointment ? app.id !== editingAppointment.id : true)
    );
    
    if (existingAppointmentsForEmployee.length >= employee.maxCustomersPerDay) {
      message.error(`Nhân viên ${employee.name} đã đạt số lượng khách tối đa (${employee.maxCustomersPerDay}) trong ngày này!`);
      return false;
    }
    
    // Kiểm tra trùng lịch
    if (checkOverlappingAppointment(values)) {
      message.error("Nhân viên đã có lịch hẹn trùng thời gian này!");
      return false;
    }
    
    return true;
  };
  
  return (
    <div className="appointment-management">
      <Card style={{ marginBottom: "20px" }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={3}>Quản lý lịch hẹn</Title>
          </Col>
          <Col span={4}>
            <Statistic title="Tổng số lịch hẹn" value={appointmentStats.total} />
          </Col>
          <Col span={5}>
            <Statistic 
              title="Chờ duyệt" 
              value={appointmentStats.pending} 
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={5}>
            <Statistic 
              title="Đã xác nhận" 
              value={appointmentStats.confirmed} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={5}>
            <Statistic 
              title="Đã hoàn thành" 
              value={appointmentStats.completed} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={5}>
            <Statistic 
              title="Đã hủy" 
              value={appointmentStats.canceled} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      </Card>
      
      {/* Công cụ bảng */}
      <Card style={{ marginBottom: "20px" }}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: "16px" }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddNew}
          >
            Thêm lịch hẹn
          </Button>
          
          <Space>
            <RangePicker 
              format="DD/MM/YYYY"
              onChange={(dates) => setDateRange(dates as [moment.Moment, moment.Moment] | null)}
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: "300px" }}
            />
            <Input.Search
              placeholder="Tìm kiếm..."
              allowClear
              onSearch={setSearchText}
              style={{ width: 250 }}
            />
          </Space>
        </Space>
      </Card>
      
      {/* Bảng lịch hẹn */}
      <Table 
        columns={columns} 
        dataSource={getFilteredAppointments()} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        onChange={handleTableChange}
      />
      
      {/* Modal thêm/sửa lịch hẹn */}
      <Modal
        title={editingAppointment ? "Chỉnh sửa lịch hẹn" : "Thêm lịch hẹn"}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrUpdate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="date" 
                label="Chọn ngày" 
                rules={[
                  { required: true, message: "Vui lòng chọn ngày!" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      return moment().startOf('day').isAfter(value)
                        ? Promise.reject(new Error('Không thể chọn ngày trong quá khứ!'))
                        : Promise.resolve();
                    }
                  }
                ]}
              > 
                <DatePicker 
                  style={{ width: "100%" }} 
                  format="DD/MM/YYYY" 
                  disabledDate={(current) => {
                    // Không cho phép chọn ngày trong quá khứ
                    return current && current.isBefore(moment().startOf('day'));
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="time" 
                label="Chọn giờ" 
                rules={[{ required: true, message: "Vui lòng chọn giờ!" }]}
              > 
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: "100%" }} 
                  minuteStep={15} 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="customerName" 
                label="Tên khách hàng"
                rules={[{ required: true, message: "Vui lòng nhập tên khách hàng!" }]}
              > 
                <Input placeholder="Nhập tên khách hàng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="customerPhone" 
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { 
                    pattern: /^(0|\+84)([0-9]{9,10})$/,
                    message: "Số điện thoại không hợp lệ! Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx" 
                  }
                ]}
              > 
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            name="employee" 
            label="Nhân viên phục vụ" 
            rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
          > 
            <Select
              placeholder="Chọn nhân viên"
              onChange={handleEmployeeChange}
              showSearch
              optionFilterProp="children"
            >
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.name}>
                  {emp.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="service" 
            label="Dịch vụ" 
            rules={[{ required: true, message: "Vui lòng chọn dịch vụ!" }]}
            dependencies={['employee']}
          > 
            <Select
              placeholder="Chọn dịch vụ"
              showSearch
              optionFilterProp="children"
              disabled={!form.getFieldValue('employee')}
            >
              {form.getFieldValue('employee') ? 
                getEmployeeServices(form.getFieldValue('employee')).map((svc) => (
                  <Option key={svc.id} value={svc.name}>
                    {svc.name} ({svc.durationMinutes} phút - {svc.price.toLocaleString('vi-VN')} VNĐ)
                  </Option>
                )) : 
                <Option disabled>Vui lòng chọn nhân viên trước</Option>
              }
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="note" 
            label="Ghi chú"
          >
            <Input.TextArea rows={4} placeholder="Nhập ghi chú nếu có" />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAppointment ? 'Cập nhật' : 'Đặt lịch'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuanLyLichHen;