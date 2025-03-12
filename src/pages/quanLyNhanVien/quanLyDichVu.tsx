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
  Divider, 
  message 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { confirm } = Modal;

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
}

const QuanLyDichVu: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // Tải danh sách dịch vụ từ localStorage khi component được render
  useEffect(() => {
    const storedServices = localStorage.getItem('booking-app-services');
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    }
  }, []);

  // Lưu danh sách dịch vụ vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('booking-app-services', JSON.stringify(services));
  }, [services]);

  // Xử lý khi mở form thêm mới
  const handleAddNew = () => {
    setEditingService(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Xử lý khi mở form sửa
  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue({
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes,
      description: service.description,
    });
    setIsModalVisible(true);
  };

  // Xử lý khi xóa dịch vụ
  const handleDelete = (id: string) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa dịch vụ này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        setServices(services.filter(service => service.id !== id));
        message.success('Đã xóa dịch vụ thành công');
      },
    });
  };

  // Xử lý khi submit form
  const handleSubmit = (values: any) => {
    if (editingService) {
      // Cập nhật dịch vụ hiện có
      const updatedServices = services.map(service => 
        service.id === editingService.id ? 
          { 
            ...values, 
            id: service.id
          } as Service : service
      );
      setServices(updatedServices);
      message.success('Cập nhật dịch vụ thành công!');
    } else {
      // Thêm dịch vụ mới
      const newService: Service = {
        ...values,
        id: uuidv4(),
      };
      
      setServices([...services, newService]);
      message.success('Thêm dịch vụ mới thành công!');
    }

    setIsModalVisible(false);
    form.resetFields();
  };

  // Lọc dịch vụ theo từ khóa tìm kiếm
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format số tiền thành VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Quản Lý Dịch Vụ
      </Title>
      
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Search
          placeholder="Tìm kiếm dịch vụ..."
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
          Thêm Dịch Vụ Mới
        </Button>
      </Space>

      {filteredServices.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '30px' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Không có dịch vụ nào. Vui lòng thêm dịch vụ mới.
          </Text>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={filteredServices}
          renderItem={service => (
            <List.Item>
              <Card
                hoverable
                title={service.name}
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit(service)}
                  >
                    Sửa
                  </Button>,
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(service.id)}
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <Descriptions column={1}>
                  <Descriptions.Item label="Giá">
                    <Text type="success" strong style={{ fontSize: 16 }}>
                      {formatCurrency(service.price)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian">
                    {service.durationMinutes} phút
                  </Descriptions.Item>
                </Descriptions>
                {service.description && (
                  <>
                    <Divider plain>Mô tả</Divider>
                    <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                      {service.description}
                    </Paragraph>
                  </>
                )}
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Modal thêm/sửa dịch vụ */}
      <Modal
        title={editingService ? 'Cập Nhật Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: '',
            price: 0,
            durationMinutes: 30,
            description: '',
          }}
        >
          <Form.Item
            name="name"
            label="Tên Dịch Vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ!' }]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập giá dịch vụ!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={10000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => {
                return value ? Number(value.replace(/[^\d]/g, '')) as any : 0;
              }}
              placeholder="Nhập giá dịch vụ"
            />
          </Form.Item>
          
          <Form.Item
            name="durationMinutes"
            label="Thời Gian Thực Hiện (phút)"
            rules={[{ required: true, message: 'Vui lòng nhập thời gian thực hiện!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={5}
              step={5}
              placeholder="Nhập thời gian thực hiện"
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô Tả"
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả dịch vụ (không bắt buộc)" />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingService ? 'Cập Nhật' : 'Thêm Mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuanLyDichVu;