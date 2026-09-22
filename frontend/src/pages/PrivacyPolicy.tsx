import { Header } from "../components/Header";

/**
 * プライバシーポリシー・利用規約のまとめページ。個人開発の小規模アプリ向けに、
 * 何のデータをどう扱っているかを平易な言葉でまとめたもの(法律の専門文書ではない)。
 * ログイン不要で誰でも閲覧できる。
 */
export function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="page" style={{ maxWidth: 640 }}>
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, color: "var(--accent-ink)" }}>
          プライバシーポリシー・利用規約
        </h1>

        <p className="muted-text" style={{ marginBottom: 24 }}>
          未来リストは個人が開発・運営している小規模なアプリです。このページは、法律の専門文書ではなく、
          どんな情報をどう扱っているかを分かりやすくまとめたものです。
        </p>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>お預かりする情報</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            新規登録時に、ユーザー名・メールアドレス・パスワードをお預かりします。パスワードは元の文字列を
            保存せず、ハッシュ化(不可逆な変換)した状態で保存しているため、運営者を含め誰も元のパスワードを
            見ることはできません。
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>投稿内容の公開範囲</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            投稿(リスト)は、「マイリストにだけ表示」を選ばない限り、ログイン済みの他のユーザーに
            「みんなのリスト」として公開されます。タイトル・本文・タグ・達成状況・コメントも同様に、
            投稿者のユーザー名とともに他のユーザーから見える状態になります。
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>ログイン状態の保存</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            ログイン状態を保つため、ブラウザのlocalStorageに認証用トークンを保存します。第三者への
            トラッキングやCookieを使った広告配信などは行っていません。解析ツール・広告も導入していません。
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>利用しているサービス</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            データベースにSupabase、サーバーにRender、フロントエンドにVercelを利用しています。
            いずれも各サービスのセキュリティ対策のもとで運用されていますが、個人開発のため
            大規模サービスと同等の保証はできない点をご理解ください。
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>禁止事項</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            他のユーザーへの誹謗中傷、なりすまし、スパム投稿、法令に違反する内容の投稿はご遠慮ください。
            運営者の判断で、投稿の削除やアカウントの利用停止を行う場合があります。
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>アカウント・データの削除</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            現在、ご自身でアカウントを削除する機能は用意していません。削除をご希望の場合は、
            下記の連絡先までご連絡ください。
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>お問い合わせ</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            ご質問・ご要望は
            <a href="mailto:hello.yona.studio@gmail.com">hello.yona.studio@gmail.com</a>
            までご連絡ください。
          </p>
        </section>
      </main>
    </>
  );
}
