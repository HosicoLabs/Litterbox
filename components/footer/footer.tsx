import Link from "next/link";
import { JSX } from "react";

const LINKS: {
  label: string;
  href: string;
  icon: JSX.Element;
}[] = [
  {
    label: "Buy Hosico",
    href: "https://jup.ag/swap/SOL-Hosico",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" className="icon" viewBox="0 0 28 28"><path fill="#000" fillRule="evenodd" d="M12.975 1.375a1.45 1.45 0 0 1 2.05 0l8.7 8.7 2.9 2.9a1.45 1.45 0 0 1-2.05 2.05l-.425-.425v9.55a2.9 2.9 0 0 1-2.9 2.9H16.9a1.45 1.45 0 0 1-1.45-1.45v-4.35h-2.9v4.35a1.45 1.45 0 0 1-1.45 1.45H6.75a2.9 2.9 0 0 1-2.9-2.9V14.6l-.425.425a1.45 1.45 0 0 1-2.05-2.05l2.9-2.9z" clipRule="evenodd"/></svg>
    ),
  },
  {
    label: "x twitter",
    href: "https://x.com/Hosico_on_sol",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" className="icon" viewBox="0 0 22 22"><path fill="#000" d="m12.752 9.553 6.835-8.003h-1.62l-5.933 6.948L7.293 1.55H1.825l7.168 10.508-7.168 8.392h1.62l6.267-7.339 5.007 7.339h5.467zm-2.218 2.597-.726-1.046-5.78-8.326h2.488l4.663 6.72.726 1.046 6.063 8.734H15.48z"/></svg>
    ),
  },
  {
    label: "telegram",
    href: "https://t.me/hosicostarchild/1",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" className="icon" viewBox="0 0 22 22"><path fill="#000" d="m21.738 2.166-3.26 18.33c-.246 1.293-.887 1.615-1.799 1.006l-4.966-4.364-2.396 2.748c-.266.316-.487.58-.999.58l.357-6.03 9.205-9.919c.4-.425-.087-.661-.622-.236l-11.38 8.544L.98 10.997c-1.066-.397-1.085-1.27.221-1.88L20.363.314c.888-.396 1.664.236 1.375 1.852"/></svg>
    ),
  },
  {
    label: "official website",
    href: "https://hosico.cat",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" className="icon" viewBox="0 0 36 36"><path fill="#000" d="M7.448 25.133a13.1 13.1 0 0 0 4.114 3.591 13.6 13.6 0 0 0 5.28 1.66c-.957-1.387-2.35-2.663-4.09-3.635-1.737-.971-3.578-1.503-5.304-1.616m7.642-2.254c-3.35-1.873-6.975-2.349-9.567-1.508q.375 1.2.986 2.304c2.253-.05 4.712.538 7.003 1.819 2.288 1.28 4.04 3.045 5.111 4.956a14 14 0 0 0 2.569-.316c-.524-2.587-2.754-5.381-6.102-7.255m15.96-7.602a12.6 12.6 0 0 0-2.265-4.608 13.1 13.1 0 0 0-3.958-3.389 13.6 13.6 0 0 0-5.017-1.63 13.8 13.8 0 0 0-5.283.389c2.865.337 6.047 1.373 9.167 3.117s5.632 3.892 7.356 6.122m-4.17 6.112c-1.466-2.345-3.979-4.591-7.076-6.322-3.094-1.73-6.366-2.72-9.208-2.784-2.498-.058-4.373.642-5.143 1.918l-.014.022q-.105.357-.184.719c1.074-.408 2.32-.635 3.706-.661 3.08-.055 6.525.893 9.708 2.67 3.18 1.78 5.744 4.194 7.22 6.795.66 1.172 1.073 2.326 1.237 3.43q.285-.247.559-.51l.011-.024c.77-1.277.473-3.191-.816-5.253"/><path fill="#000" d="M17.449 18.971c-4.742-2.653-9.98-3.068-12.499-1.218q.007.87.138 1.732a11 11 0 0 1 2.276-.406c2.816-.203 5.92.55 8.737 2.127 2.815 1.575 5.035 3.797 6.246 6.25a9.7 9.7 0 0 1 .761 2.105q.84-.315 1.632-.741c.42-3.023-2.55-7.198-7.291-9.85m11.868-1.504c-1.483-2.343-4.018-4.595-7.137-6.336s-6.4-2.747-9.25-2.828c-2.173-.06-3.855.447-4.728 1.404 3.624-.59 8.402.403 13.033 2.993s7.897 6.093 9.157 9.414c.432-1.203.055-2.86-1.075-4.647"/></svg>
    ),
  },
];

export function Footer(): JSX.Element {
  return (
    <div className="footer">
      <picture className="img img_bg">
        <source media="(min-width:768px)" srcSet="/footer_bg.webp" />
        <img src="/footer_bg_sm.webp" alt="" />
      </picture>
      <p className="disclaimer">
        Token accounts for discarded assets are closed, returning the rent to
        you as SOL. (Typically 0.0024 SOL per account closed).{" "}
      </p>
      <div className="content">
        <ul className="links_container">
          {LINKS.map((link, i) => {
            return (
              <li key={i} className="link">
                <Link href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.icon}
                  <span className="label">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <h2 className="title">HOSICO LITTER BOX</h2>
      </div>
    </div>
  );
}
