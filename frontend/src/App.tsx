import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { PostList } from "./pages/PostList";
import { PostDetail } from "./pages/PostDetail";
import { PostForm } from "./pages/PostForm";
import { PostCommentEdit } from "./pages/PostCommentEdit";
import { Ranking } from "./pages/Ranking";
import { AdminUsers } from "./pages/AdminUsers";
import { AccountEdit } from "./pages/AccountEdit";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

/** アプリのルート。ルーティング(BrowserRouter)と認証状態(AuthProvider)を全体に提供する。 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * 実際の画面ルーティング定義。AuthProviderの外ではuseAuthが使えないので、専用のコンポーネントに分けている。
 * loading中(保存済みトークンからログイン状態を復元している間)は画面を出さないことで、
 * 「一瞬だけ未ログイン画面がちらつく」のを防ぐ。
 */
function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <p style={{ padding: 24, fontFamily: "sans-serif" }}>読み込み中...</p>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <PostList />
          </RequireAuth>
        }
      />
      <Route
        path="/posts/new"
        element={
          <RequireAuth>
            <PostForm />
          </RequireAuth>
        }
      />
      <Route path="/posts/:id" element={<PostDetail />} />
      <Route
        path="/posts/:id/edit"
        element={
          <RequireAuth>
            <PostForm />
          </RequireAuth>
        }
      />
      <Route
        path="/posts/:id/edit-comment"
        element={
          <RequireAuth>
            <PostCommentEdit />
          </RequireAuth>
        }
      />
      <Route path="/ranking" element={<Ranking />} />
      <Route
        path="/account"
        element={
          <RequireAuth>
            <AccountEdit />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <AdminUsers />
          </RequireAdmin>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
