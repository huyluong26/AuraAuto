import asyncio
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _wrap_base_template(title: str, content_html: str) -> str:
    """Khung HTML email phong cách Quiet Luxury tối giản, sang trọng."""
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; background: linear-gradient(135deg, #090d16 0%, #111827 100%); text-align: center; border-bottom: 2px solid #eab308;">
              <span style="font-size: 24px; font-weight: 800; letter-spacing: 3px; color: #ffffff; text-transform: uppercase;">AURA<span style="color: #eab308;">AUTO</span></span>
              <p style="margin: 4px 0 0; font-size: 11px; letter-spacing: 1.5px; color: #94a3b8; text-transform: uppercase;">Nền Tảng Xe Cũ Minh Bạch & Định Giá AI</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px 32px; font-size: 15px; line-height: 1.6; color: #334155;">
              {content_html}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #edf2f7; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 6px;">Đây là email tự động từ hệ thống AuraAuto Việt Nam. Vui lòng không phản hồi email này.</p>
              <p style="margin: 0;">© 2026 AuraAuto Platform. Mọi quyền được bảo lưu.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def render_verify_email_html(display_name: str, verification_token: str) -> str:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    content = f"""
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Chào mừng bạn đến với AuraAuto, {display_name}!</h2>
      <p style="margin: 0 0 20px;">Cảm ơn bạn đã tin tưởng tham gia cộng đồng mua bán ô tô chất lượng cao. Để kích hoạt đầy đủ quyền đăng tin, đặt lịch hẹn và định giá AI, vui lòng xác thực địa chỉ email của bạn.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{verify_url}" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; letter-spacing: 0.5px; border: 1px solid #eab308;">
          Xác Thực Tài Khoản Ngay
        </a>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Nếu nút phía trên không hoạt động, vui lòng copy đường dẫn dưới đây dán vào trình duyệt:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all; color: #2563eb;">{verify_url}</p>
      <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">Liên kết có hiệu lực trong vòng 24 giờ.</p>
    """
    return _wrap_base_template("Xác thực tài khoản AuraAuto", content)


def render_reset_password_html(display_name: str, reset_token: str) -> str:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    content = f"""
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Yêu cầu đặt lại mật khẩu</h2>
      <p style="margin: 0 0 16px;">Chào {display_name}, chúng tôi nhận được yêu cầu khôi phục mật khẩu tài khoản của bạn trên AuraAuto.</p>
      <p style="margin: 0 0 24px;">Nếu chính bạn đã thực hiện yêu cầu này, hãy nhấp vào nút bên dưới để thiết lập mật khẩu mới an toàn:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{reset_url}" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; letter-spacing: 0.5px; border: 1px solid #eab308;">
          Thiết Lập Mật Khẩu Mới
        </a>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Đường dẫn thay thế:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all; color: #2563eb;">{reset_url}</p>
      <p style="margin: 24px 0 0; font-size: 13px; color: #ef4444;">Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email. Mật khẩu hiện tại của bạn vẫn an toàn tuyệt đối.</p>
    """
    return _wrap_base_template("Khôi phục mật khẩu AuraAuto", content)


def render_appointment_alert_html(recipient_name: str, car_title: str, scheduled_time: str, location: str, role_type: str = "SELLER") -> str:
    role_msg = (
        "Bạn vừa nhận được một yêu cầu hẹn xem xe mới từ khách hàng quan tâm."
        if role_type == "SELLER"
        else "Lịch hẹn xem xe của bạn đã được ghi nhận thành công trên hệ thống."
    )
    content = f"""
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Thông Báo Lịch Hẹn Xem Xe</h2>
      <p style="margin: 0 0 20px;">Chào {recipient_name}, {role_msg}</p>
      
      <div style="background-color: #f1f5f9; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #eab308;">
        <p style="margin: 0 0 10px; font-size: 15px;"><strong>Mẫu xe:</strong> {car_title}</p>
        <p style="margin: 0 0 10px; font-size: 15px;"><strong>Thời gian hẹn:</strong> {scheduled_time}</p>
        <p style="margin: 0; font-size: 15px;"><strong>Địa điểm xem xe:</strong> {location}</p>
      </div>
      
      <p style="margin: 20px 0 0; font-size: 14px; color: #475569;">Vui lòng truy cập mục <strong>Quản lý Lịch hẹn</strong> trên AuraAuto để theo dõi chi tiết và giữ liên lạc trực tiếp.</p>
    """
    return _wrap_base_template("Thông báo lịch hẹn xem xe", content)


def render_listing_status_html(seller_name: str, car_title: str, status_text: str, note: Optional[str] = None) -> str:
    is_approved = status_text.upper() in ("PUBLISHED", "APPROVED")
    status_label = "ĐÃ ĐƯỢC PHÊ DUYỆT XUẤT BẢN" if is_approved else "CẦN CHỈNH SỬA BỔ SUNG"
    badge_color = "#16a34a" if is_approved else "#dc2626"
    badge_bg = "#dcfce7" if is_approved else "#fee2e2"

    note_section = ""
    if note:
        note_section = f"""
        <div style="margin-top: 16px; padding: 14px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          <strong style="color: #475569;">Ghi chú từ bộ phận kiểm duyệt:</strong>
          <p style="margin: 6px 0 0; color: #334155; font-size: 14px;">{note}</p>
        </div>
        """

    content = f"""
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Cập Nhật Trạng Thái Tin Đăng Xe</h2>
      <p style="margin: 0 0 16px;">Chào {seller_name},</p>
      <p style="margin: 0 0 20px;">Tin đăng chiếc <strong>{car_title}</strong> của bạn đã có kết quả kiểm định:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <span style="background-color: {badge_bg}; color: {badge_color}; padding: 10px 24px; border-radius: 20px; font-weight: 700; font-size: 14px; display: inline-block; letter-spacing: 0.5px;">
          {status_label}
        </span>
      </div>
      
      {note_section}
      
      <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">
        { 'Xe của bạn hiện đã hiển thị công khai tới hàng ngàn khách hàng tiềm năng trên AuraAuto.' if is_approved else 'Vui lòng đăng nhập vào tài khoản để cập nhật thông tin theo yêu cầu.' }
      </p>
    """
    return _wrap_base_template("Trạng thái tin đăng xe AuraAuto", content)


def send_email_sync(to_email: str, subject: str, html_content: str) -> bool:
    """Gửi email đồng bộ qua SMTP. Tự động fallback log nếu SMTP chưa bật."""
    if not settings.EMAILS_ENABLED or not settings.SMTP_USER:
        logger.info(
            f"[EMAIL MOCK DISPATCH] To: {to_email} | Subject: {subject} | Body Length: {len(html_content)} bytes"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email

        part = MIMEText(html_content, "html", "utf-8")
        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15.0) as server:
            if settings.SMTP_TLS:
                server.starttls()
            # Loại bỏ khoảng trắng trong app password nếu người dùng paste cả dấu cách
            smtp_pass = settings.SMTP_PASSWORD.replace(" ", "") if settings.SMTP_PASSWORD else ""
            server.login(settings.SMTP_USER, smtp_pass)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())

        logger.info(f"[EMAIL DISPATCHED] Successfully sent email to {to_email} with subject: {subject}")
        return True
    except Exception as exc:
        logger.error(f"[EMAIL ERROR] Failed to send email to {to_email}: {exc}", exc_info=True)
        return False


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Gửi email bất đồng bộ không gây nghẽn Event Loop."""
    return await asyncio.to_thread(send_email_sync, to_email, subject, html_content)
