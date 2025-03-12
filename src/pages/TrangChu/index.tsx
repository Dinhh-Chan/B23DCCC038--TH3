import { Card, Table } from 'antd';
import './components/style.less';
import { unitName } from '@/services/base/constant';

const members = [
	{ name: 'Lưu Đức Tuấn', id: 'B23DCCC170' },
	{ name: 'Trần Đức Định', id: 'B23DCCC038' },
	{ name: 'Nguyễn Viết Sang', id: 'B23DCCC142' },
	{ name: 'Nguyễn Minh Đức', id: 'B23DCCC042' },
];

const columns = [
	{ title: 'Tên thành viên', dataIndex: 'name', key: 'name' },
	{ title: 'Mã sinh viên', dataIndex: 'id', key: 'id' },
];

const TrangChu = () => {
	return (
		<Card bodyStyle={{ height: '100%' }}>
			<div className='home-welcome'>
				<h1 className='title'>THỰC HÀNH LẬP TRÌNH WEB</h1>
				<h2 className='sub-title'>{unitName.toUpperCase()}</h2>
				<Table 
					dataSource={members} 
					columns={columns} 
					pagination={false} 
					bordered 
					style={{ width:'60%'}}
					className='members-table' 
				/>
			</div>
		</Card>
	);
};

export default TrangChu;