<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { settings } from '$lib/settings.svelte';
</script>

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/" aria-label="Back"><Icon name="back" /></a>
		<h1>{settings.lang === 'vi' ? 'Quyền riêng tư' : 'Privacy'}</h1>
	</header>

	<article class="prose">
		{#if settings.lang === 'vi'}
			<p class="muted">Cập nhật ngày 28 tháng 9 năm 2026.</p>

			<p>Anbani là ứng dụng học bảng chữ cái Georgia, miễn phí và mã nguồn mở. Tài liệu này nói rõ ứng dụng giữ gì và không giữ gì.</p>

			<h2>Dùng không cần tài khoản</h2>
			<p>Mọi tính năng đều dùng được khi chưa đăng nhập. Khi đó tiến độ học nằm trong bộ nhớ trình duyệt trên máy của bạn, không gửi đi đâu. Xóa dữ liệu trình duyệt là tiến độ mất theo.</p>

			<h2>Khi bạn đăng nhập bằng Google</h2>
			<p>Ứng dụng nhận địa chỉ email và tên hiển thị từ Google, chỉ để nhận ra bạn là ai giữa các thiết bị. Ứng dụng không đọc thư, không xem danh bạ, không truy cập tệp của bạn.</p>
			<p>Máy chủ lưu ba nhóm dữ liệu: địa chỉ email, cài đặt của bạn gồm ngôn ngữ, kiểu chữ và số lựa chọn mỗi câu, và tiến độ học của từng chữ cái.</p>

			<h2>Không chia sẻ, không quảng cáo</h2>
			<p>Dữ liệu không được bán, không được chia sẻ với bên thứ ba, và không dùng cho quảng cáo. Ứng dụng không cài công cụ theo dõi hay đo lường hành vi nào.</p>

			<h2>Xóa dữ liệu</h2>
			<p>Bạn xóa tài khoản và toàn bộ dữ liệu kèm theo bằng cách gửi thư tới <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. Yêu cầu được xử lý trong vòng 30 ngày.</p>

			<h2>Liên hệ</h2>
			<p>Mọi câu hỏi xin gửi tới <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. Mã nguồn công khai tại <a href="https://github.com/tant/anbani">github.com/tant/anbani</a>.</p>
		{:else}
			<p class="muted">Last updated 28 September 2026.</p>

			<p>Anbani is a free, open-source app for learning the Georgian alphabet. This page states what the app keeps and what it does not.</p>

			<h2>Using it without an account</h2>
			<p>Every feature works without signing in. Your progress then lives in your browser's storage on your own device and is never sent anywhere. Clearing your browser data clears it.</p>

			<h2>When you sign in with Google</h2>
			<p>The app receives your email address and display name from Google, solely to recognise you across devices. It does not read your mail, your contacts, or your files.</p>
			<p>The server stores three things: your email address, your settings (language, letter style, choices per question), and your learning progress for each letter.</p>

			<h2>No sharing, no ads</h2>
			<p>Your data is never sold or shared with third parties, and is not used for advertising. The app carries no analytics or tracking of any kind.</p>

			<h2>Deleting your data</h2>
			<p>To delete your account and everything stored with it, write to <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. Requests are handled within 30 days.</p>

			<h2>Contact</h2>
			<p>Questions go to <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. The source code is public at <a href="https://github.com/tant/anbani">github.com/tant/anbani</a>.</p>
		{/if}
	</article>
</main>

<style>
	.prose { display: flex; flex-direction: column; gap: 14px; max-width: 62ch; }
	.prose h2 { font-size: 1.05rem; font-weight: 600; margin-top: 8px; }
	.prose p { line-height: 1.65; }
</style>
