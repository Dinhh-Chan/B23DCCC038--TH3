import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, DatePicker, TimePicker, Select, message } from "antd";
import dayjs from "dayjs";

const { Option } = Select;
const STATUS = { PENDING: "Chờ duyệt", CONFIRMED: "Xác nhận", COMPLETED: "Hoàn thành", CANCELED: "Hủy" };
localStorage.setItem("employees", JSON.stringify(["Nhân viên A", "Nhân viên B"]));
const initializeLocalStorage = () => {
    // Danh sách nhân viên mẫu
    const employees = ["Nhân viên A", "Nhân viên B", "Nhân viên C"];
    // Danh sách lịch hẹn mẫu
    const sampleAppointments = [
      {
        id: Date.now(),
        date: "2025-03-13",
        time: "10:00",
        employee: "Nhân viên A",
        service: "Massage",
        status: "Chờ duyệt"
      }
    ];
  
    // Kiểm tra và lưu dữ liệu nếu chưa tồn tại
    if (!localStorage.getItem("employees")) {
      localStorage.setItem("employees", JSON.stringify(employees));
    }
    if (!localStorage.getItem("appointments")) {
      localStorage.setItem("appointments", JSON.stringify(sampleAppointments));
    }
  
    console.log("Dữ liệu đã được lưu vào localStorage!");
  };
  
  // Gọi hàm để khởi tạo dữ liệu
  initializeLocalStorage();

const AppointmentManager = () => {
  const [appointments, setAppointments] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [form] = Form.useForm();
  
  const employees = JSON.parse(localStorage.getItem("employees")) || ["Nhân viên A", "Nhân viên B"];
  const services = ["Massage", "Làm móng", "Chăm sóc da"];

  useEffect(() => {
    const storedAppointments = JSON.parse(localStorage.getItem("appointments")) || [];
    setAppointments(storedAppointments);
  }, []);

  const saveAppointments = (data) => {
    localStorage.setItem("appointments", JSON.stringify(data));
    setAppointments(data);
  };

  const handleAddOrUpdate = (values) => {
    const { date, time, employee, service } = values;
    const newAppointment = {
      id: editingAppointment ? editingAppointment.id : Date.now(),
      date: date.format("YYYY-MM-DD"),
      time: time.format("HH:mm"),
      employee,
      service,
      status: STATUS.PENDING,
    };

    const isDuplicate = appointments.some(
      (app) => app.date === newAppointment.date && app.time === newAppointment.time && app.employee === newAppointment.employee
    );

    if (isDuplicate && !editingAppointment) {
      message.error("Lịch hẹn bị trùng, vui lòng chọn thời gian khác.");
      return;
    }

    const updatedAppointments = editingAppointment
      ? appointments.map((app) => (app.id === editingAppointment.id ? newAppointment : app))
      : [...appointments, newAppointment];

    saveAppointments(updatedAppointments);
    setVisible(false);
    form.resetFields();
  };

  const handleDelete = (id, status) => {
    if (status !== STATUS.PENDING) {
      message.error("Không thể xóa lịch hẹn đã được xác nhận hoặc hoàn thành.");
      return;
    }
    saveAppointments(appointments.filter((app) => app.id !== id));
  };

  const openModal = (record = null) => {
    setEditingAppointment(record);
    setVisible(true);
    
    if (record) {
      form.setFieldsValue({
        date: dayjs(record.date, "YYYY-MM-DD"),  // Chuyển đổi từ chuỗi thành dayjs
        time: dayjs(record.time, "HH:mm"),      // Chuyển đổi từ chuỗi thành dayjs
        employee: record.employee,
        service: record.service,
      });
    } else {
      form.resetFields();
    }
  };
  

  const columns = [
    { title: "Ngày", dataIndex: "date" },
    { title: "Giờ", dataIndex: "time" },
    { title: "Nhân viên", dataIndex: "employee" },
    { title: "Dịch vụ", dataIndex: "service" },
    { title: "Trạng thái", dataIndex: "status" },
    {
      title: "Hành động",
      render: (_, record) => (
        <>
          <Button disabled={record.status !== STATUS.PENDING} onClick={() => openModal(record)} type="link">
            Sửa
          </Button>
          <Button disabled={record.status !== STATUS.PENDING} onClick={() => handleDelete(record.id, record.status)} type="link" danger>
            Xóa
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" onClick={() => openModal()}>
        Đặt lịch hẹn
      </Button>
      <Table columns={columns} dataSource={appointments} rowKey="id" style={{ marginTop: 20 }} />
      <Modal
        title={editingAppointment ? "Chỉnh sửa lịch hẹn" : "Thêm lịch hẹn"}
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrUpdate}>
          <Form.Item name="date" label="Chọn ngày" rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}> 
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="time" label="Chọn giờ" rules={[{ required: true, message: "Vui lòng chọn giờ!" }]}> 
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="employee" label="Nhân viên phục vụ" rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}> 
            <Select>{employees.map((emp) => <Option key={emp} value={emp}>{emp}</Option>)}</Select>
          </Form.Item>
          <Form.Item name="service" label="Dịch vụ" rules={[{ required: true, message: "Vui lòng chọn dịch vụ!" }]}> 
            <Select>{services.map((svc) => <Option key={svc} value={svc}>{svc}</Option>)}</Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentManager;