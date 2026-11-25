# Chọn mô hình cho bài toán rủi ro tín dụng

Nhóm gộp trạng thái A, C thành Good và B, D thành Bad. Trong 682 khoản vay có 76 hồ sơ Bad (11,14%). 545 hồ sơ dùng để huấn luyện, 137 hồ sơ để đánh giá. Giao dịch và thẻ được lọc theo ngày trước khoản vay. Bảng lệnh định kỳ chỉ có khóa tài khoản, nên chưa thể giới hạn thời gian cho các biến từ bảng này.

## Mất cân bằng lớp

Notebook baseline thử trọng số lớp, SMOTE, lấy mẫu giảm ngẫu nhiên và dữ liệu nguyên trạng trên ba tập đặc trưng. Pipeline đặt sampler bên trong mỗi fold. Ở notebook cải tiến, Random Forest với trọng số mẫu Bad gấp 5 lần Good tăng recall CV từ 0,3269 lên 0,3910 so với baseline Random Forest cân bằng trọng số lớp. XGBoost cuối dùng trọng số lớp dương bằng tỷ lệ Good/Bad của tập train.

## Chọn theo F1 và Average Precision

| Cấu hình | F1 | Average Precision | Điểm tổng hợp |
| --- | ---: | ---: | ---: |
| Random Forest baseline | 0,4829 | 0,7882 | 0,6050 |
| Random Forest trọng số 5:1 | 0,5488 | 0,8008 | 0,6496 |
| LightGBM SHAP top 12 | 0,7412 | 0,8215 | 0,7733 |
| XGBoost SHAP top 12 | 0,7391 | 0,8410 | **0,7799** |
| RealMLP top 12 tại ngưỡng OOF 0,3518 | 0,7302 | 0,7650 | 0,7441 |

Mã chọn mô hình theo 0,6 × F1 + 0,4 × Average Precision trên train. LightGBM dẫn về F1, XGBoost dẫn về điểm tổng hợp. Nhóm dùng Optuna để dò siêu tham số và SHAP để chọn đặc trưng. SHAP được tính trên toàn bộ train trước khi đánh giá theo fold, nên điểm CV có thể lạc quan. F1 của RealMLP tính trên dự đoán OOF gộp sau khi dò ngưỡng.

## Kết quả test đã lưu

Tại ngưỡng phân lớp 0,5, mô hình phát hiện 10/15 hồ sơ Bad, bỏ sót 5 và báo nhầm 2 trong 122 hồ sơ Good. F1 lớp Bad đạt 0,7407, Average Precision 0,7003 và ROC-AUC 0,9240. Các số liệu đến từ lần huấn luyện đã lưu. Bảng giao dịch `completedtrans.csv` cần cho huấn luyện lại chưa có trong bản bàn giao.

## Ba đầu ra trên ứng dụng

Pipeline XGBoost trả điểm lớp Bad và nhãn Good/Bad. Hai ngưỡng nghiệp vụ của bản ứng dụng nhóm quyết định hướng xử lý: điểm ≤ 30% được tự động duyệt, điểm ≥ 72,48% được đề xuất từ chối, phần giữa cần kiểm duyệt thủ công. Ngưỡng 0,3518 ghi trong thí nghiệm RealMLP phục vụ đánh giá riêng của mô hình đó.

[Thông số thí nghiệm](../models/model_metrics.json) · [Notebook so sánh mô hình](../notebooks/03_cai_tien.ipynb) · [SHAP của XGBoost](figures/shap_summary_xgb_step7.png)
