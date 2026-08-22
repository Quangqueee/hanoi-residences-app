/** Nội dung pháp lý / FAQ — đồng bộ website `faq.ts`, `dieu-khoan`, `chinh-sach-bao-mat`. */

export const SITE_INFO = {
  name: 'Hanoi Residences',
  url: 'https://hanoiresidence.site',
  telephoneDisplay: '081.2442.111',
  email: 'quangluxury6886@gmail.com',
  founderName: 'Nguyễn Đức Quang',
  streetAddress: '173B Trường Chinh',
  addressLocality: 'Đống Đa',
  addressRegion: 'Hà Nội',
} as const;

export const LEGAL_UPDATED_AT = '19/08/2026';

export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Hanoi Residences là gì?',
    answer:
      'Hanoi Residences là nền tảng cho thuê căn hộ chung cư cao cấp và căn hộ dịch vụ tại Hà Nội, hoạt động từ năm 2020. Chúng tôi cung cấp thông tin minh bạch về giá, hình ảnh thực tế, tiện ích, và hỗ trợ khách thuê từ khâu tìm kiếm đến ký hợp đồng.',
  },
  {
    question: 'Cho thuê căn hộ ở những quận nào tại Hà Nội?',
    answer:
      'Danh mục tập trung các khu vực trung tâm và nơi có đông cộng đồng người nước ngoài: Tây Hồ, Ba Đình, Cầu Giấy, Đống Đa, Thanh Xuân, Nam Từ Liêm (Mỹ Đình), cùng các khu lân cận như Trung Hòa - Nhân Chính.',
  },
  {
    question: 'Giá thuê căn hộ khoảng bao nhiêu?',
    answer:
      'Mức giá niêm yết thường dao động từ khoảng 5 triệu đến 50 triệu đồng/tháng, tùy loại phòng, diện tích, nội thất và vị trí. Giá từng căn được ghi rõ trên trang chi tiết và xác nhận lại khi xem nhà.',
  },
  {
    question:
      'Có hỗ trợ khách nước ngoài, chuyên gia Nhật Bản và Hàn Quốc không?',
    answer:
      'Có. Hanoi Residences phục vụ cả khách Việt Nam và cộng đồng expat. Chúng tôi hỗ trợ xem nhà, tư vấn khu vực và thủ tục hợp đồng thuê.',
  },
  {
    question: 'Làm sao để xem nhà và đặt lịch?',
    answer: `Chọn căn hộ trên app hoặc website, sau đó đặt lịch trong app hoặc liên hệ ${SITE_INFO.founderName} qua điện thoại ${SITE_INFO.telephoneDisplay}, Zalo ${SITE_INFO.telephoneDisplay.replace(/\./g, '')}.`,
  },
  {
    question: 'Đặt cọc và thời hạn hợp đồng thuê như thế nào?',
    answer:
      'Điều kiện cọc và thời hạn hợp đồng phụ thuộc từng căn và thỏa thuận với bên cho thuê. Không chốt số tiền cọc qua điện thoại nếu chưa xem nhà và chưa xác nhận nguồn.',
  },
  {
    question: 'Căn hộ có cho nuôi thú cưng không?',
    answer:
      'Tùy từng căn. Một số listing được gắn nhãn pet friendly. Nếu chưa ghi rõ, hãy hỏi tư vấn viên trước khi xem nhà.',
  },
  {
    question: 'Giá thuê đã gồm phí dịch vụ, gửi xe, internet chưa?',
    answer:
      'Không mặc định. Phí dịch vụ, gửi xe, điện nước được ghi trong mô tả khi có dữ liệu. Luôn xác nhận lại khi xem nhà.',
  },
  {
    question: 'Căn hộ có sẵn nội thất không? Có hỗ trợ đăng ký tạm trú không?',
    answer:
      'Hầu hết căn hộ dịch vụ full nội thất. Hanoi Residences hỗ trợ hướng dẫn thủ tục hợp đồng và tạm trú khi nguồn cho phép.',
  },
  {
    question: 'Tôi là chủ nhà, làm sao để đăng căn hộ hoặc hợp tác quản lý?',
    answer: `Đăng ký hợp tác trong app (Profile → Đăng ký Chủ nhà) hoặc trên website. Văn phòng: ${SITE_INFO.streetAddress}, ${SITE_INFO.addressLocality}, ${SITE_INFO.addressRegion}.`,
  },
];

export type LegalSection = { title: string; body: string };

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Chấp nhận điều khoản',
    body: `Khi sử dụng app hoặc truy cập ${SITE_INFO.url}, bạn đồng ý với các điều khoản này và với Chính sách bảo mật. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.`,
  },
  {
    title: '2. Vai trò của Hanoi Residences',
    body: `${SITE_INFO.name} là đơn vị môi giới / tư vấn cho thuê căn hộ và căn hộ dịch vụ tại Hà Nội. Thông tin nhằm hỗ trợ tìm kiếm; điều kiện thuê chính thức được xác nhận khi xem nhà và ký hợp đồng.`,
  },
  {
    title: '3. Thông tin căn hộ',
    body: 'Giá, tình trạng còn trống, nội thất, phí dịch vụ và hình ảnh có thể thay đổi theo nguồn. Khách nên xem nhà trực tiếp trước khi đặt cọc.',
  },
  {
    title: '4. Đặt lịch, đặt cọc và hợp đồng',
    body: 'Việc đặt lịch xem nhà không tạo nghĩa vụ thuê. Tiền đặt cọc, thời hạn hợp đồng và quy định tòa nhà do các bên thỏa thuận bằng văn bản.',
  },
  {
    title: '5. Tài khoản người dùng',
    body: 'Bạn chịu trách nhiệm bảo mật tài khoản đăng nhập. Không đăng nội dung sai sự thật, spam, hoặc sử dụng dịch vụ cho mục đích trái pháp luật.',
  },
  {
    title: '6. Chủ nhà và đối tác',
    body: 'Chủ nhà cam kết thông tin đăng ký và căn hộ là chính xác, có quyền cho thuê. Hoa hồng và phạm vi hợp tác được thỏa thuận riêng sau khi đăng ký.',
  },
  {
    title: '7. Sở hữu trí tuệ',
    body: `Tên thương hiệu, giao diện, mô tả do ${SITE_INFO.name} tạo và hình ảnh do chúng tôi sản xuất thuộc quyền của đơn vị.`,
  },
  {
    title: '8. Giới hạn trách nhiệm',
    body: 'Dịch vụ cung cấp thông tin theo hiện trạng. Chúng tôi không chịu trách nhiệm đối với thiệt hại gián tiếp phát sinh từ việc dựa hoàn toàn vào tin đăng mà không xem nhà.',
  },
  {
    title: '9. Liên hệ',
    body: `${SITE_INFO.name} — ${SITE_INFO.streetAddress}, ${SITE_INFO.addressLocality}, ${SITE_INFO.addressRegion}. Điện thoại: ${SITE_INFO.telephoneDisplay}. Email: ${SITE_INFO.email}. Người đại diện: ${SITE_INFO.founderName}.`,
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Phạm vi áp dụng',
    body: `Chính sách này áp dụng cho website ${SITE_INFO.url} và ứng dụng di động ${SITE_INFO.name} khi bạn tìm kiếm căn hộ, tạo tài khoản, lưu yêu thích, đặt lịch xem nhà, hoặc đăng ký hợp tác.`,
  },
  {
    title: '2. Thông tin chúng tôi thu thập',
    body: 'Tùy thao tác: họ tên, số điện thoại, email, nội dung tin nhắn, thông tin tài khoản (Firebase Auth), căn hộ yêu thích, yêu cầu hợp tác, token thông báo đẩy (Expo), và dữ liệu kỹ thuật cần thiết để vận hành app.',
  },
  {
    title: '3. Mục đích sử dụng',
    body: 'Liên hệ tư vấn thuê nhà, sắp xếp xem nhà, xử lý đăng ký đối tác, gửi thông báo liên quan tài khoản/lịch hẹn, cải thiện trải nghiệm, và tuân thủ nghĩa vụ pháp lý khi có yêu cầu hợp lệ.',
  },
  {
    title: '4. Lưu trữ và bên thứ ba',
    body: 'Dữ liệu được lưu trên hạ tầng Firebase (Google). Chúng tôi không bán danh sách khách hàng cho bên thứ ba để quảng cáo không liên quan.',
  },
  {
    title: '5. Thời gian lưu và quyền của bạn',
    body: `Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa thông tin bằng email ${SITE_INFO.email} hoặc mục Xóa tài khoản trong Profile. Một số dữ liệu giao dịch / hợp đồng có thể được giữ lại để giải quyết tranh chấp.`,
  },
  {
    title: '6. Thông báo đẩy',
    body: 'App có thể đăng ký Expo Push Token để gửi thông báo liên quan lịch hẹn và cập nhật tài khoản. Bạn có thể tắt quyền thông báo trong cài đặt hệ thống.',
  },
  {
    title: '7. Liên hệ về quyền riêng tư',
    body: `Đơn vị: ${SITE_INFO.name}. Địa chỉ: ${SITE_INFO.streetAddress}, ${SITE_INFO.addressLocality}, ${SITE_INFO.addressRegion}. Email: ${SITE_INFO.email}. Điện thoại: ${SITE_INFO.telephoneDisplay}.`,
  },
];
