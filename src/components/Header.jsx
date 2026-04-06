import "./Header.css";
import logo from "../../assets/logo.svg";

export default function Header() {
  return (
    <header className="site-header">
      <img src={logo} alt="Logo" className="site-logo" />
    </header>
  );
}
