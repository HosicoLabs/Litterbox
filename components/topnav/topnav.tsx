"use client";

import { useState } from "react";
import { WalletDropdown } from "../wallet-dropdown/wallet-dropdown";

export function Topnav() {
  const [opened, setOpened] = useState(false);
  const [target, setTarget] = useState("#");

  const URLS = [
    {
      url: "#",
      label: "Home",
    },
    {
      url: "#hosico",
      label: "Hosico",
    },
    {
      url: "#hoscoverse",
      label: "Hosicoverse",
    },
  ];

  function open() {
    setOpened(() => true);
  }

  function close() {
    setOpened(() => false);
  }

  return (
    <nav className={`topnav`}>
      <ul className="navigation">
        <li className="link home-link">
          <a href="#">
            <img src="./hosico_logo.png" alt="somi" className="icon" />
          </a>

          <button className="btn" onClick={open}>
            <svg
              className="icon icon-menu"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 7.75H3C2.59 7.75 2.25 7.41 2.25 7C2.25 6.59 2.59 6.25 3 6.25H21C21.41 6.25 21.75 6.59 21.75 7C21.75 7.41 21.41 7.75 21 7.75Z"
                fill="white"
              />
              <path
                d="M21 12.75H3C2.59 12.75 2.25 12.41 2.25 12C2.25 11.59 2.59 11.25 3 11.25H21C21.41 11.25 21.75 11.59 21.75 12C21.75 12.41 21.41 12.75 21 12.75Z"
                fill="white"
              />
              <path
                d="M21 17.75H3C2.59 17.75 2.25 17.41 2.25 17C2.25 16.59 2.59 16.25 3 16.25H21C21.41 16.25 21.75 16.59 21.75 17C21.75 17.41 21.41 17.75 21 17.75Z"
                fill="white"
              />
            </svg>
          </button>
        </li>

        <li>
          <ul className={`center ${opened ? "opened" : ""}`}>
            <li className="link header_link">
              <a href="#">
                <img src="./hosico_logo.png" alt="somi" className="icon" />
              </a>

              <button className="btn" onClick={close}>
                <svg
                  className="icon icon-close"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M17.8501 16.44C17.9448 16.5339 17.998 16.6617 17.998 16.795C17.998 16.9283 17.9448 17.0561 17.8501 17.15L17.1501 17.85C17.0562 17.9447 16.9284 17.9979 16.7951 17.9979C16.6618 17.9979 16.534 17.9447 16.4401 17.85L12.0001 13.41L7.5601 17.85C7.46621 17.9447 7.33842 17.9979 7.2051 17.9979C7.07178 17.9979 6.94398 17.9447 6.8501 17.85L6.1501 17.15C6.05544 17.0561 6.0022 16.9283 6.0022 16.795C6.0022 16.6617 6.05544 16.5339 6.1501 16.44L10.5901 12L6.1501 7.56C6.05544 7.46612 6.0022 7.33832 6.0022 7.205C6.0022 7.07168 6.05544 6.94388 6.1501 6.85L6.8501 6.15C6.94398 6.05534 7.07178 6.0021 7.2051 6.0021C7.33842 6.0021 7.46621 6.05534 7.5601 6.15L12.0001 10.59L16.4401 6.15C16.534 6.05534 16.6618 6.0021 16.7951 6.0021C16.9284 6.0021 17.0562 6.05534 17.1501 6.15L17.8501 6.85C17.9448 6.94388 17.998 7.07168 17.998 7.205C17.998 7.33832 17.9448 7.46612 17.8501 7.56L13.4101 12L17.8501 16.44Z"
                    fill="white"
                  />
                </svg>
              </button>
            </li>
            {URLS.map((e, i) => {
              return (
                <li
                  key={i}
                  className={`link ${target == e.url ? "active" : ""}`}
                  onClick={() => {
                    setTarget(() => e.url);
                  }}
                >
                  <a href={e.url}>{e.label}</a>
                </li>
              );
            })}
            <li className="link link-end">
              <a href="#">
                <span className="circle"></span>
                Connect Wallet
              </a>
            </li>
          </ul>
        </li>
        <li className="link link-end">
          <a href="#">
            <WalletDropdown />
          </a>
        </li>
      </ul>
    </nav>
  );
}
