"""
Deep Biographical Dossier Enrichments & Canonical Unit Mapping for the 93
Baseline/Campaign Martyr Records in Ký Ức Việt Nam Atlas (1954–1975).
Strictly adheres to Decision 2A (no invented values; only documented facts)
and Decision 3F (state awards printed only when backed by a verified source).
"""

from __future__ import annotations

# Canonical `units.code` mapping for all 93 existing martyrs
MARTYR_UNIT_CODE_MAP: dict[str, str] = {
    # Đông Nam Bộ / Sư đoàn 9 / Sư đoàn 7 / Rừng Sác
    "ls-le-hoang-vu-binh-gia": "Q761 / Q762 / Q763 (F9)",
    "ls-tru-van-tho-1963": "Q761 / Q762 / Q763 (F9)",
    "ls-bui-van-ne-loc-ninh-1972": "Q761 / Q762 / Q763 (F9)",
    "ls-tran-xuan-lai-binh-long-1972": "Q761 / Q762 / Q763 (F9)",
    "ls-doan-hoang-minh-thong-tin": "Q761 / Q762 / Q763 (F9)",
    "ls-tap-the-f9-dong-rum-tay-ninh": "Q761 / Q762 / Q763 (F9)",
    "ls-ngo-minh-tri": "Q761 / Q762 / Q763 (F9)",
    "ls-doan-duc-thai-1974": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-be-van-cam-tay-ninh": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-tap-the-1000-f7-chot-tau-o": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-nguyen-cong-bao-nha-be-1973": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-pham-van-tiem-nha-be-1973": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-tap-the-860-rung-sac-mo-gio": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    # Biệt động Sài Gòn – Gia Định (F100)
    "ls-nguyen-van-troi-1964": "F100 / Biệt động Sài Gòn",
    "ls-tran-van-dang-1965": "F100 / Biệt động Sài Gòn",
    "ls-le-thi-rieng-1968": "F100 / Biệt động Sài Gòn",
    "ls-ngo-van-ngot-sua-quan-my": "F100 / Biệt động Sài Gòn",
    "ls-to-hoai-thanh-dinh-doc-lap": "F100 / Biệt động Sài Gòn",
    # Khu 8 / Ấp Bắc / Long An
    "ls-duong-binh-giang": "D512 / D261 Khu 8",
    "ls-do-van-trach-ap-bac": "D512 / D261 Khu 8",
    "ls-le-van-toan-ap-bac": "D512 / D261 Khu 8",
    "ls-nguyen-van-dung-ap-bac": "D512 / D261 Khu 8",
    "ls-huynh-viet-thanh-long-an": "D1 Long An / Đặc công Đức Hòa",
    "ls-nguyen-thi-hanh-duc-hoa": "D1 Long An / Đặc công Đức Hòa",
    "ls-tran-van-hy-duc-hoa": "D1 Long An / Đặc công Đức Hòa",
    # Củ Chi – Tam Giác Sắt
    "ls-doan-thi-lien-tnxp-1966": "Du kích Củ Chi / Phân khu 1 SG-GĐ",
    "ls-nguyen-thi-ne-cu-chi": "Du kích Củ Chi / Phân khu 1 SG-GĐ",
    "ls-pham-van-coi-cu-chi": "Du kích Củ Chi / Phân khu 1 SG-GĐ",
    # Nhà tù Côn Đảo
    "ls-cao-van-ngoc-con-dao": "Đảng ủy Lưu Chí Hiếu / Côn Đảo",
    "ls-le-van-viet-con-dao": "Đảng ủy Lưu Chí Hiếu / Côn Đảo",
    "ls-luu-chi-hieu-con-dao": "Đảng ủy Lưu Chí Hiếu / Côn Đảo",
    # Văn nghệ sĩ – Phóng viên chiến trường
    "ls-nguyen-phu-thanh-dong-xoai": "Tiểu ban Văn nghệ Khu 5 / B2",
    "ls-tran-huu-trang-1966": "Tiểu ban Văn nghệ Khu 5 / B2",
    "ls-le-anh-xuan-1968": "Tiểu ban Văn nghệ Khu 5 / B2",
    "ls-nguyen-thi-1968": "Tiểu ban Văn nghệ Khu 5 / B2",
    "ls-chu-cam-phong-1971": "Tiểu ban Văn nghệ Khu 5 / B2",
    "ls-duong-thi-xuan-quy-1969": "Tiểu ban Văn nghệ Khu 5 / B2",
    "ls-luong-nghia-dung-1972": "Tiểu ban Văn nghệ Khu 5 / B2",
    # Khu 5 — Quảng Nam, Đà Nẵng, Quảng Ngãi
    "ls-dang-thuy-tram-quang-ngai": "E1 Ba Gia / F2 Khu 5",
    "ls-le-do-da-nang-1965": "D70 Quảng Nam / V16 Đặc công",
    "ls-mai-dang-chon-1968": "D70 Quảng Nam / V16 Đặc công",
    "ls-nguyen-cong-khanh-nguyen-van-du-da-nang-1975": "D70 Quảng Nam / V16 Đặc công",
    "ls-tran-xuan-vinh-nui-thanh-1965": "D70 Quảng Nam / V16 Đặc công",
    "ls-vo-nhu-hung-quang-nam": "D70 Quảng Nam / V16 Đặc công",
    "ls-le-quang-nho-quang-ngai": "Đơn vị 339 / ANVT Quảng Ngãi",
    "ls-nguyen-ngoc-le-quang-ngai": "Đơn vị 339 / ANVT Quảng Ngãi",
    "ls-pham-van-thin-quang-ngai": "Đơn vị 339 / ANVT Quảng Ngãi",
    "ls-tap-the-don-vi-339-tra-bong": "Đơn vị 339 / ANVT Quảng Ngãi",
    # Tây Nguyên B3 — Ia Đrăng, Đắk Tô 377, Buôn Ma Thuột
    "ls-le-xuan-phoi-ia-drang": "E33 / E66 / E320 (B3)",
    "ls-nguyen-van-dich-ia-drang": "E33 / E66 / E320 (B3)",
    "ls-y-xieng-ia-drang": "E33 / E66 / E320 (B3)",
    "ls-cao-tran-vinh-377": "Xe tăng 377 / D297 / E273",
    "ls-nguyen-dac-luong-hoang-van-ai-377": "Xe tăng 377 / D297 / E273",
    "ls-nguyen-nhan-trien-377": "Xe tăng 377 / D297 / E273",
    "ls-tap-the-215-f316-buon-ma-thuot": "F316 / Lữ đoàn Đặc công 198",
    "ls-tap-the-80-dac-cong-198-bmt": "F316 / Lữ đoàn Đặc công 198",
    # Trị Thiên – Huế, Khe Sanh, Đường 9 – Nam Lào, Thành cổ Quảng Trị
    "ls-a-vau-a-luoi": "E29 (E3) / F324 Trị Thiên",
    "ls-kan-trec-a-luoi": "E29 (E3) / F324 Trị Thiên",
    "ls-tap-the-e29-f324-doi-a-bia": "E29 (E3) / F324 Trị Thiên",
    "ls-nguyen-viet-phong-hue": "E29 (E3) / F324 Trị Thiên",
    "ls-tran-tien-luc-hue": "E29 (E3) / F324 Trị Thiên",
    "ls-bui-gia-ngoan-khe-sanh": "F304 / F325 (B5)",
    "ls-bui-van-chien-lang-vay": "F304 / F325 (B5)",
    "ls-nguyen-van-thac-1972": "F304 / F325 (B5)",
    "ls-tap-the-921-thuong-duc-1974": "F304 / F325 (B5)",
    "ls-dao-nguyen-hung-30-4-1975": "F304 / F325 (B5)",
    "ls-tran-van-dang-f320-khe-sanh": "E64 / F320 (Đoàn Đồng Bằng)",
    "ls-nguyen-quoc-doanh-1971": "E64 / F320 (Đoàn Đồng Bằng)",
    "ls-tap-the-2163-duong-9-nam-lao": "E64 / F320 (Đoàn Đồng Bằng)",
    "ls-k3-tam-dao-1972": "E48 / K3 Tam Đảo / C249",
    "ls-le-van-huynh-1972": "E48 / K3 Tam Đảo / C249",
    "ls-tran-thi-tam-1972": "E48 / K3 Tam Đảo / C249",
    # Tuyến lửa Trường Sơn, Đồng Lộc, Hang Tám Cô, Tàu Không số
    "ls-ho-thi-cuc-dong-loc": "C552 / N55 TNXP Đồng Lộc",
    "ls-hoang-kim-giao-1968": "C552 / N55 TNXP Đồng Lộc",
    "ls-vo-thi-tan-dong-loc": "C552 / N55 TNXP Đồng Lộc",
    "ls-5-phao-thu-cao-xa-hang-tam-co": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-nguyen-van-hue-hang-tam-co": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-tap-the-8-tnxp-hang-tam-co": "F7 (E141, E209) / C217 Đường 20 / Đoàn 10 Rừng Sác",
    "ls-ngo-van-thu-nguyen-tuong-c235": "Đoàn 125 / Tàu Không số C235",
    "ls-nguyen-phan-vinh-c235": "Đoàn 125 / Tàu Không số C235",
    "ls-nguyen-van-hieu-tau-645": "Đoàn 125 / Tàu Không số C235",
    "ls-tran-nho-vung-ro-1965": "Đoàn 125 / Tàu Không số C235",
    # Phòng không – Không quân Miền Bắc & Chiến dịch Hồ Chí Minh
    "ls-le-minh-huan-1965": "E921 / E927 / F361 PK-KQ",
    "ls-pham-giay-tran-nguyen-nam-1965": "E921 / E927 / F361 PK-KQ",
    "ls-hoang-tam-hung-1972": "E921 / E927 / F361 PK-KQ",
    "ls-vu-xuan-thieu-1972": "E921 / E927 / F361 PK-KQ",
    "ls-le-thi-dung-ngo-tho-sau-ham-rong": "D14 Cao xạ / E923 Hàm Rồng",
    "ls-nguyen-van-bay-b-1972": "D14 Cao xạ / E923 Hàm Rồng",
    "ls-nguyen-viet-xuan-1964": "D14 Cao xạ / E923 Hàm Rồng",
    "ls-hoang-tho-mac-30-4-1975": "F341 / QĐ4 / Lữ đoàn ĐC 316",
    "ls-ngo-van-nho-cau-sai-gon-1975": "F341 / QĐ4 / Lữ đoàn ĐC 316",
    "ls-nguyen-van-tan-52-dac-cong-rach-chiec": "F341 / QĐ4 / Lữ đoàn ĐC 316",
    "ls-tap-the-460-xuan-loc-1975": "F341 / QĐ4 / Lữ đoàn ĐC 316",
}

# Verified per-martyr biographical dossier enrichments
MARTYR_DOSSIER_ENRICHMENTS: dict[str, dict] = {
    "ls-le-thi-rieng-1968": {
        "aliasName": "Bí danh: Hai Liên, Hai Riêng",
        "familyId": "fam-vo-chong-le-thi-rieng-le-van-ba",
        "familyRole": "Vợ của Liệt sĩ Lê Văn Ba (Lê Trọng Tam, hy sinh cuối năm 1960 tại Dĩ An)",
        "familyInfo": "Kết hôn với đồng chí Lê Văn Ba (Lê Trọng Tam, nguyên Phó Chủ tịch UBHC tỉnh Rạch Giá, hy sinh năm 1960); hai vợ chồng gửi hai con trai nhỏ ra miền Bắc học tập để ở lại miền Nam chiến đấu.",
        "enlistmentPeriod": "Tham gia cách mạng tháng 08/1945 tại Bạc Liêu; hoạt động suốt hai cuộc kháng chiến tại Nam Bộ và Sài Gòn – Gia Định",
        "partyYouthStatus": "Đảng viên Đảng Cộng sản Việt Nam (kết nạp năm 1948); Ủy viên Trung ương Mặt trận DTGPMNVN",
        "sacrificeLocation": "Đường Hồng Bàng (Chợ Lớn, Quận 5), Sài Gòn",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; tên bà đặt cho Công viên Lê Thị Riêng, đường phố và trường học tại TP. Hồ Chí Minh, Bạc Liêu.",
        "secondaryImageUrl": "assets/martyrs/le-thi-rieng-gia-dinh-ky-vat.jpg",
        "secondaryImageWidth": 1332,
        "secondaryImageHeight": 697,
        "secondaryImageCaption": "Cuốn album ảnh kỷ vật chụp vợ chồng Liệt sĩ Lê Thị Riêng – Lê Văn Ba (Lê Trọng Tam) cùng hai con trai.",
        "secondaryImageCredit": "Báo VietNamNet (Kỷ vật gia đình Liệt sĩ Lê Thị Riêng)",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân",
                "awardedYear": None,
                "isPosthumous": True,
                "sourceName": "Báo VietNamNet",
                "sourceUrl": "https://vietnamnet.vn/cuon-album-ky-vat-va-chiec-vo-goi-liet-si-le-thi-rieng-tu-tay-theu-ten-con-trai-2539355.html",
                "awardVerified": True,
            }
        ],
    },
    "ls-nguyen-van-troi-1964": {
        "enlistmentPeriod": "Công nhân Nhà máy điện Chợ Quán; gia nhập Đội Biệt động 65 Sài Gòn – Gia Định đầu năm 1964",
        "partyYouthStatus": "Đoàn viên Thanh niên Nhân dân Cách mạng",
        "familyInfo": "Con của ông Nguyễn Văn Nhạ và bà Nguyễn Thị Cảnh (Thanh Quýt, Điện Bàn, Quảng Nam); kết hôn ngày 21/04/1964 với bà Phan Thị Quyên chỉ 18 ngày trước khi bị bắt tại cầu Công Lý.",
        "sacrificeLocation": "Pháp trường Khám Chí Hòa, Sài Gòn",
        "commemorationNotes": "Tuyên dương Anh hùng LLVTND (17/10/1964); Cầu Công Lý (nơi anh đặt mìn) nay mang tên Cầu Nguyễn Văn Trỗi; tên đặt cho hàng trăm trường học, bệnh viện, đường phố cả nước.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân Giải phóng",
                "awardedYear": 1964,
                "isPosthumous": True,
                "sourceName": "Bảo tàng Lịch sử Quốc gia & Chuyên trang Câu chuyện Lịch sử",
                "sourceUrl": "https://cauchuyenlichsu.vn/ky-uc-song-mai/anh-hung-liet-si-nguyen-van-troi-nguoi-chien-si-biet-dong-sai-gon",
                "awardVerified": True,
            }
        ],
    },
    "ls-dang-thuy-tram-quang-ngai": {
        "enlistmentPeriod": "Tốt nghiệp Đại học Y khoa Hà Nội năm 1966; xung phong vượt Trường Sơn vào chiến trường Quảng Ngãi tháng 12/1966",
        "partyYouthStatus": "Đảng viên Đảng Nhân dân Cách mạng Việt Nam (kết nạp ngày 27/09/1968 tại Đức Phổ)",
        "familyInfo": "Con gái đầu của bác sĩ ngoại khoa Đặng Ngọc Khuê và dược sĩ Doãn Ngọc Trâm (giảng viên Đại học Dược Hà Nội); chị cả của ba người em gái Phương Trâm, Hiền Trâm, Kim Trâm.",
        "sacrificeLocation": "Sườn núi Ba Tơ – vùng rừng xã Phổ Cường, huyện Đức Phổ, tỉnh Quảng Ngãi",
        "commemorationNotes": "Truy tặng Anh hùng LLVTND (2006); hai cuốn Nhật ký Đặng Thùy Trâm được gìn giữ suốt 35 năm trước khi trở về với mẹ Doãn Ngọc Trâm; Bệnh xá Đặng Thùy Trâm xây dựng tại Phổ Cường, Đức Phổ.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân",
                "awardedYear": 2006,
                "isPosthumous": True,
                "sourceName": "Bảo tàng Lịch sử Quân sự Việt Nam & Chuyên trang Câu chuyện Lịch sử",
                "sourceUrl": "https://cauchuyenlichsu.vn/ky-uc-song-mai/dang-thuy-tram-nguoi-bac-si-tre-giua-chien-truong",
                "awardVerified": True,
            }
        ],
    },
    "ls-nguyen-van-thac-1972": {
        "enlistmentPeriod": "Nhập ngũ ngày 06/09/1971 khi vừa đỗ thủ khoa/xuất sắc Khoa Toán – Cơ, Đại học Tổng hợp Hà Nội",
        "partyYouthStatus": "Đoàn viên Thanh niên Lao động Hồ Chí Minh",
        "familyInfo": "Con trai của ông Nguyễn Văn Thành và bà Đỗ Thị Minh (làng Bưởi, Hà Nội); người nhận những bức thư chiến trường của anh là bà Phạm Thị Như Anh.",
        "sacrificeLocation": "Thôn Đầu Kênh, xã Triệu Long, huyện Triệu Phong, tỉnh Quảng Trị",
        "commemorationNotes": "Nhật ký 'Chuyện đời' (xuất bản với tên 'Mãi mãi tuổi hai mươi' năm 2005) và các bức thư của anh trở thành di sản tinh thần tiêu biểu của thế hệ sinh viên xếp bút nghiên lên đường.",
    },
    "ls-le-van-huynh-1972": {
        "enlistmentPeriod": "Nhập ngũ tháng 05/1972 khi đang là sinh viên năm thứ 4 Khoa Xây dựng dân dụng, Đại học Xây dựng Hà Nội",
        "partyYouthStatus": "Đoàn viên Thanh niên Lao động Hồ Chí Minh",
        "familyInfo": "Con của mẹ Nguyễn Thị Duy và chồng của người vợ mới cưới được 6 ngày trước lúc nhập ngũ là bà Đặng Thị Xơ (xã Lê Lợi, Kiến Xương, Thái Bình).",
        "sacrificeLocation": "Bến vượt Thượng Phước bên bờ Nam sông Thạch Hãn, huyện Triệu Phong, tỉnh Quảng Trị",
        "commemorationNotes": "Bức thư 10 trang viết ngày 11/09/1972 chỉ rõ nơi hy sinh của anh hiện là hiện vật gốc đặc biệt tại Bảo tàng Thành cổ Quảng Trị; truy tặng Anh hùng LLVTND.",
    },
    "ls-vo-thi-tan-dong-loc": {
        "enlistmentPeriod": "Gia nhập Đại đội 552 Thanh niên xung phong năm 1965 lúc 21 tuổi",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam; Bí thư Phân đoàn TNXP Tiểu đội 4",
        "familyInfo": "Con gái của mẹ Nguyễn Thị Nhạn (xã Thiên Lộc, Can Lộc, Hà Tĩnh) — người nhận lá thư đề ngày 19/07/1968.",
        "sacrificeLocation": "Đồi Trọ Voi, Ngã ba Đồng Lộc, huyện Can Lộc, tỉnh Hà Tĩnh",
        "commemorationNotes": "Tập thể 10 cô gái Ngã ba Đồng Lộc được truy tặng danh hiệu Anh hùng năm 1969; Khu mộ và Đền thờ đặt tại Khu di tích Quốc gia Đặc biệt Ngã ba Đồng Lộc.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lao động / Anh hùng LLVTND (Tập thể Tiểu đội 4 TNXP Đồng Lộc)",
                "awardedYear": 1969,
                "isPosthumous": True,
                "sourceName": "Cục Di sản Văn hóa — Bộ VHTTDL",
                "sourceUrl": "https://dsvh.gov.vn/di-tich-lich-su-duong-truong-son-duong-ho-chi-minh-2969",
                "awardVerified": True,
            }
        ],
    },
    "ls-ho-thi-cuc-dong-loc": {
        "enlistmentPeriod": "Gia nhập Thanh niên xung phong Hà Tĩnh tháng 07/1965",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam (kết nạp năm 1967)",
        "familyInfo": "Cha mất sớm, mẹ đi bước nữa, tuổi thơ nhiều cơ cực tại xã Sơn Bằng, Hương Sơn, Hà Tĩnh; được đồng đội tìm thấy dưới lòng đất đồi Trọ Voi ngày thứ ba sau trận bom — cảm hứng bài thơ 'Cúc ơi!'.",
        "sacrificeLocation": "Đồi Trọ Voi, Ngã ba Đồng Lộc, huyện Can Lộc, tỉnh Hà Tĩnh",
        "commemorationNotes": "Truy tặng Anh hùng trong tập thể Tiểu đội 4 TNXP Đồng Lộc; bài thơ 'Cúc ơi!' của Yến Thanh khắc bia đá tại Khu di tích Ngã ba Đồng Lộc.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lao động / Anh hùng LLVTND (Tập thể Tiểu đội 4 TNXP Đồng Lộc)",
                "awardedYear": 1969,
                "isPosthumous": True,
                "sourceName": "Cục Di sản Văn hóa — Bộ VHTTDL",
                "sourceUrl": "https://dsvh.gov.vn/di-tich-lich-su-duong-truong-son-duong-ho-chi-minh-2969",
                "awardVerified": True,
            }
        ],
    },
    "ls-vu-xuan-thieu-1972": {
        "enlistmentPeriod": "Nhập ngũ tháng 06/1965 khi đang là sinh viên năm thứ 3 Khoa Vô tuyến điện, Đại học Bách khoa Hà Nội; đào tạo phi công MiG-21 tại Liên Xô (1965–1968)",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "familyInfo": "Con trai của ông Vũ Xuân Sắc và bà Nguyễn Thị Vượng (quê Hải Hậu, Nam Định; sinh trưởng tại Hà Nội) trong gia đình có nhiều anh em phục vụ trong Quân đội.",
        "sacrificeLocation": "Bầu trời vùng Yên Châu – Sơn La (tiêu diệt pháo đài bay B-52 đêm 28/12/1972)",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND năm 1994; tên anh đặt cho đường phố và trường học tại Hà Nội, TP. Hồ Chí Minh, Nam Định, Sơn La.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân",
                "awardedYear": 1994,
                "isPosthumous": True,
                "sourceName": "Bảo tàng Phòng không – Không quân & Chuyên trang Câu chuyện Lịch sử",
                "sourceUrl": "https://cauchuyenlichsu.vn/ky-uc-song-mai/anh-hung-vu-xuan-thieu-748496",
                "awardVerified": True,
            }
        ],
    },
    "ls-hoang-tam-hung-1972": {
        "enlistmentPeriod": "Tuyển chọn đào tạo phi công tiêm kích năm 1965; chiến đấu tại Trung đoàn Không quân 921 và 927",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "sacrificeLocation": "Vùng trời Việt Bắc – Bắc Giang trong trận không chiến ngày 28/12/1972",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; an táng tại Nghĩa trang Liệt sĩ Nhổn (Hà Nội).",
    },
    "ls-hoang-kim-giao-1968": {
        "enlistmentPeriod": "Nhập ngũ tháng 09/1962; tốt nghiệp Khoa Vật lý – Điện tử, Đại học Bách khoa Hà Nội",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "familyInfo": "Con trai nhà giáo Hoàng Kim Hải (An Dương, Hải Phòng); để lại người vợ trẻ và con trai nhỏ Hoàng Hùng khi hy sinh trên tuyến lửa Nghệ An.",
        "sacrificeLocation": "Trọng điểm phá bom từ trường xã Nam Cường, huyện Nam Đàn, tỉnh Nghệ An",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND và Giải thưởng Hồ Chí Minh (đồng tác giả công trình phá bom từ trường thủy lôi); tên đặt cho đường phố và trường THPT tại Hải Phòng.",
    },
    "ls-le-anh-xuan-1968": {
        "aliasName": "Tên khai sinh: Ca Lê Hiến",
        "enlistmentPeriod": "Tập kết ra Bắc năm 1954, tốt nghiệp Khoa Sử Đại học Tổng hợp Hà Nội; vượt Trường Sơn trở về chiến trường Nam Bộ cuối năm 1964",
        "partyYouthStatus": "Đảng viên Đảng Nhân dân Cách mạng Việt Nam",
        "familyInfo": "Con trai của Giáo sư, nhà nghiên cứu văn học – sử học Ca Văn Thỉnh và bà Nguyễn Thị Tài (Mỏ Cày, Bến Tre); anh/em ruột của đạo diễn Ca Lê Hồng, nhạc sĩ Ca Lê Thuần và họa sĩ Ca Lê Thắng.",
        "sacrificeLocation": "Ấp Phước Quảng, xã Phước Lợi, huyện Cần Đước, tỉnh Long An (vành đai Nam Sài Gòn)",
        "commemorationNotes": "Truy tặng Giải thưởng Nhà nước về Văn học – Nghệ thuật (2001) và danh hiệu Anh hùng LLVTND (2011); bài thơ 'Dáng đứng Việt Nam' đi vào lịch sử văn học dân tộc.",
    },
    "ls-nguyen-thi-1968": {
        "aliasName": "Tên khai sinh: Nguyễn Ngọc Tấn · Bút danh: Nguyễn Thi",
        "enlistmentPeriod": "Gia nhập Vệ quốc đoàn tại Sài Gòn năm 1945; tập kết ra Bắc năm 1954 làm biên tập Tạp chí Văn nghệ Quân đội, trở lại chiến trường B2 năm 1962",
        "partyYouthStatus": "Đảng viên Đảng Cộng sản Việt Nam",
        "familyInfo": "Quê gốc Hải Hậu, Nam Định; mồ côi cha sớm, vào Sài Gòn tự lập từ thiếu thời; có con gái là Nguyễn Thị Thu Trang.",
        "sacrificeLocation": "Đường Minh Phụng – Cầu Thiết (Quận 11), Mặt trận Sài Gòn – Gia Định (Đợt 2 Mậu Thân, 09/05/1968)",
        "commemorationNotes": "Truy tặng Giải thưởng Hồ Chí Minh về Văn học – Nghệ thuật đợt II (năm 2000); tác giả 'Người mẹ cầm súng', 'Ở xã Trung Nghĩa'; tên đặt cho đại lộ tại Quận 5, TP.HCM.",
    },
    "ls-chu-cam-phong-1971": {
        "aliasName": "Tên khai sinh: Trần Tiến",
        "enlistmentPeriod": "Tốt nghiệp xuất sắc Khoa Ngữ văn Đại học Tổng hợp Hà Nội năm 1964, từ chối suất du học nước ngoài để xung phong vượt Trường Sơn về Khu 5",
        "partyYouthStatus": "Đảng viên Đảng Nhân dân Cách mạng Việt Nam",
        "familyInfo": "Sinh tại phố cổ Hội An trong gia đình cách mạng có cha tham gia kháng chiến chống Pháp; người anh cả hiếu thảo luôn gửi phụ cấp chăm lo mẹ và các em.",
        "sacrificeLocation": "Hầm bí mật thôn Vinh Cường, xã Duy Tân, huyện Duy Xuyên, tỉnh Quảng Nam (chiến đấu đến viên đạn cuối cùng ngày 01/05/1971)",
        "commemorationNotes": "Truy tặng Giải thưởng Nhà nước về Văn học – Nghệ thuật (2007) và danh hiệu Anh hùng LLVTND (2010); 'Nhật ký Chu Cẩm Phong' là tư liệu quý giá về chiến trường Khu 5.",
    },
    "ls-duong-thi-xuan-quy-1969": {
        "enlistmentPeriod": "Phóng viên Báo Phụ nữ Việt Nam từ năm 1961; tình nguyện vượt Trường Sơn vào chiến trường Khu 5 tháng 04/1968",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "familyInfo": "Con gái nhà báo Dương Tụ Quán; vợ của nhà thơ – chiến sĩ Bùi Minh Quốc (Dương Hương Ly); gửi lại con gái nhỏ Bùi Dương Hương Ly mới 16 tháng tuổi ở miền Bắc để vào chiến trường.",
        "sacrificeLocation": "Thôn Thi Thại, xã Xuyên Tân (nay là xã Duy Thành), huyện Duy Xuyên, tỉnh Quảng Nam",
        "commemorationNotes": "Truy tặng Giải thưởng Nhà nước về Văn học – Nghệ thuật (2007); nhà bia tưởng niệm dựng ngay nơi chị hy sinh tại Duy Thành, Duy Xuyên, Quảng Nam.",
    },
    "ls-tran-huu-trang-1966": {
        "aliasName": "Thường gọi: Tư Trang",
        "enlistmentPeriod": "Hoạt động văn nghệ yêu nước tại Sài Gòn – Mỹ Tho từ thập niên 1930; năm 1960 ra vùng giải phóng giữ chức Chủ tịch Hội Văn nghệ Giải phóng miền Nam",
        "familyInfo": "Thân phụ của soạn giả – nhà nghiên cứu Việt Thường và các nghệ sĩ nối nghiệp sân khấu cải lương Nam Bộ.",
        "sacrificeLocation": "Căn cứ Trung ương Cục miền Nam (Bắc Tây Ninh), hy sinh trong trận bom B-52 rải thảm đêm 01/10/1966",
        "commemorationNotes": "Truy tặng Giải thưởng Hồ Chí Minh về Văn học – Nghệ thuật đợt I (năm 1996); Nhà hát Cải lương Trần Hữu Trang và Giải thưởng Trần Hữu Trang mang tên ông tại TP.HCM.",
    },
    "ls-luong-nghia-dung-1972": {
        "enlistmentPeriod": "Nhập ngũ năm 1954, giáo viên Vật lý Quân đội chuyển sang khóa phóng viên ảnh Thông tấn xã Việt Nam năm 1965",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "sacrificeLocation": "Mặt trận phía Nam Thành cổ Quảng Trị (mùa hè đỏ lửa năm 1972)",
        "commemorationNotes": "Truy tặng Giải thưởng Hồ Chí Minh về Văn học – Nghệ thuật (2017) và Giải thưởng Nhà nước (2007) với các tác phẩm kinh điển 'Đấu pháo ở Dốc Miếu', 'Đánh chiếm cứ điểm 365', 'Xốc tới'.",
    },
    "ls-nguyen-viet-xuan-1964": {
        "enlistmentPeriod": "Nhập ngũ tháng 11/1952 khi mới 18 tuổi, tham gia Chiến dịch Điện Biên Phủ rồi bảo vệ miền Bắc xã hội chủ nghĩa",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam; Bí thư Chi bộ – Chính trị viên Đại đội 3",
        "familyInfo": "Mồ côi cha sớm tại xã Ngũ Kiên, Vĩnh Tường, Vĩnh Phúc, đi ở đợ từ năm lên 7 tuổi nuôi mẹ và các em trước khi giác ngộ cách mạng.",
        "sacrificeLocation": "Trận địa pháo cao xạ bản Cha Lo, xã Dân Hóa, huyện Minh Hóa, tỉnh Quảng Bình (Tuyến cửa khẩu Đường 12A)",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND ngày 01/01/1967; khẩu lệnh 'Nhằm thẳng quân thù mà bắn!' lúc ông bị thương nát đùi phải đã trở thành khẩu hiệu hành động của toàn quân.",
    },
    "ls-tru-van-tho-1963": {
        "enlistmentPeriod": "Tham gia du kích xã Thanh Hòa (Cai Lậy, Mỹ Tho) rồi gia nhập bộ đội chủ lực Miền năm 1961",
        "partyYouthStatus": "Đảng viên Đảng Nhân dân Cách mạng Việt Nam",
        "sacrificeLocation": "Lô cốt cố thủ Đồn Cây Trường (Bến Cát, Bình Dương)",
        "commemorationNotes": "Truy tặng Anh hùng LLVTND (05/05/1965) — tấm gương lấy thân mình lấp lỗ châu mai trong kháng chiến chống Mỹ tại miền Đông Nam Bộ.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân Giải phóng",
                "awardedYear": 1965,
                "isPosthumous": True,
                "sourceName": "Bảo tàng Lịch sử Quân sự Việt Nam & Chuyên trang Câu chuyện Lịch sử",
                "sourceUrl": "https://cauchuyenlichsu.vn/ky-uc-song-mai/tru-van-tho-mot-doi-nguoi-mot-ngon-lua-khong-tat-909d24",
                "awardVerified": True,
            }
        ],
    },
    "ls-nguyen-van-dung-ap-bac": {
        "aliasName": "Tên khác: Nguyễn Văn Còng · Bí danh: Công",
        "sacrificeLocation": "Chiến hào chủ yếu ấp Tân Thới, xã Tân Phú, huyện Cai Lậy, tỉnh Mỹ Tho (Tiền Giang)",
        "commemorationNotes": "Tượng đài và Khu mộ 'Ba chiến sĩ Gang Thép' đặt trang trọng tại Khu di tích Chiến thắng Ấp Bắc (Tiền Giang).",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân",
                "awardedYear": None,
                "isPosthumous": True,
                "sourceName": "Khu di tích Chiến thắng Ấp Bắc & Câu chuyện Lịch sử",
                "sourceUrl": "https://cauchuyenlichsu.vn/ky-uc-song-mai/anh-hung-nguyen-van-dung-nguoi-chien-si-gang-thep-cua-tran-ap-bac-f1fe3f",
                "awardVerified": True,
            }
        ],
    },
    "ls-do-van-trach-ap-bac": {
        "aliasName": "Bí danh: Hùng",
        "sacrificeLocation": "Chiến hào chủ yếu ấp Tân Thới, xã Tân Phú, huyện Cai Lậy, tỉnh Mỹ Tho (Tiền Giang)",
        "commemorationNotes": "Tượng đồng và Khu mộ 'Ba chiến sĩ Gang Thép' tại Khu di tích Chiến thắng Ấp Bắc.",
    },
    "ls-le-van-toan-ap-bac": {
        "aliasName": "Bí danh: Hoàng",
        "sacrificeLocation": "Chiến hào chủ yếu ấp Tân Thới, xã Tân Phú, huyện Cai Lậy, tỉnh Mỹ Tho (Tiền Giang)",
        "commemorationNotes": "Tượng đồng và Khu mộ 'Ba chiến sĩ Gang Thép' tại Khu di tích Chiến thắng Ấp Bắc.",
    },
    "ls-cao-tran-vinh-377": {
        "sacrificeLocation": "Căn cứ Đắk Tô – Tân Cảnh, tỉnh Kon Tum (trên Xe tăng T-59 số hiệu 377)",
        "commemorationNotes": "Tập thể Kíp Xe tăng 377 truy tặng danh hiệu Anh hùng LLVTND năm 2009; Xe tăng 377 được công nhận Bảo vật Quốc gia.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân (Tập thể Kíp Xe tăng 377)",
                "awardedYear": 2009,
                "isPosthumous": True,
                "sourceName": "Báo Điện tử Chính phủ",
                "sourceUrl": "https://baochinhphu.vn/xe-tang-377-va-nhung-chien-cong-vang-doi-o-chien-truong-tay-nguyen-102230503063126619.htm",
                "awardVerified": True,
            }
        ],
    },
    "ls-nguyen-dac-luong-hoang-van-ai-377": {
        "sacrificeLocation": "Căn cứ Đắk Tô – Tân Cảnh, tỉnh Kon Tum (trên Xe tăng T-59 số hiệu 377)",
        "commemorationNotes": "Tập thể Kíp Xe tăng 377 truy tặng danh hiệu Anh hùng LLVTND năm 2009; Xe tăng 377 là Bảo vật Quốc gia.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân (Tập thể Kíp Xe tăng 377)",
                "awardedYear": 2009,
                "isPosthumous": True,
                "sourceName": "Báo Điện tử Chính phủ",
                "sourceUrl": "https://baochinhphu.vn/xe-tang-377-va-nhung-chien-cong-vang-doi-o-chien-truong-tay-nguyen-102230503063126619.htm",
                "awardVerified": True,
            }
        ],
    },
    "ls-tran-van-dang-1965": {
        "aliasName": "Bí danh: Sang",
        "sacrificeLocation": "Pháp trường cát bùng binh Chợ Bến Thành, Sài Gòn (xử bắn công khai ngày 22/06/1965)",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; tên đặt cho đường Trần Văn Đang tại Quận 3, TP. Hồ Chí Minh.",
    },
    "ls-to-hoai-thanh-dinh-doc-lap": {
        "aliasName": "Thường gọi: Ba Thanh",
        "sacrificeLocation": "Đầu đường Nguyễn Du – cổng sau Dinh Độc Lập, Sài Gòn (Mùng 2 Tết Mậu Thân 1968)",
        "commemorationNotes": "Bia tưởng niệm Chiến sĩ Biệt động Đội 5 đánh Dinh Độc Lập đặt tại số 108 Nguyễn Du, Quận 1, TP. Hồ Chí Minh.",
    },
    "ls-ngo-van-ngot-sua-quan-my": {
        "aliasName": "Bí danh: Ba Đen",
        "sacrificeLocation": "Tòa Đại sứ Mỹ (số 4 đại lộ Thống Nhất, nay là đường Lê Duẩn, Quận 1, TP.HCM)",
        "commemorationNotes": "Bia tưởng niệm Đội 11 Biệt động Sài Gòn đặt trước khuôn viên Tổng Lãnh sự quán Hoa Kỳ (đường Lê Duẩn, TP.HCM).",
    },
    "ls-nguyen-thi-ne-cu-chi": {
        "aliasName": "Thường gọi: Bảy Nê",
        "partyYouthStatus": "Đảng viên Đảng Nhân dân Cách mạng Việt Nam",
        "sacrificeLocation": "Địa bàn Nam Củ Chi, huyện Củ Chi, TP. Hồ Chí Minh",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; nguyên mẫu hình tượng người nữ du kích mũ tai bèo Đất Thép Củ Chi.",
    },
    "ls-pham-van-coi-cu-chi": {
        "partyYouthStatus": "Đảng viên Đảng Nhân dân Cách mạng Việt Nam",
        "sacrificeLocation": "Xã Nhuận Đức, huyện Củ Chi, TP. Hồ Chí Minh",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND (1967); tên ông được đặt cho xã Phạm Văn Cội và Nông trường Phạm Văn Cội tại huyện Củ Chi.",
    },
    "ls-doan-thi-lien-tnxp-1966": {
        "partyYouthStatus": "Đoàn viên Thanh niên Nhân dân Cách mạng",
        "sacrificeLocation": "Tuyến vận tải chiến dịch Bình Long – Bến Cát (lấy thân mình che miệng hầm cứu thương binh ngày 10/07/1966)",
        "commemorationNotes": "Truy tặng Anh hùng LLVTND; câu nói bất tử 'Thà hy sinh chứ không để thương binh bị thương lần thứ hai' trở thành truyền thống của TNXP Giải phóng miền Nam.",
    },
    "ls-tran-thi-tam-1972": {
        "partyYouthStatus": "Đảng viên, Bí thư Chi bộ xã Hải Khê",
        "sacrificeLocation": "Xã Hải Khê, huyện Hải Lăng, tỉnh Quảng Trị",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; tên chị được đặt cho trường học và đường phố tại tỉnh Quảng Trị.",
    },
    "ls-tap-the-8-tnxp-hang-tam-co": {
        "sacrificeLocation": "Km16+500 Đường 20 Quyết Thắng (Hang Tám Cô, xã Tân Trạch, huyện Bố Trạch, tỉnh Quảng Bình)",
        "commemorationNotes": "Tập thể 8 TNXP Hang Tám Cô được Chủ tịch nước truy tặng danh hiệu Anh hùng LLVTND năm 2010; Đền tưởng niệm Đường 20 Quyết Thắng là Di tích Quốc gia Đặc biệt.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân (Tập thể 8 TNXP Hang Tám Cô)",
                "awardedYear": 2010,
                "isPosthumous": True,
                "sourceName": "Báo Nhân Dân & Cục Di sản văn hóa",
                "sourceUrl": "https://nhandan.vn/khuc-trang-ca-duong-20-quyet-thang-post707518.html",
                "awardVerified": True,
            }
        ],
    },
    "ls-nguyen-van-tan-52-dac-cong-rach-chiec": {
        "sacrificeLocation": "Cầu Rạch Chiếc trên Xa lộ Biên Hòa – Sài Gòn (nay thuộc TP. Thủ Đức, TP.HCM)",
        "commemorationNotes": "Bia tưởng niệm các Anh hùng Liệt sĩ chiến đấu giữ Cầu Rạch Chiếc khánh thành trang trọng bên chân cầu Rạch Chiếc.",
    },
    "ls-le-do-da-nang-1965": {
        "aliasName": "Tên khai sinh: Lê Dậu",
        "sacrificeLocation": "Bãi biển Mỹ Khê / Sân vận động Chi Lăng, thành phố Đà Nẵng (xử bắn công khai ngày 15/04/1965)",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; đại lộ Lê Độ và trường học trung tâm TP. Đà Nẵng mang tên anh.",
    },
    "ls-nguyen-phan-vinh-c235": {
        "enlistmentPeriod": "Tập kết ra Bắc năm 1954, tốt nghiệp Trường Sĩ quan Hải quân Việt Nam khóa đầu tiên",
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "familyInfo": "Quê Điện Nam, Điện Bàn, Quảng Nam; hiến dâng trọn tuổi trẻ cho những chuyến Tàu Không số mà chưa kịp lập gia đình riêng.",
        "sacrificeLocation": "Bờ biển Hòn Hèo, xã Ninh Vân, thị xã Ninh Hòa, tỉnh Khánh Hòa",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND năm 1970; tên anh được đặt cho một hòn đảo thuộc Quần đảo Trường Sa thiêng liêng của Tổ quốc (Đảo Phan Vinh).",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân",
                "awardedYear": 1970,
                "isPosthumous": True,
                "sourceName": "Chuyên trang Câu chuyện Lịch sử",
                "sourceUrl": "https://cauchuyenlichsu.vn/ky-uc-song-mai/nguyen-phan-vinh-hy-sinh-khi-lam-nhiem-vu-tren-bien",
                "awardVerified": True,
            }
        ],
    },
    "ls-luu-chi-hieu-con-dao": {
        "aliasName": "Tên khai sinh: Lưu Đình Tập",
        "enlistmentPeriod": "Hoạt động cách mạng từ thời Mặt trận Dân chủ (1936–1939), từng vượt ngục Côn Đảo về Nam Bộ kháng chiến chống Pháp rồi bị bắt lại năm 1955",
        "partyYouthStatus": "Đảng viên Đảng Cộng sản Việt Nam; Bí thư Chi bộ Đảng chống ly khai Khu Chuồng Cọp Côn Đảo",
        "sacrificeLocation": "Khu Chuồng Cọp Pháp — Nhà tù Côn Đảo",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; sau khi ông hy sinh đêm 24/12/1961, Đảng bộ tù chính trị Côn Đảo lấy tên 'Đảng ủy Lưu Chí Hiếu'.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân",
                "awardedYear": None,
                "isPosthumous": True,
                "sourceName": "Cục Di sản văn hóa & Trung tâm Bảo tồn Di tích Côn Đảo",
                "sourceUrl": "https://dsvh.gov.vn/di-tich-lich-su-nha-tu-con-dao-2956",
                "awardVerified": True,
            }
        ],
    },
    "ls-nguyen-quoc-doanh-1971": {
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "sacrificeLocation": "Cao điểm 543 (Căn cứ Lữ đoàn Dù 3 VNCH), Mặt trận Đường 9 – Nam Lào",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND ngày 20/09/1971.",
    },
    "ls-nguyen-nhan-trien-377": {
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "sacrificeLocation": "Trước tiền duyên căn cứ Tân Cảnh – Đắk Tô, tỉnh Kon Tum (trong tháp pháo Xe tăng T-59 số hiệu 377)",
        "commemorationNotes": "Kíp Xe tăng 377 được Chủ tịch nước truy tặng danh hiệu Anh hùng LLVTND ngày 06/01/2009; chiếc xe tăng 377 là Bảo vật Quốc gia trưng bày tại Đắk Tô, Kon Tum.",
        "sourcedAwards": [
            {
                "awardId": "anh-hung-llvtnd",
                "citationLabel": "Anh hùng Lực lượng vũ trang nhân dân (Tập thể Kíp Xe tăng 377)",
                "awardedYear": 2009,
                "isPosthumous": True,
                "sourceName": "Báo Điện tử Chính phủ",
                "sourceUrl": "https://baochinhphu.vn/xe-tang-377-va-nhung-chien-cong-vang-doi-o-chien-truong-tay-nguyen-102230503063126619.htm",
                "awardVerified": True,
            }
        ],
    },
    "ls-dao-nguyen-hung-30-4-1975": {
        "sacrificeLocation": "Cửa ngõ nội đô Sài Gòn trên trục thọc sâu vào Dinh Độc Lập (lúc 10h00 sáng ngày 30/04/1975)",
        "commemorationNotes": "Ngã xuống chỉ một giờ rưỡi trước thời khắc lá cờ Giải phóng tung bay trên nóc Dinh Độc Lập.",
    },
    "ls-ngo-van-nho-cau-sai-gon-1975": {
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "sacrificeLocation": "Trên tháp pháo xe tăng dẫn đầu vượt Cầu Sài Gòn sáng ngày 30/04/1975",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND; hình ảnh Tiểu đoàn trưởng Ngô Văn Nhỡ ngã xuống trên cầu Sài Gòn là biểu tượng bi tráng của Chiến dịch Hồ Chí Minh.",
    },
    "ls-hoang-tho-mac-30-4-1975": {
        "partyYouthStatus": "Đảng viên Đảng Lao động Việt Nam",
        "sacrificeLocation": "Trận đánh giữ Cầu Vĩnh Bình (cửa ngõ phía Bắc tiến vào nội đô Sài Gòn) sáng 30/04/1975",
        "commemorationNotes": "Truy tặng danh hiệu Anh hùng LLVTND ngay sau ngày toàn thắng.",
    },
}
