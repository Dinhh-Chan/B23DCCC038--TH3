import React from 'react';
import { Tabs, Card } from 'antd';
import QuanLyNhanVienComponent from './qlnv';
import QuanLyDichVuComponent from './quanLyDichVu';

const { TabPane } = Tabs;

const QuanLyNhanVien: React.FC = () => {
  return (
    <Card className="card-tabs-container" style={{ margin: '24px 0' }}>
      <Tabs defaultActiveKey="nhan-vien" size="large">
        <TabPane tab="Quản lý Nhân viên" key="nhan-vien">
          <QuanLyNhanVienComponent />
        </TabPane>
        <TabPane tab="Quản lý Dịch vụ" key="dich-vu">
          <QuanLyDichVuComponent />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default QuanLyNhanVien;