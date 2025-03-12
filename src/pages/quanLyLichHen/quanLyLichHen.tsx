import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, DatePicker, TimePicker, Select, message } from "antd";
import moment from "moment";

const { Option } = Select;
const STATUS = { PENDING: "Chờ duyệt", CONFIRMED: "Xác nhận", COMPLETED: "Hoàn thành", CANCELED: "Hủy" };

// Định nghĩa thời gian cho từng dịch vụ
const SERVICE_DURATIONS = {
  "Massage": 60, // 60 phút
  "Làm móng": 30,
  "Chăm sóc da": 45,
};

const initializeLocalStorage = () => {
  const employees = ["Nhân viên A", "Nhân viên B", "Nhân viên C"];
  const sampleAppointments = [
    {
      id: Date.now(),
      date: moment().format("YYYY-MM-DD"),
      time: "20:00",
      employee: "Nhân viên A",
      service: "Massage",
      duration: 60, // Dịch vụ kéo dài 60 phút
      status: STATUS.PENDING,
    },
  ];

  if (!localStorage.getItem("employees")) {
    localStorage.setItem("employees", JSON.stringify(employees));
  }
  if (!localStorage.getItem("appointments")) {
    localStorage.setItem("appointments", JSON.stringify(sampleAppointments));
  }
};

// Gọi hàm khởi tạo
initializeLocalStorage();

const AppointmentManager = () => {
  const [appointments, setAppointments] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [form] = Form.useForm();

  const employees = JSON.parse(localStorage.getItem("employees")) || [];
  const services = Object.keys(SERVICE_DURATIONS);

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
    const appointmentTime = moment(`${date.format("YYYY-MM-DD")} ${time.format("HH:mm")}`, "YYYY-MM-DD HH:mm");
    const serviceDuration = SERVICE_DURATIONS[service];
    const endTime = appointmentTime.clone().add(serviceDuration, "minutes");

    // Kiểm tra thời gian không được là quá khứ
    if (appointmentTime.isBefore(moment())) {
      message.error("Không thể đặt lịch vào thời gian trong quá khứ!");
      return;
    }

    // Kiểm tra trùng lịch của nhân viên
    const isOverlapping = appointments.some((app) => {
      if (app.employee !== employee || (editingAppointment && app.id === editingAppointment.id)) {
        return false;
      }
      const existingStartTime = moment(`${app.date} ${app.time}`, "YYYY-MM-DD HH:mm");
      const existingEndTime = existingStartTime.clone().add(app.duration, "minutes");
      return appointmentTime.isBetween(existingStartTime, existingEndTime, "minutes", "[)") ||
             endTime.isBetween(existingStartTime, existingEndTime, "minutes", "(]") ||
             (appointmentTime.isSameOrBefore(existingStartTime) && endTime.isSameOrAfter(existingEndTime));
    });

    if (isOverlapping) {
      message.error("Nhân viên đã có lịch hẹn trong khoảng thời gian này!");
      return;
    }

    const newAppointment = {
      id: editingAppointment ? editingAppointment.id : Date.now(),
      date: date.format("YYYY-MM-DD"),
      time: time.format("HH:mm"),
      employee,
      service,
      duration: serviceDuration,
      status: STATUS.PENDING,
    };

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
        date: moment(record.date, "YYYY-MM-DD"),
        time: moment(record.time, "HH:mm"),
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
    { title: "Thời gian (phút)", dataIndex: "duration" },
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
            <DatePicker style={{ width: "100%" }} disabledDate={(current) => current.isBefore(moment().startOf("day"))} />
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
