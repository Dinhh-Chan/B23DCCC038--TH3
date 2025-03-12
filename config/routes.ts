export default [
	{
		path: '/user',
		layout: false,
		routes: [
			{
				path: '/user/login',
				layout: false,
				name: 'login',
				component: './user/Login',
			},
			{
				path: '/user',
				redirect: '/user/login',
			},
		],
	},

	///////////////////////////////////
	// DEFAULT MENU
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: './TrangChu',
		icon: 'HomeOutlined',
	},
	{
		path: '/gioi-thieu',
		name: 'About',
		component: './TienIch/GioiThieu',
		hideInMenu: true,
	},
	{
		path: '/random-user',
		name: 'RandomUser',
		component: './RandomUser',
		icon: 'ArrowsAltOutlined',
	},
	{
		path: '/quan_ly_lich_hen',
		name: 'Quản lý lịch hẹn',
		component: './quanLyLichHen/quanLyLichHen',
		icon: 'ArrowsAltOutlined',
	},
	{
		path: '/quan_ly_nhan_vien',
		name: 'Quản lý nhân viên & dịch vụ',
		component: './quanLyNhanVien/quanLyNhanVien',
		icon: 'ArrowsAltOutlined',
	},
	{
		path: '/danh_gia',
		name: 'Đánh giá dịch vụ & nhân viên',
		component: './danhGia/danhGia',
		icon: 'UnorderedListOutlined',
		
	},
	{
		path: '/thongKe',
		name: 'Thống kê & báo cáo',
		component: './thongKe/thongKe',
		icon: 'UnorderedListOutlined',
	}
	// DANH MUC HE THONG
	// {
	// 	name: 'DanhMuc',
	// 	path: '/danh-muc',
	// 	icon: 'copy',
	// 	routes: [
	// 		{
	// 			name: 'ChucVu',
	// 			path: 'chuc-vu',
	// 			component: './DanhMuc/ChucVu',
	// 		},
	// 	],
	// },

	{
		path: '/notification',
		routes: [
			{
				path: './subscribe',
				exact: true,
				component: './ThongBao/Subscribe',
			},
			{
				path: './check',
				exact: true,
				component: './ThongBao/Check',
			},
			{
				path: './',
				exact: true,
				component: './ThongBao/NotifOneSignal',
			},
		],
		layout: false,
		hideInMenu: true,
	},
	{
		path: '/',
	},
	{
		path: '/403',
		component: './exception/403/403Page',
		layout: false,
	},
	{
		path: '/hold-on',
		component: './exception/DangCapNhat',
		layout: false,
	},
	{
		component: './exception/404',
	},
];
