import TopBar from './TopBar.jsx';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import Footer from './Footer.jsx';
import './Layout.css';

// Shared application chrome. Used by every authenticated route. Auth
// pages (login/signup/forgot/reset) use it too with `withFooter` and
// without the bottom nav.
export default function Layout({ profile, withFooter = false, withBottomNav = true, children }) {
  return (
    <div className={`layout${withBottomNav ? ' layout--with-bottom-nav' : ''}`}>
      <TopBar profile={profile} />
      <div className="layout__row">
        <Sidebar />
        <main className="layout__main">{children}</main>
      </div>
      {withBottomNav && <BottomNav />}
      {withFooter && <Footer />}
    </div>
  );
}
