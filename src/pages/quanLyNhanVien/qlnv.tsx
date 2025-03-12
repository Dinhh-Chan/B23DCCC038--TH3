import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  Button,
  Input,
  Form,
  InputNumber,
  Typography,
  List,
  Space,
  Modal,
  Descriptions,
  Avatar,
  Checkbox,
  TimePicker,
  Select,
  Divider,
  message,
  Tag,
  Rate
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Search } = Input;
const { confirm } = Modal;
const { Option } = Select;

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  maxCustomersPerDay: number;
  workingDays: number[]; // 0-6 (Chủ nhật - Thứ 7)
  workingHours: {
    start: string; // Format: "HH:mm"
    end: string;   // Format: "HH:mm"
  };
  services: string[]; // Danh sách ID dịch vụ nhân viên có thể thực hiện
  averageRating: number;
  avatar?: string;
}

interface Service {
  id: string;
  name: string;
}

const QuanLyNhanVien: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [form] = Form.useForm();

  // Hàm tải lại dịch vụ từ localStorage
  const loadServicesFromStorage = () => {
    const storedServices = localStorage.getItem('booking-app-services');
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    } else {
      // Tạo một số dịch vụ mẫu nếu chưa có
      const sampleServices = [
        { id: 'service-1', name: 'Cắt tóc' , price: '300000'},
        { id: 'service-2', name: 'Nhuộm tóc' , price: '300000'},
        { id: 'service-3', name: 'Làm móng' , price: "300000"},
        { id: 'service-4', name: 'Massage' , price: "300000"},
      ];
      setServices(sampleServices);
      localStorage.setItem('booking-app-services', JSON.stringify(sampleServices));
    }
  };

  // Tải danh sách nhân viên và dịch vụ từ localStorage khi component được render
  useEffect(() => {
    const storedEmployees = localStorage.getItem('booking-app-employees');
    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees));
    }

    // Tải dịch vụ ban đầu
    loadServicesFromStorage();

    // Thêm event listener để lắng nghe sự kiện visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadServicesFromStorage();
      }
    };

    // Thêm event listener khi window được focus lại
    const handleWindowFocus = () => {
      loadServicesFromStorage();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup listeners khi component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Lưu danh sách nhân viên vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('booking-app-employees', JSON.stringify(employees));
  }, [employees]);

  // Khi mở modal thêm/sửa nhân viên, tải lại dịch vụ mới nhất
  const handleAddNew = () => {
    setEditingEmployee(null);
    form.resetFields();
    form.setFieldsValue({
      maxCustomersPerDay: 10,
      workingDays: [1, 2, 3, 4, 5],
      workingHours: [moment('08:00', 'HH:mm'), moment('17:00', 'HH:mm')],
      services: [],
    });
    // Tải lại dịch vụ mới nhất khi mở modal
    loadServicesFromStorage();
    setIsModalVisible(true);
  };

  // Tương tự, khi mở form sửa, cũng tải lại dịch vụ mới nhất
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      name: employee.name,
      phone: employee.phone,
      email: employee.email,
      position: employee.position,
      maxCustomersPerDay: employee.maxCustomersPerDay,
      workingDays: employee.workingDays,
      workingHours: [
        moment(employee.workingHours.start, 'HH:mm'),
        moment(employee.workingHours.end, 'HH:mm')
      ],
      services: employee.services,
    });
    // Tải lại dịch vụ mới nhất khi mở modal
    loadServicesFromStorage();
    setIsModalVisible(true);
  };

  // Xử lý khi xóa nhân viên
  const handleDelete = (id: string) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa nhân viên này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        setEmployees(employees.filter(employee => employee.id !== id));
        message.success('Đã xóa nhân viên thành công');
      },
    });
  };

  // Xử lý khi submit form
  const handleSubmit = (values: any) => {
    // Chuyển đổi từ moment objects sang string cho workingHours
    const workingHours = {
      start: values.workingHours[0].format('HH:mm'),
      end: values.workingHours[1].format('HH:mm')
    };

    if (editingEmployee) {
      // Cập nhật nhân viên hiện có
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id ? 
          { 
            ...values,
            id: emp.id,
            workingHours,
            averageRating: emp.averageRating || 0,
            services: values.services || []
          } as Employee : emp
      );
      setEmployees(updatedEmployees);
      message.success('Cập nhật nhân viên thành công!');
    } else {
      // Thêm nhân viên mới
      const newEmployee: Employee = {
        ...values,
        id: uuidv4(),
        workingHours,
        averageRating: 0,
        services: values.services || []
      };
      
      setEmployees([...employees, newEmployee]);
      message.success('Thêm nhân viên mới thành công!');
    }

    setIsModalVisible(false);
    form.resetFields();
  };

  // Lấy tên ngày trong tuần
  const getDayName = (day: number): string => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[day];
  };

  // Lấy tên dịch vụ từ id
  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Dịch vụ không xác định';
  };

  // Lọc nhân viên theo từ khóa tìm kiếm
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone.includes(searchTerm) ||
    (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.position && employee.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Quản Lý Nhân Viên
      </Title>
      
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Search
          placeholder="Tìm kiếm nhân viên..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          style={{ width: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={handleAddNew}
        >
          Thêm Nhân Viên Mới
        </Button>
      </Space>

      {filteredEmployees.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '30px' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Không có nhân viên nào. Vui lòng thêm nhân viên mới.
          </Text>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4 }}
          dataSource={filteredEmployees}
          renderItem={employee => (
            <List.Item>
              <Card
                hoverable
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit(employee)}
                  >
                    Sửa
                  </Button>,
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(employee.id)}
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={
                    employee.avatar ? 
                      <Avatar src={employee.avatar} size={64} /> : 
                      <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                        {employee.name.charAt(0).toUpperCase()}
                      </Avatar>
                  }
                  title={<Text strong style={{ fontSize: 18 }}>{employee.name}</Text>}
                  description={
                    <>
                      <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                        <Descriptions.Item label="SĐT">{employee.phone}</Descriptions.Item>
                        {employee.email && <Descriptions.Item label="Email">{employee.email}</Descriptions.Item>}
                        {employee.position && <Descriptions.Item label="Chức vụ">{employee.position}</Descriptions.Item>}
                        <Descriptions.Item label="Khách tối đa/ngày">{employee.maxCustomersPerDay}</Descriptions.Item>
                      </Descriptions>
                      
                      <Divider plain>Lịch làm việc</Divider>
                      <div>
                        <Space>
                          {employee.workingDays.map(day => (
                            <Tag key={day} color="blue">{getDayName(day)}</Tag>
                          ))}
                        </Space>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          {employee.workingHours.start} - {employee.workingHours.end}
                        </Text>
                      </div>
                      
                      <Divider plain>Dịch vụ</Divider>
                      <Space wrap>
                        {employee.services.length > 0 ? (
                          employee.services.map(serviceId => (
                            <Tag key={serviceId} color="green">{getServiceName(serviceId)}</Tag>
                          ))
                        ) : (
                          <Text type="secondary">Không có dịch vụ nào</Text>
                        )}
                      </Space>
                      
                      {employee.averageRating > 0 && (
                        <>
                          <Divider plain>Đánh giá</Divider>
                          <Rate disabled value={employee.averageRating} allowHalf />
                          <Text style={{ marginLeft: 8 }}>{employee.averageRating.toFixed(1)}</Text>
                        </>
                      )}
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Modal thêm/sửa nhân viên */}
      <Modal
        title={editingEmployee ? 'Cập Nhật Nhân Viên' : 'Thêm Nhân Viên Mới'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên Nhân Viên"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên!' }]}
          >
            <Input placeholder="Nhập tên nhân viên" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Số Điện Thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
          >
            <Input placeholder="Nhập email (không bắt buộc)" />
          </Form.Item>
          
          <Form.Item
            name="position"
            label="Chức Vụ"
          >
            <Input placeholder="Nhập chức vụ (không bắt buộc)" />
          </Form.Item>
          
          <Form.Item
            name="maxCustomersPerDay"
            label="Số Khách Tối Đa / Ngày"
            rules={[{ required: true, message: 'Vui lòng nhập số khách tối đa!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="workingDays"
            label="Ngày Làm Việc"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một ngày làm việc!' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Space wrap>
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <Checkbox key={day} value={day}>
                    {getDayName(day)}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
          
          <Form.Item
            name="workingHours"
            label="Giờ Làm Việc"
            rules={[{ required: true, message: 'Vui lòng chọn giờ làm việc!' }]}
          >
            <TimePicker.RangePicker 
              format="HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="services"
            label="Dịch Vụ Có Thể Thực Hiện"
          >
            <Select
              mode="multiple"
              placeholder="Chọn dịch vụ"
              style={{ width: '100%' }}
              optionFilterProp="children"
            >
              {services.map(service => (
                <Option key={service.id} value={service.id}>
                  {service.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingEmployee ? 'Cập Nhật' : 'Thêm Mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuanLyNhanVien;