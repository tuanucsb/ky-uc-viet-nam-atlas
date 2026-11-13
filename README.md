# Ký Ức Việt Nam Atlas (1954–1975)

**Cơ sở dữ liệu & Bản đồ tưởng niệm các Chiến dịch lịch sử, Liệt sĩ, Huân chương – Danh hiệu Nhà nước, Hệ thống Nghĩa trang Liệt sĩ Quốc gia và Giải mã Phiên hiệu Đơn vị (1954–1975).**

Dự án được xây dựng như một không gian lưu trữ – tưởng niệm trang nghiêm, kết hợp **cơ sở dữ liệu quan hệ SQLite (`db/ky_uc_viet_nam.sqlite`)** cùng **giao diện bản đồ tĩnh không phụ thuộc máy chủ** để triển khai trực tiếp trên **GitHub Pages** hoặc chạy cục bộ qua REST API Python (`server.py`).

---

## Quy mô Cơ sở Dữ liệu Hiện tại

- **29 chiến dịch & trận đánh trọng điểm (1959–1975)** trải dài khắp 5 giai đoạn lịch sử: từ Khởi nghĩa Trà Bồng, Đồng Khởi – Tua Hai, Côn Đảo, Hiệp Hòa, Ấp Bắc, Bình Giã, Núi Thành, Hàm Rồng – Cha Lo, Vạn Tường – Ba Gia, Ia Đrăng, Địa đạo Củ Chi, Junction City, Khe Sanh – Làng Vây, Tết Mậu Thân 1968, Đoàn Tàu Không Số C235, Ngã ba Đồng Lộc, Đồi A Bia, Đường 9 – Nam Lào, Đắk Tô – Tân Cảnh, Chốt chặn Tàu Ô (Đường 13), Thành cổ Quảng Trị, Hang Tám Cô (Đường 20 Quyết Thắng), Điện Biên Phủ trên không, Đặc công Rừng Sác – Nhà Bè, Thượng Đức – Phước Long đến Tây Nguyên, Huế – Đà Nẵng và Xuân Lộc – Chiến dịch Hồ Chí Minh.
- **122 hồ sơ Liệt sĩ & Tập thể Anh hùng** (101 hồ sơ cá nhân + 21 tập thể chiến đấu hy sinh tại trận), có đối chiếu quê quán, phiên hiệu đơn vị chuẩn (`unit_code`), tuổi hy sinh, quá trình nhập ngũ, nơi hy sinh, di tích tưởng niệm, nơi an táng và cấp xác minh (`L4` / `L3`) do dữ liệu khai báo.
- **8 đại gia đình nhiều Liệt sĩ & Bà Mẹ Việt Nam Anh hùng** (28 hồ sơ Liệt sĩ liên kết trong Atlas) từ Bắc vào Nam: Đại gia đình hai Bà Mẹ VNAH Nguyễn Thị Thứ & Lê Thị Trị (Điện Bàn, Quảng Nam — 12 Liệt sĩ), Mẹ VNAH Nguyễn Thị Rành (Củ Chi — 10 Liệt sĩ), Mẹ VNAH Trần Thị Mít (Hải Lăng, Quảng Trị — 9 Liệt sĩ), Mẹ VNAH Văn Thị Thừa (Duy Xuyên, Quảng Nam — 5 Liệt sĩ), vợ chồng Liệt sĩ Lê Thị Riêng – Lê Văn Ba (Lê Trọng Tam), hai chị em ruột pháo thủ Nguyễn Thị Thu – Nguyễn Thị Thi (Lam Hạ, Hà Nam), vợ chồng pháo thủ Lê Văn Chắc – Nguyễn Thị Oánh (Lam Hạ, Hà Nam), và gia đình Mẹ VNAH Đỗ Thị Quế — hai chị em ruột Lê Thị Hồng Gấm & Lê Văn Nhựt (Châu Thành, Tiền Giang).
- **392 liên kết mạng lưới Liệt sĩ (`martyr_links`)** kết nối theo 3 cấp: **cùng gia đình ruột thịt** (`47` liên kết), **cùng tiểu đội / kíp xe tăng / tàu Không số / trận địa** (`33` liên kết qua 12 tổ chiến đấu), và **cùng phiên hiệu đơn vị** (`312` liên kết qua 24 phiên hiệu).
- **21 bản ghi Huân chương, Huy chương & Danh hiệu Nhà nước đã dẫn nguồn chính thức** (kèm cơ quan ban hành / nguồn báo chí chính thống) thuộc **8 nhóm khen thưởng**; các bản ghi chưa có nguồn riêng tiếp tục ẩn theo quy tắc trung thực sử liệu (`Decision 3F`).
- **15 Nghĩa trang Liệt sĩ Quốc gia & Khu di tích tưởng niệm đặc biệt** (số phần mộ ghi theo từng nguồn, nhiều con số là ước tính): NTLS Quốc gia Trường Sơn, NTLS Quốc gia Đường 9, Thành cổ Quảng Trị, Ngã ba Đồng Lộc, Hang Tám Cô, Hàng Dương (Côn Đảo), Đền Bến Dược – Củ Chi, NTLS TP. Hồ Chí Minh, Đồi 82 (Tây Ninh), Rừng Sác (Cần Giờ), Nhổn – Mai Dịch (Hà Nội), Điện Bàn (Quảng Nam), Đắk Lắk – Đắk Tô, Tiền Giang – Ấp Bắc, Đồng Nai – Xuân Lộc.
- **24 cụm phiên hiệu đơn vị chủ lực & địa phương** phục vụ đối chiếu ký hiệu trên giấy báo tử và tra cứu đồng đội cùng đơn vị (`F325`, `F304`, `E66/F10`, `F320`, `F316`, `F324`, `F7`, `F361`, `Đoàn 125`, `Đoàn 10 Rừng Sác`, `C552 TNXP`, `C Dân quân Lam Hạ / PK Hà Nam`, `Biệt động Sài Gòn – Gia Định / Thành đoàn`, v.v.).
- **27 ảnh tư liệu lịch sử & ảnh di tích lưu trữ nội bộ** (`assets/martyrs/`, `assets/cemeteries/`) và **7 bức thư, nhật ký, thơ thời chiến** (bản chép lại, đang chờ đối chiếu với bản gốc).

---

## Nguyên tắc Sử liệu & Xác minh

Hồ sơ chiến dịch, tiểu sử Liệt sĩ và số liệu nghĩa trang được tổng hợp từ các cơ quan lưu trữ, bảo tàng, cổng thông tin chính phủ và báo chí chính thống Việt Nam dưới đây. Mỗi hồ sơ ghi nguồn của nó; việc đối chiếu lại từng hồ sơ với bản gốc vẫn đang làm (xem `TODOS.md`):
- Cổng Thông tin Điện tử Bộ Quốc phòng (`mod.gov.vn`) & Bảo tàng Lịch sử Quân sự Việt Nam (`btlsqsvn.mod.gov.vn`)
- Cục Di sản văn hóa – Bộ Văn hóa, Thể thao và Du lịch (`dsvh.gov.vn`)
- Cổng Chính sách Quân đội (`chinhsachquandoi.gov.vn`). Cổng `thongtinlietsi.gov.vn` không còn truy cập được (kiểm tra 12/11/2026); tra cứu chính thức hiện qua ứng dụng VNeID → Kết nối thân nhân liệt sĩ.
- Báo Quân đội nhân dân (`qdnd.vn`, `sknc.qdnd.vn`), Báo Nhân Dân (`nhandan.vn`), Thông tấn xã Việt Nam (`vnanet.vn`), Báo Chính phủ (`baochinhphu.vn`), Báo Sài Gòn Giải Phóng (`sggp.org.vn`), Khu di tích Địa đạo Củ Chi (`diadaocuchi.com.vn`), Ban Phục vụ Lễ tang Hà Nội (`banphucvuletanghanoi.vn`).
- Quần đảo **Hoàng Sa** (TP. Đà Nẵng) và **Trường Sa** (tỉnh Khánh Hòa) được thể hiện đầy đủ chủ quyền Việt Nam trên cả bản đồ Vector lẫn nền bản đồ tối giản không nhãn ngoại lai.

---

## Cấu trúc Thư mục

```text
VietnamWar/
├── index.html                                  # Giao diện chính (3 chế độ xem: Bản đồ, Liệt sĩ, Phiên hiệu; nghĩa trang mở trên bản đồ)
├── css/styles.css                              # Hệ thống thiết kế tưởng niệm (Dark/Light mode, bảng sắp xếp chuẩn trợ năng)
├── js/app.js                                   # Logic bản đồ Vector/Leaflet, tìm kiếm combobox, bộ lọc & hộp thoại hồ sơ
├── assets/
│   ├── martyrs/                                # 20 chân dung Liệt sĩ & ảnh hiện vật bảo tàng đã kiểm duyệt
│   └── cemeteries/                             # 5 ảnh Nghĩa trang Liệt sĩ Quốc gia đã kiểm duyệt
├── data/
│   ├── battles_and_martyrs.js                  # Gói dữ liệu tĩnh tự động sinh cho GitHub Pages
│   ├── ky_uc_viet_nam_liet_si_1954_1975.csv    # Bảng dữ liệu Liệt sĩ chuẩn UTF-8 BOM (mở trực tiếp bằng Excel)
│   └── ky_uc_viet_nam_database.json            # Bản xuất JSON toàn bộ cơ sở dữ liệu
├── db/
│   ├── schema.sql                              # Lược đồ SQLite quan hệ (11 bảng + chỉ mục toàn văn FTS5)
│   ├── base_16_battles.json                    # Dữ liệu nền 16 chiến dịch gốc
│   └── ky_uc_viet_nam.sqlite                   # Cơ sở dữ liệu SQLite biên dịch hoàn chỉnh
├── scripts/
│   ├── seed_cemeteries_awards.py               # Dữ liệu 15 Nghĩa trang, 8 nhóm Huân chương & phiên hiệu mở rộng
│   ├── seed_campaigns_north_central.py         # Dữ liệu chiến dịch & Liệt sĩ miền Bắc, Trường Sơn, Biển, Khu 5, Trị Thiên
│   ├── seed_campaigns_south_highlands.py       # Dữ liệu chiến dịch & Liệt sĩ Nam Bộ (Côn Đảo, Củ Chi, Tây Ninh, Tàu Ô, Rừng Sác)
│   ├── seed_families_meta.py                   # Dữ liệu 8 gia đình nhiều Liệt sĩ & 20 Liệt sĩ gia đình miền Bắc – Trung
│   ├── seed_families_south.py                  # Dữ liệu Liệt sĩ gia đình miền Nam & 12 tổ/tiểu đội/kíp chiến đấu
│   ├── seed_dossiers_enrichments.py            # Hồ sơ chi tiết Liệt sĩ, chuẩn hóa unit_code & huân chương dẫn nguồn
│   └── build_database.py                       # Trình biên dịch SQLite + xuất JS/CSV/JSON & kiểm tra toàn vẹn
├── server.py                                   # Máy chủ Web + REST API đọc trực tiếp từ SQLite
└── .github/workflows/pages.yml                 # Quy trình kiểm tra toàn vẹn & tự động triển khai GitHub Pages
```

---

## Hướng dẫn Chạy Cục bộ & Truy vấn SQLite API

### 1. Chạy máy chủ Web kèm SQLite REST API (Khuyên dùng)

```bash
python3 server.py 8090
```

Mở trình duyệt tại `http://localhost:8090`. Các đầu mối REST API sẵn sàng phục vụ:
- `GET /api/stats` — Thống kê tổng quan toàn bộ cơ sở dữ liệu
- `GET /api/battles?period=P3_1965_1968` — Danh sách chiến dịch theo giai đoạn
- `GET /api/martyrs?family_id=fam-me-nguyen-thi-thu-le-thi-tri&unit_code=F325&q=Quảng+Trị` — Truy vấn hồ sơ Liệt sĩ đa tiêu chí (gia đình, phiên hiệu, nghĩa trang, huân chương, từ khóa)
- `GET /api/families` — Danh sách 8 đại gia đình nhiều Liệt sĩ & Bà Mẹ VNAH kèm các hồ sơ thành viên
- `GET /api/martyr-links?martyr_id=ls-le-tu-chuyen-1975` — Mạng lưới liên kết đồng đội và thân nhân Liệt sĩ (`family`, `same_squad`, `same_unit`)
- `GET /api/cemeteries` — Danh sách 15 Nghĩa trang Liệt sĩ Quốc gia kèm số lượng hồ sơ liên kết
- `GET /api/awards` — Danh mục 8 nhóm Huân chương, Huy chương & Danh hiệu kèm số người thụ hưởng
- `GET /api/export/martyrs.csv` — Xuất trực tiếp bảng CSV từ SQLite
- `GET /api/export/database.json` — Xuất trực tiếp toàn bộ JSON từ SQLite

### 2. Biên dịch lại Cơ sở Dữ liệu sau khi bổ sung tư liệu

```bash
python3 scripts/build_database.py
```

---

## Trang web công khai

Trang được xuất bản bằng GitHub Pages từ nhánh `main` (thư mục gốc):
**https://tuanucsb.github.io/ky-uc-viet-nam-atlas/**

Dữ liệu (`data/`, `db/`) đã được biên dịch sẵn và đưa vào kho, nên không cần bước build trên GitHub. Sau khi sửa tư liệu:

```bash
python3 scripts/build_database.py
git add -A && git commit -m "data: cập nhật tư liệu"
git push
```

GitHub Pages tự cập nhật sau khoảng một phút.
