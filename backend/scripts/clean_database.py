"""
Clean Database Script
---------------------
Bảo lưu (Keep):
- Tài khoản Admin
- Tài khoản Showroom & Showrooms
- Tin bán xe (Listings & Revisions & Media)
- Tin tức bài viết (Articles)
- Danh mục xe chuẩn (Brands, Models, Variants) & Gói khuyến mãi (Promotion Packages)

Làm sạch hoàn toàn (Purge):
- Toàn bộ tài khoản rác (Users thử nghiệm)
- Toàn bộ lịch hẹn (Appointments & Events)
- Toàn bộ thông báo (Notifications)
- Toàn bộ giao dịch thanh toán thử nghiệm (Payment Transactions)
- Toàn bộ tin nhắn chat thử nghiệm (Conversations, Messages, Reads)
- Đánh giá (Reviews), Tin yêu thích (Favorites)
- Báo cáo vi phạm (Reports, Evidences, Moderation Actions, Appeals)
- AI Predictions, User Preferences, User Behavior Events, Audit Logs
- Phiên đăng nhập (Auth Sessions), Email Tokens, Password Reset Tokens
"""

import asyncio
import logging
from sqlalchemy import select, delete, func
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models import (
    User,
    OAuthIdentity,
    AuthSession,
    EmailVerificationToken,
    PasswordResetToken,
    Showroom,
    Listing,
    ListingRevision,
    ListingMedia,
    ListingStatusEvent,
    Appointment,
    AppointmentEvent,
    Review,
    Conversation,
    Message,
    ConversationRead,
    Favorite,
    Report,
    ReportEvidence,
    ModerationAction,
    Appeal,
    Notification,
    AIPrediction,
    UserPreference,
    UserBehaviorEvent,
    AuditLog,
    Article,
    PaymentTransaction,
    PromotionPackage,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("clean_database")


async def clean_database():
    logger.info("=== BẮT ĐẦU DỌN DẸP LÀM SẠCH CƠ SỞ DỮ LIỆU ===")

    async with AsyncSessionLocal() as db:
        # 1. Xác định các User cần BẢO LƯU (GIỮ LẠI)
        # 1.1 Admin
        admin_res = await db.execute(
            select(User).where((User.role == "ADMIN") | (User.email == settings.INITIAL_ADMIN_EMAIL.lower()))
        )
        admin_users = admin_res.scalars().all()
        admin_user_ids = {u.id for u in admin_users}
        logger.info(f"Đã tìm thấy {len(admin_users)} tài khoản Admin cần giữ lại:")
        for a in admin_users:
            logger.info(f"   [ADMIN] {a.email} ({a.display_name}) - ID: {a.id}")

        # 1.2 Showroom
        showroom_res = await db.execute(select(Showroom))
        showrooms = showroom_res.scalars().all()
        showroom_owner_ids = {s.owner_user_id for s in showrooms}
        logger.info(f"Đã tìm thấy {len(showrooms)} Showroom cần giữ lại:")
        for s in showrooms:
            logger.info(f"   [SHOWROOM] {s.name} - Chủ sở hữu User ID: {s.owner_user_id}")

        # 1.3 Tin xe (Listing sellers)
        listing_res = await db.execute(select(Listing))
        listings = listing_res.scalars().all()
        listing_seller_ids = {l.seller_user_id for l in listings}
        logger.info(f"Đã tìm thấy {len(listings)} tin bán xe cần giữ lại:")
        for l in listings:
            logger.info(f"   [LISTING] ID: {l.id} - Người bán ID: {l.seller_user_id} - Trạng thái: {l.status}")

        article_count = await db.scalar(select(func.count(Article.id)))
        logger.info(f"Đã tìm thấy {article_count} bài viết tin tức (Articles) được bảo lưu nguyên vẹn.")

        # Tập hợp tất cả các User ID được phép giữ lại
        preserved_user_ids = admin_user_ids | showroom_owner_ids | listing_seller_ids
        logger.info(f"==> Tổng số tài khoản User được bảo lưu an toàn: {len(preserved_user_ids)}")

        # 2. Xóa các bảng phụ thuộc & dữ liệu rác
        # 2.1 Appointments & Events
        del_appt_events = await db.execute(delete(AppointmentEvent))
        del_appts = await db.execute(delete(Appointment))
        logger.info(f"• Đã xóa {del_appts.rowcount} lịch hẹn và {del_appt_events.rowcount} sự kiện lịch hẹn.")

        # 2.2 Chat: Reads, Messages, Conversations
        del_reads = await db.execute(delete(ConversationRead))
        del_msgs = await db.execute(delete(Message))
        del_convs = await db.execute(delete(Conversation))
        logger.info(f"• Đã xóa {del_convs.rowcount} cuộc hội thoại, {del_msgs.rowcount} tin nhắn, {del_reads.rowcount} trạng thái đã đọc.")

        # 2.3 Notifications
        del_notis = await db.execute(delete(Notification))
        logger.info(f"• Đã xóa {del_notis.rowcount} thông báo.")

        # 2.4 Payment Transactions
        del_txs = await db.execute(delete(PaymentTransaction))
        logger.info(f"• Đã xóa {del_txs.rowcount} giao dịch thanh toán thử nghiệm.")

        # 2.5 Reviews & Favorites
        del_reviews = await db.execute(delete(Review))
        del_favs = await db.execute(delete(Favorite))
        logger.info(f"• Đã xóa {del_reviews.rowcount} đánh giá và {del_favs.rowcount} tin yêu thích.")

        # 2.6 Reports, Evidences, Actions, Appeals
        del_ev = await db.execute(delete(ReportEvidence))
        del_app = await db.execute(delete(Appeal))
        del_mod = await db.execute(delete(ModerationAction))
        del_rep = await db.execute(delete(Report))
        logger.info(f"• Đã xóa {del_rep.rowcount} báo cáo vi phạm và dữ liệu liên quan.")

        # 2.7 AI Predictions, Behaviors, Preferences, Audit Logs
        del_ai = await db.execute(delete(AIPrediction))
        del_beh = await db.execute(delete(UserBehaviorEvent))
        del_pref = await db.execute(delete(UserPreference))
        del_audit = await db.execute(delete(AuditLog))
        logger.info(f"• Đã dọn dẹp các bản ghi AI dự đoán, User behaviors, Preferences và Audit logs.")

        # 2.8 Auth sessions, Tokens, Identities
        del_tokens = await db.execute(delete(EmailVerificationToken))
        del_pwd_tokens = await db.execute(delete(PasswordResetToken))
        del_sessions = await db.execute(delete(AuthSession))
        del_oauth = await db.execute(
            delete(OAuthIdentity).where(OAuthIdentity.user_id.not_in(preserved_user_ids))
        )
        logger.info(f"• Đã dọn dẹp phiên đăng nhập và token xác thực rác.")

        # 3. Xóa toàn bộ các User rác (ngoại trừ preserved_user_ids)
        del_users = await db.execute(
            delete(User).where(User.id.not_in(preserved_user_ids))
        )
        logger.info(f"• ĐÃ XÓA THÀNH CÔNG {del_users.rowcount} TÀI KHOẢN NGƯỜI DÙNG THỬ NGHIỆM / RÁC!")

        # 4. Commit transaction
        await db.commit()
        logger.info("=== HOÀN TẤT DỌN DẸP VÀ LÀM SẠCH CƠ SỞ DỮ LIỆU THÀNH CÔNG 100% ===")

        # 5. In bảng tổng kết hiện trạng sau khi làm sạch
        print("\n" + "=" * 65)
        print("  THỐNG KÊ CƠ SỞ DỮ LIỆU SAU KHI LÀM SẠCH:")
        print("=" * 65)
        final_users = (await db.execute(select(User.id, User.email, User.display_name, User.role))).all()
        print(f"Tổng số User còn lại ({len(final_users)}):")
        for u in final_users:
            print(f"  • [{u.role}] {u.email} - '{u.display_name}' (ID: {u.id})")

        final_showrooms = (await db.execute(select(Showroom.id, Showroom.name, Showroom.phone, Showroom.is_verified))).all()
        print(f"\nTổng số Showroom ({len(final_showrooms)}):")
        for s in final_showrooms:
            print(f"  • Showroom: '{s.name}' - Hotline: {s.phone} - Đã duyệt: {s.is_verified}")

        final_listings = (await db.execute(select(Listing.id, Listing.status))).all()
        print(f"\nTổng số Tin bán xe ({len(final_listings)}):")
        for l in final_listings:
            print(f"  • Tin đăng ID: {l.id} - Trạng thái: {l.status}")

        final_articles = (await db.execute(select(Article.id, Article.title))).all()
        print(f"\nTổng số Tin tức bài viết ({len(final_articles)}):")
        for a in final_articles:
            print(f"  • Bài viết: '{a.title}'")

        final_appts = await db.scalar(select(func.count(Appointment.id)))
        final_notis = await db.scalar(select(func.count(Notification.id)))
        final_txs = await db.scalar(select(func.count(PaymentTransaction.id)))
        final_convs = await db.scalar(select(func.count(Conversation.id)))
        print(f"\nCác bảng rác đã được dọn sạch về 0:")
        print(f"  • Lịch hẹn: {final_appts}")
        print(f"  • Thông báo: {final_notis}")
        print(f"  • Giao dịch: {final_txs}")
        print(f"  • Cuộc hội thoại chat: {final_convs}")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(clean_database())
