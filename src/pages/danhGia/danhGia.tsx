import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  Rate,
  Input,
  Button,
  List,
  Typography,
  Space,
  Avatar,
  Divider,
  Tag,
  message,
  Modal,
  Form,
  Empty,
  Comment,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Radio
} from 'antd';
import { UserOutlined, StarOutlined, CommentOutlined, FilterOutlined, SortAscendingOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/vi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Interface cho đánh giá chi tiết
interface DetailedRating {
  service: number;
  attitude: number;
  cleanliness: number;
  price: number;
  overall: number;
}

// Interface cho đánh giá
interface Review {
  id: string;
  appointmentId: string;
  customerId: string;
  customerName: string;
  employeeId: string;
  employeeName: string;
  serviceId: string;
  serviceName: string;
  rating: DetailedRating;
  comment: string;
  date: string;
  reply?: string;
  replyDate?: string;
}

const DanhGia: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [form] = Form.useForm();
  const [replyForm] = Form.useForm();
  const [filterType, setFilterType] = useState<string>('all');
  const [sortType, setSortType] = useState<string>('newest');
  const [ratingStats, setRatingStats] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  });

  // Tải dữ liệu từ localStorage
  useEffect(() => {
    loadData();
  }, []);

  // Lưu reviews vào localStorage khi có thay đổi
  useEffect(() => {
    localStorage.setItem('booking-app-reviews', JSON.stringify(reviews));
    
    // Cập nhật averageRating cho nhân viên
    if (employees.length > 0) {
      const updatedEmployees = employees.map(employee => {
        const employeeReviews = reviews.filter(review => review.employeeId === employee.id);
        const averageRating = employeeReviews.length > 0
          ? employeeReviews.reduce((acc, curr) => acc + curr.rating.overall, 0) / employeeReviews.length
          : 0;
        return { ...employee, averageRating };
      });
      
      localStorage.setItem('booking-app-employees', JSON.stringify(updatedEmployees));
    }

    // Tính toán thống kê đánh giá
    const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating.overall);
      if (rating >= 1 && rating <= 5) {
        stats[rating]++;
      }
    });
    setRatingStats(stats);
  }, [reviews]);

  const loadData = () => {
    // Tải reviews
    const storedReviews = localStorage.getItem('booking-app-reviews');
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews));
    }

    // Tải appointments
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }

    // Tải employees
    const storedEmployees = localStorage.getItem('booking-app-employees');
    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees));
    }

    // Tải services
    const storedServices = localStorage.getItem('booking-app-services');
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    }
  };

  // Lấy các lịch hẹn đã hoàn thành chưa được đánh giá
  const getUnreviewedAppointments = () => {
    return appointments.filter(appointment => 
      appointment.status === 'Hoàn thành' &&
      !reviews.some(review => review.appointmentId === appointment.id)
    );
  };

  // Xử lý khi submit đánh giá
  const handleSubmitReview = (values: any) => {
    const newReview: Review = {
      id: uuidv4(),
      appointmentId: selectedAppointment.id,
      customerId: selectedAppointment.customerPhone,
      customerName: selectedAppointment.customerName,
      employeeId: employees.find(emp => emp.name === selectedAppointment.employee)?.id || '',
      employeeName: selectedAppointment.employee,
      serviceId: services.find(svc => svc.name === selectedAppointment.service)?.id || '',
      serviceName: selectedAppointment.service,
      rating: {
        service: values.serviceRating,
        attitude: values.attitudeRating,
        cleanliness: values.cleanlinessRating,
        price: values.priceRating,
        overall: (values.serviceRating + values.attitudeRating + values.cleanlinessRating + values.priceRating) / 4
      },
      comment: values.comment,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    setReviews([...reviews, newReview]);
    message.success('Đánh giá của bạn đã được gửi thành công!');
    setIsModalVisible(false);
    form.resetFields();
  };

  // Xử lý khi nhân viên phản hồi đánh giá
  const handleSubmitReply = (values: any) => {
    if (!selectedReview) return;

    const updatedReviews = reviews.map(review => 
      review.id === selectedReview.id
        ? {
            ...review,
            reply: values.reply,
            replyDate: moment().format('YYYY-MM-DD HH:mm:ss'),
          }
        : review
    );

    setReviews(updatedReviews);
    message.success('Phản hồi đã được gửi thành công!');
    setReplyModalVisible(false);
    replyForm.resetFields();
  };

  // Hiển thị modal đánh giá
  const showReviewModal = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  // Hiển thị modal phản hồi
  const showReplyModal = (review: Review) => {
    setSelectedReview(review);
    setReplyModalVisible(true);
  };

  // Lọc và sắp xếp đánh giá
  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    // Lọc theo loại
    if (filterType !== 'all') {
      const rating = parseInt(filterType);
      filtered = filtered.filter(review => 
        Math.round(review.rating.overall) === rating
      );
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      if (sortType === 'newest') {
        return moment(b.date).valueOf() - moment(a.date).valueOf();
      } else if (sortType === 'oldest') {
        return moment(a.date).valueOf() - moment(b.date).valueOf();
      } else if (sortType === 'highest') {
        return b.rating.overall - a.rating.overall;
      } else {
        return a.rating.overall - b.rating.overall;
      }
    });

    return filtered;
  };

  // Tính tổng số đánh giá
  const getTotalReviews = () => {
    return Object.values(ratingStats).reduce((a, b) => a + b, 0);
  };

  // Tính điểm đánh giá trung bình
  const getAverageRating = () => {
    const total = getTotalReviews();
    if (total === 0) return 0;
    
    return Object.entries(ratingStats).reduce((acc, [rating, count]) => {
      return acc + (parseInt(rating) * count);
    }, 0) / total;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Đánh Giá Dịch Vụ & Nhân Viên
      </Title>

      {/* Thống kê đánh giá */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng số đánh giá"
                value={getTotalReviews()}
                suffix="đánh giá"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Điểm trung bình"
                value={getAverageRating()}
                precision={1}
                suffix={<Rate disabled defaultValue={1} count={1} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Title level={5}>Phân bố đánh giá</Title>
              {[5, 4, 3, 2, 1].map(rating => (
                <Row key={rating} align="middle" style={{ marginBottom: 8 }}>
                  <Col span={3}>
                    {rating} <StarOutlined style={{ color: '#fadb14' }} />
                  </Col>
                  <Col span={16}>
                    <Progress 
                      percent={getTotalReviews() ? (ratingStats[rating] / getTotalReviews() * 100) : 0} 
                      size="small" 
                      showInfo={false}
                    />
                  </Col>
                  <Col span={5} style={{ textAlign: 'right' }}>
                    {ratingStats[rating]}
                  </Col>
                </Row>
              ))}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Phần lịch hẹn chưa đánh giá */}
      <Card title="Lịch Hẹn Chưa Đánh Giá" style={{ marginBottom: '24px' }}>
        {getUnreviewedAppointments().length > 0 ? (
          <List
            dataSource={getUnreviewedAppointments()}
            renderItem={appointment => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    icon={<StarOutlined />}
                    onClick={() => showReviewModal(appointment)}
                  >
                    Đánh giá
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={`Dịch vụ: ${appointment.service}`}
                  description={
                    <>
                      <Text>Nhân viên: {appointment.employee}</Text>
                      <br />
                      <Text type="secondary">
                        Ngày: {moment(appointment.date).format('DD/MM/YYYY')} - 
                        Giờ: {appointment.time}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Không có lịch hẹn nào cần đánh giá" />
        )}
      </Card>

      {/* Phần hiển thị đánh giá */}
      <Card 
        title="Đánh Giá Gần Đây"
        extra={
          <Space>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
              placeholder="Lọc đánh giá"
            >
              <Option value="all">Tất cả</Option>
              <Option value="5">5 sao</Option>
              <Option value="4">4 sao</Option>
              <Option value="3">3 sao</Option>
              <Option value="2">2 sao</Option>
              <Option value="1">1 sao</Option>
            </Select>
            <Select
              value={sortType}
              onChange={setSortType}
              style={{ width: 150 }}
              placeholder="Sắp xếp"
            >
              <Option value="newest">Mới nhất</Option>
              <Option value="oldest">Cũ nhất</Option>
              <Option value="highest">Đánh giá cao nhất</Option>
              <Option value="lowest">Đánh giá thấp nhất</Option>
            </Select>
          </Space>
        }
      >
        {getFilteredAndSortedReviews().length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={getFilteredAndSortedReviews()}
            renderItem={review => (
              <List.Item>
                <Comment
                  author={<Text strong>{review.customerName}</Text>}
                  avatar={<Avatar icon={<UserOutlined />} />}
                  content={
                    <>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Text>Tổng thể:</Text>
                          <Rate disabled defaultValue={review.rating.overall} />
                          <Text>({review.rating.overall.toFixed(1)})</Text>
                        </Space>
                        <Row gutter={16}>
                          <Col span={6}>
                            <Text>Dịch vụ: {review.rating.service}</Text>
                          </Col>
                          <Col span={6}>
                            <Text>Thái độ: {review.rating.attitude}</Text>
                          </Col>
                          <Col span={6}>
                            <Text>Vệ sinh: {review.rating.cleanliness}</Text>
                          </Col>
                          <Col span={6}>
                            <Text>Giá cả: {review.rating.price}</Text>
                          </Col>
                        </Row>
                        <Paragraph style={{ margin: '8px 0' }}>
                          {review.comment}
                        </Paragraph>
                        <Space>
                          <Tag color="blue">{review.serviceName}</Tag>
                          <Tag color="green">Nhân viên: {review.employeeName}</Tag>
                        </Space>
                      </Space>
                    </>
                  }
                  datetime={moment(review.date).format('DD/MM/YYYY HH:mm')}
                />
                
                {/* Phần phản hồi của nhân viên */}
                {review.reply && (
                  <Comment
                    style={{ marginLeft: 44 }}
                    author={<Text strong>{review.employeeName} (Nhân viên)</Text>}
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    content={review.reply}
                    datetime={moment(review.replyDate).format('DD/MM/YYYY HH:mm')}
                  />
                )}
                
                {/* Nút phản hồi cho nhân viên */}
                {!review.reply && (
                  <Button
                    type="link"
                    icon={<CommentOutlined />}
                    onClick={() => showReplyModal(review)}
                    style={{ marginLeft: 44 }}
                  >
                    Phản hồi
                  </Button>
                )}
                
                <Divider />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Chưa có đánh giá nào" />
        )}
      </Card>

      {/* Modal đánh giá */}
      <Modal
        title="Đánh Giá Dịch Vụ & Nhân Viên"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} onFinish={handleSubmitReview} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serviceRating"
                label="Chất lượng dịch vụ"
                rules={[{ required: true, message: 'Vui lòng đánh giá chất lượng dịch vụ!' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="attitudeRating"
                label="Thái độ phục vụ"
                rules={[{ required: true, message: 'Vui lòng đánh giá thái độ phục vụ!' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cleanlinessRating"
                label="Vệ sinh sạch sẽ"
                rules={[{ required: true, message: 'Vui lòng đánh giá vệ sinh!' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priceRating"
                label="Giá cả hợp lý"
                rules={[{ required: true, message: 'Vui lòng đánh giá giá cả!' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="comment"
            label="Nhận xét"
            rules={[{ required: true, message: 'Vui lòng nhập nhận xét!' }]}
          >
            <TextArea rows={4} placeholder="Nhập nhận xét của bạn..." />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Gửi đánh giá
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal phản hồi */}
      <Modal
        title="Phản Hồi Đánh Giá"
        visible={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        footer={null}
      >
        <Form form={replyForm} onFinish={handleSubmitReply} layout="vertical">
          <Form.Item
            name="reply"
            label="Phản hồi"
            rules={[{ required: true, message: 'Vui lòng nhập phản hồi!' }]}
          >
            <TextArea rows={4} placeholder="Nhập phản hồi của bạn..." />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReplyModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Gửi phản hồi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DanhGia;
