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
			<p class="muted">Cập nhật ngày 8 tháng 10 năm 2026.</p>

			<p>Anbani là ứng dụng học bảng chữ cái Georgia, miễn phí và mã nguồn mở. Tài liệu này nói rõ ứng dụng giữ gì và không giữ gì.</p>

			<h2>Dùng không cần tài khoản</h2>
			<p>Mọi tính năng đều dùng được khi chưa đăng nhập. Khi đó tiến độ học nằm trong bộ nhớ trình duyệt trên máy của bạn, không gửi đi đâu. Xóa dữ liệu trình duyệt là tiến độ mất theo.</p>

			<h2>Khi bạn đăng nhập bằng Google</h2>
			<p>Ứng dụng nhận địa chỉ email và tên hiển thị từ Google, chỉ để nhận ra bạn là ai giữa các thiết bị. Ứng dụng không đọc thư, không xem danh bạ, không truy cập tệp của bạn.</p>
			<p>Máy chủ lưu bốn nhóm dữ liệu: địa chỉ email, cài đặt của bạn gồm ngôn ngữ, kiểu chữ và số lựa chọn mỗi câu, tiến độ học của từng chữ cái, và vai của tài khoản nếu bạn được mời tham gia thu âm.</p>

			<h2>Ứng dụng không thu tiếng của người học</h2>
			<p>Khi học, khi làm bài kiểm tra hay khi nghe phát âm, ứng dụng không xin quyền micro và không ghi lại tiếng của bạn. Quyền micro chỉ được xin ở màn thu âm dành riêng cho người đọc được mời, và chỉ sau khi người đó tự bấm nút thu.</p>

			<h2>Bản thu phát âm của người đọc được mời</h2>
			<p>Phần phát âm trong ứng dụng do người bản xứ được dự án mời đọc. Người đọc đăng nhập bằng Google, được cấp quyền thu, rồi tự đọc từng mục trong danh mục, mỗi mục ba lượt.</p>
			<p>Với mỗi lượt thu, máy chủ lưu tệp âm thanh, mã của nội dung đã đọc, tài khoản đã thu, thời điểm thu và trạng thái duyệt. Giọng nói là dữ liệu cá nhân, nên người đọc cần biết rõ phần này trước khi bắt đầu.</p>
			<p>Bản thu đã duyệt là nội dung công bố trong ứng dụng: người học nào cũng nghe được, kể cả khi chưa có tài khoản, vì đó chính là mục đích của bản thu. Bản chưa duyệt hoặc bị trả lại thì chỉ người đã thu và chủ dự án mở được; người khác có đúng đường dẫn tệp cũng không tải được.</p>
			<p>Bản thu được dùng cho hai việc: phát cho người học nghe, và làm cơ sở để xây dựng phần đối chiếu phát âm về sau. Bản thu không được bán và không chia sẻ cho bên thứ ba.</p>
			<p>Người đọc có thể yêu cầu xóa toàn bộ bản thu của mình bất cứ lúc nào bằng cách gửi thư tới <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. Yêu cầu được xử lý trong vòng 30 ngày, và mọi bản sao đã công bố trong ứng dụng được rút xuống.</p>

			<h2>Không chia sẻ, không quảng cáo</h2>
			<p>Dữ liệu không được bán, không được chia sẻ với bên thứ ba, và không dùng cho quảng cáo. Ứng dụng không cài công cụ theo dõi hay đo lường hành vi nào.</p>

			<h2>Xóa dữ liệu</h2>
			<p>Bạn xóa tài khoản và toàn bộ dữ liệu kèm theo bằng cách gửi thư tới <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. Yêu cầu được xử lý trong vòng 30 ngày.</p>

			<h2>Liên hệ</h2>
			<p>Mọi câu hỏi xin gửi tới <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. Mã nguồn công khai tại <a href="https://github.com/tant/anbani">github.com/tant/anbani</a>.</p>
		{:else}
			<p class="muted">Last updated 8 October 2026.</p>

			<p>Anbani is a free, open-source app for learning the Georgian alphabet. This page states what the app keeps and what it does not.</p>

			<h2>Using it without an account</h2>
			<p>Every feature works without signing in. Your progress then lives in your browser's storage on your own device and is never sent anywhere. Clearing your browser data clears it.</p>

			<h2>When you sign in with Google</h2>
			<p>The app receives your email address and display name from Google, solely to recognise you across devices. It does not read your mail, your contacts, or your files.</p>
			<p>The server stores four things: your email address, your settings (language, letter style, choices per question), your learning progress for each letter, and the role of your account if you were invited to help with recordings.</p>

			<h2>The app never records a learner</h2>
			<p>While you study, take a test, or play a pronunciation clip, the app does not ask for the microphone and does not record you. The microphone is requested only on the recording screen, which is for invited readers, and only after that person taps the record button themselves.</p>

			<h2>Recordings made by an invited reader</h2>
			<p>The pronunciation in the app is read by a native speaker invited by the project. The reader signs in with Google, is granted permission to record, and reads each item in the catalogue three times.</p>
			<p>For every take, the server keeps the audio file, the key of the item that was read, the account that recorded it, the time, and its review status. A voice is personal data, so a reader should understand this before starting.</p>
			<p>An approved recording is published material inside the app: any learner can play it, with or without an account, because that is what it is for. A recording that is waiting for review, or was sent back, can be opened only by the person who recorded it and by the project owner — holding the file address is not enough.</p>
			<p>Recordings are used for two things: playing them to learners, and as the basis for pronunciation checking later on. They are never sold and never shared with third parties.</p>
			<p>A reader may ask for all of their recordings to be deleted at any time by writing to <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>. Requests are handled within 30 days, and anything already published in the app is withdrawn.</p>

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
