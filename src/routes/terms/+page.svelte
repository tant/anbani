<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { settings } from '$lib/settings.svelte';
</script>

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/" aria-label="Back"><Icon name="back" /></a>
		<h1>{settings.lang === 'vi' ? 'Điều khoản sử dụng' : 'Terms of service'}</h1>
	</header>

	<article class="prose">
		{#if settings.lang === 'vi'}
			<p class="muted">Cập nhật ngày 8 tháng 10 năm 2026.</p>

			<h2>Dịch vụ</h2>
			<p>Anbani là ứng dụng học 33 chữ cái tiếng Georgia. Ứng dụng miễn phí, không quảng cáo, không bán hàng, và không thu bất kỳ khoản nào.</p>

			<h2>Tài khoản</h2>
			<p>Tài khoản không bắt buộc và chỉ dùng để đồng bộ tiến độ giữa các thiết bị. Bạn chịu trách nhiệm giữ an toàn cho tài khoản Google mà mình dùng để đăng nhập.</p>

			<h2>Cách dùng được chấp nhận</h2>
			<p>Xin đừng dùng ứng dụng theo cách gây hại cho người khác, làm gián đoạn dịch vụ, hoặc truy cập vào phần dữ liệu không thuộc về bạn.</p>

			<h2>Bản thu phát âm</h2>
			<p>Phần này áp dụng cho người đọc giúp dự án. Màn thu mở cho bất kỳ ai có đường dẫn, không cần tài khoản; xin chỉ đọc đúng nội dung mà màn hình yêu cầu.</p>
			<p>Khi bấm lưu, người đọc cho dự án Anbani quyền sử dụng không độc quyền, không giới hạn lãnh thổ, không phải trả phí, trong các việc sau: dùng bản thu để xây dựng phần đối chiếu phát âm của ứng dụng, và nếu về sau dự án quyết định phát bản thu thì phát cho người học trong ứng dụng. Người đọc giữ quyền nhân thân đối với giọng đọc của mình.</p>
			<p>Bản thu được giữ ẩn danh, nên mặc định không ghi công ai. Người đọc muốn được ghi công thì cho dự án biết mình là ai và đã đọc những mục nào. Dự án có thể xóa bản thu không dùng được mà không cần báo trước.</p>
			<p>Tệp âm thanh không thuộc phạm vi giấy phép MIT của mã nguồn. Người đọc có thể rút toàn bộ bản thu của mình bất cứ lúc nào, theo cách nêu trong trang Quyền riêng tư; khi đó bản thu được rút khỏi ứng dụng và khỏi mọi dữ liệu dùng để xây dựng phần đối chiếu phát âm.</p>
			<p>Dự án không trả thù lao cho việc thu âm, trừ khi hai bên thống nhất riêng bằng văn bản trước khi thu.</p>

			<h2>Mức bảo đảm</h2>
			<p>Ứng dụng được cung cấp nguyên trạng, không kèm bảo đảm nào. Dịch vụ có thể tạm ngừng, thay đổi hoặc dừng hẳn mà không báo trước. Hãy xem tiến độ học là dữ liệu tiện ích, đừng xem là bản lưu duy nhất của điều gì quan trọng.</p>

			<h2>Mã nguồn và giấy phép</h2>
			<p>Mã nguồn công khai theo giấy phép MIT tại <a href="https://github.com/tant/anbani">github.com/tant/anbani</a>. Các bộ phông chữ đi kèm giữ giấy phép riêng của chúng, ghi trong kho mã.</p>

			<h2>Liên hệ</h2>
			<p>Mọi câu hỏi xin gửi tới <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>.</p>
		{:else}
			<p class="muted">Last updated 8 October 2026.</p>

			<h2>The service</h2>
			<p>Anbani is an app for learning the 33 letters of the Georgian alphabet. It is free, carries no advertising, sells nothing, and charges nothing.</p>

			<h2>Accounts</h2>
			<p>An account is optional and exists only to sync your progress between devices. Keeping the Google account you sign in with secure is your responsibility.</p>

			<h2>Acceptable use</h2>
			<p>Please do not use the app in ways that harm others, disrupt the service, or reach data that is not yours.</p>

			<h2>Recordings</h2>
			<p>This section is for anyone who reads for the project. The recording screen is open to whoever has the link, with no account; please read only the item shown on the screen.</p>
			<p>By tapping save, a reader grants the Anbani project a non-exclusive, worldwide, royalty-free right to use the recordings to build the app's pronunciation checking, and, if the project later decides to play them, to play them to learners inside the app. A reader keeps the moral rights to their own voice.</p>
			<p>Recordings are kept anonymous, so by default nobody is credited. A reader who wants a credit should tell the project who they are and which items they read. The project may delete recordings it cannot use, without notice.</p>
			<p>The audio files are not covered by the MIT licence that covers the source code. A reader may withdraw all of their recordings at any time, in the way set out on the Privacy page; the recordings are then taken out of the app and out of any data held for pronunciation checking.</p>
			<p>The project pays nothing for recording unless the two sides agree otherwise, in writing, before the session.</p>

			<h2>Warranty</h2>
			<p>The app is provided as is, with no warranty. The service may be interrupted, changed, or discontinued without notice. Treat your progress as a convenience, not as the only copy of anything that matters.</p>

			<h2>Source and licence</h2>
			<p>The source is public under the MIT licence at <a href="https://github.com/tant/anbani">github.com/tant/anbani</a>. The bundled fonts keep their own licences, listed in the repository.</p>

			<h2>Contact</h2>
			<p>Questions go to <a href="mailto:txntan@gmail.com">txntan@gmail.com</a>.</p>
		{/if}
	</article>
</main>

<style>
	.prose { display: flex; flex-direction: column; gap: 14px; max-width: 62ch; }
	.prose h2 { font-size: 1.05rem; font-weight: 600; margin-top: 8px; }
	.prose p { line-height: 1.65; }
</style>
